import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    description: 'The email address to register for the new user account.',
    example: 'alex@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The plaintext password for the new user account.',
    example: 'my-secure-password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
