import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { ScraperModule } from 'src/scrapers/scraper.module';
import { DatabaseModule } from 'src/db/database.module';
import queries from './queries';
import { JobModule } from 'src/jobs/jobs.module';
import { S3UploadService } from 'src/aws/s3upload.service';

@Module({
  imports: [ScraperModule, DatabaseModule, JobModule],
  controllers: [RecordsController],
  providers: [
    RecordsService,
    {
      provide: 'RECORDS_QUERIES',
      useValue: queries,
    },
    S3UploadService,
  ],
})
export class RecordsModule {}
