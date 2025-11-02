import { Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Person } from 'src/db/entities/Person';

export class RecordsService {
    // private pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // // constructor(){}

    // async getRecordById(id: string) {
    //     const res = await this.pool.query(
    //         'SELECT * FROM person WHERE offender_id = $1 LIMIT 1;',
    //         [id],
    //     );

    //     if (res.rows.length > 0) return res.rows[0];

    //     return { error: 'No record found' };
    // }

    // private async saveToDatabase(data: any) {
    //     await this.pool.query(
    //         'INSERT INTO person (offender_id, first_name, last_name) VALUES ($1, $2, $3) ON CONFLICT (offender_id) DO NOTHING;',
    //         [data.offender_id, data.first_name, data.last_name],
    //     );
    // }
  constructor(@Inject('PERSON_REPO') private personRepo: Repository<Person>) {}

  async getRecordById(offenderId: string): Promise<Person> {
    try {
      const rows = await this.personRepo.findOneByOrFail({ offenderId });
      return rows;
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error('Something went wrong');
    }
  }
}
