import {
  createAppLogger,
  configureApp,
  setupOptionalCors,
  setupOptionalOpenApi,
} from './app.bootstrap';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import environmentConfig, {
  type EnvironmentConfig,
} from './config/validated-environment';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );
  const {
    FRONTEND_ORIGIN: frontendOrigin,
    NODE_ENV: nodeEnv,
    PORT: port,
  } = app.get<EnvironmentConfig>(environmentConfig.KEY);

  app.useLogger(createAppLogger(nodeEnv));
  await configureApp(app, nodeEnv);
  setupOptionalCors(app, frontendOrigin);
  setupOptionalOpenApi(app, nodeEnv);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
