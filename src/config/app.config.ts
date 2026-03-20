import { type ConfigType, registerAs } from '@nestjs/config';
import { validateEnv } from './env.schema';

const appConfig = registerAs('app', () => {
  const env = validateEnv(process.env);

  return {
    corsAllowedOrigins: env.CORS_ALLOWED_ORIGINS,
    corsEnabled: env.CORS_ENABLED,
    databaseUrl: env.DATABASE_URL,
    nodeEnv: env.NODE_ENV,
    openApiEnabled: env.OPENAPI_ENABLED,
    port: env.PORT,
    readinessEnabled: env.READINESS_ENABLED,
  };
});

export type AppConfig = ConfigType<typeof appConfig>;

export default appConfig;
