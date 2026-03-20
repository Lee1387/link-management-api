import { type ConfigType, registerAs } from '@nestjs/config';
import { loadValidatedEnvironment } from './validated-environment';

const authConfig = registerAs('auth', () => {
  const env = loadValidatedEnvironment();

  return {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  };
});

export type AuthConfig = ConfigType<typeof authConfig>;

export default authConfig;
