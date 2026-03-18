import { Inject, Injectable } from '@nestjs/common';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepository,
} from '../domain/auth-user.repository';

export interface RegisterUserCommand {
  email: string;
  password: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly authUserRepository: AuthUserRepository,
  ) {}
}
