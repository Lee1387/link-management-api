import { DuplicateShortCodeError } from '../domain/link.errors';
import { type CreateLinkInput } from '../domain/link.repository';
import {
  createPrismaLinkRepositoryTestContext,
  type PrismaLinkRecord,
} from './prisma-link.repository.spec-support';

describe('PrismaLinkRepository create', () => {
  it('should persist and map the created link', async () => {
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
    const input: CreateLinkInput = {
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123',
      userId: 'user_123',
    };
    const prismaLink: PrismaLinkRecord = {
      id: 'link_123',
      originalUrl: input.originalUrl,
      shortCode: input.shortCode,
      disabledAt: null,
      expiresAt: null,
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
    const { prismaLinkRepository, prismaService } =
      await createPrismaLinkRepositoryTestContext();
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
});
