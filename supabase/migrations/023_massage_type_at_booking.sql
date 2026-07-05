-- Correction: the massage type is chosen by the member (or admin, for them) at
-- booking time, not baked into the slot at creation. The slot itself is generic.

-- Consolidate the 3 seeded massage class_types into a single generic "Massage" one.
-- Safe: no class_sessions reference them yet.
DELETE FROM class_types WHERE is_massage = true;

INSERT INTO class_types (name, description, color, duration_minutes, is_massage)
VALUES ('Massage', 'Créneau de massage — le type est choisi à la réservation', '#ec4899', 60, true);

ALTER TABLE class_types DROP COLUMN IF EXISTS massage_product_id;
ALTER TABLE class_sessions DROP COLUMN IF EXISTS massage_product_id;

-- The chosen massage type now lives on the booking, not the slot.
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS massage_product_id UUID REFERENCES products(id);
