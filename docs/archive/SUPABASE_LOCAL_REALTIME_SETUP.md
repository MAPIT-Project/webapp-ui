> Documentation status: archived | Owner: MAP-IT frontend team | Scope: superseded local Realtime instructions | Last verified: 18-08-2026 for archival classification

# Local Supabase Realtime Setup

## Enable Realtime for Local Development

Since you're using local Supabase (`http://localhost:54323`), here's how to enable Realtime:

### 1. Access SQL Editor

1. Go to `http://localhost:54323/project/default/sql`
2. Open the SQL Editor

### 2. Enable Realtime for the `message` table

Run this SQL command to enable Realtime:

```sql
-- Enable Realtime for the message table
ALTER publication supabase_realtime ADD TABLE message;
```

If you get an error, you might need to create the publication first:

```sql
-- Create the realtime publication if it doesn't exist
CREATE PUBLICATION supabase_realtime FOR TABLE message;
```

### 3. Verify Realtime is enabled

Check if Realtime is working by running:

```sql
-- Check if message table is in the realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

You should see your `message` table listed.

### 4. Alternative: Enable via Supabase CLI

If you prefer using the CLI, you can also add this to your `supabase/migrations` folder:

```sql
-- Add this to a new migration file
-- Example: supabase/migrations/20240101000000_enable_realtime.sql

-- Enable realtime for message table
ALTER publication supabase_realtime ADD TABLE message;
```

Then run:

```bash
supabase db reset
```

### 5. Test the Setup

1. Go back to `http://localhost:54323/project/default/realtime/inspector`
2. Click "Join a channel"
3. Create a channel like: `collaboration-chat-123` (where 123 is a conversation ID)
4. You should now see real-time events when messages are inserted

### 6. Verify in Your App

1. Create a collaboration conversation in your app
2. Open it in two browser windows
3. Send a message from one window
4. It should appear instantly in the other window
5. Check the browser console for connection logs

## Troubleshooting Local Setup

### If Realtime still doesn't work:

1. **Restart Supabase services:**

   ```bash
   supabase stop
   supabase start
   ```

2. **Check the logs:**

   ```bash
   supabase logs
   ```

3. **Verify the message table exists:**

   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'message';
   ```

4. **Check your RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'message';
   ```

### Common Local Development Issues:

- **Port conflicts**: Make sure port 54323 is free
- **Docker issues**: Ensure Docker is running
- **Database reset**: Sometimes you need to reset the local DB
- **Migration issues**: Check if all migrations have run

## Expected Behavior

Once setup correctly:

- Your app should show "LIVE" status with a green dot
- Messages should appear instantly across browser windows
- The Realtime Inspector should show message events
- Browser console should log "Collaboration chat subscription status: SUBSCRIBED"

Your local Realtime setup should now be working! 🎉
