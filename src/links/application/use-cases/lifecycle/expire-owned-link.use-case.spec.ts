import { Test, TestingModule } from '@nestjs/testing';
import { ExpireOwnedLinkUseCase } from './expire-owned-link.use-case';
import {
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../../domain/link.repository';
import type { Link } from '../../../domain/link.entity';

describe('ExpireOwnedLinkUseCase', () => {
  let expireOwnedLinkUseCase: ExpireOwnedLinkUseCase;
  let linkRepository: {
    expireByIdAndUserId: jest.Mock<
      Promise<Link | null>,
      [string, string, Date]
    >;
  };

  beforeEach(async () => {
    linkRepository = {
      expireByIdAndUserId: jest.fn<
        Promise<Link | null>,
        [string, string, Date]
      >(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpireOwnedLinkUseCase,
        {
          provide: LINK_REPOSITORY,
          useValue: linkRepository satisfies Pick<
            LinkRepository,
            'expireByIdAndUserId'
          >,
        },
      ],
    }).compile();

    expireOwnedLinkUseCase = module.get<ExpireOwnedLinkUseCase>(
      ExpireOwnedLinkUseCase,
    );
  });

  it('should set expiry on the owned link', async () => {
    const expiresAt = new Date('2026-04-01T12:00:00.000Z');
    const link: Link = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      expiresAt,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-21T16:30:00.000Z'),
    };
    linkRepository.expireByIdAndUserId.mockResolvedValue(link);

    await expect(
      expireOwnedLinkUseCase.execute('link_123', 'user_123', expiresAt),
    ).resolves.toEqual(link);
    expect(linkRepository.expireByIdAndUserId).toHaveBeenCalledWith(
      'link_123',
      'user_123',
      expiresAt,
    );
    expect(linkRepository.expireByIdAndUserId).toHaveBeenCalledTimes(1);
  });

  it('should return null when the owned link does not exist', async () => {
    const expiresAt = new Date('2026-04-01T12:00:00.000Z');
    linkRepository.expireByIdAndUserId.mockResolvedValue(null);

    await expect(
      expireOwnedLinkUseCase.execute('missing', 'user_123', expiresAt),
    ).resolves.toBeNull();
    expect(linkRepository.expireByIdAndUserId).toHaveBeenCalledWith(
      'missing',
      'user_123',
      expiresAt,
    );
  });
});
