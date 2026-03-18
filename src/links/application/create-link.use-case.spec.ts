import { Test, TestingModule } from '@nestjs/testing';
import { CreateLinkUseCase } from './create-link.use-case';
import {
  LINK_REPOSITORY,
  type CreateLinkInput,
  type LinkRepository,
} from '../domain/link.repository';
import type { Link } from '../domain/link.entity';

describe('CreateLinkUseCase', () => {
  let createLinkUseCase: CreateLinkUseCase;
  let linkRepository: { create: jest.Mock<Promise<Link>, [CreateLinkInput]> };

  beforeEach(async () => {
    linkRepository = {
      create: jest.fn<Promise<Link>, [CreateLinkInput]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateLinkUseCase,
        {
          provide: LINK_REPOSITORY,
          useValue: linkRepository satisfies LinkRepository,
        },
      ],
    }).compile();

    createLinkUseCase = module.get<CreateLinkUseCase>(CreateLinkUseCase);
  });

  it('should delegate link creation to the repository', async () => {
    const input: CreateLinkInput = {
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123',
    };
    const createdLink: Link = {
      id: 'link_123',
      originalUrl: input.originalUrl,
      shortCode: input.shortCode,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    linkRepository.create.mockResolvedValue(createdLink);

    await expect(createLinkUseCase.execute(input)).resolves.toEqual(
      createdLink,
    );
    expect(linkRepository.create).toHaveBeenCalledWith(input);
    expect(linkRepository.create).toHaveBeenCalledTimes(1);
  });
});
