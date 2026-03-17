-- ============================================
-- Migration 012: Liste d'attente pour cours collectifs
-- Apply in Supabase SQL Editor
-- ============================================

-- 1. Create class_waitlists table
CREATE TABLE IF NOT EXISTS class_waitlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'promoted', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(member_id, class_session_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_class_waitlists_session_pos
  ON class_waitlists(class_session_id, position)
  WHERE status = 'waiting';

CREATE INDEX IF NOT EXISTS idx_class_waitlists_member
  ON class_waitlists(member_id);

-- 3. RLS
ALTER TABLE class_waitlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own waitlist entries" ON class_waitlists
  FOR SELECT USING (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Members can join waitlist" ON class_waitlists
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update own waitlist entries" ON class_waitlists
  FOR UPDATE USING (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

-- 4. RPC: join waitlist atomically (returns assigned position)
CREATE OR REPLACE FUNCTION join_waitlist(p_member_id UUID, p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO next_pos
  FROM class_waitlists
  WHERE class_session_id = p_session_id AND status = 'waiting';

  INSERT INTO class_waitlists (member_id, class_session_id, position, status)
  VALUES (p_member_id, p_session_id, next_pos, 'waiting')
  ON CONFLICT (member_id, class_session_id) DO NOTHING;

  -- If conflict (already on waitlist), return existing position
  IF NOT FOUND THEN
    SELECT position INTO next_pos
    FROM class_waitlists
    WHERE member_id = p_member_id AND class_session_id = p_session_id;
  END IF;

  RETURN next_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION join_waitlist(UUID, UUID) TO authenticated;

-- 5. RPC: get waitlist count for a session
CREATE OR REPLACE FUNCTION get_waitlist_count(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM class_waitlists
  WHERE class_session_id = p_session_id AND status = 'waiting';
  RETURN cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_waitlist_count(UUID) TO authenticated;

SELECT '012_class_waitlist applied! ✓';
