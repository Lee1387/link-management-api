import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateLinkUseCase } from './application/create-link.use-case';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinkResponseDto, toLinkResponseDto } from './dto/link-response.dto';

@ApiTags('links')
@Controller('links')
export class LinksController {
  constructor(private readonly createLinkUseCase: CreateLinkUseCase) {}

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
  async create(@Body() body: CreateLinkDto): Promise<LinkResponseDto> {
    const link = await this.createLinkUseCase.execute({
      originalUrl: body.originalUrl,
    });

    return toLinkResponseDto(link);
  }
}
