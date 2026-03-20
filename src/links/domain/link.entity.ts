export interface Link {
  readonly id: string;
  readonly originalUrl: string;
  readonly shortCode: string;
  readonly disabledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
