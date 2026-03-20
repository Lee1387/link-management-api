import { type FindOwnedLinksPageInput } from '../domain/link.repository';
import {
  createPrismaLinkRepositoryTestContext,
  type PrismaLinkRecord,
} from './prisma-link.repository.spec-support';

describe('PrismaLinkRepository lookup', () => {
  it('should resolve a link by short code', async () => {
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const prismaLink: PrismaLinkRecord = {
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
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
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
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const page: FindOwnedLinksPageInput = {
      userId: 'user_123',
      limit: 25,
      offset: 10,
    };
    const prismaLinks: PrismaLinkRecord[] = [
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
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const prismaLink: PrismaLinkRecord = {
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
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
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
});
