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
      findUnique: jest.Mock<
        Promise<{
          id: string;
          originalUrl: string;
          shortCode: string;
          createdAt: Date;
          updatedAt: Date;
        } | null>,
        [{ where: { shortCode: string } }]
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
        findUnique: jest.fn<
          Promise<{
            id: string;
            originalUrl: string;
            shortCode: string;
            createdAt: Date;
            updatedAt: Date;
          } | null>,
          [{ where: { shortCode: string } }]
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
      userId: 'user_123',
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
      userId: 'user_123',
    };
    prismaService.link.create.mockRejectedValue({
      code: 'P2002',
    });

    await expect(prismaLinkRepository.create(input)).rejects.toThrow(
      DuplicateShortCodeError,
    );
  });

  it('should resolve a link by short code', async () => {
    const prismaLink = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    prismaService.link.findUnique.mockResolvedValue(prismaLink);

    await expect(
      prismaLinkRepository.findByShortCode(prismaLink.shortCode),
    ).resolves.toEqual(prismaLink);
    expect(prismaService.link.findUnique).toHaveBeenCalledWith({
      where: {
        shortCode: prismaLink.shortCode,
      },
    });
  });

  it('should return null when a short code is not found', async () => {
    prismaService.link.findUnique.mockResolvedValue(null);

    await expect(prismaLinkRepository.findByShortCode('missing')).resolves.toBe(
      null,
    );
    expect(prismaService.link.findUnique).toHaveBeenCalledWith({
      where: {
        shortCode: 'missing',
      },
    });
  });
});
