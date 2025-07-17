-- Create user_metadata table for real-time data integrity and cache management
-- This table serves as a single source of truth for user's accessible data

CREATE TABLE IF NOT EXISTS user_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contact access metadata
    contact_ids JSONB DEFAULT '[]'::jsonb,
    contact_count INTEGER DEFAULT 0,
    
    -- Activity metadata
    activity_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    
    -- Team and permissions metadata
    team_ids JSONB DEFAULT '[]'::jsonb,
    permissions JSONB DEFAULT '{}'::jsonb,
    
    -- Data integrity
    data_checksum TEXT,
    cache_version INTEGER DEFAULT 1,
    
    -- Timestamps
    last_contact_update TIMESTAMPTZ DEFAULT NOW(),
    last_activity_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_metadata_user_id ON user_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metadata_updated_at ON user_metadata(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_metadata_cache_version ON user_metadata(cache_version);

-- Enable RLS
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own metadata" ON user_metadata
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own metadata" ON user_metadata
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metadata" ON user_metadata
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metadata" ON user_metadata
    FOR DELETE USING (auth.uid() = user_id);

-- Function to calculate data checksum
CREATE OR REPLACE FUNCTION calculate_user_data_checksum(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    contact_hash TEXT;
    activity_hash TEXT;
    final_hash TEXT;
BEGIN
    -- Calculate contact data hash
    SELECT md5(string_agg(id::text || name || COALESCE(phone_number, '') || updated_at::text, '' ORDER BY id))
    INTO contact_hash
    FROM contacts 
    WHERE user_id = p_user_id OR id IN (
        SELECT contact_id FROM team_contacts tc
        JOIN team_members tm ON tc.team_id = tm.team_id
        WHERE tm.user_id = p_user_id
    );
    
    -- Calculate activity data hash
    SELECT md5(string_agg(id::text || type || details || created_at::text, '' ORDER BY id))
    INTO activity_hash
    FROM activities
    WHERE user_id = p_user_id;
    
    -- Combine hashes
    final_hash := md5(COALESCE(contact_hash, '') || COALESCE(activity_hash, ''));
    
    RETURN final_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh user metadata
CREATE OR REPLACE FUNCTION refresh_user_metadata(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_contact_ids JSONB;
    v_contact_count INTEGER;
    v_activity_count INTEGER;
    v_last_activity_at TIMESTAMPTZ;
    v_team_ids JSONB;
    v_checksum TEXT;
BEGIN
    -- Get accessible contact IDs
    SELECT jsonb_agg(DISTINCT id)
    INTO v_contact_ids
    FROM contacts 
    WHERE user_id = p_user_id 
       OR id IN (
           SELECT contact_id FROM team_contacts tc
           JOIN team_members tm ON tc.team_id = tm.team_id
           WHERE tm.user_id = p_user_id
       );
    
    -- Get contact count
    SELECT COUNT(*)
    INTO v_contact_count
    FROM contacts 
    WHERE user_id = p_user_id 
       OR id IN (
           SELECT contact_id FROM team_contacts tc
           JOIN team_members tm ON tc.team_id = tm.team_id
           WHERE tm.user_id = p_user_id
       );
    
    -- Get activity count and last activity
    SELECT COUNT(*), MAX(created_at)
    INTO v_activity_count, v_last_activity_at
    FROM activities
    WHERE user_id = p_user_id;
    
    -- Get team IDs
    SELECT jsonb_agg(DISTINCT team_id)
    INTO v_team_ids
    FROM team_members
    WHERE user_id = p_user_id;
    
    -- Calculate checksum
    v_checksum := calculate_user_data_checksum(p_user_id);
    
    -- Upsert metadata
    INSERT INTO user_metadata (
        user_id,
        contact_ids,
        contact_count,
        activity_count,
        last_activity_at,
        team_ids,
        data_checksum,
        cache_version,
        last_contact_update,
        last_activity_update,
        updated_at
    ) VALUES (
        p_user_id,
        COALESCE(v_contact_ids, '[]'::jsonb),
        COALESCE(v_contact_count, 0),
        COALESCE(v_activity_count, 0),
        v_last_activity_at,
        COALESCE(v_team_ids, '[]'::jsonb),
        v_checksum,
        1,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        contact_ids = EXCLUDED.contact_ids,
        contact_count = EXCLUDED.contact_count,
        activity_count = EXCLUDED.activity_count,
        last_activity_at = EXCLUDED.last_activity_at,
        team_ids = EXCLUDED.team_ids,
        data_checksum = EXCLUDED.data_checksum,
        cache_version = user_metadata.cache_version + 1,
        last_contact_update = CASE 
            WHEN user_metadata.contact_ids != EXCLUDED.contact_ids THEN NOW()
            ELSE user_metadata.last_contact_update
        END,
        last_activity_update = CASE 
            WHEN user_metadata.activity_count != EXCLUDED.activity_count THEN NOW()
            ELSE user_metadata.last_activity_update
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to auto-refresh metadata on data changes
CREATE OR REPLACE FUNCTION trigger_refresh_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh metadata for affected user(s)
    IF TG_OP = 'DELETE' THEN
        PERFORM refresh_user_metadata(OLD.user_id);
        RETURN OLD;
    ELSE
        PERFORM refresh_user_metadata(NEW.user_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-refresh
CREATE TRIGGER trigger_contacts_metadata_refresh
    AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_user_metadata();

CREATE TRIGGER trigger_activities_metadata_refresh
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_user_metadata();

-- Function to validate contact access using metadata
CREATE OR REPLACE FUNCTION validate_contact_access(p_user_id UUID, p_contact_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_metadata RECORD;
    v_has_access BOOLEAN := FALSE;
BEGIN
    -- Get user metadata
    SELECT * INTO v_metadata
    FROM user_metadata
    WHERE user_id = p_user_id;
    
    -- If no metadata exists, refresh it first
    IF NOT FOUND THEN
        PERFORM refresh_user_metadata(p_user_id);
        
        SELECT * INTO v_metadata
        FROM user_metadata
        WHERE user_id = p_user_id;
    END IF;
    
    -- Check if contact_id exists in metadata
    IF v_metadata.contact_ids ? p_contact_id::text THEN
        v_has_access := TRUE;
    END IF;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize metadata for existing users
INSERT INTO user_metadata (user_id)
SELECT DISTINCT user_id
FROM contacts
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Refresh metadata for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM user_metadata LOOP
        PERFORM refresh_user_metadata(user_record.user_id);
    END LOOP;
END $$;

COMMIT;