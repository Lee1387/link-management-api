import { Inject, Injectable } from '@nestjs/common';
import {
  type FindOwnedLinksPageInput,
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../domain/link.repository';
import type { Link } from '../../domain/link.entity';

@Injectable()
export class ListOwnedLinksUseCase {
  constructor(
    @Inject(LINK_REPOSITORY)
    private readonly linkRepository: LinkRepository,
  ) {}

  execute(
    userId: string,
    page: Omit<FindOwnedLinksPageInput, 'userId'>,
  ): Promise<Link[]> {
    return this.linkRepository.findPageByUserId({
      userId,
      ...page,
    });
  }
}
