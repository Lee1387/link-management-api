export interface Link {
  readonly id: string;
  readonly originalUrl: string;
  readonly shortCode: string;
  readonly disabledAt: Date | null;
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function isLinkExpired(link: Link, now = new Date()): boolean {
  return link.expiresAt !== null && link.expiresAt.getTime() <= now.getTime();
}

export function isLinkPubliclyResolvable(
  link: Link,
  now = new Date(),
): boolean {
  return link.disabledAt === null && !isLinkExpired(link, now);
}
