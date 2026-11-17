import { PasswordHasher, type OidcProfile } from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { ExternalIdentity } from '../entities/external-identity.entity.js';

@Injectable()
export class GoogleAccountResolver {
  constructor(
    private readonly db: DataSource,
    private readonly hasher: PasswordHasher,
  ) {}
  async resolve(
    profile: { subject: string; email: string; name?: string },
    linkUserId?: string,
  ): Promise<string> {
    const user = await this.resolveUser(
      {
        provider: 'google',
        subject: profile.subject,
        email: profile.email,
        name: profile.name,
        emailVerified: true,
        claims: {},
      },
      linkUserId,
    );
    if (!user) throw new Error('Google account could not be linked');
    return user.id;
  }
  async resolveUser(
    profile: OidcProfile,
    linkUserId?: string,
  ): Promise<{ id: string } | null> {
    if (
      profile.provider !== 'google' ||
      !profile.subject ||
      !profile.email ||
      !profile.emailVerified
    )
      return null;
    const email = profile.email.trim().normalize('NFC').toLowerCase();
    if (email.length > 254 || profile.subject.length > 255) return null;
    return this.db.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        email,
      ]);
      const identity = await manager.findOneBy(ExternalIdentity, {
        provider: 'google',
        providerUserId: profile.subject,
      });
      if (identity) {
        if (linkUserId && identity.userId !== linkUserId) return null;
        return { id: identity.userId };
      }
      if (linkUserId) {
        const local = (await manager.query(
          'SELECT id FROM users WHERE id = $1',
          [linkUserId],
        )) as { id: string }[];
        if (!local.length) return null;
        await manager.insert(ExternalIdentity, {
          provider: 'google',
          providerUserId: profile.subject,
          userId: linkUserId,
        });
        return { id: linkUserId };
      }
      const users = (await manager.query(
        'SELECT id, email_verified FROM users WHERE LOWER(email) = $1 LIMIT 2',
        [email],
      )) as { id: string; email_verified: boolean }[];
      if (users.length > 1 || (users.length === 1 && !users[0].email_verified))
        return null;
      let id = users[0]?.id;
      if (!id) {
        id = randomUUID();
        const hash = await this.hasher.hash(randomBytes(32).toString('hex'));
        await manager.query(
          'INSERT INTO users (id, name, email, password_hash, email_verified) VALUES ($1, $2, $3, $4, true)',
          [id, (profile.name?.trim() || email).slice(0, 120), email, hash],
        );
      }
      await manager.insert(ExternalIdentity, {
        provider: 'google',
        providerUserId: profile.subject,
        userId: id,
      });
      return { id };
    });
  }
}
