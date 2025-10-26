import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { ScraperModule } from 'src/scrapers/scraper.module';

@Module({
  imports: [ScraperModule],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}

