import { Test, TestingModule } from '@nestjs/testing';
import {
  ACCESS_TOKEN_SIGNER,
  type AccessTokenSigner,
} from '../ports/access-token-signer';
import { LoginUserUseCase } from './login-user.use-case';
import { PASSWORD_HASHER, type PasswordHasher } from '../ports/password-hasher';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepository,
} from '../../domain/auth-user.repository';
import type { AuthUser } from '../../domain/auth-user.entity';
import { InvalidCredentialsError } from '../../domain/auth-user.errors';

describe('LoginUserUseCase', () => {
  let loginUserUseCase: LoginUserUseCase;
  let authUserRepository: {
    findByEmail: jest.Mock<Promise<AuthUser | null>, [string]>;
  };
  let passwordHasher: {
    verify: jest.Mock<Promise<boolean>, [string, string]>;
  };
  let accessTokenSigner: {
    sign: jest.Mock<Promise<string>, [{ sub: string; email: string }]>;
  };

  beforeEach(async () => {
    authUserRepository = {
      findByEmail: jest.fn<Promise<AuthUser | null>, [string]>(),
    };
    passwordHasher = {
      verify: jest.fn<Promise<boolean>, [string, string]>(),
    };
    accessTokenSigner = {
      sign: jest.fn<Promise<string>, [{ sub: string; email: string }]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        {
          provide: AUTH_USER_REPOSITORY,
          useValue: authUserRepository satisfies Pick<
            AuthUserRepository,
            'findByEmail'
          >,
        },
        {
          provide: PASSWORD_HASHER,
          useValue: passwordHasher satisfies Pick<PasswordHasher, 'verify'>,
        },
        {
          provide: ACCESS_TOKEN_SIGNER,
          useValue: accessTokenSigner satisfies Pick<AccessTokenSigner, 'sign'>,
        },
      ],
    }).compile();

    loginUserUseCase = module.get<LoginUserUseCase>(LoginUserUseCase);
  });

  it('should normalize the email, verify the password, and return a clean result', async () => {
    const user: AuthUser = {
      id: 'user_123',
      email: 'alex@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date('2026-03-19T10:00:00.000Z'),
      updatedAt: new Date('2026-03-19T10:00:00.000Z'),
    };
    authUserRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);
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
    expect(authUserRepository.findByEmail).toHaveBeenCalledWith(
      'alex@example.com',
    );
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'my-secure-password',
      user.passwordHash,
    );
    expect(accessTokenSigner.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
  });

  it('should reject when the email does not exist', async () => {
    authUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      loginUserUseCase.execute({
        email: 'alex@example.com',
        password: 'my-secure-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(passwordHasher.verify).not.toHaveBeenCalled();
    expect(accessTokenSigner.sign).not.toHaveBeenCalled();
  });

  it('should reject when the password is invalid', async () => {
    authUserRepository.findByEmail.mockResolvedValue({
      id: 'user_123',
      email: 'alex@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date('2026-03-19T10:00:00.000Z'),
      updatedAt: new Date('2026-03-19T10:00:00.000Z'),
    });
    passwordHasher.verify.mockResolvedValue(false);

    await expect(
      loginUserUseCase.execute({
        email: 'alex@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(accessTokenSigner.sign).not.toHaveBeenCalled();
  });
});
