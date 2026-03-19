import { type ConfigType, registerAs } from '@nestjs/config';
import { validateEnv } from './env.schema';

const authConfig = registerAs('auth', () => {
  const env = validateEnv(process.env);

  return {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  };
});

export type AuthConfig = ConfigType<typeof authConfig>;

export default authConfig;
