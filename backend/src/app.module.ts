import { Module } from '@nestjs/common';
import { WebAppController } from './webapp/webapp.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from './jobs/jobs.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [ScheduleModule.forRoot(), JobModule, ConfigModule.forRoot({
    validationSchema: {
      DB_PORT
    }
  })],
  controllers: [WebAppController],
  providers: [],
})
export class AppModule {}
