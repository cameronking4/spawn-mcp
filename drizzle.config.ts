import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Log the DATABASE_URL to verify it's loaded correctly
console.log('DATABASE_URL:', process.env.DATABASE_URL);

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mcp_sse_db'
  }
} satisfies Config;
