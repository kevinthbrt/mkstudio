-- ============================================
-- Migration 004: Two balances + session types
-- Apply in Supabase SQL Editor
-- ============================================

-- 1. Add two separate balances to profiles
--    Rename session_balance → collective_balance
--    Add individual_balance
ALTER TABLE profiles
  RENAME COLUMN session_balance TO collective_balance;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS individual_balance INTEGER NOT NULL DEFAULT 0;

-- 2. Add session_type to products (collective or individual)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'collective'
  CHECK (session_type IN ('collective', 'individual'));

-- 3. Add session_type + assigned_member_id to class_sessions
--    session_type: 'collective' = open group class, 'individual' = one-on-one
--    assigned_member_id: for individual sessions, the member this session belongs to
ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'collective'
  CHECK (session_type IN ('collective', 'individual'));

ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS assigned_member_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Update RLS for class_sessions:
--    Members should see:
--      - all collective sessions
--      - individual sessions assigned to them
DROP POLICY IF EXISTS "Anyone authenticated can view class sessions" ON class_sessions;

CREATE POLICY "Members can view collective and their individual sessions" ON class_sessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      session_type = 'collective'
      OR is_admin()
      OR assigned_member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- 5. Allow admins to manage class bookings (insert individual bookings for members)
DROP POLICY IF EXISTS "Members can create their own bookings" ON class_bookings;

CREATE POLICY "Members or admins can create bookings" ON class_bookings
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Members can update their own bookings" ON class_bookings;

CREATE POLICY "Members or admins can update bookings" ON class_bookings
  FOR UPDATE USING (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

-- 6. New RPC functions for collective balance
CREATE OR REPLACE FUNCTION increment_collective_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET collective_balance = collective_balance + 1
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_collective_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET collective_balance = GREATEST(0, collective_balance - 1)
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. New RPC functions for individual balance
CREATE OR REPLACE FUNCTION increment_individual_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET individual_balance = individual_balance + 1
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_individual_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET individual_balance = GREATEST(0, individual_balance - 1)
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Keep old functions for backward compatibility (alias to collective)
CREATE OR REPLACE FUNCTION increment_session_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET collective_balance = collective_balance + 1
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_session_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET collective_balance = GREATEST(0, collective_balance - 1)
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION increment_collective_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_collective_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_individual_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_individual_balance(UUID) TO authenticated;

-- Index for individual session lookup
CREATE INDEX IF NOT EXISTS idx_class_sessions_assigned_member ON class_sessions(assigned_member_id)
  WHERE assigned_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_class_sessions_type ON class_sessions(session_type);

SELECT '004_two_balances_and_session_types applied! ✓';
