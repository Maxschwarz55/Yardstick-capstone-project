import { DataSource } from 'typeorm';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const dbProviders: Provider[] = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async (configService: ConfigService) => {
      const source = new DataSource({
        //TODO switch to env var
        type: 'postgres',
        host: configService.get<string>('db.host'),
        port: configService.get<number>('db.port'),
        username: configService.get<string>('db.user'),
        password: configService.get<string>('db.pwd'),
        entities: [
          //TODO
        ]
      });
      try {
        await source.initialize();
        return source;
      } catch (e) {
        if (e instanceof Error) {
          throw e;
        }

        console.log('Problem initializing DataSource connection');
      }
    },
    inject: [ConfigService],
  },
];
