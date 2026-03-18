import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Redirect,
} from '@nestjs/common';
import {
  ApiFoundResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ResolveLinkUseCase } from './application/resolve-link.use-case';

@ApiTags('redirects')
@Controller()
export class LinkRedirectController {
  constructor(private readonly resolveLinkUseCase: ResolveLinkUseCase) {}

  @Get(':shortCode')
  @Redirect(undefined, HttpStatus.FOUND)
  @ApiOperation({
    summary: 'Resolve a short code',
    description:
      'Redirects the requester to the original URL for a short code.',
  })
  @ApiParam({
    name: 'shortCode',
    description: 'The short code to resolve.',
    example: 'abc123X',
  })
  @ApiFoundResponse({
    description: 'The short code was resolved and redirected.',
  })
  @ApiNotFoundResponse({
    description: 'The requested short code does not exist.',
  })
  async redirect(
    @Param('shortCode') shortCode: string,
  ): Promise<{ url: string }> {
    const link = await this.resolveLinkUseCase.execute(shortCode);

    if (link === null) {
      throw new NotFoundException('Link not found.');
    }

    return {
      url: link.originalUrl,
    };
  }
}
