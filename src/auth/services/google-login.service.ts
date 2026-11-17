import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@nestjs/authentication';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { PublicUser } from '../dtos/public-user.dto.js';
import { GoogleOidcClient } from '../providers/google-oidc.client.js';
import { OidcFlowStore } from './oidc-flow.store.js';
import { GoogleAccountResolver } from '../providers/google-account.resolver.js';

const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class GoogleLoginService {
  constructor(
    private readonly config: ConfigService,
    private readonly client: GoogleOidcClient,
    private readonly flows: OidcFlowStore,
    private readonly accounts: GoogleAccountResolver,
    private readonly tokens: TokenService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  get enabled() {
    return (
      !!this.config.get<string>('GOOGLE_CLIENT_ID')?.trim() &&
      !!this.config.get<string>('GOOGLE_CLIENT_SECRET')?.trim()
    );
  }

  get frontendCallback() {
    return (
      this.config.get<string>('FRONTEND_CALLBACK_URL')?.trim() ||
      'http://localhost:4200/auth/callback'
    );
  }
  get secureCookie() {
    return (
      new URL(
        this.config.get<string>('GOOGLE_CALLBACK_URL')?.trim() ||
          'http://localhost:3000/api/v1/auth/oidc/google/callback',
      ).protocol === 'https:'
    );
  }

  async start(linkUserId?: string) {
    const binding = randomBytes(32).toString('base64url');
    const state = digest(binding);
    const { url, verifier, nonce } = await this.client.start(state);
    await this.flows.put(
      state,
      'login',
      {
        browserHash: state,
        verifier,
        nonce,
        ...(linkUserId && { linkUserId }),
      },
      10 * 60_000,
    );
    return { url, binding };
  }

  async finish(
    query: { code: string; state: string; iss?: string },
    binding?: string,
  ) {
    if (!binding || digest(binding) !== query.state)
      throw new UnauthorizedException('Google login browser mismatch');
    const flow = await this.flows.take(query.state, 'login', digest(binding));
    const profile = await this.client.finish(query, flow.verifier, flow.nonce);
    const userId = await this.accounts.resolve(profile, flow.linkUserId);
    const code = randomBytes(32).toString('base64url');
    await this.flows.put(
      digest(code),
      'exchange',
      { browserHash: digest(binding), userId },
      60_000,
    );
    const url = new URL(this.frontendCallback);
    url.hash = new URLSearchParams({ code }).toString();
    return url.href;
  }

  async exchange(code: string, binding?: string) {
    if (!binding)
      throw new UnauthorizedException('Google login browser mismatch');
    const flow = await this.flows.take(
      digest(code),
      'exchange',
      digest(binding),
    );
    const user = await this.users.findOneBy({ id: flow.userId });
    if (!user) throw new UnauthorizedException();
    const result = await this.tokens.issue(flow.userId, {
      method: 'oidc:google',
      claims: { amr: ['oidc:google'] },
    });
    return { ...result, user: PublicUser.toDto(user) };
  }
}
