-- Authentication System Upgrade: Token Blacklist Migration
-- Creates a token blacklist table to track invalidated tokens for better security
-- Date: 2025-05-11

-- Create token blacklist table if it doesn't exist
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invalidation_reason VARCHAR(50) DEFAULT 'logout'
);

-- Create index for faster lookups by token_hash
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash 
ON token_blacklist(token_hash);

-- Create index for user_id to quickly find all blacklisted tokens for a user
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id
ON token_blacklist(user_id);

-- Create index for expiry date to support cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expiry
ON token_blacklist(expiry_date);

-- Create trigger function to automatically cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS TRIGGER AS $$
BEGIN
    -- Delete tokens that have been expired for more than 24 hours
    DELETE FROM token_blacklist
    WHERE expiry_date < NOW() - INTERVAL '24 hours';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger that runs the cleanup function periodically
DROP TRIGGER IF EXISTS trigger_cleanup_expired_tokens ON token_blacklist;
CREATE TRIGGER trigger_cleanup_expired_tokens
    AFTER INSERT ON token_blacklist
    EXECUTE PROCEDURE cleanup_expired_tokens();

-- Add comment to the table
COMMENT ON TABLE token_blacklist IS 'Stores invalidated JWT tokens to prevent their reuse after logout';
