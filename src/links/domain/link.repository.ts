import type { Link } from './link.entity';

export interface CreateLinkInput {
  originalUrl: string;
  shortCode: string;
}

export interface LinkRepository {
  create(input: CreateLinkInput): Promise<Link>;
}

export const LINK_REPOSITORY = Symbol('LINK_REPOSITORY');
