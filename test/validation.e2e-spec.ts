import { Body, Controller, Get, Module, Param, Post } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { IsString } from 'class-validator';
import { configureApp } from './../src/app.bootstrap';

class CreateValidationDto {
  @IsString()
  name!: string;
}

@Controller('validation-test')
class ValidationTestController {
  @Post()
  create(@Body() body: CreateValidationDto): CreateValidationDto {
    return body;
  }

  @Get('transform/:id')
  transformParam(@Param('id') id: number): { id: number; type: string } {
    return {
      id,
      type: typeof id,
    };
  }
}

@Module({
  controllers: [ValidationTestController],
})
class ValidationTestModule {}

describe('Validation (e2e)', () => {
  let app: NestFastifyApplication | null = null;

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  async function createApp(): Promise<NestFastifyApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ValidationTestModule],
    }).compile();

    const nextApp = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await configureApp(nextApp);
    await nextApp.init();
    await nextApp.getHttpAdapter().getInstance().ready();

    return nextApp;
  }

  it('should reject non-whitelisted properties', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'POST',
      url: '/validation-test',
      payload: {
        name: 'alpha',
        unexpected: 'value',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      statusCode: 400,
      message: ['property unexpected should not exist'],
      error: 'Bad Request',
    });
  });

  it('should accept valid DTO payloads', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'POST',
      url: '/validation-test',
      payload: {
        name: 'alpha',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      name: 'alpha',
    });
  });

  it('should transform route params to the declared type', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/validation-test/transform/123',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: 123,
      type: 'number',
    });
  });
});
