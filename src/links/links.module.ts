import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { CreateLinkUseCase } from './application/use-cases/create-link.use-case';
import { DisableOwnedLinkUseCase } from './application/use-cases/disable-owned-link.use-case';
import { GetOwnedLinkDetailsUseCase } from './application/use-cases/get-owned-link-details.use-case';
import { ListOwnedLinksUseCase } from './application/use-cases/list-owned-links.use-case';
import { ResolveLinkUseCase } from './application/use-cases/resolve-link.use-case';
import { SHORT_CODE_GENERATOR } from './application/ports/short-code-generator';
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
