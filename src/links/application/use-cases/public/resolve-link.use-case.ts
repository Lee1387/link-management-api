import { Inject, Injectable } from '@nestjs/common';
import {
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../../domain/link.repository';
import {
  isLinkPubliclyResolvable,
  type Link,
} from '../../../domain/link.entity';

@Injectable()
export class ResolveLinkUseCase {
  constructor(
    @Inject(LINK_REPOSITORY)
    private readonly linkRepository: LinkRepository,
  ) {}

  async execute(shortCode: string): Promise<Link | null> {
    const link = await this.linkRepository.findByShortCode(shortCode);

    if (link === null || !isLinkPubliclyResolvable(link)) {
      return null;
    }

    return link;
  }
}
