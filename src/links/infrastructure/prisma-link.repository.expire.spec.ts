import {
  createPrismaLinkRepositoryTestContext,
  type PrismaLinkRecord,
} from './prisma-link.repository.spec-support';

describe('PrismaLinkRepository expire', () => {
  it('should set expiry on an owned link', async () => {
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const expiresAt = new Date('2026-04-01T12:00:00.000Z');
    const updatedPrismaLink: PrismaLinkRecord = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      expiresAt,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-21T16:30:00.000Z'),
    };
    prismaService.link.updateMany.mockResolvedValue({ count: 1 });
    prismaService.link.findFirst.mockResolvedValue(updatedPrismaLink);

    await expect(
      prismaLinkRepository.expireByIdAndUserId(
        'link_123',
        'user_123',
        expiresAt,
      ),
    ).resolves.toEqual(updatedPrismaLink);
    expect(prismaService.link.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
      },
      data: {
        expiresAt,
      },
    });
    expect(prismaService.link.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
      },
    });
  });

  it('should return null when expiring an owned link that does not exist', async () => {
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    prismaService.link.updateMany.mockResolvedValue({ count: 0 });
    prismaService.link.findFirst.mockResolvedValue(null);

    await expect(
      prismaLinkRepository.expireByIdAndUserId(
        'missing',
        'user_123',
        new Date('2026-04-01T12:00:00.000Z'),
      ),
    ).resolves.toBeNull();
    expect(prismaService.link.updateMany).toHaveBeenCalledTimes(1);
  });

  it('should replace an existing expiry on an owned link', async () => {
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const expiresAt = new Date('2026-04-01T12:00:00.000Z');
    const updatedPrismaLink: PrismaLinkRecord = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      expiresAt,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-21T16:30:00.000Z'),
    };
    prismaService.link.updateMany.mockResolvedValue({ count: 1 });
    prismaService.link.findFirst.mockResolvedValue(updatedPrismaLink);

    await expect(
      prismaLinkRepository.expireByIdAndUserId(
        'link_123',
        'user_123',
        expiresAt,
      ),
    ).resolves.toEqual(updatedPrismaLink);
    expect(prismaService.link.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
      },
      data: {
        expiresAt,
      },
    });
  });
});
