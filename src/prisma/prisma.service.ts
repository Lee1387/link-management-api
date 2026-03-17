import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import appConfig, { type AppConfig } from '../config/app.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(appConfig.KEY) config: AppConfig) {
    const adapter = new PrismaPg({ connectionString: config.databaseUrl });

    super({
      adapter,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
