import { Module } from '@nestjs/common';
import { JobService } from './jobs.service';
import { ConfigModule } from '@nestjs/config';
import { RecordsService } from 'src/records/records.service';
import { ScraperModule } from 'src/scrapers/scraper.module';

@Module({
  imports: [ConfigModule, ScraperModule],
  providers: [JobService, RecordsService],
})
export class JobModule {}
