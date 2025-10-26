import { Module } from '@nestjs/common';
import { dbProviders } from './DatabaseServices';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [...dbProviders],
  exports: [...dbProviders],
})
export class DatabaseModule {}
