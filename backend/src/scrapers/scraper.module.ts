import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScraperService } from './scraper.service';

@Module({
    imports: [ConfigModule],
    providers: [ScraperService],
    exports: [ScraperService]
})

export class ScraperModule {};