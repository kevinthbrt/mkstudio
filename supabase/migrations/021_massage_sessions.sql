-- Massage slots: a 4th session_type alongside collective/individual/duo.
-- Display (name/color) lives on class_types as usual; price/invoicing reuse
-- the products table (flagged is_massage) so the admin can edit prices from
-- the existing Produits page without any new UI.

ALTER TABLE class_types ADD COLUMN IF NOT EXISTS is_massage BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE class_types ADD COLUMN IF NOT EXISTS massage_product_id UUID REFERENCES products(id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_massage BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_session_type_check;
ALTER TABLE products ADD CONSTRAINT products_session_type_check
  CHECK (session_type IN ('collective', 'individual', 'duo', 'massage'));

ALTER TABLE class_sessions DROP CONSTRAINT IF EXISTS class_sessions_session_type_check;
ALTER TABLE class_sessions ADD CONSTRAINT class_sessions_session_type_check
  CHECK (session_type IN ('collective', 'individual', 'duo', 'massage'));

ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS massage_product_id UUID REFERENCES products(id);

ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS massage_price NUMERIC(10,2);
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS massage_discount_applied BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS invoice_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Members can browse open (non-hidden) massage slots, same visibility model as collective classes.
DROP POLICY IF EXISTS "Members can view collective and their private sessions" ON class_sessions;
CREATE POLICY "Members can view collective and their private sessions" ON class_sessions
  FOR SELECT
  USING (
    (
      (session_type = 'collective' AND is_hidden = false)
      OR (session_type = 'massage' AND is_hidden = false)
      OR (session_type = 'individual' AND assigned_member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
      OR (session_type = 'duo' AND id IN (
        SELECT class_session_id FROM class_bookings
        WHERE member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND status = 'confirmed'
      ))
    )
    OR is_admin()
  );

-- Seed the 3 massage types (class_types = display, products = price/invoicing)
DO $$
DECLARE
  v_class_type_id UUID;
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM class_types WHERE is_massage = true) THEN
    INSERT INTO products (name, description, price, session_count, session_type, active, is_massage)
    VALUES ('Massage Ayurvédique (60 min)', 'Massage Ayurvédique, 60 minutes', 60, 1, 'massage', true, true)
    RETURNING id INTO v_product_id;
    INSERT INTO class_types (name, description, color, duration_minutes, is_massage, massage_product_id)
    VALUES ('Massage Ayurvédique', 'Massage traditionnel indien, détente profonde', '#f97316', 60, true, v_product_id)
    RETURNING id INTO v_class_type_id;

    INSERT INTO products (name, description, price, session_count, session_type, active, is_massage)
    VALUES ('Massage Californien (60 min)', 'Massage Californien, 60 minutes', 60, 1, 'massage', true, true)
    RETURNING id INTO v_product_id;
    INSERT INTO class_types (name, description, color, duration_minutes, is_massage, massage_product_id)
    VALUES ('Massage Californien', 'Massage relaxant aux mouvements longs et enveloppants', '#ec4899', 60, true, v_product_id)
    RETURNING id INTO v_class_type_id;

    INSERT INTO products (name, description, price, session_count, session_type, active, is_massage)
    VALUES ('Drainage lymphatique (60 min)', 'Massage drainage lymphatique, 60 minutes', 75, 1, 'massage', true, true)
    RETURNING id INTO v_product_id;
    INSERT INTO class_types (name, description, color, duration_minutes, is_massage, massage_product_id)
    VALUES ('Drainage lymphatique', 'Massage doux stimulant la circulation lymphatique', '#06b6d4', 60, true, v_product_id)
    RETURNING id INTO v_class_type_id;
  END IF;
END $$;
