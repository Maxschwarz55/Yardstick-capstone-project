import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { ScraperModule } from 'src/scrapers/scraper.module';
import { DatabaseModule } from 'src/db/database.module';

@Module({
<<<<<<< HEAD
    imports: [ScraperModule],
    controllers: [RecordsController],
    providers: [RecordsService],
=======
  imports: [ScraperModule, DatabaseModule],
  controllers: [RecordsController],
  providers: [RecordsService],
>>>>>>> chore/migrate-to-typeorm
})
export class RecordsModule { }
