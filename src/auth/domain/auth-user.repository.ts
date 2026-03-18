import type { AuthUser } from './auth-user.entity';

export interface CreateAuthUserInput {
  email: string;
  passwordHash: string;
}

export interface AuthUserRepository {
  create(input: CreateAuthUserInput): Promise<AuthUser>;
  findByEmail(email: string): Promise<AuthUser | null>;
}

export const AUTH_USER_REPOSITORY = Symbol('AUTH_USER_REPOSITORY');
