import { AuthenticationModule, TokenService } from '@nestjs/authentication';
import {
  StandardSchemaValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { User } from '../../auth/entities/user.entity.js';
import { JwtAuthProvider } from '../../auth/providers/jwt-auth.provider.js';
import { UserRole } from '../enums/user-role.enum.js';
import { UsersController } from './users.controller.js';

describe('POST /users authorization and validation', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const commands = { execute: vi.fn() };
  const users = {
    findOneBy: vi.fn(async ({ id }: { id: string }) =>
      Object.values(UserRole).includes(id as UserRole)
        ? { id, role: id }
        : null,
    ),
  };
  const data = {
    name: 'Ana',
    email: 'ana@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AuthenticationModule.forRoot({
          accessToken: {
            key: 'test-secret-with-at-least-32-characters',
            ttl: '1h',
          },
          refreshToken: false,
        }),
      ],
      controllers: [UsersController],
      providers: [
        JwtAuthProvider,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: CommandBus, useValue: commands },
        { provide: QueryBus, useValue: { execute: vi.fn() } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    tokens = app.get(TokenService);
  });

  beforeEach(() => {
    commands.execute.mockReset();
    commands.execute.mockResolvedValue({
      id: 'created-user',
      ...data,
      role: UserRole.ADMIN,
      emailVerified: false,
      person: { name: data.name, lastName: null },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects missing and invalid credentials before dispatching creation', async () => {
    await request(app.getHttpServer()).post('/users').send(data).expect(401);
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer invalid')
      .send(data)
      .expect(401);
    expect(commands.execute).not.toHaveBeenCalled();
  });

  it.each(Object.values(UserRole).filter((role) => role !== UserRole.ADMIN))(
    'rejects authenticated role %s',
    async (role) => {
      const { accessToken } = await tokens.issue(role);
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...data, role: UserRole.ADMIN })
        .expect(403);
      expect(commands.execute).not.toHaveBeenCalled();
    },
  );

  it('allows an administrator to select a role and omits password data in the response', async () => {
    const { accessToken } = await tokens.issue(UserRole.ADMIN);
    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...data, role: UserRole.ADMIN })
      .expect(201);
    expect(commands.execute.mock.calls[0][0].data).toEqual({
      ...data,
      role: UserRole.ADMIN,
    });
    expect(response.body.role).toBe(UserRole.ADMIN);
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('rejects an invalid role before dispatching creation', async () => {
    const { accessToken } = await tokens.issue(UserRole.ADMIN);
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...data, role: 'INVALID' })
      .expect(400);
    expect(commands.execute).not.toHaveBeenCalled();
  });
});
