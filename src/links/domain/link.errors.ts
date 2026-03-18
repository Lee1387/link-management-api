export class DuplicateShortCodeError extends Error {
  constructor() {
    super('A generated short code already exists.');
    this.name = 'DuplicateShortCodeError';
  }
}

export class ShortCodeGenerationFailedError extends Error {
  constructor() {
    super('Unable to generate a unique short code.');
    this.name = 'ShortCodeGenerationFailedError';
  }
}
