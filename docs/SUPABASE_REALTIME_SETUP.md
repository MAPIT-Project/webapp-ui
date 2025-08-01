# Supabase Realtime Setup for Collaboration Chat

## Prerequisites

Your collaboration chat system now uses **Supabase Realtime** instead of polling. To get it working, you need to enable Realtime in your Supabase project.

## Steps to Enable Realtime

### 1. Enable Realtime for the `message` table

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Scroll down to **Realtime**
4. Find the `message` table in the list
5. Toggle **Enable Realtime** for the `message` table

### 2. Verify Row Level Security (RLS)

Since Realtime subscriptions respect RLS policies, make sure your `message` table has appropriate policies:

```sql
-- Example RLS policies for the message table
-- (Adjust according to your specific needs)

-- Allow users to read messages from conversations they have access to
CREATE POLICY "Users can read messages from accessible conversations" ON message
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversation
    WHERE user_id = auth.uid()
    OR collaboration_id IN (
      SELECT collaboration_id FROM client_collaboration
      WHERE client_id = (SELECT id FROM client WHERE auth_id = auth.uid())
    )
  )
);

-- Allow users to insert messages to conversations they have access to
CREATE POLICY "Users can insert messages to accessible conversations" ON message
FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversation
    WHERE user_id = auth.uid()
    OR collaboration_id IN (
      SELECT collaboration_id FROM client_collaboration
      WHERE client_id = (SELECT id FROM client WHERE auth_id = auth.uid())
    )
  )
);
```

### 3. Test the Setup

1. Create a collaboration conversation using the new interface
2. Open the conversation in two different browser windows/tabs
3. Send a message from one window
4. Verify that the message appears in real-time in the other window

## How It Works

### Real-time Flow:

1. User sends a message via the input form
2. Message is saved to the database via `/api/chat/websocket` POST endpoint
3. Supabase Realtime automatically notifies all subscribers of the new message
4. Other users in the conversation receive the message instantly via WebSocket
5. UI updates in real-time without page refresh

### Key Features:

- **True WebSocket connections** via Supabase Realtime
- **Automatic reconnection** if connection is lost
- **Connection status indicator** shows "LIVE" or "OFFLINE"
- **No polling overhead** - messages arrive instantly
- **Built-in security** via RLS policies

## Troubleshooting

### If real-time isn't working:

1. **Check browser console** for connection errors
2. **Verify Realtime is enabled** for the `message` table in Supabase dashboard
3. **Check RLS policies** ensure users can read/write messages
4. **Test with minimal policy** to isolate permission issues:
   ```sql
   -- Temporary test policy (remove after testing)
   CREATE POLICY "test_policy" ON message FOR ALL USING (true);
   ```

### Connection Status:

- **Green dot + "LIVE"**: Real-time connected and working
- **Red dot + "OFFLINE"**: Connection failed or lost

## Performance Benefits

- **Instant messaging**: No 2-second polling delay
- **Reduced server load**: No repeated API calls
- **Better UX**: Messages appear immediately
- **Automatic scaling**: Supabase handles WebSocket connections

Your collaboration chat system is now powered by true WebSocket technology! 🚀
