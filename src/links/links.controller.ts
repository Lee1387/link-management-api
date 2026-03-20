import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/http/current-user.decorator';
import { JwtAuthGuard } from '../auth/http/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/http/authenticated-request-user';
import { CreateLinkUseCase } from './application/use-cases/create-link.use-case';
import { DisableOwnedLinkUseCase } from './application/use-cases/disable-owned-link.use-case';
import { GetOwnedLinkDetailsUseCase } from './application/use-cases/get-owned-link-details.use-case';
import { ListOwnedLinksUseCase } from './application/use-cases/list-owned-links.use-case';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinkResponseDto, toLinkResponseDto } from './dto/link-response.dto';
import {
  OwnedLinkDetailsResponseDto,
  toOwnedLinkDetailsResponseDto,
} from './dto/owned-link-details-response.dto';
import {
  OwnedLinkResponseDto,
  toOwnedLinkResponseDtos,
} from './dto/owned-link-response.dto';

@ApiTags('links')
@Controller('links')
export class LinksController {
  constructor(
    private readonly createLinkUseCase: CreateLinkUseCase,
    private readonly disableOwnedLinkUseCase: DisableOwnedLinkUseCase,
    private readonly getOwnedLinkDetailsUseCase: GetOwnedLinkDetailsUseCase,
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get an authenticated user link',
    description:
      'Returns the details of a shortened link owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the owned link.',
    example: 'cm8f4b2zy0000s6m8x2v0q3lp',
  })
  @ApiOkResponse({
    description: 'The owned link was returned successfully.',
    type: OwnedLinkDetailsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The requested owned link does not exist.',
  })
  @ApiUnauthorizedResponse({
    description: 'A valid bearer token is required to get owned link details.',
  })
  @UseGuards(JwtAuthGuard)
  async getOwnedDetails(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<OwnedLinkDetailsResponseDto> {
    const link = await this.getOwnedLinkDetailsUseCase.execute(id, user.id);

    if (link === null) {
      throw new NotFoundException('Link not found.');
    }

    return toOwnedLinkDetailsResponseDto(link);
  }

  @Patch(':id/disable')
  @ApiOperation({
    summary: 'Disable an authenticated user link',
    description:
      'Disables a shortened link owned by the authenticated user so it no longer resolves publicly.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the owned link to disable.',
    example: 'cm8f4b2zy0000s6m8x2v0q3lp',
  })
  @ApiOkResponse({
    description: 'The owned link was disabled successfully.',
    type: OwnedLinkDetailsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The requested owned link does not exist.',
  })
  @ApiUnauthorizedResponse({
    description: 'A valid bearer token is required to disable an owned link.',
  })
  @UseGuards(JwtAuthGuard)
  async disableOwned(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<OwnedLinkDetailsResponseDto> {
    const link = await this.disableOwnedLinkUseCase.execute(id, user.id);

    if (link === null) {
      throw new NotFoundException('Link not found.');
    }

    return toOwnedLinkDetailsResponseDto(link);
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
