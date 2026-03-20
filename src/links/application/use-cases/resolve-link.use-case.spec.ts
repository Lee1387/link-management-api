import { Test, TestingModule } from '@nestjs/testing';
import { ResolveLinkUseCase } from './resolve-link.use-case';
import {
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../domain/link.repository';
import type { Link } from '../../domain/link.entity';

describe('ResolveLinkUseCase', () => {
  let resolveLinkUseCase: ResolveLinkUseCase;
  let linkRepository: {
    findByShortCode: jest.Mock<Promise<Link | null>, [string]>;
  };

  beforeEach(async () => {
    linkRepository = {
      findByShortCode: jest.fn<Promise<Link | null>, [string]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResolveLinkUseCase,
        {
          provide: LINK_REPOSITORY,
          useValue: linkRepository satisfies Pick<
            LinkRepository,
            'findByShortCode'
          >,
        },
      ],
    }).compile();

    resolveLinkUseCase = module.get<ResolveLinkUseCase>(ResolveLinkUseCase);
  });

  it('should resolve a link by short code', async () => {
    const link: Link = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    linkRepository.findByShortCode.mockResolvedValue(link);

    await expect(resolveLinkUseCase.execute(link.shortCode)).resolves.toEqual(
      link,
    );
    expect(linkRepository.findByShortCode).toHaveBeenCalledWith(link.shortCode);
    expect(linkRepository.findByShortCode).toHaveBeenCalledTimes(1);
  });

  it('should return null when the link is disabled', async () => {
    const link: Link = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: new Date('2026-03-20T10:00:00.000Z'),
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    };
    linkRepository.findByShortCode.mockResolvedValue(link);

    await expect(
      resolveLinkUseCase.execute(link.shortCode),
    ).resolves.toBeNull();
    expect(linkRepository.findByShortCode).toHaveBeenCalledWith(link.shortCode);
  });

  it('should return null when a short code does not exist', async () => {
    linkRepository.findByShortCode.mockResolvedValue(null);

    await expect(resolveLinkUseCase.execute('missing')).resolves.toBeNull();
    expect(linkRepository.findByShortCode).toHaveBeenCalledWith('missing');
  });
});
