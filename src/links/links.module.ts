import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateLinkUseCase } from './application/create-link.use-case';
import { SHORT_CODE_GENERATOR } from './application/short-code-generator';
import { LINK_REPOSITORY } from './domain/link.repository';
import { PrismaLinkRepository } from './infrastructure/prisma-link.repository';
import { RandomShortCodeGenerator } from './infrastructure/random-short-code-generator';
import { LinksController } from './links.controller';

@Module({
  controllers: [LinksController],
  imports: [PrismaModule],
  providers: [
    CreateLinkUseCase,
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
