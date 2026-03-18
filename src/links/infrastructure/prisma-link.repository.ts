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
}
