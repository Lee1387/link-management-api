import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
} from '../application/ports/access-token-verifier';
import { InvalidAccessTokenError } from '../domain/auth-user.errors';
import type { AuthenticatedRequest } from './authenticated-request-user';

interface AuthenticatedHttpRequest extends AuthenticatedRequest {
  readonly headers?: {
    readonly authorization?: string | string[];
  };
}

function extractBearerToken(
  authorizationHeader: string | string[] | undefined,
): string | null {
  if (typeof authorizationHeader !== 'string') {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());

  if (match === null) {
    return null;
  }

  return match[1]?.trim() || null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(ACCESS_TOKEN_VERIFIER)
    private readonly accessTokenVerifier: AccessTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedHttpRequest>();
    const token = extractBearerToken(request.headers?.authorization);

    if (token === null) {
      throw new UnauthorizedException('Authentication token is missing.');
    }

    try {
      const payload = await this.accessTokenVerifier.verify(token);

      request.user = {
        id: payload.sub,
        email: payload.email,
      };

      return true;
    } catch (error) {
      if (error instanceof InvalidAccessTokenError) {
        throw new UnauthorizedException('Authentication token is invalid.');
      }

      throw error;
    }
  }
}
