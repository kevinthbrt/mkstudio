-- Migration 006: payment_method on orders, legal_status on profiles,
--                stamp_url on invoice_settings, guest_names on class_bookings

-- 1. Payment method on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2. Legal status on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS legal_status TEXT;

-- 3. Stamp URL on invoice_settings
ALTER TABLE invoice_settings
  ADD COLUMN IF NOT EXISTS stamp_url TEXT;

-- 4. Guest names on class_bookings (comma-separated names of invited guests)
ALTER TABLE class_bookings
  ADD COLUMN IF NOT EXISTS guest_names TEXT;
