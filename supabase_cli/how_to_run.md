# Local Supabase & Database Setup Guide

This guide describes how to run and configure the local Supabase environment and apply the database schemas for both the SvelteKit frontend and python backend.

---

## 🛠️ Step-by-Step Local Setup

### 1. Prerequisites
- **Supabase CLI**: Follow the [Supabase CLI Installation Guide](https://supabase.com/docs/guides/cli) for your OS.
- **Docker**: Ensure Docker is installed and the daemon is running.

### 2. Start local Supabase
Navigate to this directory (`webapp-ui/supabase_cli`) and start the Supabase containers:
```bash
# Start Supabase services
supabase start
```
Upon success, the terminal will print your local endpoints and credentials:
- **Supabase Studio (Dashboard)**: http://localhost:54323
- **Postgres Database**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **API URL**: `http://localhost:54321`

### 3. Initialize Database Schema
A unified schema setup file is available inside this directory: [schema.sql](file:///home/anmar/Documents/VSCODE_REPOS/MAPIT/NEWMAPIT/webapp-ui/supabase_cli/schema.sql). This sets up all frontend and backend tables, views, indexes, functions, triggers, and RPCs.

Apply the schema to the running local database:
```bash
# From this directory (webapp-ui/supabase_cli)
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f schema.sql
```

### 4. SvelteKit Schema Synchronisation
The frontend utilizes [Drizzle ORM](https://orm.drizzle.team/) to interface with the database. To synchronise the SvelteKit-specific tables and models defined in `webapp-ui/src/lib/server/db/schema.ts` with the database:

1. Navigate to the `webapp-ui` directory:
   ```bash
   cd webapp-ui
   ```
2. Verify that your `.env` contains the database connection string:
   ```env
   PRIVATE_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   ```
3. Push the Drizzle schema directly:
   ```bash
   npm run db:push
   ```
   *Note: Since the schema has already been pre-created by `schema.sql`, `db:push` will verify consistency and ensure the tables match the typescript definitions exactly.*

---

## 🛑 Stopping Supabase
To stop the local containers without losing database state:
```bash
supabase stop
```

To stop and completely destroy the database volumes (resets all data):
```bash
supabase stop --clean
```

