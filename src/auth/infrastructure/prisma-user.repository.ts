import { type User as PrismaUser } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../domain/auth-user.entity';
import type {
  AuthUserRepository,
  CreateAuthUserInput,
} from '../domain/auth-user.repository';

function toAuthUser(prismaUser: PrismaUser): AuthUser {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    passwordHash: prismaUser.passwordHash,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  };
}

@Injectable()
export class PrismaUserRepository implements AuthUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: CreateAuthUserInput): Promise<AuthUser> {
    const prismaUser = await this.prismaService.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
      },
    });

    return toAuthUser(prismaUser);
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const prismaUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (prismaUser === null) {
      return null;
    }

    return toAuthUser(prismaUser);
  }
}
