import { ConsoleLogger, type LogLevel, ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { type EnvironmentVariables } from './config/env.schema';
import { setupOpenApi } from './app.openapi';

export type RuntimeNodeEnv = EnvironmentVariables['NODE_ENV'];

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

export function setupOptionalOpenApi(
  app: NestFastifyApplication,
  openApiEnabled: boolean,
  setup: (app: NestFastifyApplication) => void = setupOpenApi,
): void {
  if (!openApiEnabled) {
    return;
  }

  setup(app);
}

export async function configureApp(
  app: NestFastifyApplication,
  nodeEnv: RuntimeNodeEnv = resolveNodeEnv(process.env.NODE_ENV),
): Promise<void> {
  app.enableShutdownHooks();
  app.useGlobalPipes(createValidationPipe(nodeEnv));
  await app.register(helmet, {
    global: true,
    // Nest's Swagger UI needs a looser CSP when served through Fastify.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `'unsafe-inline'`, 'https:'],
      },
    },
  });
}
