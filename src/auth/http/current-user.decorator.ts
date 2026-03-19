import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  AuthenticatedRequestUser,
} from './authenticated-request-user';

export function getAuthenticatedRequestUser(
  request: AuthenticatedRequest,
): AuthenticatedRequestUser {
  const user = request.user;

  if (user === undefined) {
    throw new Error('Authenticated user is missing from the request.');
  }

  return user;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedRequestUser =>
    getAuthenticatedRequestUser(
      context.switchToHttp().getRequest<AuthenticatedRequest>(),
    ),
);
