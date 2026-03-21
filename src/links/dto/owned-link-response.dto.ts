import { ApiProperty } from '@nestjs/swagger';
import type { Link } from '../domain/link.entity';
import { LinkResponseDto, toLinkResponseDto } from './link-response.dto';

export class OwnedLinkResponseDto extends LinkResponseDto {
  @ApiProperty({
    description:
      'The timestamp when the link was disabled, or null when the link is active.',
    example: '2026-03-20T10:00:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  disabledAt!: string | null;

  @ApiProperty({
    description:
      'The timestamp when the link expires, or null when the link has no expiry.',
    example: '2026-04-01T12:00:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  expiresAt!: string | null;
}

export function toOwnedLinkResponseDto(link: Link): OwnedLinkResponseDto {
  return {
    ...toLinkResponseDto(link),
    disabledAt: link.disabledAt?.toISOString() ?? null,
    expiresAt: link.expiresAt?.toISOString() ?? null,
  };
}

export function toOwnedLinkResponseDtos(
  links: readonly Link[],
): OwnedLinkResponseDto[] {
  return links.map(toOwnedLinkResponseDto);
}
