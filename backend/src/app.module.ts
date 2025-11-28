import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { ScraperModule } from './scrapers/scraper.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as Joi from 'joi';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from './jobs/jobs.module';
import { WebAppController } from './webapp/webapp.controller';
import { RecordsModule } from './records/records.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { SimilarityCheckModule } from './matcher/similarity_check.module';
import config from './config';
import { SummaryModule } from './summary/summary.module';
import { join } from 'path';
import { ConfigService } from 'aws-sdk';
import { SelfieModule } from './matcher/selfie.module';

@Module({
  imports: [
    // ConfigModule.forRoot({
    //   envFilePath: ['../.env'],
    //   isGlobal: true,
    //   validationSchema: Joi.object({
    //     DATABASE_URL: Joi.string().uri().required(),
    //     DATABASE_PORT: Joi.number().default(4000),
    //     CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
    //   }),
    // }),
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
          'string.base': 'DB_USER must be a string',
          'string.empty': 'DB_USER is required',
        }),
        DB_DB: Joi.string().required().messages({
          'string.base': 'DB_DB must be a string',
          'string.empty': 'DB_DB is required',
        }),
        NODE_ENV: Joi.string().default('production'),
        // backend/src/app.module
        //assume prod
        STATIC_PATH: Joi.string().default(
          join(__dirname, '..', '..', 'bundle', 'background-check-ui'),
        ),
      }),
    }),
    ScheduleModule.forRoot(),
    JobModule,
    RecordsModule,
    DiagnosticsModule,
    SummaryModule,
    SimilarityCheckModule,
    SelfieModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'bundle', 'background-check-ui'),
      exclude: ["/summary/*", "records/*", "/ai-summary/*", ""],
    }),
  ],
  controllers: [WebAppController],
  providers: [],
})
export class AppModule {}
