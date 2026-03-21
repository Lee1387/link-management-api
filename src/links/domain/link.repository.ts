import type { Link } from './link.entity';

export interface CreateLinkInput {
  originalUrl: string;
  shortCode: string;
  userId: string;
}

export interface FindOwnedLinksPageInput {
  userId: string;
  limit: number;
  offset: number;
}

export interface LinkRepository {
  create(input: CreateLinkInput): Promise<Link>;
  findByShortCode(shortCode: string): Promise<Link | null>;
  findPageByUserId(input: FindOwnedLinksPageInput): Promise<Link[]>;
  findByIdAndUserId(id: string, userId: string): Promise<Link | null>;
  disableByIdAndUserId(
    id: string,
    userId: string,
    disabledAt: Date,
  ): Promise<Link | null>;
  enableByIdAndUserId(id: string, userId: string): Promise<Link | null>;
  expireByIdAndUserId(
    id: string,
    userId: string,
    expiresAt: Date,
  ): Promise<Link | null>;
}

export const LINK_REPOSITORY = Symbol('LINK_REPOSITORY');
