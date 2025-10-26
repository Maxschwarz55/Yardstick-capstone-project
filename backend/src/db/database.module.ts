import { Module } from '@nestjs/common';
import { dbProviders } from './database.services';
import { ConfigModule } from '@nestjs/config';
import { personProviders } from './person.providers';

@Module({
  imports: [ConfigModule],
  providers: [...dbProviders, ...personProviders],
  exports: [...dbProviders, ...personProviders],
})
export class DatabaseModule {}
