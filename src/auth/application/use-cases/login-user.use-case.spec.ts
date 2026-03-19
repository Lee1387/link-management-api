import { Test, TestingModule } from '@nestjs/testing';
import {
  ACCESS_TOKEN_SIGNER,
  type AccessTokenSigner,
} from '../ports/access-token-signer';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';
import { LoginUserUseCase } from './login-user.use-case';
import type { AuthUser } from '../../domain/auth-user.entity';
import { InvalidCredentialsError } from '../../domain/auth-user.errors';

describe('LoginUserUseCase', () => {
  let loginUserUseCase: LoginUserUseCase;
  let authenticateUserUseCase: {
    execute: jest.Mock<
      Promise<AuthUser>,
      [{ email: string; password: string }]
    >;
  };
  let accessTokenSigner: {
    sign: jest.Mock<Promise<string>, [{ sub: string; email: string }]>;
  };

  beforeEach(async () => {
    authenticateUserUseCase = {
      execute: jest.fn<
        Promise<AuthUser>,
        [{ email: string; password: string }]
      >(),
    };
    accessTokenSigner = {
      sign: jest.fn<Promise<string>, [{ sub: string; email: string }]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        {
          provide: AuthenticateUserUseCase,
          useValue: authenticateUserUseCase satisfies Pick<
            AuthenticateUserUseCase,
            'execute'
          >,
        },
        {
          provide: ACCESS_TOKEN_SIGNER,
          useValue: accessTokenSigner satisfies Pick<AccessTokenSigner, 'sign'>,
        },
      ],
    }).compile();

    loginUserUseCase = module.get<LoginUserUseCase>(LoginUserUseCase);
  });

  it('should authenticate the user, sign an access token, and return a clean result', async () => {
    const user: AuthUser = {
      id: 'user_123',
      email: 'alex@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date('2026-03-19T10:00:00.000Z'),
      updatedAt: new Date('2026-03-19T10:00:00.000Z'),
    };
    authenticateUserUseCase.execute.mockResolvedValue(user);
    accessTokenSigner.sign.mockResolvedValue('signed-jwt-token');

    await expect(
      loginUserUseCase.execute({
        email: '  Alex@Example.com ',
        password: 'my-secure-password',
      }),
    ).resolves.toEqual({
      accessToken: 'signed-jwt-token',
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
      },
    });
    expect(authenticateUserUseCase.execute).toHaveBeenCalledWith({
      email: '  Alex@Example.com ',
      password: 'my-secure-password',
    });
    expect(accessTokenSigner.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
  });

  it('should reject when authentication fails', async () => {
    authenticateUserUseCase.execute.mockRejectedValue(
      new InvalidCredentialsError(),
    );

    await expect(
      loginUserUseCase.execute({
        email: 'alex@example.com',
        password: 'my-secure-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(accessTokenSigner.sign).not.toHaveBeenCalled();
  });
});
