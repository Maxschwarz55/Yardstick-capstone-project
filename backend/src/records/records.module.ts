import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { ScraperModule } from 'src/scrapers/scraper.module';
import { DatabaseModule } from 'src/db/database.module';
import queries from './queries';

@Module({
  imports: [ScraperModule, DatabaseModule],
  controllers: [RecordsController],
  providers: [
    RecordsService,
    {
      provide: 'RECORDS_QUERIES',
      useValue: queries,
    },
  ],
})
export class RecordsModule {}
