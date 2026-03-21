import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { CreateLinkUseCase } from './application/use-cases/mutation/create-link.use-case';
import { DisableOwnedLinkUseCase } from './application/use-cases/lifecycle/disable-owned-link.use-case';
import { EnableOwnedLinkUseCase } from './application/use-cases/lifecycle/enable-owned-link.use-case';
import { ExpireOwnedLinkUseCase } from './application/use-cases/lifecycle/expire-owned-link.use-case';
import { GetOwnedLinkDetailsUseCase } from './application/use-cases/query/get-owned-link-details.use-case';
import { ListOwnedLinksUseCase } from './application/use-cases/query/list-owned-links.use-case';
import { ResolveLinkUseCase } from './application/use-cases/public/resolve-link.use-case';
import { SHORT_CODE_GENERATOR } from './application/short-code-generator';
import { LINK_REPOSITORY } from './domain/link.repository';
import { LinkRedirectController } from './link-redirect.controller';
import { PrismaLinkRepository } from './infrastructure/prisma-link.repository';
import { RandomShortCodeGenerator } from './infrastructure/random-short-code-generator';
import { LinksController } from './links.controller';

@Module({
  controllers: [LinksController, LinkRedirectController],
  imports: [AuthModule, PrismaModule, RateLimitModule],
  providers: [
    CreateLinkUseCase,
    DisableOwnedLinkUseCase,
    EnableOwnedLinkUseCase,
    ExpireOwnedLinkUseCase,
    GetOwnedLinkDetailsUseCase,
    ListOwnedLinksUseCase,
    ResolveLinkUseCase,
    PrismaLinkRepository,
    RandomShortCodeGenerator,
    {
      provide: LINK_REPOSITORY,
      useExisting: PrismaLinkRepository,
    },
    {
      provide: SHORT_CODE_GENERATOR,
      useExisting: RandomShortCodeGenerator,
    },
  ],
})
export class LinksModule {}
