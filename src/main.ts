import * as express from "express"
import testRouter from "./routes/TestRouter"

const app = express()

const PORT = 3000

app.listen(PORT, (err) => {
    if (err)
        throw err
})

app.use("/test", testRouter)
