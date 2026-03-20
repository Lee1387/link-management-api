import {
  createAppLogger,
  createValidationPipe,
  resolveNodeEnv,
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
});
