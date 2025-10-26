import {Injectable} from '@nestjs/common';
import {Pool} from 'pg';

@Injectable()
export class DiagnosticsService{
    private pool = new Pool({connectionString: process.env.DATABASE_URL });

    async getDiagnostics(){
        const total = await this.pool.query('SELECT COUNT(*) FROM person');
        const logs = await this.pool.query(
            'SELECT * FROM crawl_log ORDER BY crawl_date DESC LIMIT 2'
        );
        const [latest, previous] = logs.rows;

        return{
            lastCrawledAt: latest?.crawl_date ?? null,
            recordsAddedSinceLastCrawl: previous
                ? latest.total_records - previous.total_records
                : latest.records_added ?? 0,
            nextScheduledCrawl: this.computeNextCrawl(latest?.crawl_date),
            totalRecords: parseInt(total.rows[0].count, 10),
        };
    }

    private computeNextCrawl(last?: string){
        if (!last) return null;
        const next = new Date(last);
        //TODO: update to the correct time cycle
        next.setDate(next.getDate() + 2);
        return next;
    }
}