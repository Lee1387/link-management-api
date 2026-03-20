import { z } from 'zod';

const nodeEnvSchema = z.enum(['development', 'test', 'production']);
const trueValues = new Set(['true', '1', 'yes', 'on']);
const falseValues = new Set(['false', '0', 'no', 'off']);

function parseBooleanEnv(value: unknown, defaultValue: boolean): unknown {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (trueValues.has(normalizedValue)) {
      return true;
    }

    if (falseValues.has(normalizedValue)) {
      return false;
    }
  }

  return value;
}

const booleanEnvSchema = (defaultValue: boolean) =>
  z.preprocess((value) => parseBooleanEnv(value, defaultValue), z.boolean());

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_EXPIRES_IN: z.preprocess(
    (value) => (value === undefined || value === '' ? '15m' : value),
    z.string().trim().min(1),
  ),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: nodeEnvSchema.default('development'),
  OPENAPI_ENABLED: booleanEnvSchema(true),
  PORT: z.preprocess(
    (value) => (value === undefined || value === '' ? 3000 : value),
    z.coerce.number().int().min(1).max(65535),
  ),
  READINESS_ENABLED: booleanEnvSchema(true),
});

export type EnvironmentVariables = z.infer<typeof envSchema>;

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map(({ path, message }) => `- ${path.join('.') || 'root'}: ${message}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}
