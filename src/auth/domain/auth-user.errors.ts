export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('A user with that email already exists.');
    this.name = 'EmailAlreadyInUseError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('The provided credentials are invalid.');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidAccessTokenError extends Error {
  constructor() {
    super('The provided access token is invalid.');
    this.name = 'InvalidAccessTokenError';
  }
}
