import {
  createPrismaLinkRepositoryTestContext,
  type PrismaLinkRecord,
} from './prisma-link.repository.spec-support';

describe('PrismaLinkRepository disable', () => {
  it('should disable an owned active link', async () => {
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const disabledAt = new Date('2026-03-19T20:00:00.000Z');
    const updatedPrismaLink: PrismaLinkRecord = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
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
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
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
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const disabledAt = new Date('2026-03-19T20:00:00.000Z');
    const prismaLink: PrismaLinkRecord = {
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
        disabledAt,
      ),
    ).resolves.toEqual(prismaLink);
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
  });
});
