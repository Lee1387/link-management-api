import { type Link as PrismaLink } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Link } from '../domain/link.entity';
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

@Injectable()
export class PrismaLinkRepository implements LinkRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: CreateLinkInput): Promise<Link> {
    const prismaLink = await this.prismaService.link.create({
      data: {
        originalUrl: input.originalUrl,
        shortCode: input.shortCode,
      },
    });

    return toLinkEntity(prismaLink);
  }
}
