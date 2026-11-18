import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Unique,
  OneToOne,
  type Relation,
} from 'typeorm';
import { Person } from '../../users/entities/person.entity.js';
import { UserRole } from '../../users/enums/user-role.enum.js';

@Entity('users')
@Unique('UQ_users_email', ['email'])
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => Person, (person) => person.user, { eager: true })
  person: Relation<Person>;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum',
    default: UserRole.CLIENTE,
  })
  role: UserRole;

  @Column({ length: 254 })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
