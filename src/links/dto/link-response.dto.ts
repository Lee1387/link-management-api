import { ApiProperty } from '@nestjs/swagger';
import type { Link } from '../domain/link.entity';

export class LinkResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the created link.',
    example: 'cm8f4b2zy0000s6m8x2v0q3lp',
  })
  id!: string;

  @ApiProperty({
    description: 'The destination URL that the short link resolves to.',
    example: 'https://example.com/articles/clean-architecture',
  })
  originalUrl!: string;

  @ApiProperty({
    description: 'The generated short code for the link.',
    example: 'abc123X',
  })
  shortCode!: string;

  @ApiProperty({
    description: 'The timestamp when the link was created.',
    example: '2026-03-18T13:10:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'The timestamp when the link was last updated.',
    example: '2026-03-18T13:10:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}

export function toLinkResponseDto(link: Link): LinkResponseDto {
  return {
    id: link.id,
    originalUrl: link.originalUrl,
    shortCode: link.shortCode,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}
