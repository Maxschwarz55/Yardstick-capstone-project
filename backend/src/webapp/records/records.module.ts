import {Module} from '@nestjs/common';
import {RecordsController} from './records.controller';
import {RecordsService} from './records.service';
import {ScraperService} from '../../scrapers/scraper.service';

@Module({
  controllers: [RecordsController],
  providers: [RecordsService, ScraperService],
})

export class RecordsModule {}
