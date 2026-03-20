import { ConsoleLogger, type LogLevel, ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { type EnvironmentVariables } from './config/env.schema';
import { setupOpenApi } from './app.openapi';

export type RuntimeNodeEnv = EnvironmentVariables['NODE_ENV'];
type AppCorsOptions = NonNullable<
  Parameters<NestFastifyApplication['enableCors']>[0]
>;
type AppHelmetOptions = Parameters<NestFastifyApplication['register']>[1];

const DEVELOPMENT_LOG_LEVELS: LogLevel[] = [
  'log',
  'error',
  'warn',
  'debug',
  'verbose',
  'fatal',
];
const PRODUCTION_LOG_LEVELS: LogLevel[] = ['log', 'error', 'warn', 'fatal'];

export function resolveNodeEnv(nodeEnv: string | undefined): RuntimeNodeEnv {
  if (nodeEnv === 'test' || nodeEnv === 'production') {
    return nodeEnv;
  }

  return 'development';
}

export function createAppLogger(nodeEnv: RuntimeNodeEnv): ConsoleLogger {
  const isProduction = nodeEnv === 'production';

  return new ConsoleLogger({
    logLevels: isProduction ? PRODUCTION_LOG_LEVELS : DEVELOPMENT_LOG_LEVELS,
    json: isProduction,
    colors: !isProduction,
    compact: isProduction,
    timestamp: !isProduction,
    forceConsole: nodeEnv === 'test',
  });
}

export function createValidationPipe(nodeEnv: RuntimeNodeEnv): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: nodeEnv === 'production',
  });
}

export function createHelmetOptions(nodeEnv: RuntimeNodeEnv): AppHelmetOptions {
  const isProduction = nodeEnv === 'production';

  return {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: isProduction ? [`'self'`] : [`'self'`, `'unsafe-inline'`],
        imgSrc: isProduction
          ? [`'self'`, 'data:']
          : [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: isProduction
          ? [`'self'`]
          : [`'self'`, `'unsafe-inline'`, 'https:'],
      },
    },
  };
}

export function setupOptionalOpenApi(
  app: NestFastifyApplication,
  nodeEnv: RuntimeNodeEnv,
  setup: (app: NestFastifyApplication) => void = setupOpenApi,
): void {
  if (nodeEnv === 'production') {
    return;
  }

  setup(app);
}

export function createCorsOptions(frontendOrigin: string): AppCorsOptions {
  return {
    origin(requestOrigin, callback) {
      if (requestOrigin === undefined) {
        callback(null, true);
        return;
      }

      callback(null, requestOrigin === frontendOrigin);
    },
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: false,
    maxAge: 86400,
    optionsSuccessStatus: 204,
  };
}

export function setupOptionalCors(
  app: NestFastifyApplication,
  frontendOrigin: string | undefined,
): void {
  if (frontendOrigin === undefined) {
    return;
  }

  app.enableCors(createCorsOptions(frontendOrigin));
}

export async function configureApp(
  app: NestFastifyApplication,
  nodeEnv: RuntimeNodeEnv = resolveNodeEnv(process.env.NODE_ENV),
): Promise<void> {
  app.enableShutdownHooks();
  app.useGlobalPipes(createValidationPipe(nodeEnv));
  await app.register(helmet, createHelmetOptions(nodeEnv));
}
