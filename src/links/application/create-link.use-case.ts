import { Inject, Injectable } from '@nestjs/common';
import {
  LINK_REPOSITORY,
  type CreateLinkInput,
  type LinkRepository,
} from '../domain/link.repository';
import type { Link } from '../domain/link.entity';

@Injectable()
export class CreateLinkUseCase {
  constructor(
    @Inject(LINK_REPOSITORY)
    private readonly linkRepository: LinkRepository,
  ) {}

  execute(input: CreateLinkInput): Promise<Link> {
    return this.linkRepository.create(input);
  }
}
