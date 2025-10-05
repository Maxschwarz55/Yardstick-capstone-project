import pool from "./pool";

async function testQuery() {
    const SQL = `
        SELECT * FROM test;
    `
    //assume table test exists
    const res = await pool.query(SQL)
    return res.rows 
}

export {
    testQuery
}