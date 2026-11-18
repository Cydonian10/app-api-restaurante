import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../users/enums/user-role.enum.js';
import { User } from '../entities/user.entity.js';
import { Person } from '../../users/entities/person.entity.js';
import { ExternalIdentity } from '../entities/external-identity.entity.js';
import { GoogleAccountResolver } from './google-account.resolver.js';

describe('GoogleAccountResolver', () => {
  it('creates the user, person and identity in the same transaction', async () => {
    const manager = {
      query: vi.fn().mockResolvedValue([]),
      findOneBy: vi.fn().mockResolvedValue(null),
      insert: vi.fn().mockResolvedValue(undefined),
    };
    const db = {
      transaction: vi.fn(async (fn: (manager: unknown) => unknown) =>
        fn(manager),
      ),
    };
    const hasher = { hash: vi.fn().mockResolvedValue('hash') };
    const resolver = new GoogleAccountResolver(db as never, hasher as never);
    const id = await resolver.resolve({
      subject: 'google-id',
      email: 'ana@example.com',
      name: 'Ana Pérez',
      givenName: 'Ana',
      familyName: 'Pérez',
    });
    expect(manager.insert).toHaveBeenCalledWith(
      User,
      expect.objectContaining({
        id,
        email: 'ana@example.com',
        emailVerified: true,
        role: UserRole.CLIENTE,
      }),
    );
    expect(manager.insert).toHaveBeenCalledWith(
      Person,
      expect.objectContaining({ userId: id, name: 'Ana', lastName: 'Pérez' }),
    );
    expect(manager.insert).toHaveBeenCalledWith(
      ExternalIdentity,
      expect.objectContaining({ userId: id }),
    );
    expect(db.transaction).toHaveBeenCalledOnce();
  });
});
