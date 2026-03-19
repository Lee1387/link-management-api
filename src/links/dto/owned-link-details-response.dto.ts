import type { Link } from '../domain/link.entity';
import {
  OwnedLinkResponseDto,
  toOwnedLinkResponseDto,
} from './owned-link-response.dto';

export class OwnedLinkDetailsResponseDto extends OwnedLinkResponseDto {}

export function toOwnedLinkDetailsResponseDto(
  link: Link,
): OwnedLinkDetailsResponseDto {
  return toOwnedLinkResponseDto(link);
}
