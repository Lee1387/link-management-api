import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({
    description: 'The destination URL that the short link should resolve to.',
    example: 'https://example.com/articles/clean-architecture',
  })
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  originalUrl!: string;
}
