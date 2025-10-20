import { Module } from '@nestjs/common';
import { JobService } from './jobs.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [JobService],
  // exports: [JobService],
})
export class JobModule {}
