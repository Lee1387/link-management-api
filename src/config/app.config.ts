import { type ConfigType, registerAs } from '@nestjs/config';
import { validateEnv } from './env.schema';

const appConfig = registerAs('app', () => {
  const env = validateEnv(process.env);

  return {
    databaseUrl: env.DATABASE_URL,
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  };
});

export type AppConfig = ConfigType<typeof appConfig>;

export default appConfig;
