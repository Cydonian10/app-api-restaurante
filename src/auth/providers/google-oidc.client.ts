import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oidc from 'openid-client';

@Injectable()
export class GoogleOidcClient {
  private configuration?: Promise<oidc.Configuration>;

  constructor(private readonly config: ConfigService) {}

  private async client(): Promise<oidc.Configuration> {
    const id = this.config.get<string>('GOOGLE_CLIENT_ID');
    const secret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    if (!id || !secret)
      throw new ServiceUnavailableException('Google login is not configured');
    if (!this.configuration) {
      this.configuration = oidc
        .discovery(new URL('https://accounts.google.com'), id, secret)
        .then((client) => {
          // Explicitly validate ID token signatures against Google's JWKS, in addition to claims.
          oidc.enableNonRepudiationChecks(client);
          return client;
        })
        .catch(() => {
          this.configuration = undefined;
          throw new ServiceUnavailableException(
            'Google is temporarily unavailable',
          );
        });
    }
    return this.configuration;
  }

  async start(state: string) {
    const client = await this.client();
    const verifier = oidc.randomPKCECodeVerifier();
    const nonce = oidc.randomNonce();
    const challenge = await oidc.calculatePKCECodeChallenge(verifier);
    const url = oidc.buildAuthorizationUrl(client, {
      redirect_uri:
        this.config.get<string>('GOOGLE_CALLBACK_URL')?.trim() ||
        'http://localhost:3000/api/v1/auth/oidc/google/callback',
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    return { url: url.href, verifier, nonce };
  }

  async finish(
    query: { code: string; state: string; iss?: string },
    verifier: string,
    nonce: string,
  ) {
    const client = await this.client();
    const url = new URL(
      this.config.get<string>('GOOGLE_CALLBACK_URL')?.trim() ||
        'http://localhost:3000/api/v1/auth/oidc/google/callback',
    );
    url.search = new URLSearchParams({
      code: query.code,
      state: query.state,
      ...(query.iss && { iss: query.iss }),
    }).toString();
    try {
      const tokens = await oidc.authorizationCodeGrant(client, url, {
        pkceCodeVerifier: verifier,
        expectedState: query.state,
        expectedNonce: nonce,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (
        !claims?.sub ||
        claims.email_verified !== true ||
        typeof claims.email !== 'string'
      ) {
        throw new Error('Verified identity required');
      }
      return {
        subject: claims.sub,
        email: claims.email,
        name: typeof claims.name === 'string' ? claims.name : undefined,
        givenName:
          typeof claims.given_name === 'string' ? claims.given_name : undefined,
        familyName:
          typeof claims.family_name === 'string'
            ? claims.family_name
            : undefined,
      };
    } catch {
      throw new UnauthorizedException('Google authentication failed');
    }
  }
}
