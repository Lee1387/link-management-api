import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAccessTokenVerifier } from './jwt-access-token-verifier';
import { InvalidAccessTokenError } from '../domain/auth-user.errors';

describe('JwtAccessTokenVerifier', () => {
  let jwtService: JwtService;
  let jwtAccessTokenVerifier: JwtAccessTokenVerifier;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-jwt-secret-that-is-long-enough-for-validation',
          signOptions: {
            expiresIn: '15m',
          },
        }),
      ],
      providers: [JwtAccessTokenVerifier],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
    jwtAccessTokenVerifier = module.get<JwtAccessTokenVerifier>(
      JwtAccessTokenVerifier,
    );
  });

  it('should verify a valid access token payload', async () => {
    const token = await jwtService.signAsync({
      sub: 'user_123',
      email: 'alex@example.com',
    });

    const payload = await jwtAccessTokenVerifier.verify(token);

    expect(payload.sub).toBe('user_123');
    expect(payload.email).toBe('alex@example.com');
    expect(typeof payload.iat).toBe('number');
    expect(typeof payload.exp).toBe('number');
  });

  it('should reject malformed tokens', async () => {
    await expect(
      jwtAccessTokenVerifier.verify('not-a-valid-token'),
    ).rejects.toThrow(InvalidAccessTokenError);
  });

  it('should reject tokens that do not contain the expected access token claims', async () => {
    const token = await jwtService.signAsync({
      sub: 'user_123',
    });

    await expect(jwtAccessTokenVerifier.verify(token)).rejects.toThrow(
      InvalidAccessTokenError,
    );
  });
});
