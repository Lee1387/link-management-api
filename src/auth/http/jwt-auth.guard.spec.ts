import { type ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
} from '../application/ports/access-token-verifier';
import { InvalidAccessTokenError } from '../domain/auth-user.errors';
import { JwtAuthGuard } from './jwt-auth.guard';

interface TestRequest {
  headers?: {
    authorization?: string | string[];
  };
  user?: {
    id: string;
    email: string;
  };
}

function createExecutionContext(request: TestRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: <T>() => request as T,
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let jwtAuthGuard: JwtAuthGuard;
  let accessTokenVerifier: {
    verify: jest.Mock<
      Promise<{
        sub: string;
        email: string;
        iat: number;
        exp: number;
      }>,
      [string]
    >;
  };

  beforeEach(async () => {
    accessTokenVerifier = {
      verify: jest.fn<
        Promise<{
          sub: string;
          email: string;
          iat: number;
          exp: number;
        }>,
        [string]
      >(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: ACCESS_TOKEN_VERIFIER,
          useValue: accessTokenVerifier satisfies AccessTokenVerifier,
        },
      ],
    }).compile();

    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should verify the bearer token and attach the authenticated user to the request', async () => {
    const request: TestRequest = {
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
    };
    accessTokenVerifier.verify.mockResolvedValue({
      sub: 'user_123',
      email: 'alex@example.com',
      iat: 1,
      exp: 2,
    });

    await expect(
      jwtAuthGuard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(accessTokenVerifier.verify).toHaveBeenCalledWith('signed-jwt-token');
    expect(request.user).toEqual({
      id: 'user_123',
      email: 'alex@example.com',
    });
  });

  it('should reject requests without an authorization header', async () => {
    await expect(
      jwtAuthGuard.canActivate(createExecutionContext({})),
    ).rejects.toThrow('Authentication token is missing.');
    expect(accessTokenVerifier.verify).not.toHaveBeenCalled();
  });

  it('should reject requests with a non-bearer authorization header', async () => {
    await expect(
      jwtAuthGuard.canActivate(
        createExecutionContext({
          headers: {
            authorization: 'Basic abc123',
          },
        }),
      ),
    ).rejects.toThrow('Authentication token is missing.');
    expect(accessTokenVerifier.verify).not.toHaveBeenCalled();
  });

  it('should reject requests with an invalid bearer token', async () => {
    accessTokenVerifier.verify.mockRejectedValue(new InvalidAccessTokenError());

    await expect(
      jwtAuthGuard.canActivate(
        createExecutionContext({
          headers: {
            authorization: 'Bearer invalid-token',
          },
        }),
      ),
    ).rejects.toThrow('Authentication token is invalid.');
    expect(accessTokenVerifier.verify).toHaveBeenCalledWith('invalid-token');
  });
});
