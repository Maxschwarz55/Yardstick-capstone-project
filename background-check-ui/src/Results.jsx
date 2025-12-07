import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Button,
  Image,
  VStack,
  Spinner,
  List,
  SkeletonText,
  Card,
  Flex,
} from "@chakra-ui/react";
import blankPhoto from "./Blank-Profile-Picture.webp";
import { getAiSummary } from "./api";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const firstName = state?.firstName;
  const lastName = state?.lastName;
  const selfieKey = state?.selfieKey;

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState(null);
  const [error, setError] = useState("");
  const [similarityResult, setSimilarityResult] = useState(null);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const API = "http://localhost:4000";

  // Fetch person record by name
  useEffect(() => {
    if (!firstName || !lastName) {
      navigate("/");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        setPerson(null);

        const url = `${API}/records/search/by-name?first=${encodeURIComponent(
          firstName
        )}&last=${encodeURIComponent(lastName)}&limit=1&page=1`;

        const res = await fetch(url);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }
        if (!ct.includes("application/json")) {
          const text = await res.text().catch(() => "");
          throw new Error(`Expected JSON, got: ${text.slice(0, 120)}…`);
        }

        const json = await res.json();
        const firstMatch = json?.data?.[0] ?? null;
        if (!cancelled) setPerson(firstMatch);
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to fetch");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firstName, lastName, navigate, API]);

  // run similarity when person loads & only if selfie uploaded
  useEffect(() => {
    async function runSimilarityCheck() {
      if (!person) return;
      if (!selfieKey) return;

      const inputPerson = {
        first_name: person.first_name || "",
        last_name: person.last_name || "",
        dob: person.dob || "",
        photo_s3_key: selfieKey,
      };

      const dbPerson = {
        first_name: person.first_name,
        last_name: person.last_name,
        dob: person.dob,
        photo_s3_key: person.photo_url,
      };

      try {
        const res = await fetch(`${API}/api/check_similarity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input_person: inputPerson,
            db_person: dbPerson,
          }),
        });
        const data = await res.json();
        setSimilarityResult(data);
      } catch (err) {
        console.error("Similarity check failed", err);
      }
    }
    if (person && selfieKey) {
      runSimilarityCheck();
    }
  }, [person, selfieKey]);

  // When we have a person, fetch the AI summary
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!person) return;
      try {
        setSummaryLoading(true);
        setSummary("");
        setSummaryError("");
        const pid = person.id ?? person.person_id;
        if (!pid) return;
        const ai = await getAiSummary(pid);
        if (!cancelled) setSummary(ai.summary || "");
      } catch (e) {
        console.error("ai-summary failed:", e);
        if (!cancelled) setSummaryError("AI summary failed");
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [person]);

  if (loading)
    return (
      <Box p={8} textAlign="center">
        <Heading mb={4}>Searching…</Heading>
        <Spinner size="xl" />
      </Box>
    );

  if (error)
    return (
      <Box p={8} textAlign="center">
        <Heading mb={4}>Error</Heading>
        <Text color="red.500" mb={4}>
          {error}
        </Text>
        <Button onClick={() => navigate("/")}>Return</Button>
      </Box>
    );

  if (!person)
    return (
      <Box p={8} textAlign="center">
        <Heading mb={4}>No results</Heading>
        <Button onClick={() => navigate("/")}>Return</Button>
      </Box>
    );

  const photoSrc = person.photo_url || "/adam_jones.png";

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <Heading mb={6}>
        Background Check Results for {person.first_name ?? firstName}{" "}
        {person.last_name ?? lastName}
      </Heading>

      <Flex gap={6} mb={6} direction={{ base: "column", md: "row" }}>
        <Image
          src={photoSrc}
          onError={(e) => {
            e.currentTarget.src = blankPhoto;
          }}
          alt="Profile"
          width="200px"
          height="250px"
          objectFit="cover"
          borderRadius="md"
        />
        <Card.Root flex="1" p={4}>
          {summaryLoading ? (
            <VStack align="stretch" gap={2}>
              <Spinner size="sm" />
              <SkeletonText noOfLines={3} gap={2} />
            </VStack>
          ) : summary ? (
            <Text>{summary}</Text>
          ) : summaryError ? (
            <Text color="gray.500">{summaryError}</Text>
          ) : (
            <Text color="gray.500">AI summary not available</Text>
          )}
        </Card.Root>
      </Flex>

      {selfieKey && similarityResult && (
        <Section title="Similarity Check">
          <Text>
            Similarity Score: <strong>{similarityResult?.score ?? "—"}</strong>
          </Text>
          <Text>Status: {similarityResult?.status ?? "—"}</Text>
        </Section>
      )}

      <Section title="Description">
        <Text>
          Height: {person.height || "—"}, Weight: {person.weight ?? "—"} lbs,
          Hair: {person.hair || "—"}, Eyes: {person.eyes || "—"}
        </Text>
        <Text>
          Sex: {person.sex || "—"} | Race: {person.race || "—"} | Ethnicity:{" "}
          {person.ethnicity || "—"} | DOB: {fmt(person.dob)}
        </Text>
        <Text>
          Offender ID: {person.offender_id || "—"} | Risk Level:{" "}
          {person.risk_level ?? "—"} | Designation: {person.designation || "—"}
        </Text>
        {person.photo_date && <Text>Photo Date: {fmt(person.photo_date)}</Text>}
        {person.last_updated && (
          <Text>Last Updated: {fmt(person.last_updated)}</Text>
        )}
      </Section>

      <Section title="Last Known Address">
        <Text>{formatPrimaryAddress(person.addresses)}</Text>
      </Section>

      <Section title="All Addresses">
        <CustomList
          data={person.addresses}
          empty="None Reported"
          render={(a, i) => (
            <List.Item key={i}>
              <strong>{a.type ?? "ADDR"}</strong>: {lineAddr(a)}
            </List.Item>
          )}
        />
      </Section>

      <Section title="Current Convictions">
        <CustomList
          data={person.convictions}
          empty="No convictions"
          render={(c, i) => (
            <List.Item key={i} mb={3}>
              <VStack align="stretch" gap={1}>
                <Text>
                  <strong>{c.title || "—"}</strong>{" "}
                  {c.class ? `Class ${c.class}` : ""}{" "}
                  {c.category ? `(${c.category})` : ""}
                </Text>
                {c.description && <Text>{c.description}</Text>}
                <Text fontSize="sm" color="gray.600">
                  PL {c.pl_section || "—"}
                  {c.subsection ? `(${c.subsection})` : ""} | Counts:{" "}
                  {c.counts ?? "—"} | Crime: {fmt(c.date_of_crime)} | Convicted:{" "}
                  {fmt(c.date_convicted)} | Computer used:{" "}
                  {bool(c.computer_used)} | Pornography involved:{" "}
                  {bool(c.pornography_involved)}
                </Text>
                {c.victim_sex_age && (
                  <Text fontSize="sm" color="gray.600">
                    Victim: {c.victim_sex_age}
                  </Text>
                )}
                {(c.arresting_agency ||
                  c.relationship_to_victim ||
                  c.weapon_used ||
                  c.force_used) && (
                  <Text fontSize="sm" color="gray.600">
                    {c.arresting_agency
                      ? `Arresting agency: ${c.arresting_agency}`
                      : ""}
                    {c.relationship_to_victim
                      ? ` | Relationship: ${c.relationship_to_victim}`
                      : ""}
                    {c.weapon_used ? ` | Weapon: ${c.weapon_used}` : ""}
                    {c.force_used ? ` | Force: ${c.force_used}` : ""}
                  </Text>
                )}
                {(c.sentence_term || c.sentence_type) && (
                  <Text fontSize="sm" color="gray.600">
                    Sentence: {c.sentence_term || "—"}{" "}
                    {c.sentence_type ? `(${c.sentence_type})` : ""}
                  </Text>
                )}
              </VStack>
            </List.Item>
          )}
        />
      </Section>

      <Section title="Previous Conviction(s) Requiring Registration">
        <CustomList
          data={person.previous_convictions}
          empty="None Reported"
          render={(pc, i) => <List.Item key={i}>{pc.title || "—"}</List.Item>}
        />
      </Section>

      <Section title="Supervising Agency Information">
        <CustomList
          data={person.supervising_agencies}
          empty="None Reported"
          render={(sa, i) => (
            <List.Item key={i}>{sa.agency_name || "—"}</List.Item>
          )}
        />
      </Section>

      <Section title="Special Conditions of Supervision">
        <CustomList
          data={person.special_conditions}
          empty="None Reported"
          render={(sc, i) => (
            <List.Item key={i}>{sc.description || "—"}</List.Item>
          )}
        />
      </Section>

      <Section title="Maximum Expiration Date/Post Release Supervision Date of Sentence">
        <CustomList
          data={person.max_expiration_dates}
          empty="None Reported"
          render={(me, i) => (
            <List.Item key={i}>{me.description || "—"}</List.Item>
          )}
        />
      </Section>

      <Section title="Scars / Marks / Tattoos">
        <CustomList
          data={person.scars_marks}
          empty="None Reported"
          render={(sm, i) => (
            <List.Item key={i}>
              {sm.description || "—"}
              {sm.location ? ` — ${sm.location}` : ""}
            </List.Item>
          )}
        />
      </Section>

      <Section title="Aliases / Additional Names">
        <CustomList
          data={person.aliases}
          empty="None Reported"
          render={(x, i) => (
            <List.Item key={i}>
              {[x.first_name, x.middle_name, x.last_name]
                .filter(Boolean)
                .join(" ")}
            </List.Item>
          )}
        />
      </Section>

      <Section title="Vehicles">
        <CustomList
          data={person.vehicles}
          empty="None Reported"
          render={(v, i) => (
            <List.Item key={i}>
              {v.year || "—"} {v.make_model || ""} — {v.color || "—"} (
              {v.state || "—"} • {v.plate_number || "—"})
            </List.Item>
          )}
        />
      </Section>

      <Button
        variant="subtle"
        colorPalette="orange"
        backgroundColor="colorPalette.subtle"
        color="colorPalette.fg"
        className="ring-1 ring-orange-500/50 px-md"

        onClick={() => navigate("/")}
        mt={6}
      >
        Return
      </Button>
    </Box>
  );
}

// Helper components
function Section({ title, children }) {
  return (
    <Card.Root
      mb={6}
      p={4}
      borderWidth="0.5px"
      borderColor="colorPalette.border"
      borderRadius="md"
      colorPalette="gray"
    >
      <Heading size="md" mb={3}>
        {title}
      </Heading>
      {children}
    </Card.Root>
  );
}

function CustomList({ data, render, empty }) {
  if (!data?.length)
    return (
      <Text color="gray.500" fontStyle="italic">
        {empty}
      </Text>
    );
  return <List.Root>{data.map(render)}</List.Root>;
}

function lineAddr(a = {}) {
  const parts = [a.street, a.city, a.state, a.zip].filter(Boolean);
  const line = parts.join(", ");
  return a.county ? `${line} (${a.county})` : line || "—";
}

function formatPrimaryAddress(addrs = []) {
  if (!addrs.length) return "—";
  const primary =
    addrs.find((a) => (a.type || "").toUpperCase() === "RES") || addrs[0];
  return lineAddr(primary);
}

function fmt(d) {
  if (!d) return "—";
  const t = typeof d === "string" ? d : String(d);
  return t.length >= 10 ? t.slice(0, 10) : t;
}

function bool(b) {
  return b === true ? "Yes" : b === false ? "No" : "—";
}
