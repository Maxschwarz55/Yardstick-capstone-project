import testRouter from "./routes/TestRouter.js"
import express from 'express';


const app = express()

const PORT = 3000

app.listen(PORT, (err) => {
    if (err)
        throw err
})

app.use("/test", testRouter)
