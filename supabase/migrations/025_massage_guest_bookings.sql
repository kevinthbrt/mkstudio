-- Allow the admin to book/invoice a massage slot for someone who isn't a
-- registered member (walk-in / guest), identified by name (+ optional email)
-- instead of a profiles row.

ALTER TABLE class_bookings ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE class_bookings ADD CONSTRAINT class_bookings_member_or_guest_chk
  CHECK (member_id IS NOT NULL OR guest_name IS NOT NULL);

ALTER TABLE orders ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE orders ADD CONSTRAINT orders_member_or_guest_chk
  CHECK (member_id IS NOT NULL OR guest_name IS NOT NULL);
