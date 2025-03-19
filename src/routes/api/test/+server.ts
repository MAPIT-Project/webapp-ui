import type { RequestHandler } from '@sveltejs/kit';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import { client } from '$lib/server/db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const sql = postgres(env.DATABASE_URL, {
    ssl: false
});

// Initialize drizzle with the postgres client
const db = drizzle(sql);

// Function to get all clients
async function getAllClients() {
    try {
        const clients = await db.select().from(client);
        return clients;
    } catch (error) {
        console.error('Error fetching clients:', error);
        throw error;
    }
}

export const GET: RequestHandler = async ({ request }) => {
    try {
        const clients = await getAllClients();
        
        return new Response(JSON.stringify({ 
            message: 'Successfully retrieved clients',
            clients
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'Failed to fetch clients',
            details: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};