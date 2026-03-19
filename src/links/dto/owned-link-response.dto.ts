import type { Link } from '../domain/link.entity';
import { LinkResponseDto, toLinkResponseDto } from './link-response.dto';

export class OwnedLinkResponseDto extends LinkResponseDto {}

export function toOwnedLinkResponseDto(link: Link): OwnedLinkResponseDto {
  return toLinkResponseDto(link);
}

export function toOwnedLinkResponseDtos(
  links: readonly Link[],
): OwnedLinkResponseDto[] {
  return links.map(toOwnedLinkResponseDto);
}
