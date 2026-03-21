import { Test, TestingModule } from '@nestjs/testing';
import { EnableOwnedLinkUseCase } from './enable-owned-link.use-case';
import {
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../../domain/link.repository';
import type { Link } from '../../../domain/link.entity';

describe('EnableOwnedLinkUseCase', () => {
  let enableOwnedLinkUseCase: EnableOwnedLinkUseCase;
  let linkRepository: {
    enableByIdAndUserId: jest.Mock<Promise<Link | null>, [string, string]>;
  };

  beforeEach(async () => {
    linkRepository = {
      enableByIdAndUserId: jest.fn<Promise<Link | null>, [string, string]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnableOwnedLinkUseCase,
        {
          provide: LINK_REPOSITORY,
          useValue: linkRepository satisfies Pick<
            LinkRepository,
            'enableByIdAndUserId'
          >,
        },
      ],
    }).compile();

    enableOwnedLinkUseCase = module.get<EnableOwnedLinkUseCase>(
      EnableOwnedLinkUseCase,
    );
  });

  it('should enable the owned link', async () => {
    const link: Link = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      expiresAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    };
    linkRepository.enableByIdAndUserId.mockResolvedValue(link);

    await expect(
      enableOwnedLinkUseCase.execute('link_123', 'user_123'),
    ).resolves.toEqual(link);
    expect(linkRepository.enableByIdAndUserId).toHaveBeenCalledWith(
      'link_123',
      'user_123',
    );
    expect(linkRepository.enableByIdAndUserId).toHaveBeenCalledTimes(1);
  });

  it('should return null when the owned link does not exist', async () => {
    linkRepository.enableByIdAndUserId.mockResolvedValue(null);

    await expect(
      enableOwnedLinkUseCase.execute('missing', 'user_123'),
    ).resolves.toBeNull();
    expect(linkRepository.enableByIdAndUserId).toHaveBeenCalledWith(
      'missing',
      'user_123',
    );
  });
});
