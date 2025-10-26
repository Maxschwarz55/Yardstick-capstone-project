import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScraperModule } from './scrapers/scraper.module';
import * as Joi from 'joi';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from './jobs/jobs.module';
import { WebAppController } from './webapp/webapp.controller';
import { RecordsModule } from './records/records.module';

@Module({
<<<<<<< HEAD
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        PORT: Joi.number().default(4000),
        CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
      }),
    }),
    ScheduleModule.forRoot(),
    JobModule,
    RecordsModule,
  ],
=======
  imports: [ScheduleModule.forRoot(), JobModule, ConfigModule.forRoot({
    validationSchema: {
      DB_PORT: Joi.number().integer().min(1),
    }
  }), ScraperModule],
>>>>>>> 344ac6d6a9699355c0a32465e6e6f2956e40ad48
  controllers: [WebAppController],
  providers: [],
})
export class AppModule {}
