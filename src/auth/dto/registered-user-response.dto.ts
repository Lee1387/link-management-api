import { ApiProperty } from '@nestjs/swagger';
import type { AuthUser } from '../domain/auth-user.entity';

export class RegisteredUserResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the registered user.',
    example: 'cm8f4b2zy0000s6m8x2v0q3lp',
  })
  id!: string;

  @ApiProperty({
    description: 'The registered email address for the user account.',
    example: 'alex@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'The timestamp when the user account was created.',
    example: '2026-03-18T13:10:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'The timestamp when the user account was last updated.',
    example: '2026-03-18T13:10:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}

export function toRegisteredUserResponseDto(
  user: AuthUser,
): RegisteredUserResponseDto {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
