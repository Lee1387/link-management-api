import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import environmentConfig, {
  type EnvironmentConfig,
} from '../config/validated-environment';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(environmentConfig.KEY) config: EnvironmentConfig) {
    const adapter = new PrismaPg({ connectionString: config.DATABASE_URL });

    super({
      adapter,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
