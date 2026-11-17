import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Unique,
} from 'typeorm';

@Entity('users')
@Unique('UQ_users_email', ['email'])
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 254 })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
