import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type PasswordHasher } from '../application/password-hasher';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SALT_BYTES = 16;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
      },
      (error, derivedKey) => {
        if (error !== null) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES).toString('hex');
    const derivedKey = await deriveKey(password, salt);

    return [
      'scrypt',
      SCRYPT_COST.toString(),
      SCRYPT_BLOCK_SIZE.toString(),
      SCRYPT_PARALLELIZATION.toString(),
      salt,
      derivedKey.toString('hex'),
    ].join('$');
  }
}
