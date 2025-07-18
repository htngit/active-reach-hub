-- Template Cache Storage Migration
-- Creates database-level caching for templates with metadata security triggers

-- Create template_cache table for persistent storage
CREATE TABLE IF NOT EXISTS template_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    cache_data JSONB NOT NULL,
    metadata_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    
    -- Composite unique constraint
    UNIQUE(user_id, cache_key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_cache_user_id ON template_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_template_cache_expires_at ON template_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_template_cache_metadata_version ON template_cache(metadata_version);
CREATE INDEX IF NOT EXISTS idx_template_cache_user_key ON template_cache(user_id, cache_key);

-- Function to validate cache access with metadata
CREATE OR REPLACE FUNCTION validate_template_cache_access()
RETURNS TRIGGER AS $$
DECLARE
    user_metadata_version INTEGER;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Security check: ensure user can only access their own cache
    IF NEW.user_id != current_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot access other users cache';
    END IF;
    
    -- Get user's current metadata version
    SELECT cache_version INTO user_metadata_version 
    FROM user_metadata 
    WHERE user_id = current_user_id;
    
    -- If no metadata found, create default
    IF user_metadata_version IS NULL THEN
        INSERT INTO user_metadata (user_id, cache_version, last_cache_refresh)
        VALUES (current_user_id, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            cache_version = EXCLUDED.cache_version,
            last_cache_refresh = EXCLUDED.last_cache_refresh;
        user_metadata_version := 1;
    END IF;
    
    -- Set metadata version for new cache entries
    NEW.metadata_version := user_metadata_version;
    NEW.updated_at := NOW();
    
    -- Set expiration (1 hour from now)
    NEW.expires_at := NOW() + INTERVAL '1 hour';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invalidate cache when templates/labels change
CREATE OR REPLACE FUNCTION invalidate_template_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment user's cache version to invalidate all cache
    UPDATE user_metadata 
    SET 
        cache_version = cache_version + 1,
        last_cache_refresh = NOW()
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    -- Delete expired cache entries for this user
    DELETE FROM template_cache 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND (expires_at < NOW() OR metadata_version < (
        SELECT cache_version FROM user_metadata WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ));
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_template_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM template_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers

-- Trigger for cache validation on insert/update
DROP TRIGGER IF EXISTS trigger_validate_template_cache ON template_cache;
CREATE TRIGGER trigger_validate_template_cache
    BEFORE INSERT OR UPDATE ON template_cache
    FOR EACH ROW
    EXECUTE FUNCTION validate_template_cache_access();

-- Trigger for cache invalidation when templates change
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_template_change ON message_template_sets;
CREATE TRIGGER trigger_invalidate_cache_on_template_change
    AFTER INSERT OR UPDATE OR DELETE ON message_template_sets
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_template_cache();

-- Trigger for cache invalidation when labels change
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_label_change ON labels;
CREATE TRIGGER trigger_invalidate_cache_on_label_change
    AFTER INSERT OR UPDATE OR DELETE ON labels
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_template_cache();

-- RLS Policies
ALTER TABLE template_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own cache
CREATE POLICY "Users can manage their own template cache" ON template_cache
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON template_cache TO authenticated;
GRANT EXECUTE ON FUNCTION validate_template_cache_access() TO authenticated;
GRANT EXECUTE ON FUNCTION invalidate_template_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_template_cache() TO authenticated;

-- Create a scheduled job to cleanup expired cache (if pg_cron is available)
-- This will run every hour to clean up expired entries
-- SELECT cron.schedule('cleanup-template-cache', '0 * * * *', 'SELECT cleanup_expired_template_cache();');

-- Add helpful comments
COMMENT ON TABLE template_cache IS 'Persistent cache storage for user templates with metadata security';
COMMENT ON COLUMN template_cache.cache_key IS 'Unique identifier for cache entry (e.g., user_id:label_combination)';
COMMENT ON COLUMN template_cache.cache_data IS 'JSON data containing templates and labels';
COMMENT ON COLUMN template_cache.metadata_version IS 'Version number for cache invalidation based on user metadata';
COMMENT ON COLUMN template_cache.expires_at IS 'Automatic expiration timestamp for cache entries';

COMMENT ON FUNCTION validate_template_cache_access() IS 'Security function to validate cache access and set metadata version';
COMMENT ON FUNCTION invalidate_template_cache() IS 'Function to invalidate cache when templates or labels change';
COMMENT ON FUNCTION cleanup_expired_template_cache() IS 'Maintenance function to remove expired cache entries';