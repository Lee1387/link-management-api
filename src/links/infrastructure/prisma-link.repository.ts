import { type Link as PrismaLink } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Link } from '../domain/link.entity';
import { DuplicateShortCodeError } from '../domain/link.errors';
import type {
  CreateLinkInput,
  FindOwnedLinksPageInput,
  LinkRepository,
} from '../domain/link.repository';

function toLinkEntity(prismaLink: PrismaLink): Link {
  return {
    id: prismaLink.id,
    originalUrl: prismaLink.originalUrl,
    shortCode: prismaLink.shortCode,
    disabledAt: prismaLink.disabledAt,
    expiresAt: prismaLink.expiresAt,
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

  async findPageByUserId(input: FindOwnedLinksPageInput): Promise<Link[]> {
    const prismaLinks = await this.prismaService.link.findMany({
      where: {
        userId: input.userId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit,
      skip: input.offset,
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
    const disableResult = await this.prismaService.link.updateMany({
      where: {
        id,
        userId,
        disabledAt: null,
      },
      data: {
        disabledAt,
      },
    });

    const prismaLink = await this.prismaService.link.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (prismaLink === null) {
      return null;
    }

    if (disableResult.count === 0) {
      return toLinkEntity(prismaLink);
    }

    return toLinkEntity(prismaLink);
  }

  async enableByIdAndUserId(id: string, userId: string): Promise<Link | null> {
    await this.prismaService.link.updateMany({
      where: {
        id,
        userId,
        disabledAt: {
          not: null,
        },
      },
      data: {
        disabledAt: null,
      },
    });

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

  async expireByIdAndUserId(
    id: string,
    userId: string,
    expiresAt: Date,
  ): Promise<Link | null> {
    await this.prismaService.link.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        expiresAt,
      },
    });

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
}
