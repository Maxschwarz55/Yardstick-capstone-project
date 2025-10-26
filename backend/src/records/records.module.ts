import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { ScraperModule } from 'src/scrapers/scraper.module';

@Module({
    imports: [ScraperModule],
    controllers: [RecordsController],
    providers: [RecordsService],
})
<<<<<<< HEAD
export class RecordsModule {}

=======
export class RecordsModule { }
>>>>>>> 344ac6d6a9699355c0a32465e6e6f2956e40ad48
