import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

import { QueryResultRow } from 'pg';

export const query = <T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params);
