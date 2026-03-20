import { toOwnedLinkDetailsResponseDto } from './owned-link-details-response.dto';
import type { Link } from '../domain/link.entity';

describe('OwnedLinkDetailsResponseDto', () => {
  it('should map a link entity to an owned link details response DTO', () => {
    const link: Link = {
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };

    expect(toOwnedLinkDetailsResponseDto(link)).toEqual({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      createdAt: '2026-03-18T13:10:00.000Z',
      updatedAt: '2026-03-18T13:10:00.000Z',
    });
  });
});
