import { z } from 'zod';

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: nodeEnvSchema.default('development'),
  PORT: z.preprocess(
    (value) => (value === undefined || value === '' ? 3000 : value),
    z.coerce.number().int().min(1).max(65535),
  ),
});

export type EnvironmentVariables = z.infer<typeof envSchema>;

let validatedEnvCache: EnvironmentVariables | null = null;

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

  validatedEnvCache = result.data;

  return result.data;
}

export function getValidatedEnv(): EnvironmentVariables {
  return validatedEnvCache ?? validateEnv(process.env);
}

export function resetValidatedEnvCache(): void {
  validatedEnvCache = null;
}
