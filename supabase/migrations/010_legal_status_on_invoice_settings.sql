-- Migration 010: Move legal_status from profiles to invoice_settings
-- The legal status belongs to the coach (prestataire), not the members (clients)

-- Add legal_status to invoice_settings (coach's legal status, e.g. "Auto-entrepreneur")
ALTER TABLE invoice_settings
  ADD COLUMN IF NOT EXISTS legal_status TEXT;
