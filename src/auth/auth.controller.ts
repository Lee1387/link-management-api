import { Body, ConflictException, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { EmailAlreadyInUseError } from './domain/auth-user.errors';
import { RegisterUserDto } from './dto/register-user.dto';
import {
  RegisteredUserResponseDto,
  toRegisteredUserResponseDto,
} from './dto/registered-user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a user account',
    description: 'Creates a new user account for authenticated API access.',
  })
  @ApiCreatedResponse({
    description: 'The user account was created successfully.',
    type: RegisteredUserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
  })
  @ApiConflictResponse({
    description: 'A user account with that email already exists.',
  })
  async register(
    @Body() body: RegisterUserDto,
  ): Promise<RegisteredUserResponseDto> {
    try {
      const user = await this.registerUserUseCase.execute({
        email: body.email,
        password: body.password,
      });

      return toRegisteredUserResponseDto(user);
    } catch (error) {
      if (error instanceof EmailAlreadyInUseError) {
        throw new ConflictException('Email already in use.');
      }

      throw error;
    }
  }
}
