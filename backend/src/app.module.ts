import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { WebAppController } from './webapp/webapp.controller';

@Module({
  imports: [],
  controllers: [AppController, WebAppController],
  providers: [],
})
export class AppModule {}
