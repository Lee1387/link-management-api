import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DuplicateShortCodeError } from '../domain/link.errors';
import { type CreateLinkInput } from '../domain/link.repository';
import { PrismaLinkRepository } from './prisma-link.repository';

describe('PrismaLinkRepository', () => {
  let prismaLinkRepository: PrismaLinkRepository;
  let prismaService: {
    link: {
      create: jest.Mock<
        Promise<{
          id: string;
          originalUrl: string;
          shortCode: string;
          createdAt: Date;
          updatedAt: Date;
        }>,
        [{ data: CreateLinkInput }]
      >;
    };
  };

  beforeEach(async () => {
    prismaService = {
      link: {
        create: jest.fn<
          Promise<{
            id: string;
            originalUrl: string;
            shortCode: string;
            createdAt: Date;
            updatedAt: Date;
          }>,
          [{ data: CreateLinkInput }]
        >(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaLinkRepository,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    prismaLinkRepository =
      module.get<PrismaLinkRepository>(PrismaLinkRepository);
  });

  it('should persist and map the created link', async () => {
    const input: CreateLinkInput = {
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123',
    };
    const prismaLink = {
      id: 'link_123',
      originalUrl: input.originalUrl,
      shortCode: input.shortCode,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    prismaService.link.create.mockResolvedValue(prismaLink);

    await expect(prismaLinkRepository.create(input)).resolves.toEqual(
      prismaLink,
    );
    expect(prismaService.link.create).toHaveBeenCalledWith({
      data: input,
    });
    expect(prismaService.link.create).toHaveBeenCalledTimes(1);
  });

  it('should translate Prisma unique constraint errors into a feature error', async () => {
    const input: CreateLinkInput = {
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123',
    };
    prismaService.link.create.mockRejectedValue({
      code: 'P2002',
    });

    await expect(prismaLinkRepository.create(input)).rejects.toThrow(
      DuplicateShortCodeError,
    );
  });
});
