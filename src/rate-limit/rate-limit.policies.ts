import { hours, minutes, type ThrottlerOptions } from '@nestjs/throttler';

export const TOO_MANY_REQUESTS_MESSAGE =
  'Too many requests. Please try again later.';

export const AUTH_RATE_LIMIT = {
  authBurst: {
    limit: 5,
    ttl: minutes(1),
    blockDuration: minutes(15),
  },
  authSustained: {
    limit: 20,
    ttl: hours(1),
    blockDuration: hours(1),
  },
} as const;

export const WRITE_RATE_LIMIT = {
  writeBurst: {
    limit: 10,
    ttl: minutes(1),
    blockDuration: minutes(5),
  },
  writeSustained: {
    limit: 60,
    ttl: hours(1),
    blockDuration: minutes(30),
  },
} as const;

export const SKIP_AUTH_RATE_LIMIT = {
  authBurst: true,
  authSustained: true,
} as const;

export const SKIP_WRITE_RATE_LIMIT = {
  writeBurst: true,
  writeSustained: true,
} as const;

export const RATE_LIMIT_POLICIES = [
  {
    name: 'authBurst',
    ...AUTH_RATE_LIMIT.authBurst,
  },
  {
    name: 'authSustained',
    ...AUTH_RATE_LIMIT.authSustained,
  },
  {
    name: 'writeBurst',
    ...WRITE_RATE_LIMIT.writeBurst,
  },
  {
    name: 'writeSustained',
    ...WRITE_RATE_LIMIT.writeSustained,
  },
] satisfies ThrottlerOptions[];
