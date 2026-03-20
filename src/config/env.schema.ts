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

function parseCorsAllowedOrigins(value: unknown): unknown {
  if (value === undefined || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  return value;
}

const corsAllowedOriginsSchema = z.preprocess(
  parseCorsAllowedOrigins,
  z.array(z.string().trim().min(1)).transform((origins, context) =>
    origins.map((origin) => {
      try {
        const normalizedOrigin = new URL(origin);

        if (
          normalizedOrigin.pathname !== '/' ||
          normalizedOrigin.search !== '' ||
          normalizedOrigin.hash !== ''
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'CORS origins must be exact origins without a path, query, or fragment.',
          });

          return z.NEVER;
        }

        return normalizedOrigin.origin;
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CORS origins must be valid absolute URLs.',
        });

        return z.NEVER;
      }
    }),
  ),
);

export const envSchema = z
  .object({
    CORS_ALLOWED_ORIGINS: corsAllowedOriginsSchema,
    CORS_ENABLED: booleanEnvSchema(false),
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
  })
  .superRefine((env, context) => {
    if (env.CORS_ENABLED && env.CORS_ALLOWED_ORIGINS.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ALLOWED_ORIGINS'],
        message:
          'CORS_ALLOWED_ORIGINS must contain at least one allowed origin when CORS is enabled.',
      });
    }
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
