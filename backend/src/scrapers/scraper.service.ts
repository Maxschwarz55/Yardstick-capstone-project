import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScraperService {
  private readonly inserterPath: string;
  private readonly venvPath: string;

  constructor(private configService: ConfigService) {
    const path = this.configService.get<string>('INSERTER_PATH');
    if (!path) {
      throw new Error('INSERTER_PATH env not set, see README.md for more');
    }
    this.inserterPath = path;

    const venv_path = this.configService.get<string>('VENV_PATH');
    if (!venv_path)
      throw new Error('VENV_PATH env not set, see README.md for more');
    this.venvPath = venv_path;
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
      exec(
        `source ${this.venvPath}/bin/activate && python3 ${this.inserterPath} `,
        (error, stdout, stderr) => {
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
        },
      );
    });
  }

  // Example: run the script with arbitrary name
  runScraperWithName(firstName: string, lastName: string): Promise<any> {
    const fullName = `${firstName} ${lastName}`;
    return new Promise((resolve, reject) => {
      exec(
        `bash ${this.inserterPath} "${fullName}"`,
        (error, stdout, stderr) => {
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
        },
      );
    });
  }
}
