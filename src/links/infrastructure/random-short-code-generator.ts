import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type ShortCodeGenerator } from '../application/ports/short-code-generator';

const SHORT_CODE_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SHORT_CODE_LENGTH = 7;

@Injectable()
export class RandomShortCodeGenerator implements ShortCodeGenerator {
  generate(): string {
    let shortCode = '';

    for (let index = 0; index < SHORT_CODE_LENGTH; index += 1) {
      shortCode += SHORT_CODE_ALPHABET[randomInt(SHORT_CODE_ALPHABET.length)];
    }

    return shortCode;
  }
}
