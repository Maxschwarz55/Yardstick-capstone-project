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

export {
    testQuery
}