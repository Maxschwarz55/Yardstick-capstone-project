import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { ScraperModule } from 'src/scrapers/scraper.module';
import { DatabaseModule } from 'src/db/database.module';

@Module({
  imports: [ScraperModule, DatabaseModule],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
