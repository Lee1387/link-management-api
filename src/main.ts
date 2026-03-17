import { type AppConfig } from './config/app.config';
import appConfig from './config/app.config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.bootstrap';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await configureApp(app);
  const { port } = app.get<AppConfig>(appConfig.KEY);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
