import { DataSource } from 'typeorm';
import { Person } from './entities/Person';

export const personProviders = [
  {
    provide: 'PERSON_REPO',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Person),
    inject: ['DATA_SOURCE'],
  },
];
