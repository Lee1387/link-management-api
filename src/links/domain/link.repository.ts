import type { Link } from './link.entity';

export interface CreateLinkInput {
  originalUrl: string;
  shortCode: string;
  userId: string;
}

export interface LinkRepository {
  create(input: CreateLinkInput): Promise<Link>;
  findByShortCode(shortCode: string): Promise<Link | null>;
  findByUserId(userId: string): Promise<Link[]>;
  findByIdAndUserId(id: string, userId: string): Promise<Link | null>;
}

export const LINK_REPOSITORY = Symbol('LINK_REPOSITORY');
