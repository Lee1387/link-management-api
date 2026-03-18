import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoginUserUseCase } from './application/login-user.use-case';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { AUTH_USER_REPOSITORY } from './domain/auth-user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    PrismaUserRepository,
    {
      provide: AUTH_USER_REPOSITORY,
      useExisting: PrismaUserRepository,
    },
  ],
  exports: [RegisterUserUseCase, LoginUserUseCase],
})
export class AuthModule {}
