import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScraperService {
  private readonly inserterPath: string;

  constructor(private configService: ConfigService) {
    const path = this.configService.get<string>('INSERTER_PATH');
    if (!path) {
      throw new Error('INSERTER_PATH env not set, see README.md for more');
    }
    this.inserterPath = path;
  }

  async runScraper(): Promise<any> {
    return new Promise((resolve, reject) => {
      exec(`bash ${this.inserterPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Scraper failed:', stderr || error.message);
          return reject(error);
        }

        if (stderr) {
          console.warn('Scraper stderr:', stderr);
        }

        // Try to parse JSON from the script output
        try {
          const parsed = JSON.parse(stdout);
          return resolve(parsed);
        } catch {
          return resolve({ raw: stdout.trim() });
        }
      });
    });
  }

  async runScraperTest(): Promise<any> {
    return new Promise((resolve, reject) => {
      // ⬇⬇⬇ changed from `python3` to `bash`
      exec(`bash ${this.inserterPath} "Adam" "Jones"`, (error, stdout, stderr) => {
        if (error) {
          console.error('Scraper failed:', stderr || error.message);
          return reject(error);
        }

        if (stderr) {
          console.warn('Scraper stderr:', stderr);
        }

        try {
          const parsed = JSON.parse(stdout);
          return resolve(parsed);
        } catch {
          return resolve({ raw: stdout.trim() });
        }
      });
    });
  }

  // Example: run the script with arbitrary name
  runScraperWithName(firstName: string, lastName: string): Promise<any> {
    const fullName = `${firstName} ${lastName}`;
    return new Promise((resolve, reject) => {
      exec(`bash ${this.inserterPath} "${fullName}"`, (error, stdout, stderr) => {
        if (error) {
          console.error('Scraper failed:', stderr || error.message);
          return reject(error);
        }

        if (stderr) {
          console.warn('Scraper stderr:', stderr);
        }

        try {
          const parsed = JSON.parse(stdout);
          return resolve(parsed);
        } catch {
          return resolve({ raw: stdout.trim() });
        }
      });
    });
  }
}
