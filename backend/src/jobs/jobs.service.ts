import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as dotenv from 'dotenv';
// import { spawn } from 'child_process';

@Injectable()
export class JobService {
  constructor() {
    dotenv.config();
  }
  //TODO what's update freq of db?
  //every minute
  @Cron('0 * * * * *')
  getNYData() {
    // const path: string = process.env['NY_SCRAPER_PATH'] ?? 'TODO';
    //TODO how to start scraper?
    // spawn('python', [path]);
    console.log('get data');
  }
}
