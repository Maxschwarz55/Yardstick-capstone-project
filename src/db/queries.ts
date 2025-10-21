import pool from "./pool";

async function testQuery() {
    const SQL = `
        SELECT *
        FROM people
        WHERE name = 'John Smith';
    `
    const res = await pool.query(SQL)
    return res.rows 
}

/*insert a record sent from scraper*/
async function insertScrapedData(data: any){
    const SQL = `
    INSERT INTO person (
        offender_id, first_name, middle_name, last_name,
        dob, sex, race, ethnicity, height, weight, hair,
        eyes, corrective_lens, risk_level, designation, photo_date
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    ON CONFLICT (offender_id) DO UPDATE
        SET first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            dob = EXCLUDED.dob,
            sex = EXCLUDED.sex;
    `;
    const params = [
        data.offender_id ?? null,
        data.first_name ?? null,
        data.middle_name ?? null,
        data.last_name ?? null,
        data.dob ?? null,
        data.sex ?? null,
        data.race ?? null,
        data.ethnicity ?? null,
        data.height ?? null,
        data.weight ?? null,
        data.hair ?? null,
        data.eyes ?? null,
        data.corrective_lens ?? null,
        data.risk_level ?? null,
        data.designation ?? null,
        data.photo_date ?? null
    ];

    await pool.query(SQL, params);
}

export {
    testQuery,
    insertScrapedData
}