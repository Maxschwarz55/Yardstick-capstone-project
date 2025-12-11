import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScraperService } from 'src/scrapers/scraper.service';

@Injectable()
export class JobService {
  constructor(private readonly scraperService: ScraperService) {}
  // @Cron('0 0 0 * * *')
  @Cron('* * * * * *')
  getNYData() {
    this.scraperService
      .runScraperTest()
      .then(() => {
        console.log('done');
      })
      .catch((e) => console.log(e));
  }
}
