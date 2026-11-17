import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OidcFlow } from '../entities/oidc-flow.entity.js';

@Injectable()
export class OidcFlowStore {
  constructor(private readonly database: DataSource) {}

  async put(
    id: string,
    kind: 'login' | 'exchange',
    data: Record<string, string>,
    ttl: number,
  ) {
    await this.database.transaction(async (manager) => {
      // Serialize inserts to bound storage even when login attempts arrive concurrently.
      await manager.query('SELECT pg_advisory_xact_lock(1794340000002)');
      await manager.query(
        'DELETE FROM auth_oidc_flows WHERE expires_at <= now()',
      );
      await manager.query(`DELETE FROM auth_oidc_flows WHERE id IN
        (SELECT id FROM auth_oidc_flows ORDER BY expires_at DESC, id OFFSET 9999)`);
      await manager.insert(OidcFlow, {
        id,
        kind,
        data,
        expiresAt: new Date(Date.now() + ttl),
      });
    });
  }

  async take(
    id: string,
    kind: 'login' | 'exchange',
    browserHash: string,
  ): Promise<Record<string, string>> {
    const result = await this.database
      .createQueryBuilder()
      .delete()
      .from(OidcFlow)
      .where('id = :id AND kind = :kind AND expires_at > now()', { id, kind })
      .andWhere("data ->> 'browserHash' = :browserHash", { browserHash })
      .returning('data')
      .execute();
    const rows = result.raw as { data: Record<string, string> }[];
    if (!rows[0])
      throw new UnauthorizedException('Invalid or expired Google login');
    return rows[0].data;
  }
}
