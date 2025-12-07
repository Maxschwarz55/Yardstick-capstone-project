import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('person')
export class Person {
  @PrimaryGeneratedColumn({ name: 'person_id' })
  person_id: number;

  @Column({ type: 'text', nullable: true, name: 'offender_id' })
  offender_id: string;

  @Column({ type: 'text', nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ type: 'text', nullable: true, name: 'middle_name' })
  middleName: string;

  @Column({ type: 'text', nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dob: string;

  @Column({ type: 'int', nullable: true, name: 'age' })
  age: number;

  @Column({ type: 'date', nullable: true, name: 'last_updated' })
  lastUpdated: string;

  @Column({ type: 'varchar', length: 16, nullable: true, name: 'sex' })
  sex: string;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'race' })
  race: string;

  @Column({ type: 'text', nullable: true, name: 'ethnicity' })
  ethnicity: string;

  @Column({ type: 'text', nullable: true, name: 'height' })
  height: string;

  @Column({ type: 'int', nullable: true, name: 'weight' })
  weight: number;

  @Column({ type: 'text', nullable: true, name: 'hair' })
  hair: string;

  @Column({ type: 'text', nullable: true, name: 'eyes' })
  eyes: string;

  @Column({ type: 'boolean', nullable: true, name: 'corrective_lens' })
  correctiveLens: boolean;

  @Column({ type: 'int', nullable: true, name: 'risk_level' })
  riskLevel: number;

  @Column({ type: 'text', nullable: true, name: 'designation' })
  designation: string;

  @Column({ type: 'date', nullable: true, name: 'photo_date' })
  photo_date: string;

  @Column({ type: 'text', nullable: true, name: 'photo_url' })
  photo_url: string;

  @Column({ type: 'text', nullable: true, name: 'photo_type' })
  photo_type: string;

  @Column({ type: 'text', nullable: true })
  photo_s3_key: string;

  @Column({ type: 'text', nullable: true, name: 'offender_url' })
  offender_url: string;

  @Column({ type: 'text', nullable: true, name: 'skin_tone' })
  skin_tone: string;

  @Column({ type: 'text', nullable: true, name: 'build' })
  build: string;

  @Column({ type: 'text', nullable: true, name: 'release_date' })
  release_date: string;

  @Column({ type: 'text', nullable: true, name: 'supervision_comments' })
  supervision_comments: string;

  @Column({ type: 'text', nullable: true, name: 'absconder' })
  absconder: string;

  @Column({ type: 'text', nullable: true, name: 'jurisdiction_id' })
  jurisdiction_id: string;

  @Column({ type: 'text', nullable: true, name: 'mugshot_front_url' })
  mugshot_front_url: string;

  @Column({ type: 'text', nullable: true, name: 'mugshot_side_url' })
  mugshot_side_url: string;
}
