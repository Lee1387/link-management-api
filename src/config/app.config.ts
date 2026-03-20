import { type ConfigType, registerAs } from '@nestjs/config';
import { loadValidatedEnvironment } from './validated-environment';

const appConfig = registerAs('app', () => {
  const env = loadValidatedEnvironment();

  return {
    databaseUrl: env.DATABASE_URL,
    frontendOrigin: env.FRONTEND_ORIGIN,
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  };
});

export type AppConfig = ConfigType<typeof appConfig>;

export default appConfig;
