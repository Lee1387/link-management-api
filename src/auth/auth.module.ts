import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import authConfig, { type AuthConfig } from '../config/auth.config';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { ACCESS_TOKEN_VERIFIER } from './application/ports/access-token-verifier';
import { ACCESS_TOKEN_SIGNER } from './application/ports/access-token-signer';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { PASSWORD_HASHER } from './application/ports/password-hasher';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { AuthController } from './auth.controller';
import { AUTH_USER_REPOSITORY } from './domain/auth-user.repository';
import { JwtAccessTokenSigner } from './infrastructure/jwt-access-token-signer';
import { JwtAccessTokenVerifier } from './infrastructure/jwt-access-token-verifier';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { ScryptPasswordHasher } from './infrastructure/scrypt-password-hasher';
import { JwtAuthGuard } from './http/jwt-auth.guard';

@Module({
  controllers: [AuthController],
  imports: [
    PrismaModule,
    RateLimitModule,
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
    AuthenticateUserUseCase,
    LoginUserUseCase,
    PrismaUserRepository,
    ScryptPasswordHasher,
    JwtAccessTokenSigner,
    JwtAccessTokenVerifier,
    JwtAuthGuard,
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
  exports: [ACCESS_TOKEN_VERIFIER, JwtAuthGuard],
})
export class AuthModule {}
