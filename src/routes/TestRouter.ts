import { Router } from "express";
import { testQuery } from "../db/queries.js";

const testRouter = Router()

testRouter.get("/", (req, res) => {
    res.send("hello world")
})

testRouter.get("/db", async (req, res) => {
    const rows = await testQuery()
    res.send(rows)
})

export default testRouter