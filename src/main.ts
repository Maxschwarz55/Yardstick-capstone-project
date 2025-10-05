import * as express from "express"

const app = express()

const PORT = 3000

app.listen(PORT, (err) => {
    if (err)
        throw err
})
