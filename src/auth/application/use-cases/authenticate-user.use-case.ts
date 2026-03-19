import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_HASHER, type PasswordHasher } from '../ports/password-hasher';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepository,
} from '../../domain/auth-user.repository';
import { InvalidCredentialsError } from '../../domain/auth-user.errors';
import type { AuthUser } from '../../domain/auth-user.entity';
import { normalizeEmail } from '../../domain/normalize-email';

export interface AuthenticateUserCommand {
  email: string;
  password: string;
}

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: AuthenticateUserCommand): Promise<AuthUser> {
    const user = await this.authUserRepository.findByEmail(
      normalizeEmail(command.email),
    );

    if (user === null) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.verify(
      command.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return user;
  }
}
