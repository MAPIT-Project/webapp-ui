import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

if (!env.PRIVATE_DATABASE_URL) throw new Error('PRIVATE_DATABASE_URL is not set');
// const client = postgres(env.DATABASE_URL);

const client = postgres(env.PRIVATE_DATABASE_URL);
export const db = drizzle(client, { schema, logger: true });
