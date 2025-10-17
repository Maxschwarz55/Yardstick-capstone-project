import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ScraperService {
  //every minute
  @Cron('0 * * * * *')
  getNYData(): string {
    console.log('get data');
    return 'test';
  }
}
