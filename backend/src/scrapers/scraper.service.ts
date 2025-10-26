import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScraperService {
  constructor(private configService: ConfigService) {}

  async runScraper(): Promise<any> {
    const INSERTER_PATH: string | undefined =
      this.configService.get<string>('INSERTER_PATH');

    if (!INSERTER_PATH)
      throw new Error('INSERTER_PATH env not set, see README.md for more');

    return new Promise((resolve, reject) => {
      exec(`python3 ${INSERTER_PATH}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Scraper failed:', stderr);
          return reject(error);
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          if (e instanceof Error) {
            reject(e);
          }
          reject(new Error('Unable to parse scraper output'));
        }
      });
    });
  }
}
