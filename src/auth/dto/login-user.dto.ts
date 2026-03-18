import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: 'The email address associated with the user account.',
    example: 'alex@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The plaintext password used to authenticate the user.',
    example: 'my-secure-password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
