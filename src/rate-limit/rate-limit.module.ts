import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  RATE_LIMIT_POLICIES,
  TOO_MANY_REQUESTS_MESSAGE,
} from './rate-limit.policies';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      errorMessage: TOO_MANY_REQUESTS_MESSAGE,
      throttlers: RATE_LIMIT_POLICIES,
    }),
  ],
  providers: [ThrottlerGuard],
  exports: [ThrottlerGuard],
})
export class RateLimitModule {}
