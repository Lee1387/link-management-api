export const TEST_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/link_management_api?schema=public';
export const TEST_JWT_EXPIRES_IN = '15m';
export const TEST_JWT_SECRET =
  'test-jwt-secret-that-is-long-enough-for-validation';

export interface TestEnvironmentSnapshot {
  readonly nodeEnv: string | undefined;
  readonly databaseUrl: string | undefined;
  readonly jwtExpiresIn: string | undefined;
  readonly jwtSecret: string | undefined;
}

export function captureTestEnvironment(): TestEnvironmentSnapshot {
  return {
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    jwtSecret: process.env.JWT_SECRET,
  };
}

export function applyTestEnvironment(): void {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.JWT_EXPIRES_IN = TEST_JWT_EXPIRES_IN;
  process.env.JWT_SECRET = TEST_JWT_SECRET;
}

export function restoreTestEnvironment(
  snapshot: TestEnvironmentSnapshot,
): void {
  if (snapshot.nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = snapshot.nodeEnv;
  }

  if (snapshot.databaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = snapshot.databaseUrl;
  }

  if (snapshot.jwtExpiresIn === undefined) {
    delete process.env.JWT_EXPIRES_IN;
  } else {
    process.env.JWT_EXPIRES_IN = snapshot.jwtExpiresIn;
  }

  if (snapshot.jwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = snapshot.jwtSecret;
  }
}
