-- Add charter acceptance tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS charter_accepted_at TIMESTAMPTZ DEFAULT NULL;
