import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import authConfig, { type AuthConfig } from '../config/auth.config';
import { ACCESS_TOKEN_VERIFIER } from './application/access-token-verifier';
import { ACCESS_TOKEN_SIGNER } from './application/access-token-signer';
import { PrismaModule } from '../prisma/prisma.module';
import { LoginUserUseCase } from './application/login-user.use-case';
import { PASSWORD_HASHER } from './application/password-hasher';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { AuthController } from './auth.controller';
import { AUTH_USER_REPOSITORY } from './domain/auth-user.repository';
import { JwtAccessTokenSigner } from './infrastructure/jwt-access-token-signer';
import { JwtAccessTokenVerifier } from './infrastructure/jwt-access-token-verifier';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { ScryptPasswordHasher } from './infrastructure/scrypt-password-hasher';

@Module({
  controllers: [AuthController],
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (config: AuthConfig) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtExpiresIn as NonNullable<
            JwtSignOptions['expiresIn']
          >,
        },
      }),
    }),
  ],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    PrismaUserRepository,
    ScryptPasswordHasher,
    JwtAccessTokenSigner,
    JwtAccessTokenVerifier,
    {
      provide: AUTH_USER_REPOSITORY,
      useExisting: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useExisting: ScryptPasswordHasher,
    },
    {
      provide: ACCESS_TOKEN_SIGNER,
      useExisting: JwtAccessTokenSigner,
    },
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useExisting: JwtAccessTokenVerifier,
    },
  ],
  exports: [RegisterUserUseCase, LoginUserUseCase, ACCESS_TOKEN_VERIFIER],
})
export class AuthModule {}
