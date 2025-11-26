import { Injectable } from '@nestjs/common';
import { pool } from '../db';
import OpenAI from 'openai';
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

type EventsAgg = Array<{
  id: number;
  offense: string | null;
  statute: string | null;
  disposition: string | null;
  event_date: string | null;
  jurisdiction: string | null;
  source: string;
  record_id: string;
}>;

type RuleFlag = { code: string; reason: string };

@Injectable()
export class SummaryService {
  private async getOpenAIKey(): Promise<string | null> {
    try {
      const secretName = "openai"; // AWS secret name
      const region = "us-east-2";  // Your AWS region

      const client = new SecretsManagerClient({ region });
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await client.send(command);

      if (!response.SecretString) return null;

      const secretDict = JSON.parse(response.SecretString);
      return secretDict.openai_api_key || secretDict.api_key || secretDict.OPENAI_API_KEY || null;
    } catch (err) {
      console.warn("Could not fetch OpenAI key from AWS:", err);
      return null;
    }
  }
  /** Build the model (or fallback) input from your existing schema */
  private async fetchInputs(personId: number) {
    const person = await pool.query(
      `SELECT person_id, offender_id, first_name, middle_name, last_name, dob
       FROM person
       WHERE person_id = $1`,
      [personId],
    );

    if (person.rowCount === 0) return null;

    const agg = await pool.query(
      `
WITH ev AS (
  SELECT
    c.conviction_id            AS id,
    COALESCE(NULLIF(trim(c.title), ''), c.description) AS offense,
    c.pl_section               AS statute,
    'Convicted'                AS disposition,
    COALESCE(c.date_convicted, c.date_of_crime) AS event_date,
    COALESCE(
      (SELECT a.state FROM address a
         WHERE a.person_id = c.person_id AND a.type = 'RES' LIMIT 1),
      (SELECT a2.state FROM address a2
         WHERE a2.person_id = c.person_id LIMIT 1)
    ) AS jurisdiction,
    'LOCAL_DB'                 AS source,
    c.conviction_id::text      AS record_id
  FROM conviction c
  WHERE c.person_id = $1
  ORDER BY COALESCE(c.date_convicted, c.date_of_crime) NULLS LAST
),
flags AS (
  SELECT 'SEX_OFFENSE'::text AS code,
         'Sex-offense terms detected'::text AS reason
  FROM conviction WHERE person_id = $1 AND (
    title ILIKE '%sex%' OR title ILIKE '%rape%' OR title ILIKE '%sodomy%' OR
    description ILIKE '%sex%' OR description ILIKE '%rape%' OR description ILIKE '%child%'
  )
  UNION ALL
  SELECT 'DUI_RECENT','DUI/DWI/OWI conviction in last 3 years'
  FROM conviction WHERE person_id = $1 AND (
    title ILIKE '%DUI%' OR title ILIKE '%DWI%' OR title ILIKE '%OWI%' OR
    description ILIKE '%DUI%' OR description ILIKE '%DWI%' OR description ILIKE '%OWI%'
  )
  AND COALESCE(date_convicted::date, date_of_crime::date) >= (CURRENT_DATE - INTERVAL '3 years')
  UNION ALL
  SELECT 'VIOLENT_FELONY','Violent-terms detected (assault/robbery/homicide)'
  FROM conviction WHERE person_id = $1 AND (
    title ILIKE '%assault%' OR title ILIKE '%robbery%' OR title ILIKE '%homicide%' OR
    description ILIKE '%assault%' OR description ILIKE '%robbery%' OR description ILIKE '%homicide%'
  )
),
dedup_flags AS (SELECT DISTINCT code, reason FROM flags)
SELECT
  COALESCE(jsonb_agg(ev), '[]'::jsonb) AS events,
  COALESCE((SELECT jsonb_agg(dedup_flags) FROM dedup_flags), '[]'::jsonb) AS rule_flags,
  1.0::numeric AS entity_confidence
FROM ev
      `,
      [personId],
    );

    const { events, rule_flags, entity_confidence } = agg.rows[0];
    const p = person.rows[0];

    return {
      person: {
        person_id: p.person_id,
        name: [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' '),
        dob: p.dob,
      },
      records: (events ?? []) as EventsAgg,
      rule_flags: (rule_flags ?? []) as RuleFlag[],
      entity_confidence: Number(entity_confidence ?? 1),
    };
  }

  /** Local fallback summary (used if no OpenAI key yet) */
  private buildLocalFallback(payload: {
    person: { name: string; dob: string | null };
    records: EventsAgg;
    rule_flags: RuleFlag[];
    entity_confidence: number;
  }) {
    const { person, records, rule_flags, entity_confidence } = payload;

    const total = records.length;
    const dates = records
      .map((r) => (r.event_date ? new Date(r.event_date) : null))
      .filter(Boolean) as Date[];
    const minDate = dates.length ? new Date(Math.min(...dates.map(Number))) : null;
    const maxDate = dates.length ? new Date(Math.max(...dates.map(Number))) : null;

    const fmt = (d: Date | null) =>
      d ? `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}` : 'N/A';

    // Build a neutral, factual sentence or two
    const range =
      total > 0 && minDate && maxDate && fmt(minDate) !== fmt(maxDate)
        ? ` from ${fmt(minDate)} to ${fmt(maxDate)}`
        : '';
    const flagList = rule_flags.map((f) => f.code).join(', ');
    const summary =
      total === 0
        ? `No conviction records were found for ${person.name}.`
        : `${person.name} has ${total} conviction record${total === 1 ? '' : 's'}${range}.${flagList ? ` Flags: ${flagList}.` : ''}`;

    // Map to the same shape your UI will use from the AI path
    const records_used = records.map((r) => ({
      source: r.source,
      record_id: r.record_id,
      jurisdiction: r.jurisdiction,
      offense: r.offense,
      disposition: r.disposition,
      date: r.event_date,
    }));

    return {
      summary,
      flags: rule_flags,
      records_used,
      confidence: entity_confidence,
      entity_resolution_note:
        'Records are linked directly by person_id in the current schema; confidence is set to 1.0 as a placeholder.',
      disclaimer:
        'Informational summary based on your database records. This is not a hiring recommendation. Follow applicable laws and internal review procedures.',
      _fallback: true, // helpful for debugging
    };
  }

  /** Public entry: returns AI output if key present; otherwise local fallback */
  /** Public entry: returns AI output if key present; otherwise local fallback */
async generateForPerson(personId: number) {
  const payload = await this.fetchInputs(personId);
  if (!payload) {
    return { error: 'person not found' };
  }

  // If no key yet, return local summary so you can integrate UI
  const OPENAI_API_KEY = await this.getOpenAIKey();
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI key missing, using local fallback");
    return this.buildLocalFallback(payload);
  }


  const schema = {
    name: 'BackgroundSummary',
    strict: true,
    schema: {
      type: 'object',
      required: ['summary', 'flags', 'records_used', 'disclaimer'],
      properties: {
        summary: { type: 'string' },
        flags: {
          type: 'array',
          items: {
            type: 'object',
            required: ['code', 'reason'],
            properties: {
              code: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
        records_used: {
          type: 'array',
          items: {
            type: 'object',
            required: ['source', 'record_id'],
            properties: {
              source: { type: 'string' },
              record_id: { type: 'string' },
              jurisdiction: { type: 'string' },
              offense: { type: 'string' },
              disposition: { type: 'string' },
              date: { type: 'string' },
            },
          },
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        entity_resolution_note: { type: 'string' },
        disclaimer: { type: 'string' },
      },
    },
  };

  const system = [
    'Summarize only the provided facts.',
    'Do not reference protected traits.',
    'No hiring recommendations; keep a neutral tone.',
    'Write 2–5 sentences maximum.',
    'Only cite provided records in records_used; do not invent sources.',
  ].join(' ');


const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  
const chat = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  messages: [
    { role: 'system', content: [
      'Summarize only the provided facts.',
      'Do not reference protected traits.',
      'No hiring recommendations; keep a neutral tone.',
      'Write 2–5 sentences maximum.',
      'Only cite provided records in records_used; do not invent sources.',
      'Return STRICT JSON with keys: summary, flags, records_used, confidence, entity_resolution_note, disclaimer.'
    ].join(' ') },
    { role: 'user', content: JSON.stringify(payload) },
  ],
  // Ask the model to return valid JSON
  response_format: { type: 'json_object' }  // supported on chat.completions
});

const text = chat.choices?.[0]?.message?.content ?? '{}';
const result = JSON.parse(text);   // same shape your UI expects
return result;
}
}
