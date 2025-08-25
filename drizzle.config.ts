import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infra/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.D1_PATH || './tmp/db.sqlite',
  },
  verbose: true,
  strict: true,
});


