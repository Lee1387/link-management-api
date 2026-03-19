export interface AccessTokenPayload {
  readonly sub: string;
  readonly email: string;
}

export interface AccessTokenSigner {
  sign(payload: AccessTokenPayload): Promise<string>;
}

export const ACCESS_TOKEN_SIGNER = Symbol('ACCESS_TOKEN_SIGNER');
