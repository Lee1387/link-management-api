import { Inject, Injectable } from '@nestjs/common';
import {
  SHORT_CODE_GENERATOR,
  type ShortCodeGenerator,
} from '../ports/short-code-generator';
import {
  DuplicateShortCodeError,
  ShortCodeGenerationFailedError,
} from '../../domain/link.errors';
import {
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../domain/link.repository';
import type { Link } from '../../domain/link.entity';

export interface CreateLinkCommand {
  originalUrl: string;
  userId: string;
}

const MAX_SHORT_CODE_GENERATION_ATTEMPTS = 5;

@Injectable()
export class CreateLinkUseCase {
  constructor(
    @Inject(LINK_REPOSITORY)
    private readonly linkRepository: LinkRepository,
    @Inject(SHORT_CODE_GENERATOR)
    private readonly shortCodeGenerator: ShortCodeGenerator,
  ) {}

  async execute(command: CreateLinkCommand): Promise<Link> {
    for (
      let attempt = 0;
      attempt < MAX_SHORT_CODE_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      const shortCode = this.shortCodeGenerator.generate();

      try {
        return await this.linkRepository.create({
          originalUrl: command.originalUrl,
          shortCode,
          userId: command.userId,
        });
      } catch (error) {
        if (error instanceof DuplicateShortCodeError) {
          continue;
        }

        throw error;
      }
    }

    throw new ShortCodeGenerationFailedError();
  }
}
