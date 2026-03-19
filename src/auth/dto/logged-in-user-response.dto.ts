import { ApiProperty } from '@nestjs/swagger';
import type { LoginUserResult } from '../application/login-user.use-case';

export class AuthenticatedUserResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the authenticated user.',
    example: 'cm8f4b2zy0000s6m8x2v0q3lp',
  })
  id!: string;

  @ApiProperty({
    description: 'The email address of the authenticated user.',
    example: 'alex@example.com',
  })
  email!: string;
}

export class LoggedInUserResponseDto {
  @ApiProperty({
    description:
      'The signed JWT access token to send on authenticated requests.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'The authentication scheme for the returned access token.',
    example: 'Bearer',
  })
  tokenType!: string;

  @ApiProperty({
    description: 'The authenticated user associated with the access token.',
    type: AuthenticatedUserResponseDto,
  })
  user!: AuthenticatedUserResponseDto;
}

export function toLoggedInUserResponseDto(
  user: LoginUserResult,
): LoggedInUserResponseDto {
  return {
    accessToken: user.accessToken,
    tokenType: user.tokenType,
    user: {
      id: user.user.id,
      email: user.user.email,
    },
  };
}
