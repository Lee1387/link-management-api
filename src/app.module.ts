import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { LinksModule } from './links/links.module';

@Module({
  imports: [AppConfigModule, HealthModule, LinksModule],
})
export class AppModule {}
