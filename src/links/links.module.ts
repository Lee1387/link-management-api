import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateLinkUseCase } from './application/create-link.use-case';
import { GetOwnedLinkDetailsUseCase } from './application/get-owned-link-details.use-case';
import { ListOwnedLinksUseCase } from './application/list-owned-links.use-case';
import { ResolveLinkUseCase } from './application/resolve-link.use-case';
import { SHORT_CODE_GENERATOR } from './application/short-code-generator';
import { LINK_REPOSITORY } from './domain/link.repository';
import { LinkRedirectController } from './link-redirect.controller';
import { PrismaLinkRepository } from './infrastructure/prisma-link.repository';
import { RandomShortCodeGenerator } from './infrastructure/random-short-code-generator';
import { LinksController } from './links.controller';

@Module({
  controllers: [LinksController, LinkRedirectController],
  imports: [AuthModule, PrismaModule],
  providers: [
    CreateLinkUseCase,
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
  exports: [CreateLinkUseCase],
})
export class LinksModule {}
