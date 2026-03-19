import { Inject, Injectable } from '@nestjs/common';
import {
  LINK_REPOSITORY,
  type LinkRepository,
} from '../domain/link.repository';
import type { Link } from '../domain/link.entity';

@Injectable()
export class ListOwnedLinksUseCase {
  constructor(
    @Inject(LINK_REPOSITORY)
    private readonly linkRepository: LinkRepository,
  ) {}

  execute(userId: string): Promise<Link[]> {
    return this.linkRepository.findByUserId(userId);
  }
}
