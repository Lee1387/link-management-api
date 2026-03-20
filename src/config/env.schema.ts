import { z } from 'zod';

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

function parseFrontendOrigin(value: unknown): unknown {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
}

const frontendOriginSchema = z.preprocess(
  parseFrontendOrigin,
  z
    .string()
    .min(1)
    .transform((origin, context) => {
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
              'FRONTEND_ORIGIN must be an exact origin without a path, query, or fragment.',
          });

          return z.NEVER;
        }

        return normalizedOrigin.origin;
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FRONTEND_ORIGIN must be a valid absolute URL.',
        });

        return z.NEVER;
      }
    })
    .optional(),
);

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  FRONTEND_ORIGIN: frontendOriginSchema,
  JWT_EXPIRES_IN: z.preprocess(
    (value) => (value === undefined || value === '' ? '15m' : value),
    z.string().trim().min(1),
  ),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: nodeEnvSchema.default('development'),
  PORT: z.preprocess(
    (value) => (value === undefined || value === '' ? 3000 : value),
    z.coerce.number().int().min(1).max(65535),
  ),
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
