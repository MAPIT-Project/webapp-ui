-- Idempotent frontend infrastructure step for Supabase Realtime on public.message.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'message'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message;
  END IF;
END
$$;

ALTER TABLE public.message REPLICA IDENTITY FULL;
