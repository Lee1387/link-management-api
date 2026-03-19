import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
} from './domain/auth-user.errors';
import { LoginUserDto } from './dto/login-user.dto';
import {
  LoggedInUserResponseDto,
  toLoggedInUserResponseDto,
} from './dto/logged-in-user-response.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import {
  RegisteredUserResponseDto,
  toRegisteredUserResponseDto,
} from './dto/registered-user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

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

  @Post('login')
  @ApiOperation({
    summary: 'Authenticate a user account',
    description:
      'Authenticates an existing user account with email and password.',
  })
  @ApiOkResponse({
    description: 'The user credentials were accepted successfully.',
    type: LoggedInUserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
  })
  @ApiUnauthorizedResponse({
    description: 'The provided email or password is invalid.',
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginUserDto): Promise<LoggedInUserResponseDto> {
    try {
      const user = await this.loginUserUseCase.execute({
        email: body.email,
        password: body.password,
      });

      return toLoggedInUserResponseDto(user);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      throw error;
    }
  }
}
