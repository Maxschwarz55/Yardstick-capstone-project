import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from './jobs/jobs.module';
import { WebAppController } from './webapp/webapp.controller';
import { RecordsModule } from './records/records.module';

@Module({
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
  controllers: [WebAppController],
  providers: [],
})
export class AppModule {}
