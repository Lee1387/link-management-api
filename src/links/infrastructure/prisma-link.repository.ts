import { type Link as PrismaLink } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Link } from '../domain/link.entity';
import { DuplicateShortCodeError } from '../domain/link.errors';
import type {
  CreateLinkInput,
  LinkRepository,
} from '../domain/link.repository';

function toLinkEntity(prismaLink: PrismaLink): Link {
  return {
    id: prismaLink.id,
    originalUrl: prismaLink.originalUrl,
    shortCode: prismaLink.shortCode,
    disabledAt: prismaLink.disabledAt,
    createdAt: prismaLink.createdAt,
    updatedAt: prismaLink.updatedAt,
  };
}

function isPrismaUniqueConstraintError(
  error: unknown,
): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

@Injectable()
export class PrismaLinkRepository implements LinkRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: CreateLinkInput): Promise<Link> {
    try {
      const prismaLink = await this.prismaService.link.create({
        data: {
          originalUrl: input.originalUrl,
          shortCode: input.shortCode,
          userId: input.userId,
        },
      });

      return toLinkEntity(prismaLink);
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new DuplicateShortCodeError();
      }

      throw error;
    }
  }

  async findByShortCode(shortCode: string): Promise<Link | null> {
    const prismaLink = await this.prismaService.link.findUnique({
      where: {
        shortCode,
      },
    });

    if (prismaLink === null) {
      return null;
    }

    return toLinkEntity(prismaLink);
  }

  async findByUserId(userId: string): Promise<Link[]> {
    const prismaLinks = await this.prismaService.link.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return prismaLinks.map(toLinkEntity);
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Link | null> {
    const prismaLink = await this.prismaService.link.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (prismaLink === null) {
      return null;
    }

    return toLinkEntity(prismaLink);
  }

  async disableByIdAndUserId(
    id: string,
    userId: string,
    disabledAt: Date,
  ): Promise<Link | null> {
    const prismaLink = await this.prismaService.link.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (prismaLink === null) {
      return null;
    }

    if (prismaLink.disabledAt !== null) {
      return toLinkEntity(prismaLink);
    }

    const updatedPrismaLink = await this.prismaService.link.update({
      where: {
        id,
      },
      data: {
        disabledAt,
      },
    });

    return toLinkEntity(updatedPrismaLink);
  }
}
