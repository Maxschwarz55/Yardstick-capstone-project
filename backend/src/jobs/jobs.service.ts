import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScraperService } from 'src/scrapers/scraper.service';

@Injectable()
export class JobService {
  constructor(private readonly scraperService: ScraperService) {}
  //TODO what's update freq of db?
  //every minute
  @Cron('0 * * * * *')
  getNYData() {
    // this.scraperService.runScraper();
  }
}
