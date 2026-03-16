-- Add charter acceptance tracking and date of birth to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS charter_accepted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL;
