-- Add user_id column to message table for collaboration chat support
ALTER TABLE message ADD COLUMN user_id INTEGER REFERENCES client(id);

-- Create index for better performance on user_id lookups
CREATE INDEX idx_message_user_id ON message(user_id);

-- Update existing messages to have user_id based on conversation owner for personal chats
UPDATE message 
SET user_id = (
    SELECT c.user_id 
    FROM conversation c 
    WHERE c.id = message.conversation_id 
    AND c.collaboration_id IS NULL
)
WHERE user_id IS NULL AND sender = 'user';
