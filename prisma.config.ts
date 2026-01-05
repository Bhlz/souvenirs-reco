import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL', { optional: true }) ?? '',
    shadowDatabaseUrl: env('SHADOW_DATABASE_URL', { optional: true }) ?? undefined,
  },
});
