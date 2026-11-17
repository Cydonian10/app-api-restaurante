import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('auth_oidc_flows')
export class OidcFlow {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ length: 20 })
  kind: string;

  @Column({ type: 'jsonb' })
  data: Record<string, string>;

  @Index('IDX_oidc_flow_expiry')
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;
}
