import {Injectable} from '@nestjs/common';
import {exec} from 'child_process';

@Injectable()
export class ScraperService{
    async runScraper(id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            exec(`python3 ../../db_inserter.py ${id}`, (error, stdout, stderr) => {
                if (error) {
                    console.error('Scraper failed:', stderr);
                    return reject(error);
                }
                try {
                    resolve(JSON.parse(stdout));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}