import { Module } from '@nestjs/common';
import { WebAppController } from './webapp/webapp.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from './jobs/jobs.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ScheduleModule.forRoot(), JobModule, ConfigModule.forRoot()],
  controllers: [WebAppController],
  providers: [],
})
export class AppModule {}
