-- Add citations column to message table
ALTER TABLE "message" ADD COLUMN "citations" jsonb;

-- Create a function to reload the schema
CREATE OR REPLACE FUNCTION reload_schema() RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

-- Call the function to reload the schema
SELECT reload_schema();

-- Also try a direct notification
NOTIFY pgrst, 'reload schema';

-- And a sleep to ensure the notification is processed
SELECT pg_sleep(1);