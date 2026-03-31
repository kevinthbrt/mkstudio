-- Add is_test_account flag to profiles to hide test accounts from leaderboards etc.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN NOT NULL DEFAULT FALSE;
