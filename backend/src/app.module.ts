import { Module } from '@nestjs/common';
import { WebAppController } from './webapp/webapp.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from './jobs/jobs.module';

@Module({
  imports: [ScheduleModule.forRoot(), JobModule],
  controllers: [WebAppController],
  providers: [],
})
export class AppModule {}
