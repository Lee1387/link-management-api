import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import {
  type AccessTokenVerifier,
  type VerifiedAccessTokenPayload,
} from '../application/ports/access-token-verifier';
import { InvalidAccessTokenError } from '../domain/auth-user.errors';

function isVerifiedAccessTokenPayload(
  value: unknown,
): value is VerifiedAccessTokenPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sub' in value &&
    typeof value.sub === 'string' &&
    'email' in value &&
    typeof value.email === 'string' &&
    'iat' in value &&
    typeof value.iat === 'number' &&
    'exp' in value &&
    typeof value.exp === 'number'
  );
}

@Injectable()
export class JwtAccessTokenVerifier implements AccessTokenVerifier {
  constructor(private readonly jwtService: JwtService) {}

  async verify(token: string): Promise<VerifiedAccessTokenPayload> {
    try {
      const payload: unknown = await this.jwtService.verifyAsync(token);

      if (!isVerifiedAccessTokenPayload(payload)) {
        throw new InvalidAccessTokenError();
      }

      return payload;
    } catch (error) {
      if (error instanceof InvalidAccessTokenError) {
        throw error;
      }

      throw new InvalidAccessTokenError();
    }
  }
}
