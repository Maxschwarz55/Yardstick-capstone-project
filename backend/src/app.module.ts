import { Module } from '@nestjs/common';
import { WebAppController } from './webapp/webapp.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ScraperModule } from './scrapers/scrapers.module';

@Module({
  imports: [ScheduleModule.forRoot(), ScraperModule],
  controllers: [WebAppController],
  providers: [],
})
export class AppModule {}
