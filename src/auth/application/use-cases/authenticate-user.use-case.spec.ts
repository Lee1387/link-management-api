import { Test, TestingModule } from '@nestjs/testing';
import { PASSWORD_HASHER, type PasswordHasher } from '../ports/password-hasher';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepository,
} from '../../domain/auth-user.repository';
import type { AuthUser } from '../../domain/auth-user.entity';
import { InvalidCredentialsError } from '../../domain/auth-user.errors';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';

describe('AuthenticateUserUseCase', () => {
  let authenticateUserUseCase: AuthenticateUserUseCase;
  let authUserRepository: {
    findByEmail: jest.Mock<Promise<AuthUser | null>, [string]>;
  };
  let passwordHasher: {
    verify: jest.Mock<Promise<boolean>, [string, string]>;
  };

  beforeEach(async () => {
    authUserRepository = {
      findByEmail: jest.fn<Promise<AuthUser | null>, [string]>(),
    };
    passwordHasher = {
      verify: jest.fn<Promise<boolean>, [string, string]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticateUserUseCase,
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
      ],
    }).compile();

    authenticateUserUseCase = module.get<AuthenticateUserUseCase>(
      AuthenticateUserUseCase,
    );
  });

  it('should normalize the email, verify the password, and return the user', async () => {
    const user: AuthUser = {
      id: 'user_123',
      email: 'alex@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date('2026-03-19T10:00:00.000Z'),
      updatedAt: new Date('2026-03-19T10:00:00.000Z'),
    };
    authUserRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);

    await expect(
      authenticateUserUseCase.execute({
        email: '  Alex@Example.com ',
        password: 'my-secure-password',
      }),
    ).resolves.toEqual(user);
    expect(authUserRepository.findByEmail).toHaveBeenCalledWith(
      'alex@example.com',
    );
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'my-secure-password',
      user.passwordHash,
    );
  });

  it('should reject when the email does not exist', async () => {
    authUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authenticateUserUseCase.execute({
        email: 'alex@example.com',
        password: 'my-secure-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(passwordHasher.verify).not.toHaveBeenCalled();
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
      authenticateUserUseCase.execute({
        email: 'alex@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
