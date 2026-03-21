import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { type CreateLinkInput } from '../domain/link.repository';
import { PrismaLinkRepository } from './prisma-link.repository';

export interface PrismaLinkRecord {
  readonly id: string;
  readonly originalUrl: string;
  readonly shortCode: string;
  readonly disabledAt: Date | null;
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type DisableOwnedLinkUpdateManyArgs = {
  where: { id: string; userId: string; disabledAt: null };
  data: { disabledAt: Date };
};

type EnableOwnedLinkUpdateManyArgs = {
  where: { id: string; userId: string; disabledAt: { not: null } };
  data: { disabledAt: null };
};

type ExpireOwnedLinkUpdateManyArgs = {
  where: { id: string; userId: string };
  data: { expiresAt: Date };
};

export interface PrismaLinkRepositoryMock {
  readonly link: {
    readonly create: jest.Mock<
      Promise<PrismaLinkRecord>,
      [{ data: CreateLinkInput }]
    >;
    readonly findUnique: jest.Mock<
      Promise<PrismaLinkRecord | null>,
      [{ where: { shortCode: string } }]
    >;
    readonly findFirst: jest.Mock<
      Promise<PrismaLinkRecord | null>,
      [{ where: { id: string; userId: string } }]
    >;
    readonly findMany: jest.Mock<
      Promise<PrismaLinkRecord[]>,
      [
        {
          where: { userId: string };
          orderBy: Array<{ createdAt: 'desc' } | { id: 'desc' }>;
          take: number;
          skip: number;
        },
      ]
    >;
    readonly updateMany: jest.Mock<
      Promise<{ count: number }>,
      [
        | DisableOwnedLinkUpdateManyArgs
        | EnableOwnedLinkUpdateManyArgs
        | ExpireOwnedLinkUpdateManyArgs,
      ]
    >;
  };
}

export interface PrismaLinkRepositoryTestContext {
  readonly prismaLinkRepository: PrismaLinkRepository;
  readonly prismaService: PrismaLinkRepositoryMock;
}

export function createPrismaLinkRepositoryMock(): PrismaLinkRepositoryMock {
  return {
    link: {
      create: jest.fn<Promise<PrismaLinkRecord>, [{ data: CreateLinkInput }]>(),
      findUnique: jest.fn<
        Promise<PrismaLinkRecord | null>,
        [{ where: { shortCode: string } }]
      >(),
      findFirst: jest.fn<
        Promise<PrismaLinkRecord | null>,
        [{ where: { id: string; userId: string } }]
      >(),
      findMany: jest.fn<
        Promise<PrismaLinkRecord[]>,
        [
          {
            where: { userId: string };
            orderBy: Array<{ createdAt: 'desc' } | { id: 'desc' }>;
            take: number;
            skip: number;
          },
        ]
      >(),
      updateMany: jest.fn<
        Promise<{ count: number }>,
        [
          | DisableOwnedLinkUpdateManyArgs
          | EnableOwnedLinkUpdateManyArgs
          | ExpireOwnedLinkUpdateManyArgs,
        ]
      >(),
    },
  };
}

export async function createPrismaLinkRepositoryTestContext(): Promise<PrismaLinkRepositoryTestContext> {
  const prismaService = createPrismaLinkRepositoryMock();

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PrismaLinkRepository,
      {
        provide: PrismaService,
        useValue: prismaService,
      },
    ],
  }).compile();

  return {
    prismaLinkRepository:
      module.get<PrismaLinkRepository>(PrismaLinkRepository),
    prismaService,
  };
}
