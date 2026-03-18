import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateLinkUseCase } from './application/create-link.use-case';
import { LINK_REPOSITORY } from './domain/link.repository';
import { PrismaLinkRepository } from './infrastructure/prisma-link.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    CreateLinkUseCase,
    PrismaLinkRepository,
    {
      provide: LINK_REPOSITORY,
      useExisting: PrismaLinkRepository,
    },
  ],
  exports: [CreateLinkUseCase],
})
export class LinksModule {}
