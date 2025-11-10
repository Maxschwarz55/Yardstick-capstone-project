export default {
  getByID: ` SELECT json_build_object(
        'person_id', p.person_id,
        'offender_id', p.offender_id,
        'first_name', p.first_name,
        'middle_name', p.middle_name,
        'last_name', p.last_name,
        'dob', p.dob,
        'sex', p.sex,
        'race', p.race,
        'ethnicity', p.ethnicity,
        'height', p.height,
        'weight', p.weight,
        'hair', p.hair,
        'eyes', p.eyes,
        'corrective_lens', p.corrective_lens,
        'risk_level', p.risk_level,
        'designation', p.designation,
        'photo_date', p.photo_date,

        'addresses', COALESCE((
          SELECT json_agg(row_to_json(a) ORDER BY a.type)
          FROM ( SELECT type, street, city, state, zip, county
                 FROM address WHERE person_id = p.person_id ) a
        ), '[]'::json),

        'convictions', COALESCE((
          SELECT json_agg(row_to_json(c)
                   ORDER BY c.date_convicted DESC NULLS LAST, c.date_of_crime DESC NULLS LAST)
          FROM ( SELECT title, pl_section, subsection, class, category, counts, description,
                        date_of_crime, date_convicted, victim_sex_age, arresting_agency,
                        offense_descriptions, relationship_to_victim, weapon_used, force_used,
                        computer_used, pornography_involved, sentence_term, sentence_type
                 FROM conviction WHERE person_id = p.person_id ) c
        ), '[]'::json),

        'previous_convictions', COALESCE((
          SELECT json_agg(row_to_json(pc) ORDER BY pc.title)
          FROM ( SELECT title FROM previous_conviction WHERE person_id = p.person_id ) pc
        ), '[]'::json),

        'law_enforcement_agencies', COALESCE((
          SELECT json_agg(row_to_json(lea) ORDER BY lea.agency_name)
          FROM ( SELECT agency_name FROM law_enforcement_agency WHERE person_id = p.person_id ) lea
        ), '[]'::json),

        'supervising_agencies', COALESCE((
          SELECT json_agg(row_to_json(sa) ORDER BY sa.agency_name)
          FROM ( SELECT agency_name FROM supervising_agency WHERE person_id = p.person_id ) sa
        ), '[]'::json),

        'special_conditions', COALESCE((
          SELECT json_agg(row_to_json(sc) ORDER BY sc.description)
          FROM ( SELECT description FROM special_conditions WHERE person_id = p.person_id ) sc
        ), '[]'::json),

       'max_expiration_dates', COALESCE((
          SELECT json_agg(row_to_json(me) ORDER BY me.max_exp_id)
          FROM (
            SELECT max_exp_id, description
            FROM max_expiration_date
            WHERE person_id = p.person_id
          ) me
        ), '[]'::json),

        'scars_marks', COALESCE((
          SELECT json_agg(row_to_json(sm) ORDER BY sm.location)
          FROM ( SELECT description, location FROM scar_mark WHERE person_id = p.person_id ) sm
        ), '[]'::json),

        'aliases', COALESCE((
          SELECT json_agg(row_to_json(al) ORDER BY al.last_name, al.first_name)
          FROM ( SELECT first_name, middle_name, last_name FROM alias_name WHERE person_id = p.person_id ) al
        ), '[]'::json),

        'vehicles', COALESCE((
          SELECT json_agg(row_to_json(v) ORDER BY v.year NULLS LAST, v.make_model)
          FROM ( SELECT plate_number, state, year, make_model, color FROM vehicle WHERE person_id = p.person_id ) v
        ), '[]'::json)
      ) AS person
      FROM person p
      WHERE p.offender_id = $1
      LIMIT 1;
    `,
  dataSQL: `
      WITH matches AS (
        SELECT person_id
        FROM person
        WHERE first_name ILIKE $1 AND last_name ILIKE $2
        ORDER BY last_name, first_name, person_id
        LIMIT $3 OFFSET $4
      )
      SELECT json_build_object(
        'person_id', p.person_id,
        'offender_id', p.offender_id,
        'first_name', p.first_name,
        'middle_name', p.middle_name,
        'last_name', p.last_name,
        'dob', p.dob,
        'sex', p.sex,
        'race', p.race,
        'ethnicity', p.ethnicity,
        'height', p.height,
        'weight', p.weight,
        'hair', p.hair,
        'eyes', p.eyes,
        'corrective_lens', p.corrective_lens,
        'risk_level', p.risk_level,
        'designation', p.designation,
        'photo_date', p.photo_date,

        'addresses', COALESCE((
          SELECT json_agg(row_to_json(a) ORDER BY a.type)
          FROM ( SELECT type, street, city, state, zip, county
                 FROM address WHERE person_id = p.person_id ) a
        ), '[]'::json),

        'convictions', COALESCE((
          SELECT json_agg(row_to_json(c)
                   ORDER BY c.date_convicted DESC NULLS LAST, c.date_of_crime DESC NULLS LAST)
          FROM ( SELECT title, pl_section, subsection, class, category, counts, description,
                        date_of_crime, date_convicted, victim_sex_age, arresting_agency,
                        offense_descriptions, relationship_to_victim, weapon_used, force_used,
                        computer_used, pornography_involved, sentence_term, sentence_type
                 FROM conviction WHERE person_id = p.person_id ) c
        ), '[]'::json),

        'previous_convictions', COALESCE((
          SELECT json_agg(row_to_json(pc) ORDER BY pc.title)
          FROM ( SELECT title FROM previous_conviction WHERE person_id = p.person_id ) pc
        ), '[]'::json),

        'law_enforcement_agencies', COALESCE((
          SELECT json_agg(row_to_json(lea) ORDER BY lea.agency_name)
          FROM ( SELECT agency_name FROM law_enforcement_agency WHERE person_id = p.person_id ) lea
        ), '[]'::json),

        'supervising_agencies', COALESCE((
          SELECT json_agg(row_to_json(sa) ORDER BY sa.agency_name)
          FROM ( SELECT agency_name FROM supervising_agency WHERE person_id = p.person_id ) sa
        ), '[]'::json),

        'special_conditions', COALESCE((
          SELECT json_agg(row_to_json(sc) ORDER BY sc.description)
          FROM ( SELECT description FROM special_conditions WHERE person_id = p.person_id ) sc
        ), '[]'::json),

        'max_expiration_dates', COALESCE((
          SELECT json_agg(row_to_json(me) ORDER BY me.max_exp_id)
          FROM (
            SELECT max_exp_id, description
            FROM max_expiration_date
            WHERE person_id = p.person_id
          ) me
        ), '[]'::json),

        'scars_marks', COALESCE((
          SELECT json_agg(row_to_json(sm) ORDER BY sm.location)
          FROM ( SELECT description, location FROM scar_mark WHERE person_id = p.person_id ) sm
        ), '[]'::json),

        'aliases', COALESCE((
          SELECT json_agg(row_to_json(al) ORDER BY al.last_name, al.first_name)
          FROM ( SELECT first_name, middle_name, last_name FROM alias_name WHERE person_id = p.person_id ) al
        ), '[]'::json),

        'vehicles', COALESCE((
          SELECT json_agg(row_to_json(v) ORDER BY v.year NULLS LAST, v.make_model)
          FROM ( SELECT plate_number, state, year, make_model, color FROM vehicle WHERE person_id = p.person_id ) v
        ), '[]'::json)
      ) AS person
      FROM matches m
      JOIN person p ON p.person_id = m.person_id;
    `,
  countSQL: `
      SELECT COUNT(*)::int AS total
      FROM person
      WHERE first_name ILIKE $1 AND last_name ILIKE $2;
    `,
};
