import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScraperService } from 'src/scrapers/scraper.service';

@Injectable()
export class JobService {
  constructor(private readonly scraperService: ScraperService) {}
  //TODO what's update freq of db?
  @Cron('0 0 0 * * *')
  getNYData() {
    //TODO
    this.scraperService
      .runScraperTest()
      .then(() => {
        console.log('done');
      })
      .catch((e) => console.log(e));
  }
}
