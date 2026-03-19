import { ApiProperty } from '@nestjs/swagger';
import type { LoginUserResult } from '../application/login-user.use-case';

export class LoggedInUserResponseDto {
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

export function toLoggedInUserResponseDto(
  user: LoginUserResult,
): LoggedInUserResponseDto {
  return {
    id: user.id,
    email: user.email,
  };
}
