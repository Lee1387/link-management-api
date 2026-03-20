import { Test, TestingModule } from '@nestjs/testing';
import { ListOwnedLinksUseCase } from './list-owned-links.use-case';
import {
  type FindOwnedLinksPageInput,
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../../domain/link.repository';
import type { Link } from '../../../domain/link.entity';

describe('ListOwnedLinksUseCase', () => {
  let listOwnedLinksUseCase: ListOwnedLinksUseCase;
  let linkRepository: {
    findPageByUserId: jest.Mock<Promise<Link[]>, [FindOwnedLinksPageInput]>;
  };

  beforeEach(async () => {
    linkRepository = {
      findPageByUserId: jest.fn<Promise<Link[]>, [FindOwnedLinksPageInput]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListOwnedLinksUseCase,
        {
          provide: LINK_REPOSITORY,
          useValue: linkRepository satisfies Pick<
            LinkRepository,
            'findPageByUserId'
          >,
        },
      ],
    }).compile();

    listOwnedLinksUseCase = module.get<ListOwnedLinksUseCase>(
      ListOwnedLinksUseCase,
    );
  });

  it('should list the links owned by the given user', async () => {
    const links: Link[] = [
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
    linkRepository.findPageByUserId.mockResolvedValue(links);

    await expect(
      listOwnedLinksUseCase.execute('user_123', {
        limit: 25,
        offset: 0,
      }),
    ).resolves.toEqual(links);
    expect(linkRepository.findPageByUserId).toHaveBeenCalledWith({
      userId: 'user_123',
      limit: 25,
      offset: 0,
    });
    expect(linkRepository.findPageByUserId).toHaveBeenCalledTimes(1);
  });

  it('should return an empty list when the user has no links', async () => {
    linkRepository.findPageByUserId.mockResolvedValue([]);

    await expect(
      listOwnedLinksUseCase.execute('user_123', {
        limit: 10,
        offset: 20,
      }),
    ).resolves.toEqual([]);
    expect(linkRepository.findPageByUserId).toHaveBeenCalledWith({
      userId: 'user_123',
      limit: 10,
      offset: 20,
    });
  });
});
