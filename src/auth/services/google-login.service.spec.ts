import { describe, it, expect, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { GoogleLoginService } from './google-login.service.js';

describe('Google login flow', () => {
  it('binds the one-time exchange code to the browser and returns the JWT', async () => {
    const records = new Map<
      string,
      { kind: string; data: Record<string, string> }
    >();
    const flows = {
      put: vi.fn(
        async (id: string, kind: string, data: Record<string, string>) => {
          records.set(id, { kind, data });
        },
      ),
      take: vi.fn(async (id: string, kind: string, browserHash: string) => {
        const record = records.get(id);
        if (
          !record ||
          record.kind !== kind ||
          record.data.browserHash !== browserHash
        )
          throw new Error('invalid flow');
        records.delete(id);
        return record.data;
      }),
    };
    const client = {
      start: vi.fn().mockResolvedValue({
        url: 'https://google.test',
        verifier: 'verifier',
        nonce: 'nonce',
      }),
      finish: vi
        .fn()
        .mockResolvedValue({ subject: 'sub', email: 'ana@example.com' }),
    };
    const accounts = { resolve: vi.fn().mockResolvedValue('user-id') };
    const tokens = { issue: vi.fn().mockResolvedValue({ accessToken: 'jwt' }) };
    const user = {
      id: 'user-id',
      name: 'Ana',
      email: 'ana@example.com',
      emailVerified: true,
      createdAt: new Date('2025-01-01'),
    };
    const users = {
      findOneBy: vi.fn().mockResolvedValue(user),
    };
    const service = new GoogleLoginService(
      new ConfigService(),
      client as never,
      flows as never,
      accounts as never,
      tokens as never,
      users as never,
    );
    const started = await service.start();
    const state = [...records.keys()][0];
    await expect(
      service.finish({ code: 'google-code', state }, 'other-browser'),
    ).rejects.toThrow();
    const callback = new URL(
      await service.finish({ code: 'google-code', state }, started.binding),
    );
    const code = new URLSearchParams(callback.hash.slice(1)).get('code')!;
    await expect(service.exchange(code, 'other-browser')).rejects.toThrow();
    expect(await service.exchange(code, started.binding)).toEqual({
      accessToken: 'jwt',
      user,
    });
    expect(users.findOneBy).toHaveBeenCalledWith({ id: 'user-id' });
    await expect(service.exchange(code, started.binding)).rejects.toThrow();
  });
});
