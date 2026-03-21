import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
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
import type { Link } from './domain/link.entity';
import { CreateLinkUseCase } from './application/use-cases/mutation/create-link.use-case';
import { DisableOwnedLinkUseCase } from './application/use-cases/lifecycle/disable-owned-link.use-case';
import { EnableOwnedLinkUseCase } from './application/use-cases/lifecycle/enable-owned-link.use-case';
import { ExpireOwnedLinkUseCase } from './application/use-cases/lifecycle/expire-owned-link.use-case';
import { GetOwnedLinkDetailsUseCase } from './application/use-cases/query/get-owned-link-details.use-case';
import { ListOwnedLinksUseCase } from './application/use-cases/query/list-owned-links.use-case';
import { CreateLinkDto } from './dto/create-link.dto';
import { ExpireOwnedLinkDto } from './dto/expire-owned-link.dto';
import { LinkResponseDto, toLinkResponseDto } from './dto/link-response.dto';
import {
  OwnedLinkDetailsResponseDto,
  toOwnedLinkDetailsResponseDto,
} from './dto/owned-link-details-response.dto';
import {
  OwnedLinkResponseDto,
  toOwnedLinkResponseDtos,
} from './dto/owned-link-response.dto';
import {
  ListOwnedLinksQueryDto,
  toListOwnedLinksPage,
} from './dto/list-owned-links-query.dto';
import {
  SKIP_AUTH_RATE_LIMIT,
  WRITE_RATE_LIMIT,
} from '../rate-limit/rate-limit.policies';

@ApiTags('links')
@Controller('links')
export class LinksController {
  constructor(
    private readonly createLinkUseCase: CreateLinkUseCase,
    private readonly disableOwnedLinkUseCase: DisableOwnedLinkUseCase,
    private readonly enableOwnedLinkUseCase: EnableOwnedLinkUseCase,
    private readonly expireOwnedLinkUseCase: ExpireOwnedLinkUseCase,
    private readonly getOwnedLinkDetailsUseCase: GetOwnedLinkDetailsUseCase,
    private readonly listOwnedLinksUseCase: ListOwnedLinksUseCase,
  ) {}

  private toOwnedLinkDetailsOrThrow(
    link: Link | null,
  ): OwnedLinkDetailsResponseDto {
    if (link === null) {
      throw new NotFoundException('Link not found.');
    }

    return toOwnedLinkDetailsResponseDto(link);
  }

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
    @Query() query: ListOwnedLinksQueryDto,
  ): Promise<OwnedLinkResponseDto[]> {
    const links = await this.listOwnedLinksUseCase.execute(
      user.id,
      toListOwnedLinksPage(query),
    );

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
    return this.toOwnedLinkDetailsOrThrow(
      await this.getOwnedLinkDetailsUseCase.execute(id, user.id),
    );
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
  @SkipThrottle(SKIP_AUTH_RATE_LIMIT)
  @Throttle(WRITE_RATE_LIMIT)
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  async disableOwned(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<OwnedLinkDetailsResponseDto> {
    return this.toOwnedLinkDetailsOrThrow(
      await this.disableOwnedLinkUseCase.execute(id, user.id),
    );
  }

  @Patch(':id/enable')
  @ApiOperation({
    summary: 'Enable an authenticated user link',
    description:
      'Enables a shortened link owned by the authenticated user so it can resolve publicly again.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the owned link to enable.',
    example: 'cm8f4b2zy0000s6m8x2v0q3lp',
  })
  @ApiOkResponse({
    description: 'The owned link was enabled successfully.',
    type: OwnedLinkDetailsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The requested owned link does not exist.',
  })
  @ApiUnauthorizedResponse({
    description: 'A valid bearer token is required to enable an owned link.',
  })
  @SkipThrottle(SKIP_AUTH_RATE_LIMIT)
  @Throttle(WRITE_RATE_LIMIT)
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  async enableOwned(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<OwnedLinkDetailsResponseDto> {
    return this.toOwnedLinkDetailsOrThrow(
      await this.enableOwnedLinkUseCase.execute(id, user.id),
    );
  }

  @Patch(':id/expire')
  @ApiOperation({
    summary: 'Expire an authenticated user link',
    description:
      'Sets the expiry time for a shortened link owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the owned link to expire.',
    example: 'cm8f4b2zy0000s6m8x2v0q3lp',
  })
  @ApiOkResponse({
    description: 'The owned link expiry was updated successfully.',
    type: OwnedLinkDetailsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
  })
  @ApiNotFoundResponse({
    description: 'The requested owned link does not exist.',
  })
  @ApiUnauthorizedResponse({
    description: 'A valid bearer token is required to expire an owned link.',
  })
  @SkipThrottle(SKIP_AUTH_RATE_LIMIT)
  @Throttle(WRITE_RATE_LIMIT)
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  async expireOwned(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() body: ExpireOwnedLinkDto,
  ): Promise<OwnedLinkDetailsResponseDto> {
    return this.toOwnedLinkDetailsOrThrow(
      await this.expireOwnedLinkUseCase.execute(
        id,
        user.id,
        new Date(body.expiresAt),
      ),
    );
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
  @SkipThrottle(SKIP_AUTH_RATE_LIMIT)
  @Throttle(WRITE_RATE_LIMIT)
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
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
