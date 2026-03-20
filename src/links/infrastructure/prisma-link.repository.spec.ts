import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DuplicateShortCodeError } from '../domain/link.errors';
import {
  type CreateLinkInput,
  type FindOwnedLinksPageInput,
} from '../domain/link.repository';
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
          disabledAt: Date | null;
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
          disabledAt: Date | null;
          createdAt: Date;
          updatedAt: Date;
        } | null>,
        [{ where: { shortCode: string } }]
      >;
      findFirst: jest.Mock<
        Promise<{
          id: string;
          originalUrl: string;
          shortCode: string;
          disabledAt: Date | null;
          createdAt: Date;
          updatedAt: Date;
        } | null>,
        [{ where: { id: string; userId: string } }]
      >;
      findMany: jest.Mock<
        Promise<
          Array<{
            id: string;
            originalUrl: string;
            shortCode: string;
            disabledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
          }>
        >,
        [
          {
            where: { userId: string };
            orderBy: Array<{ createdAt: 'desc' } | { id: 'desc' }>;
            take: number;
            skip: number;
          },
        ]
      >;
      updateMany: jest.Mock<
        Promise<{ count: number }>,
        [
          {
            where: { id: string; userId: string; disabledAt: null };
            data: { disabledAt: Date };
          },
        ]
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
            disabledAt: Date | null;
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
            disabledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
          } | null>,
          [{ where: { shortCode: string } }]
        >(),
        findFirst: jest.fn<
          Promise<{
            id: string;
            originalUrl: string;
            shortCode: string;
            disabledAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
          } | null>,
          [{ where: { id: string; userId: string } }]
        >(),
        findMany: jest.fn<
          Promise<
            Array<{
              id: string;
              originalUrl: string;
              shortCode: string;
              disabledAt: Date | null;
              createdAt: Date;
              updatedAt: Date;
            }>
          >,
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
            {
              where: { id: string; userId: string; disabledAt: null };
              data: { disabledAt: Date };
            },
          ]
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
      disabledAt: null,
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
      disabledAt: null,
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

  it('should resolve an owned links page ordered by newest first', async () => {
    const page: FindOwnedLinksPageInput = {
      userId: 'user_123',
      limit: 25,
      offset: 10,
    };
    const prismaLinks = [
      {
        id: 'link_456',
        originalUrl: 'https://example.com/articles/testing',
        shortCode: 'new456X',
        disabledAt: null,
        createdAt: new Date('2026-03-19T10:00:00.000Z'),
        updatedAt: new Date('2026-03-19T10:00:00.000Z'),
      },
      {
        id: 'link_123',
        originalUrl: 'https://example.com/articles/clean-architecture',
        shortCode: 'abc123X',
        disabledAt: null,
        createdAt: new Date('2026-03-18T13:10:00.000Z'),
        updatedAt: new Date('2026-03-18T13:10:00.000Z'),
      },
    ];
    prismaService.link.findMany.mockResolvedValue(prismaLinks);

    await expect(prismaLinkRepository.findPageByUserId(page)).resolves.toEqual(
      prismaLinks,
    );
    expect(prismaService.link.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user_123',
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 25,
      skip: 10,
    });
  });

  it('should resolve an owned link by id', async () => {
    const prismaLink = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    prismaService.link.findFirst.mockResolvedValue(prismaLink);

    await expect(
      prismaLinkRepository.findByIdAndUserId('link_123', 'user_123'),
    ).resolves.toEqual(prismaLink);
    expect(prismaService.link.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
      },
    });
  });

  it('should return null when an owned link id is not found', async () => {
    prismaService.link.findFirst.mockResolvedValue(null);

    await expect(
      prismaLinkRepository.findByIdAndUserId('missing', 'user_123'),
    ).resolves.toBeNull();
    expect(prismaService.link.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'missing',
        userId: 'user_123',
      },
    });
  });

  it('should disable an owned active link', async () => {
    const disabledAt = new Date('2026-03-19T20:00:00.000Z');
    const prismaLink = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    const updatedPrismaLink = {
      ...prismaLink,
      disabledAt,
      updatedAt: new Date('2026-03-19T20:00:00.000Z'),
    };
    prismaService.link.updateMany.mockResolvedValue({ count: 1 });
    prismaService.link.findFirst.mockResolvedValue(updatedPrismaLink);

    await expect(
      prismaLinkRepository.disableByIdAndUserId(
        'link_123',
        'user_123',
        disabledAt,
      ),
    ).resolves.toEqual(updatedPrismaLink);
    expect(prismaService.link.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
        disabledAt: null,
      },
      data: {
        disabledAt,
      },
    });
    expect(prismaService.link.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
      },
    });
  });

  it('should return null when disabling an owned link that does not exist', async () => {
    prismaService.link.updateMany.mockResolvedValue({ count: 0 });
    prismaService.link.findFirst.mockResolvedValue(null);

    await expect(
      prismaLinkRepository.disableByIdAndUserId(
        'missing',
        'user_123',
        new Date('2026-03-19T20:00:00.000Z'),
      ),
    ).resolves.toBeNull();
    expect(prismaService.link.updateMany).toHaveBeenCalledTimes(1);
  });

  it('should not update a link that is already disabled', async () => {
    const prismaLink = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: new Date('2026-03-19T19:00:00.000Z'),
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-19T19:00:00.000Z'),
    };
    prismaService.link.updateMany.mockResolvedValue({ count: 0 });
    prismaService.link.findFirst.mockResolvedValue(prismaLink);

    await expect(
      prismaLinkRepository.disableByIdAndUserId(
        'link_123',
        'user_123',
        new Date('2026-03-19T20:00:00.000Z'),
      ),
    ).resolves.toEqual(prismaLink);
    expect(prismaService.link.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
        disabledAt: null,
      },
      data: {
        disabledAt: new Date('2026-03-19T20:00:00.000Z'),
      },
    });
  });
});
