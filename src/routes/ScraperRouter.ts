import express from 'express';
import { insertScrapedData } from '../db/queries';

const scraperRouter = express.Router();
scraperRouter.post('/', async (req, res) => {
    try{
        const data = req.body;
        await insertScrapedData(data);
        res.status(201).json({message: 'Data inserted'});
    }
    catch (error){
        res.status(500).json({error: 'Server error inserting'});
    }
});

export default scraperRouter;