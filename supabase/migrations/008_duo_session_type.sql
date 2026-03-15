-- ============================================
-- Migration 008: Coaching privé duo session type
-- Apply in Supabase SQL Editor
-- ============================================

-- 1. Add duo_balance to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS duo_balance INTEGER NOT NULL DEFAULT 0;

-- 2. Update session_type CHECK constraint on products to include 'duo'
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_session_type_check;

ALTER TABLE products
  ADD CONSTRAINT products_session_type_check
  CHECK (session_type IN ('collective', 'individual', 'duo'));

-- 3. Update session_type CHECK constraint on class_sessions to include 'duo'
ALTER TABLE class_sessions
  DROP CONSTRAINT IF EXISTS class_sessions_session_type_check;

ALTER TABLE class_sessions
  ADD CONSTRAINT class_sessions_session_type_check
  CHECK (session_type IN ('collective', 'individual', 'duo'));

-- 4. Update RLS policy for class_sessions:
--    Members should see:
--      - all collective sessions
--      - individual sessions assigned to them (via assigned_member_id)
--      - duo sessions they are booked in (via class_bookings)
DROP POLICY IF EXISTS "Members can view collective and their individual sessions" ON class_sessions;

CREATE POLICY "Members can view collective and their private sessions" ON class_sessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      session_type = 'collective'
      OR is_admin()
      OR (session_type = 'individual' AND assigned_member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
      OR (session_type = 'duo' AND id IN (
        SELECT class_session_id FROM class_bookings
        WHERE member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND status = 'confirmed'
      ))
    )
  );

-- 5. RPC functions for duo balance
CREATE OR REPLACE FUNCTION increment_duo_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET duo_balance = duo_balance + 1
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_duo_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET duo_balance = GREATEST(0, duo_balance - 1)
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION increment_duo_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_duo_balance(UUID) TO authenticated;

-- 7. Index for duo session lookup
CREATE INDEX IF NOT EXISTS idx_class_sessions_duo_type ON class_sessions(session_type)
  WHERE session_type = 'duo';

SELECT '008_duo_session_type applied! ✓';
