import { AuthenticationModule, TokenService } from '@nestjs/authentication';
import type { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, expect, it, vi } from 'vitest';
import { User } from '../entities/user.entity.js';
import { JwtAuthProvider } from './jwt-auth.provider.js';

describe('JWT authentication', () => {
  it('accepts a freshly issued access token and loads its user', async () => {
    const user = { id: 'user-id' };
    const users = { findOneBy: vi.fn().mockResolvedValue(user) };
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
      providers: [
        JwtAuthProvider,
        { provide: getRepositoryToken(User), useValue: users },
      ],
    }).compile();
    await module.init();
    const { accessToken } = await module
      .get(TokenService)
      .issue(user.id, { method: 'password' });
    const request = { headers: { authorization: `Bearer ${accessToken}` } };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    await expect(
      module.get(JwtAuthProvider).authenticate(context),
    ).resolves.toMatchObject({ user });
    expect(users.findOneBy).toHaveBeenCalledWith({ id: user.id });
    await module.close();
  });
});
