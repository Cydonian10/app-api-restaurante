import { TokenService } from '@nestjs/authentication';
import {
  StandardSchemaValidationPipe,
  VersioningType,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource, type Repository } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ExternalIdentity } from '../src/auth/entities/external-identity.entity.js';
import { OidcFlow } from '../src/auth/entities/oidc-flow.entity.js';
import { User } from '../src/auth/entities/user.entity.js';
import { getDatabaseConfig } from '../src/config/database.config.js';
import type { ListUsersResponseDto } from '../src/users/dtos/list-users.dto.js';
import { Person } from '../src/users/entities/person.entity.js';
import { UserRole } from '../src/users/enums/user-role.enum.js';
import { Product } from '../src/products/entities/product.entity.js';

describe('GET /api/v1/users', () => {
  const path = '/api/v1/users';
  const ids = Array.from({ length: 4 }, () => randomUUID()).sort();
  const [adminId, staffId, clientId, noPersonId] = ids;
  const marker = randomUUID().slice(0, 8);
  const emails = ['admin', 'staff', 'client', 'missing'].map(
    (part) => `${part}-${marker}@example.com`,
  );
  let app: INestApplication<App>;
  let users: Repository<User>;
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useFactory({
        factory: () =>
          new DataSource({
            type: 'postgres',
            ...getDatabaseConfig(),
            // Resolve entities through Vitest rather than TypeORM's native TS loader.
            entities: [User, Person, ExternalIdentity, OidcFlow, Product],
          }).initialize(),
      })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();

    const db = app.get(DataSource);
    users = db.getRepository(User);
    const createdAt = new Date('2026-01-01T00:00:00Z');
    await users.insert(
      ids.map((id, index) => ({
        id,
        email: emails[index],
        role:
          [UserRole.ADMIN, UserRole.COCINA, UserRole.CLIENTE][index] ??
          UserRole.CLIENTE,
        emailVerified: index === 0 || index === 2,
        passwordHash: 'not-exposed',
        createdAt,
      })),
    );
    await db.getRepository(Person).insert([
      {
        id: randomUUID(),
        userId: staffId,
        name: 'Ana%',
        lastName: 'Pérez',
        phone: '123456',
        document: 'not-exposed',
        residence: 'not-exposed',
      },
      {
        id: randomUUID(),
        userId: clientId,
        name: 'Ana',
        lastName: 'Pérez',
      },
    ]);
    const tokens = app.get(TokenService);
    adminToken = (await tokens.issue(adminId)).accessToken;
    clientToken = (await tokens.issue(clientId)).accessToken;
  });

  afterAll(async () => {
    try {
      await users?.delete(ids);
    } finally {
      await app?.close();
    }
  });

  const list = (query: Record<string, string | number> = {}) =>
    request(app.getHttpServer())
      .get(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .query(query);

  const payload = (response: Response) => response.body as ListUsersResponseDto;

  it('requires a valid JWT and rejects a non-admin before query validation', async () => {
    await request(app.getHttpServer()).get(path).expect(401);
    await request(app.getHttpServer())
      .get(path)
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
    await request(app.getHttpServer())
      .get(path)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get(path)
      .set('Authorization', `Bearer ${clientToken}`)
      .query({ page: 0 })
      .expect(403);
  });

  it.each([
    'page=0',
    'page=1.5',
    'page=1&page=2',
    'limit=0',
    'limit=101',
    'role=INVALID',
    'emailVerified=1',
    'emailVerified=TRUE',
  ])('rejects %s', async (query) => {
    await list().query(query).expect(400);
  });

  it('applies defaults, includes users without a person and only exposes the listed fields', async () => {
    const body = payload(await list({ search: marker }).expect(200));
    expect(body).toMatchObject({ page: 1, limit: 10, total: 4, totalPages: 1 });
    expect(body.items.map(({ id }) => id)).toEqual(ids);
    expect(body.items[1]).toEqual({
      id: staffId,
      email: emails[1],
      role: UserRole.COCINA,
      emailVerified: false,
      person: { name: 'Ana%', lastName: 'Pérez', phone: '123456' },
    });
    expect(body.items[3]).toEqual({
      id: noPersonId,
      email: emails[3],
      role: UserRole.CLIENTE,
      emailVerified: false,
      person: null,
    });
  });

  it.each([
    ['  aNA%  ', UserRole.COCINA, 'false', staffId],
    ['péREZ', UserRole.COCINA, 'false', staffId],
    ['aNA péREZ', UserRole.CLIENTE, 'true', clientId],
    [emails[3].toUpperCase(), UserRole.CLIENTE, 'false', noPersonId],
  ])(
    'combines search (%s), role and verification filters',
    async (search, role, emailVerified, id) => {
      const body = payload(
        await list({ search, role, emailVerified }).expect(200),
      );
      expect(body.total).toBe(1);
      expect(body.items.map((item) => item.id)).toEqual([id]);
    },
  );

  it('does not interpret search text as a wildcard', async () => {
    const body = payload(await list({ search: '%' }).expect(200));
    expect(body.items.map(({ id }) => id)).toContain(staffId);
    expect(body.items.map(({ id }) => id)).not.toContain(clientId);
  });

  it('keeps the filtered total and requested page, even when out of range', async () => {
    const body = payload(
      await list({ search: marker, limit: 3, page: 2 }).expect(200),
    );
    expect(body).toMatchObject({ page: 2, limit: 3, total: 4, totalPages: 2 });
    expect(body.items.map(({ id }) => id)).toEqual([noPersonId]);
    expect(
      payload(await list({ search: marker, limit: 3, page: 3 }).expect(200)),
    ).toEqual({
      items: [],
      page: 3,
      limit: 3,
      total: 4,
      totalPages: 2,
    });
    expect(payload(await list({ search: randomUUID() }).expect(200))).toEqual({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });
});
