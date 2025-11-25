// src/records/records.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Person } from 'src/db/entities/Person';
import queries from './queries';
import * as fs from 'fs';
import { S3UploadService } from 'src/aws/s3upload.service';

class Error {
  error: string;
}

interface DataRow {
  person: Person;
}

interface CountRow {
  total: number;
}

@Injectable()
export class RecordsService {
  #manager: EntityManager;
  constructor(
    @Inject('RECORDS_QUERIES') private readonly SQLqueries: typeof queries,
    @Inject('PERSON_REPO') private readonly personRepo: Repository<Person>,
    @Inject('DATA_SOURCE') private readonly dataSource: DataSource,
    private readonly s3upload: S3UploadService,
  ) {
    this.#manager = this.dataSource.manager;
  }
  // rdsCa = fs.readFileSync('rds-combined-ca-bundle.pem', 'utf8');
  /*
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
*/
  private readonly logger = new Logger(RecordsService.name);

  // src/records/records.service.ts
  async getRecordById(offenderId: string): Promise<Error | Person> {
    const rows = await this.#manager.query<Person[]>(this.SQLqueries.getByID, [
      offenderId,
    ]);

    if (!rows || rows.length === 0) return { error: 'No record found' };

    const person = rows[0];

    // Normalize the URL and replace backslashes
    const imageUrl = (
      person.mugshot_front_url ||
      person.mugshot_side_url ||
      person.photo_url
    )?.replace(/\\/g, '/');

    console.log(`[getRecordById] person ${person.person_id} imageUrl:`, imageUrl);

    if (imageUrl) {
      const key = `mugshots/${person.person_id}.jpeg`;

      try {
        const exists = await this.s3upload.exists(key);
        if (!exists) {
          console.log(`[getRecordById] Uploading mugshot to S3: ${key}`);
          await this.s3upload.uploadMugshotFromUrl(imageUrl, key);
        } else {
          console.log(`[getRecordById] Mugshot already exists in S3: ${key}`);
        }
        person.photo_s3_key = key;
      } catch (err) {
        console.error(`[getRecordById] Failed to upload mugshot for person ${person.person_id}:`, err);
      }
    } else {
      console.log(`[getRecordById] No image URL found for person ${person.person_id}`);
    }

    return person;
  }

  async searchByName(first: string, last: string, limit = 10, page = 1) {
    const offset = (page - 1) * limit;

    const values = [`%${first}%`, `%${last}%`, limit, offset];

    const [dataRes, countRes] = await Promise.all([
      this.#manager.query<DataRow[]>(this.SQLqueries.dataSQL, values),
      this.#manager.query<CountRow[]>(this.SQLqueries.countSQL, [`%${first}%`, `%${last}%`]),
    ]);

    const people = dataRes.map((r) => r.person);

    for (const person of people) {
      const imageUrl = (
        person.mugshot_front_url ||
        person.mugshot_side_url ||
        person.photo_url
      )?.replace(/\\/g, '/');

      console.log(`Processing person ${person.person_id}, imageUrl:`, imageUrl);

      if (!imageUrl) {
        console.log(`No image URL, skipping S3 upload for person ${person.person_id}`);
        continue;
      }

      const key = `mugshots/${person.person_id}.jpeg`;

      try {
        const exists = await this.s3upload.exists(key);
        if (!exists) {
          console.log(`Uploading mugshot to S3: ${key}`);
          await this.s3upload.uploadMugshotFromUrl(imageUrl, key);
        } else {
          console.log(`Mugshot already exists in S3: ${key}`);
        }
        person.photo_s3_key = key;
      } catch (err) {
        console.error(`Failed to upload mugshot for person ${person.person_id}:`, err);
      }
    }

    return {
      data: people,
      page,
      limit,
      total: countRes[0]?.total ?? 0,
    };
  }

}
