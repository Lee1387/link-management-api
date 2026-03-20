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

    expect(env.CORS_ENABLED).toBe(false);
    expect(env.CORS_ALLOWED_ORIGINS).toEqual([]);
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

  it('should normalize a comma-separated CORS origin allowlist', () => {
    const env = validateEnv({
      ...baseConfig,
      CORS_ENABLED: 'true',
      CORS_ALLOWED_ORIGINS:
        'https://app.example.com, https://admin.example.com/',
    });

    expect(env.CORS_ENABLED).toBe(true);
    expect(env.CORS_ALLOWED_ORIGINS).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('should reject enabled CORS without an explicit allowlist', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        CORS_ENABLED: 'true',
      }),
    ).toThrow(
      'CORS_ALLOWED_ORIGINS must contain at least one allowed origin when CORS is enabled.',
    );
  });

  it('should reject CORS origins that include paths', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        CORS_ENABLED: 'true',
        CORS_ALLOWED_ORIGINS: 'https://app.example.com/dashboard',
      }),
    ).toThrow(
      'CORS origins must be exact origins without a path, query, or fragment.',
    );
  });
});
