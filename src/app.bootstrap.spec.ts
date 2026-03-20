import {
  createCorsOptions,
  createAppLogger,
  createValidationPipe,
  resolveNodeEnv,
  setupOptionalCors,
  setupOptionalOpenApi,
} from './app.bootstrap';

describe('app bootstrap runtime configuration', () => {
  it('should default unknown environments to development', () => {
    expect(resolveNodeEnv(undefined)).toBe('development');
    expect(resolveNodeEnv('staging')).toBe('development');
  });

  it('should enable detailed validation errors outside production', () => {
    const validationPipe = createValidationPipe('test') as unknown as {
      isDetailedOutputDisabled?: boolean;
    };

    expect(validationPipe.isDetailedOutputDisabled).toBe(false);
  });

  it('should disable detailed validation errors in production', () => {
    const validationPipe = createValidationPipe('production') as unknown as {
      isDetailedOutputDisabled?: boolean;
    };

    expect(validationPipe.isDetailedOutputDisabled).toBe(true);
  });

  it('should use structured JSON logging in production', () => {
    const logger = createAppLogger('production') as unknown as {
      options: {
        json?: boolean;
        colors?: boolean;
        compact?: boolean;
      };
    };

    expect(logger.options).toMatchObject({
      json: true,
      colors: false,
      compact: true,
    });
  });

  it('should keep readable console logging in development', () => {
    const logger = createAppLogger('development') as unknown as {
      options: {
        json?: boolean;
        colors?: boolean;
        timestamp?: boolean;
      };
    };

    expect(logger.options).toMatchObject({
      json: false,
      colors: true,
      timestamp: true,
    });
  });

  it('should enable OpenAPI setup when the config allows it', () => {
    const app = {} as Parameters<typeof setupOptionalOpenApi>[0];
    const setupOpenApi = jest.fn<void, [typeof app]>();

    setupOptionalOpenApi(app, true, setupOpenApi);

    expect(setupOpenApi).toHaveBeenCalledWith(app);
  });

  it('should skip OpenAPI setup when the config disables it', () => {
    const app = {} as Parameters<typeof setupOptionalOpenApi>[0];
    const setupOpenApi = jest.fn<void, [typeof app]>();

    setupOptionalOpenApi(app, false, setupOpenApi);

    expect(setupOpenApi).not.toHaveBeenCalled();
  });

  it('should enable CORS setup when the config allows it', () => {
    const enableCors = jest.fn<void, [ReturnType<typeof createCorsOptions>]>();
    const app = {
      enableCors,
    } as unknown as Parameters<typeof setupOptionalCors>[0];

    setupOptionalCors(app, true, ['https://app.example.com']);

    expect(enableCors).toHaveBeenCalledWith(
      expect.objectContaining({
        credentials: false,
        methods: ['GET', 'HEAD', 'POST', 'PATCH', 'OPTIONS'],
      }),
    );
  });

  it('should skip CORS setup when the config disables it', () => {
    const enableCors = jest.fn();
    const app = {
      enableCors,
    } as unknown as Parameters<typeof setupOptionalCors>[0];

    setupOptionalCors(app, false, ['https://app.example.com']);

    expect(enableCors).not.toHaveBeenCalled();
  });

  it('should allow configured CORS origins and reject others', () => {
    const corsOptions = createCorsOptions(['https://app.example.com']);

    const allowedOriginCallback = jest.fn<void, [Error | null, boolean?]>();
    const disallowedOriginCallback = jest.fn<void, [Error | null, boolean?]>();
    const missingOriginCallback = jest.fn<void, [Error | null, boolean?]>();

    if (typeof corsOptions.origin !== 'function') {
      throw new Error('Expected a dynamic CORS origin function.');
    }

    void corsOptions.origin('https://app.example.com', allowedOriginCallback);
    void corsOptions.origin(
      'https://evil.example.com',
      disallowedOriginCallback,
    );
    void corsOptions.origin(undefined, missingOriginCallback);

    expect(allowedOriginCallback).toHaveBeenCalledWith(null, true);
    expect(disallowedOriginCallback).toHaveBeenCalledWith(null, false);
    expect(missingOriginCallback).toHaveBeenCalledWith(null, true);
  });
});
