import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';

@Module({
  imports: [ConfigModule],
  providers: [ScraperService],
  controllers: [ScraperController],
  exports: [ScraperService],
})
export class ScraperModule {}
