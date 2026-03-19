export interface VerifiedAccessTokenPayload {
  readonly sub: string;
  readonly email: string;
  readonly iat: number;
  readonly exp: number;
}

export interface AccessTokenVerifier {
  verify(token: string): Promise<VerifiedAccessTokenPayload>;
}

export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');
