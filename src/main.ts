import testRouter from "./routes/TestRouter"
import scraperRouter from "./routes/ScraperRouter"
import express from 'express';


const app = express()

const PORT = 3000

app.use(express.json());
app.use("/test", testRouter);
app.use('/scraper', scraperRouter);

app.listen(PORT, (err) => {
    console.log(`running on ${PORT}`);
    if (err)
        throw err
});