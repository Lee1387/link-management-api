import { Inject, Injectable } from '@nestjs/common';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepository,
} from '../domain/auth-user.repository';

export interface LoginUserCommand {
  email: string;
  password: string;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly authUserRepository: AuthUserRepository,
  ) {}
}
