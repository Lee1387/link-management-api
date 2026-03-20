import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_OWNED_LINKS_LIMIT = 25;
export const MAX_OWNED_LINKS_LIMIT = 100;

export interface ListOwnedLinksPage {
  readonly limit: number;
  readonly offset: number;
}

export class ListOwnedLinksQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of owned links to return.',
    example: 25,
    minimum: 1,
    maximum: MAX_OWNED_LINKS_LIMIT,
    default: DEFAULT_OWNED_LINKS_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_OWNED_LINKS_LIMIT)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of owned links to skip before returning results.',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export function toListOwnedLinksPage(
  query: ListOwnedLinksQueryDto,
): ListOwnedLinksPage {
  return {
    limit: query.limit ?? DEFAULT_OWNED_LINKS_LIMIT,
    offset: query.offset ?? 0,
  };
}
