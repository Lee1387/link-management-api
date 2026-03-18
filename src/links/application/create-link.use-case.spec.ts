import { Test, TestingModule } from '@nestjs/testing';
import { CreateLinkUseCase } from './create-link.use-case';
import {
  SHORT_CODE_GENERATOR,
  type ShortCodeGenerator,
} from './short-code-generator';
import {
  DuplicateShortCodeError,
  ShortCodeGenerationFailedError,
} from '../domain/link.errors';
import {
  LINK_REPOSITORY,
  type CreateLinkInput,
  type LinkRepository,
} from '../domain/link.repository';
import type { Link } from '../domain/link.entity';

describe('CreateLinkUseCase', () => {
  let createLinkUseCase: CreateLinkUseCase;
  let linkRepository: { create: jest.Mock<Promise<Link>, [CreateLinkInput]> };
  let shortCodeGenerator: { generate: jest.Mock<string, []> };

  beforeEach(async () => {
    linkRepository = {
      create: jest.fn<Promise<Link>, [CreateLinkInput]>(),
    };
    shortCodeGenerator = {
      generate: jest.fn<string, []>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateLinkUseCase,
        {
          provide: LINK_REPOSITORY,
          useValue: linkRepository satisfies LinkRepository,
        },
        {
          provide: SHORT_CODE_GENERATOR,
          useValue: shortCodeGenerator satisfies ShortCodeGenerator,
        },
      ],
    }).compile();

    createLinkUseCase = module.get<CreateLinkUseCase>(CreateLinkUseCase);
  });

  it('should generate a short code and delegate link creation to the repository', async () => {
    const command = {
      originalUrl: 'https://example.com/articles/clean-architecture',
    };
    const shortCode = 'abc123x';
    const createdLink: Link = {
      id: 'link_123',
      originalUrl: command.originalUrl,
      shortCode,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    shortCodeGenerator.generate.mockReturnValue(shortCode);
    linkRepository.create.mockResolvedValue(createdLink);

    await expect(createLinkUseCase.execute(command)).resolves.toEqual(
      createdLink,
    );
    expect(shortCodeGenerator.generate).toHaveBeenCalledTimes(1);
    expect(linkRepository.create).toHaveBeenCalledWith({
      originalUrl: command.originalUrl,
      shortCode,
    });
    expect(linkRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should retry link creation when a generated short code collides', async () => {
    const command = {
      originalUrl: 'https://example.com/articles/clean-architecture',
    };
    const createdLink: Link = {
      id: 'link_123',
      originalUrl: command.originalUrl,
      shortCode: 'fresh567',
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    shortCodeGenerator.generate
      .mockReturnValueOnce('taken123')
      .mockReturnValueOnce(createdLink.shortCode);
    linkRepository.create
      .mockRejectedValueOnce(new DuplicateShortCodeError())
      .mockResolvedValueOnce(createdLink);

    await expect(createLinkUseCase.execute(command)).resolves.toEqual(
      createdLink,
    );
    expect(shortCodeGenerator.generate).toHaveBeenCalledTimes(2);
    expect(linkRepository.create).toHaveBeenNthCalledWith(1, {
      originalUrl: command.originalUrl,
      shortCode: 'taken123',
    });
    expect(linkRepository.create).toHaveBeenNthCalledWith(2, {
      originalUrl: command.originalUrl,
      shortCode: createdLink.shortCode,
    });
  });

  it('should fail after exhausting short code generation attempts', async () => {
    shortCodeGenerator.generate.mockReturnValue('taken123');
    linkRepository.create.mockRejectedValue(new DuplicateShortCodeError());

    await expect(
      createLinkUseCase.execute({
        originalUrl: 'https://example.com/articles/clean-architecture',
      }),
    ).rejects.toThrow(ShortCodeGenerationFailedError);
    expect(shortCodeGenerator.generate).toHaveBeenCalledTimes(5);
    expect(linkRepository.create).toHaveBeenCalledTimes(5);
  });
});
