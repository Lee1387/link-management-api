import { createAppLogger, configureApp } from './app.bootstrap';
import { type AppConfig } from './config/app.config';
import appConfig from './config/app.config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupOpenApi } from './app.openapi';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );
  const { nodeEnv, port } = app.get<AppConfig>(appConfig.KEY);

  app.useLogger(createAppLogger(nodeEnv));
  await configureApp(app, nodeEnv);
  setupOpenApi(app);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
