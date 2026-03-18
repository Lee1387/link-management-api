import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { LinksModule } from './links/links.module';

@Module({
  imports: [AppConfigModule, AuthModule, HealthModule, LinksModule],
})
export class AppModule {}
