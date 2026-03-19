export const TEST_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/link_management_api?schema=public';

export interface TestEnvironmentSnapshot {
  readonly nodeEnv: string | undefined;
  readonly databaseUrl: string | undefined;
}

export function captureTestEnvironment(): TestEnvironmentSnapshot {
  return {
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
  };
}

export function applyTestEnvironment(): void {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;
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
}
