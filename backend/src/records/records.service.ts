import { Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Person } from 'src/db/entities/Person';

export class RecordsService {
  constructor(@Inject('PERSON_REPO') private personRepo: Repository<Person>) {}

  async getRecordById(offenderId: string): Promise<Person> {
    try {
      const rows = await this.personRepo.findOneByOrFail({ offenderId });
      return rows;
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error(`Something went wrong trying to fetch ${offenderId}`);
    }
  }

}
