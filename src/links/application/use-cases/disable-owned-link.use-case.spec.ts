import { Test, TestingModule } from '@nestjs/testing';
import { DisableOwnedLinkUseCase } from './disable-owned-link.use-case';
import {
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../domain/link.repository';
import type { Link } from '../../domain/link.entity';

describe('DisableOwnedLinkUseCase', () => {
  let disableOwnedLinkUseCase: DisableOwnedLinkUseCase;
  let linkRepository: {
    disableByIdAndUserId: jest.Mock<
      Promise<Link | null>,
      [string, string, Date]
    >;
  };

  beforeEach(async () => {
    linkRepository = {
      disableByIdAndUserId: jest.fn<
        Promise<Link | null>,
        [string, string, Date]
      >(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisableOwnedLinkUseCase,
        {
          provide: LINK_REPOSITORY,
          useValue: linkRepository satisfies Pick<
            LinkRepository,
            'disableByIdAndUserId'
          >,
        },
      ],
    }).compile();

    disableOwnedLinkUseCase = module.get<DisableOwnedLinkUseCase>(
      DisableOwnedLinkUseCase,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should disable the owned link using the current time', async () => {
    const now = new Date('2026-03-20T10:00:00.000Z');
    const link: Link = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: now,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    };
    jest.useFakeTimers().setSystemTime(now);
    linkRepository.disableByIdAndUserId.mockResolvedValue(link);

    await expect(
      disableOwnedLinkUseCase.execute('link_123', 'user_123'),
    ).resolves.toEqual(link);
    expect(linkRepository.disableByIdAndUserId).toHaveBeenCalledWith(
      'link_123',
      'user_123',
      now,
    );
    expect(linkRepository.disableByIdAndUserId).toHaveBeenCalledTimes(1);
  });

  it('should return null when the owned link does not exist', async () => {
    const now = new Date('2026-03-20T10:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);
    linkRepository.disableByIdAndUserId.mockResolvedValue(null);

    await expect(
      disableOwnedLinkUseCase.execute('missing', 'user_123'),
    ).resolves.toBeNull();
    expect(linkRepository.disableByIdAndUserId).toHaveBeenCalledWith(
      'missing',
      'user_123',
      now,
    );
  });
});
