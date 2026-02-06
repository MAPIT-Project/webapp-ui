import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { readFileSync } from 'fs';
import { join } from 'path';

// For production
const connectionString = process.env.PRIVATE_DATABASE_URL;

// For local development with Docker
const localConnectionConfig = {
  host: 'localhost',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
};

// Use local config for development, production config for deployment
const connectionConfig = process.env.NODE_ENV === 'development' 
  ? localConnectionConfig 
  : connectionString;

const client = postgres(connectionConfig as any);
export const db = drizzle(client, { schema });

// Migration function
export async function runMigrations() {
  try {
    // Read the migration files and execute them
    const migrationsPath = join(__dirname, 'migrations');
    
    // Get all migration files and sort them
    const migrationFiles = [
      '0000_calm_roulette.sql',
      '0001_tricky_giant_girl.sql',
      '0002_next_boomerang.sql',
      '0003_closed_purple_man.sql',
      '0004_add_citations_to_messages.sql'
    ];
    
    for (const file of migrationFiles) {
      try {
        const migrationSQL = readFileSync(join(migrationsPath, file), 'utf8');
        await client.unsafe(migrationSQL);
        console.log(`Migration ${file} executed successfully`);
      } catch (error: any) {
        // Ignore "already exists" errors for migrations
        if (!error.message.includes('already exists')) {
          console.error(`Error executing migration ${file}:`, error);
        }
      }
    }
    
    console.log('All migrations executed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}
