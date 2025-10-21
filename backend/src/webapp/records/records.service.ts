import {Injectable} from '@nestjs/common';
import {Pool} from 'pg';
import {ScraperService} from '../../scrapers/scraper.service';

@Injectable()
export class RecordsService{
    private pool = new Pool({connectionString: process.env.DATABASE_URL});

    constructor(private readonly scraperService: ScraperService){}

    async getRecordById(id: string){
        const res = await this.pool.query(
            'SELECT * FROM person WHERE offender_id = $1 LIMIT 1;',
            [id]
        );

        if (res.rows.length > 0) return res.rows[0];

        //db miss -> launch scraper
        const scraped = await this.scraperService.runScraper(id);
        if(scraped){
            await this.saveToDatabase(scraped);
            return scraped;
        }
        return {error: 'No record found'};
    }

    private async saveToDatabase(data: any){
        await this.pool.query(
            'INSERT INTO person (offender_id, first_name, last_name) VALUES ($1, $2, $3) ON CONFLICT (offender_id) DO NOTHING;',
            [data.offender_id, data.first_name, data.last_name]
        );
    }
}

