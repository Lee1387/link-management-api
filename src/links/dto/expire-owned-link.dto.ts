import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class ExpireOwnedLinkDto {
  @ApiProperty({
    description: 'The timestamp when the owned link should expire.',
    example: '2026-04-01T12:00:00.000Z',
    format: 'date-time',
  })
  @IsISO8601({
    strict: true,
    strictSeparator: true,
  })
  expiresAt!: string;
}
