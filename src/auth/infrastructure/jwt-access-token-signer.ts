import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import {
  type AccessTokenPayload,
  type AccessTokenSigner,
} from '../application/access-token-signer';

@Injectable()
export class JwtAccessTokenSigner implements AccessTokenSigner {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
