import { Inject, Injectable } from '@nestjs/common';
import {
  ACCESS_TOKEN_SIGNER,
  type AccessTokenSigner,
} from '../ports/access-token-signer';
import { PASSWORD_HASHER, type PasswordHasher } from '../ports/password-hasher';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepository,
} from '../../domain/auth-user.repository';
import { InvalidCredentialsError } from '../../domain/auth-user.errors';

export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface LoginUserResult {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly user: {
    readonly id: string;
    readonly email: string;
  };
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(ACCESS_TOKEN_SIGNER)
    private readonly accessTokenSigner: AccessTokenSigner,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const normalizedEmail = command.email.trim().toLowerCase();
    const user = await this.authUserRepository.findByEmail(normalizedEmail);

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

    const accessToken = await this.accessTokenSigner.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
