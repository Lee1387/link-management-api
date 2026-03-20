import {
  createAppLogger,
  configureApp,
  setupOptionalOpenApi,
} from './app.bootstrap';
import { type AppConfig } from './config/app.config';
import appConfig from './config/app.config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );
  const { nodeEnv, openApiEnabled, port } = app.get<AppConfig>(appConfig.KEY);

  app.useLogger(createAppLogger(nodeEnv));
  await configureApp(app, nodeEnv);
  setupOptionalOpenApi(app, openApiEnabled);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
