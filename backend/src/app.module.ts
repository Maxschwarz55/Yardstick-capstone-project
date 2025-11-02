import { Module } from '@nestjs/common';
import { WebAppController } from './webapp/webapp.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from './jobs/jobs.module';
import { ConfigModule } from '@nestjs/config';
import { ScraperModule } from './scrapers/scraper.module';
import * as Joi from 'joi';
import config from './config';

@Module({
<<<<<<< HEAD
  imports: [ScheduleModule.forRoot(), JobModule, ConfigModule.forRoot({
    validationSchema: {
      DB_PORT: Joi.number().integer().min(1),
    }
  }), ScraperModule],
=======
  imports: [
    ScheduleModule.forRoot(),
    JobModule,
    ConfigModule.forRoot({
      load: [config],
      validationSchema: Joi.object({
        DB_PORT: Joi.number().port().required().messages({
          'number.port': 'DB_PORT must be a valid port',
        }),
        DB_HOST: Joi.string().hostname().required().messages({
          'string.hostname': 'DB_HOST must be a valid hostname',
        }),
        DB_PWD: Joi.string().required().messages({
          'string.base': 'DB_PWD must be a string',
          'string.empty': 'DB_PWD is required',
        }),
        DB_USER: Joi.string().required().messages({
          'string.base': 'DB_PWD must be a string',
          'string.empty': 'DB_PWD is required',
        }),
        DB_DB: Joi.string().required().messages({
          'string.base': 'DB_PWD must be a string',
          'string.empty': 'DB_PWD is required',
        }),
      }),
    }),
  ],
>>>>>>> chore/migrate-to-typeorm
  controllers: [WebAppController],
  providers: [],
})
export class AppModule {}
