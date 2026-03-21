import {
  createPrismaLinkRepositoryTestContext,
  type PrismaLinkRecord,
} from './prisma-link.repository.spec-support';

describe('PrismaLinkRepository enable', () => {
  it('should enable an owned disabled link', async () => {
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const updatedPrismaLink: PrismaLinkRecord = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      expiresAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    };
    prismaService.link.updateMany.mockResolvedValue({ count: 1 });
    prismaService.link.findFirst.mockResolvedValue(updatedPrismaLink);

    await expect(
      prismaLinkRepository.enableByIdAndUserId('link_123', 'user_123'),
    ).resolves.toEqual(updatedPrismaLink);
    expect(prismaService.link.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
        disabledAt: {
          not: null,
        },
      },
      data: {
        disabledAt: null,
      },
    });
    expect(prismaService.link.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
      },
    });
  });

  it('should return null when enabling an owned link that does not exist', async () => {
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    prismaService.link.updateMany.mockResolvedValue({ count: 0 });
    prismaService.link.findFirst.mockResolvedValue(null);

    await expect(
      prismaLinkRepository.enableByIdAndUserId('missing', 'user_123'),
    ).resolves.toBeNull();
    expect(prismaService.link.updateMany).toHaveBeenCalledTimes(1);
  });

  it('should not update a link that is already enabled', async () => {
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const prismaLink: PrismaLinkRecord = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      expiresAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    };
    prismaService.link.updateMany.mockResolvedValue({ count: 0 });
    prismaService.link.findFirst.mockResolvedValue(prismaLink);

    await expect(
      prismaLinkRepository.enableByIdAndUserId('link_123', 'user_123'),
    ).resolves.toEqual(prismaLink);
    expect(prismaService.link.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'link_123',
        userId: 'user_123',
        disabledAt: {
          not: null,
        },
      },
      data: {
        disabledAt: null,
      },
    });
  });
});
