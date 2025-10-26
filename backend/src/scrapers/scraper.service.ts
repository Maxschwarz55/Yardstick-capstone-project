import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScraperService {
  private readonly INSERTER_PATH: string | undefined;
  constructor(private configService: ConfigService) {
    this.INSERTER_PATH = this.configService.get<string>('INSERTER_PATH');
  }

  async runScraper(): Promise<void> {
    if (!this.INSERTER_PATH)
      throw new Error('INSERTER_PATH env not set, see README.md for more');

    return new Promise((resolve, reject) => {
      exec(`python3 ${this.INSERTER_PATH}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Scraper failed:', stderr);
          return reject(error);
        }
        reject(new Error('Scraper failed'));
      });
    });
  }

  async runScraperTest(): Promise<void> {
    if (!this.INSERTER_PATH)
      throw new Error('INSERTER_PATH env not set, see README.md for more');

    return new Promise((resolve, reject) => {
      exec(
        `python3 ${this.INSERTER_PATH} Adam Jones`,
        (error, stdout, stderr) => {
          if (error) {
            console.error('Scraper failed:', stderr);
            return reject(error);
          }
          reject(new Error('Scraper failed'));
        },
      );
    });
  }
}
