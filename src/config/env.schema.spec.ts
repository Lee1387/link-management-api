import { validateEnv } from './env.schema';

describe('env schema', () => {
  const baseConfig = {
    DATABASE_URL:
      'postgresql://postgres:postgres@localhost:5432/link_management_api?schema=public',
    JWT_SECRET: 'test-jwt-secret-that-is-long-enough-for-validation',
    JWT_EXPIRES_IN: '15m',
    NODE_ENV: 'development',
    PORT: '3000',
  } satisfies Record<string, unknown>;

  it('should default OpenAPI and readiness exposure flags to enabled', () => {
    const env = validateEnv(baseConfig);

    expect(env.OPENAPI_ENABLED).toBe(true);
    expect(env.READINESS_ENABLED).toBe(true);
  });

  it('should parse explicit false exposure flags from environment strings', () => {
    const env = validateEnv({
      ...baseConfig,
      OPENAPI_ENABLED: 'false',
      READINESS_ENABLED: '0',
    });

    expect(env.OPENAPI_ENABLED).toBe(false);
    expect(env.READINESS_ENABLED).toBe(false);
  });
});
