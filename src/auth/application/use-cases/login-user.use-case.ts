import { Inject, Injectable } from '@nestjs/common';
import {
  ACCESS_TOKEN_SIGNER,
  type AccessTokenSigner,
} from '../ports/access-token-signer';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';

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
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    @Inject(ACCESS_TOKEN_SIGNER)
    private readonly accessTokenSigner: AccessTokenSigner,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const user = await this.authenticateUserUseCase.execute(command);

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
