import { type ConfigType, registerAs } from '@nestjs/config';
import { getValidatedEnv } from './env.schema';

const appConfig = registerAs('app', () => {
  const env = getValidatedEnv();

  return {
    databaseUrl: env.DATABASE_URL,
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  };
});

export type AppConfig = ConfigType<typeof appConfig>;

export default appConfig;
