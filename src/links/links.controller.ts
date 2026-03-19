import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/http/current-user.decorator';
import { JwtAuthGuard } from '../auth/http/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/http/authenticated-request-user';
import { CreateLinkUseCase } from './application/use-cases/create-link.use-case';
import { ListOwnedLinksUseCase } from './application/use-cases/list-owned-links.use-case';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinkResponseDto, toLinkResponseDto } from './dto/link-response.dto';
import {
  OwnedLinkResponseDto,
  toOwnedLinkResponseDtos,
} from './dto/owned-link-response.dto';

@ApiTags('links')
@Controller('links')
export class LinksController {
  constructor(
    private readonly createLinkUseCase: CreateLinkUseCase,
    private readonly listOwnedLinksUseCase: ListOwnedLinksUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the authenticated user links',
    description: 'Returns the shortened links owned by the authenticated user.',
  })
  @ApiOkResponse({
    description: 'The owned links were returned successfully.',
    type: OwnedLinkResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'A valid bearer token is required to list owned links.',
  })
  @UseGuards(JwtAuthGuard)
  async listOwned(
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<OwnedLinkResponseDto[]> {
    const links = await this.listOwnedLinksUseCase.execute(user.id);

    return toOwnedLinkResponseDtos(links);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a short link',
    description:
      'Creates a new shortened link for the provided destination URL.',
  })
  @ApiCreatedResponse({
    description: 'The link was created successfully.',
    type: LinkResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
  })
  @ApiUnauthorizedResponse({
    description: 'A valid bearer token is required to create a short link.',
  })
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() body: CreateLinkDto,
  ): Promise<LinkResponseDto> {
    const link = await this.createLinkUseCase.execute({
      originalUrl: body.originalUrl,
      userId: user.id,
    });

    return toLinkResponseDto(link);
  }
}
