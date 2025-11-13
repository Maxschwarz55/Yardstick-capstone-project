import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('person')
export class Person {
  @PrimaryGeneratedColumn({ name: 'person_id' })
  personId: number;

  @Column({ type: 'text', nullable: true, name: 'offender_id' })
  offenderId: string;

  @Column({ type: 'text', nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ type: 'text', nullable: true, name: 'middle_name' })
  middleName: string;

  @Column({ type: 'text', nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dob: string;

  @Column({ type: 'date', nullable: true, name: 'last_updated' })
  lastUpdated: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  sex: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  race: string;

  @Column({ type: 'text', nullable: true })
  ethnicity: string;

  @Column({ type: 'text', nullable: true })
  height: string;

  @Column({ type: 'int', nullable: true })
  weight: number;

  @Column({ type: 'text', nullable: true })
  hair: string;

  @Column({ type: 'text', nullable: true })
  eyes: string;

  @Column({ type: 'boolean', nullable: true, name: 'corrective_lens' })
  correctiveLens: boolean;

  @Column({ type: 'int', nullable: true, name: 'risk_level' })
  riskLevel: number;

  @Column({ type: 'text', nullable: true })
  designation: string;

  @Column({ type: 'date', nullable: true, name: 'photo_date' })
  photoDate: string;

  @Column({ nullable: true })
  photo_url: string;
}
