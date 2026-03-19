import { getAuthenticatedRequestUser } from './current-user.decorator';
import type { AuthenticatedRequest } from './authenticated-request-user';

describe('getAuthenticatedRequestUser', () => {
  it('should return the authenticated user from the request', () => {
    const request = {
      user: {
        id: 'user_123',
        email: 'alex@example.com',
      },
    } as AuthenticatedRequest;

    expect(getAuthenticatedRequestUser(request)).toEqual({
      id: 'user_123',
      email: 'alex@example.com',
    });
  });

  it('should throw when the authenticated user is missing', () => {
    const request = {} as AuthenticatedRequest;

    expect(() => getAuthenticatedRequestUser(request)).toThrow(
      'Authenticated user is missing from the request.',
    );
  });
});
