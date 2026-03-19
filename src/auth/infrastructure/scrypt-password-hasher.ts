import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type PasswordHasher } from '../application/ports/password-hasher';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SALT_BYTES = 16;

interface ScryptParameters {
  readonly cost: number;
  readonly blockSize: number;
  readonly parallelization: number;
  readonly keyLength: number;
}

interface ParsedScryptHash extends ScryptParameters {
  readonly salt: string;
  readonly hash: Buffer;
}

function deriveKey(
  password: string,
  salt: string,
  parameters: ScryptParameters,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      parameters.keyLength,
      {
        N: parameters.cost,
        r: parameters.blockSize,
        p: parameters.parallelization,
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

function isHex(value: string): boolean {
  return (
    value.length > 0 && value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value)
  );
}

function parseInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseScryptHash(passwordHash: string): ParsedScryptHash | null {
  const [algorithm, cost, blockSize, parallelization, salt, hash] =
    passwordHash.split('$');

  if (
    algorithm !== 'scrypt' ||
    cost === undefined ||
    blockSize === undefined ||
    parallelization === undefined ||
    salt === undefined ||
    hash === undefined
  ) {
    return null;
  }

  const parsedCost = parseInteger(cost);
  const parsedBlockSize = parseInteger(blockSize);
  const parsedParallelization = parseInteger(parallelization);

  if (
    parsedCost === null ||
    parsedBlockSize === null ||
    parsedParallelization === null ||
    !isHex(salt) ||
    !isHex(hash)
  ) {
    return null;
  }

  return {
    cost: parsedCost,
    blockSize: parsedBlockSize,
    parallelization: parsedParallelization,
    keyLength: hash.length / 2,
    salt,
    hash: Buffer.from(hash, 'hex'),
  };
}

@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES).toString('hex');
    const derivedKey = await deriveKey(password, salt, {
      cost: SCRYPT_COST,
      blockSize: SCRYPT_BLOCK_SIZE,
      parallelization: SCRYPT_PARALLELIZATION,
      keyLength: SCRYPT_KEY_LENGTH,
    });

    return [
      'scrypt',
      SCRYPT_COST.toString(),
      SCRYPT_BLOCK_SIZE.toString(),
      SCRYPT_PARALLELIZATION.toString(),
      salt,
      derivedKey.toString('hex'),
    ].join('$');
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    const parsedHash = parseScryptHash(passwordHash);

    if (parsedHash === null) {
      return false;
    }

    const derivedKey = await deriveKey(password, parsedHash.salt, parsedHash);

    return (
      derivedKey.length === parsedHash.hash.length &&
      timingSafeEqual(derivedKey, parsedHash.hash)
    );
  }
}
