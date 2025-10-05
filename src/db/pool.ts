import { Pool } from "pg"
import * as dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
    connectionString: process.env["CONNECTION_URL"]
})

export default pool