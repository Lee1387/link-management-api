import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from './register-user.use-case';
import { PASSWORD_HASHER, type PasswordHasher } from '../ports/password-hasher';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepository,
  type CreateAuthUserInput,
} from '../../domain/auth-user.repository';
import type { AuthUser } from '../../domain/auth-user.entity';
import { EmailAlreadyInUseError } from '../../domain/auth-user.errors';

describe('RegisterUserUseCase', () => {
  let registerUserUseCase: RegisterUserUseCase;
  let authUserRepository: {
    create: jest.Mock<Promise<AuthUser>, [CreateAuthUserInput]>;
  };
  let passwordHasher: {
    hash: jest.Mock<Promise<string>, [string]>;
    verify: jest.Mock<Promise<boolean>, [string, string]>;
  };

  beforeEach(async () => {
    authUserRepository = {
      create: jest.fn<Promise<AuthUser>, [CreateAuthUserInput]>(),
    };
    passwordHasher = {
      hash: jest.fn<Promise<string>, [string]>(),
      verify: jest.fn<Promise<boolean>, [string, string]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: AUTH_USER_REPOSITORY,
          useValue: authUserRepository satisfies Pick<
            AuthUserRepository,
            'create'
          >,
        },
        {
          provide: PASSWORD_HASHER,
          useValue: passwordHasher satisfies PasswordHasher,
        },
      ],
    }).compile();

    registerUserUseCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
  });

  it('should hash the password and persist the registered user', async () => {
    const command = {
      email: '  Alex@Example.com ',
      password: 'my-secure-password',
    };
    const createdUser: AuthUser = {
      id: 'user_123',
      email: 'alex@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    passwordHasher.hash.mockResolvedValue(createdUser.passwordHash);
    authUserRepository.create.mockResolvedValue(createdUser);

    await expect(registerUserUseCase.execute(command)).resolves.toEqual(
      createdUser,
    );
    expect(passwordHasher.hash).toHaveBeenCalledWith(command.password);
    expect(authUserRepository.create).toHaveBeenCalledWith({
      email: 'alex@example.com',
      passwordHash: createdUser.passwordHash,
    });
  });

  it('should propagate duplicate email failures', async () => {
    passwordHasher.hash.mockResolvedValue('hashed-password');
    authUserRepository.create.mockRejectedValue(new EmailAlreadyInUseError());

    await expect(
      registerUserUseCase.execute({
        email: 'alex@example.com',
        password: 'my-secure-password',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError);
  });
});
