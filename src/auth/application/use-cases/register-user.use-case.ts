import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_HASHER, type PasswordHasher } from '../ports/password-hasher';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepository,
} from '../../domain/auth-user.repository';
import type { AuthUser } from '../../domain/auth-user.entity';

export interface RegisterUserCommand {
  email: string;
  password: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<AuthUser> {
    const passwordHash = await this.passwordHasher.hash(command.password);

    return this.authUserRepository.create({
      email: command.email.trim().toLowerCase(),
      passwordHash,
    });
  }
}
