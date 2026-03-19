import { Test, TestingModule } from '@nestjs/testing';
import { GetOwnedLinkDetailsUseCase } from './get-owned-link-details.use-case';
import {
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../domain/link.repository';
import type { Link } from '../../domain/link.entity';

describe('GetOwnedLinkDetailsUseCase', () => {
  let getOwnedLinkDetailsUseCase: GetOwnedLinkDetailsUseCase;
  let linkRepository: {
    findByIdAndUserId: jest.Mock<Promise<Link | null>, [string, string]>;
  };

  beforeEach(async () => {
    linkRepository = {
      findByIdAndUserId: jest.fn<Promise<Link | null>, [string, string]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOwnedLinkDetailsUseCase,
        {
          provide: LINK_REPOSITORY,
          useValue: linkRepository satisfies Pick<
            LinkRepository,
            'findByIdAndUserId'
          >,
        },
      ],
    }).compile();

    getOwnedLinkDetailsUseCase = module.get<GetOwnedLinkDetailsUseCase>(
      GetOwnedLinkDetailsUseCase,
    );
  });

  it('should return the owned link details for the given id', async () => {
    const link: Link = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    linkRepository.findByIdAndUserId.mockResolvedValue(link);

    await expect(
      getOwnedLinkDetailsUseCase.execute('link_123', 'user_123'),
    ).resolves.toEqual(link);
    expect(linkRepository.findByIdAndUserId).toHaveBeenCalledWith(
      'link_123',
      'user_123',
    );
    expect(linkRepository.findByIdAndUserId).toHaveBeenCalledTimes(1);
  });

  it('should return null when the owned link id is not found', async () => {
    linkRepository.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      getOwnedLinkDetailsUseCase.execute('missing', 'user_123'),
    ).resolves.toBeNull();
    expect(linkRepository.findByIdAndUserId).toHaveBeenCalledWith(
      'missing',
      'user_123',
    );
  });
});
