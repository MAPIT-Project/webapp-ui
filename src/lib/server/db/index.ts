import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import postgres from 'postgres';
// import { env } from '$env/dynamic/private';

// if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
// const client = postgres(env.DATABASE_URL);

const client = postgres('POSTGRES_URL HERE',
    {
        ssl: {
            rejectUnauthorized: false,
        },
    }
);
export const db = drizzle(client, { schema, logger: true});
