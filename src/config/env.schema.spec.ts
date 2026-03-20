import { validateEnv } from './env.schema';

describe('env schema', () => {
  const baseConfig = {
    DATABASE_URL:
      'postgresql://postgres:postgres@localhost:5432/branchly_api?schema=public',
    JWT_SECRET: 'test-jwt-secret-that-is-long-enough-for-validation',
    JWT_EXPIRES_IN: '15m',
    NODE_ENV: 'development',
    PORT: '3000',
  } satisfies Record<string, unknown>;

  it('should allow the frontend origin to be omitted', () => {
    const env = validateEnv(baseConfig);

    expect(env.FRONTEND_ORIGIN).toBeUndefined();
  });

  it('should normalize the configured frontend origin', () => {
    const env = validateEnv({
      ...baseConfig,
      FRONTEND_ORIGIN: 'https://app.example.com/',
    });

    expect(env.FRONTEND_ORIGIN).toBe('https://app.example.com');
  });

  it('should reject frontend origins that include paths', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        FRONTEND_ORIGIN: 'https://app.example.com/dashboard',
      }),
    ).toThrow(
      'FRONTEND_ORIGIN must be an exact origin without a path, query, or fragment.',
    );
  });
});
