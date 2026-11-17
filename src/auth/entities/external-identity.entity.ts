import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity.js';

@Entity('external_identities')
@Unique(['provider', 'userId'])
export class ExternalIdentity {
  @PrimaryColumn({ length: 255 })
  provider: string;

  @PrimaryColumn({ name: 'provider_user_id', length: 255 })
  providerUserId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
