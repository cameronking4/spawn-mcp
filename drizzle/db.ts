import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Log the DATABASE_URL to verify it's loaded correctly
console.log('DATABASE_URL in db.ts:', process.env.DATABASE_URL);

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true // Neon requires SSL with proper certificate validation
  }
});

// Create a Drizzle instance
export const db = drizzle(pool, { schema });
