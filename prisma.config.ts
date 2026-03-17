import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const defaultDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5432/link_management_api?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? defaultDatabaseUrl,
  },
});
