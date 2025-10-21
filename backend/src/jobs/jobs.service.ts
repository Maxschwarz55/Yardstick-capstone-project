import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';

@Injectable()
export class JobService {
  constructor(private configService: ConfigService) {}
  //TODO what's update freq of db?
  //every minute
  @Cron('0 * * * * *')
  getNYData() {
    const path: string = this.configService.get<string>('NY_SCRAPER_PATH') ?? 'TODO';
    //TODO how to start scraper?
    spawn(`scrapy crawl sor`, {'cwd': path});
    // console.log('get data');
  }
}
