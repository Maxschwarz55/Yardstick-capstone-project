//eslint complaining for no rzn so these diabled
import { DataSource } from 'typeorm';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Person } from './entities/Person';

export const dbProviders: Provider[] = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async (
      configService: ConfigService,
    ): Promise<InstanceType<typeof DataSource>> => {
      const ssl = configService.get<string>('node_env') === 'production';
      const source: InstanceType<typeof DataSource> = new DataSource({
        type: 'postgres',
        host: configService.get<string>('db.host') as string,
        port: configService.get<number>('db.port') as number,
        username: configService.get<string>('db.user') as string,
        password: configService.get<string>('db.pwd'),
        database: configService.get<string>('db.db'),
        entities: [Person],
        ssl: {
    rejectUnauthorized: false,
  },
      });
      try {
        await source.initialize();
        return source;
      } catch (e) {
        if (e instanceof Error) {
          throw e;
        }

        console.log('Problem initializing DataSource connection');
        throw new Error('Problem initializing DataSource connection');
      }
      return source;
    },
    inject: [ConfigService],
  },
];
