import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoginUserUseCase } from './application/login-user.use-case';
import { PASSWORD_HASHER } from './application/password-hasher';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { AUTH_USER_REPOSITORY } from './domain/auth-user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { ScryptPasswordHasher } from './infrastructure/scrypt-password-hasher';

@Module({
  imports: [PrismaModule],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    PrismaUserRepository,
    ScryptPasswordHasher,
    {
      provide: AUTH_USER_REPOSITORY,
      useExisting: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useExisting: ScryptPasswordHasher,
    },
  ],
  exports: [RegisterUserUseCase, LoginUserUseCase],
})
export class AuthModule {}
