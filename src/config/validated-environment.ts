import { type ConfigType, registerAs } from '@nestjs/config';
import { type EnvironmentVariables, validateEnv } from './env.schema';

type EnvironmentSource = Record<string, unknown>;
type EnvironmentKey = keyof EnvironmentVariables;

const ENVIRONMENT_KEYS: readonly EnvironmentKey[] = [
  'DATABASE_URL',
  'FRONTEND_ORIGIN',
  'JWT_EXPIRES_IN',
  'JWT_SECRET',
  'NODE_ENV',
  'PORT',
];

let cachedEnvironmentKey: string | null = null;
let cachedEnvironment: EnvironmentVariables | null = null;

function createEnvironmentCacheKey(config: EnvironmentSource): string {
  return JSON.stringify(
    ENVIRONMENT_KEYS.map((key) => [
      key,
      config[key as keyof EnvironmentSource],
    ]),
  );
}

export function loadValidatedEnvironment(
  config: EnvironmentSource = process.env,
): EnvironmentVariables {
  const environmentKey = createEnvironmentCacheKey(config);

  if (
    cachedEnvironment !== null &&
    cachedEnvironmentKey !== null &&
    cachedEnvironmentKey === environmentKey
  ) {
    return cachedEnvironment;
  }

  const validatedEnvironment = validateEnv(config);

  cachedEnvironmentKey = environmentKey;
  cachedEnvironment = validatedEnvironment;

  return validatedEnvironment;
}

const environmentConfig = registerAs('environment', () =>
  loadValidatedEnvironment(),
);

export type EnvironmentConfig = ConfigType<typeof environmentConfig>;

export default environmentConfig;
