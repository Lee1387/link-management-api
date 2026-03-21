import { Inject, Injectable } from '@nestjs/common';
import {
  LINK_REPOSITORY,
  type LinkRepository,
} from '../../../domain/link.repository';
import type { Link } from '../../../domain/link.entity';

@Injectable()
export class ExpireOwnedLinkUseCase {
  constructor(
    @Inject(LINK_REPOSITORY)
    private readonly linkRepository: LinkRepository,
  ) {}

  execute(id: string, userId: string, expiresAt: Date): Promise<Link | null> {
    return this.linkRepository.expireByIdAndUserId(id, userId, expiresAt);
  }
}
