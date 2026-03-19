export interface AuthenticatedRequestUser {
  readonly id: string;
  readonly email: string;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedRequestUser;
}
