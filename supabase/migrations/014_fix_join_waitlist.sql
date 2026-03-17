-- ============================================
-- Migration 014: Fix join_waitlist to handle re-joining
-- Allows members to re-join after being cancelled/promoted
-- Apply in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION join_waitlist(p_member_id UUID, p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_pos         INTEGER;
  existing_status  TEXT;
BEGIN
  -- Check if an entry already exists for this member+session
  SELECT status INTO existing_status
  FROM class_waitlists
  WHERE member_id = p_member_id AND class_session_id = p_session_id;

  IF existing_status IS NOT NULL THEN
    -- Entry exists
    IF existing_status = 'waiting' THEN
      -- Already on waitlist — return current position
      SELECT position INTO next_pos
      FROM class_waitlists
      WHERE member_id = p_member_id AND class_session_id = p_session_id;
      RETURN next_pos;
    ELSE
      -- Previously cancelled or promoted — reactivate with a new position at end of queue
      SELECT COALESCE(MAX(position), 0) + 1 INTO next_pos
      FROM class_waitlists
      WHERE class_session_id = p_session_id AND status = 'waiting';

      UPDATE class_waitlists
        SET status = 'waiting', position = next_pos
      WHERE member_id = p_member_id AND class_session_id = p_session_id;

      RETURN next_pos;
    END IF;
  ELSE
    -- No entry exists — insert fresh
    SELECT COALESCE(MAX(position), 0) + 1 INTO next_pos
    FROM class_waitlists
    WHERE class_session_id = p_session_id AND status = 'waiting';

    INSERT INTO class_waitlists (member_id, class_session_id, position, status)
    VALUES (p_member_id, p_session_id, next_pos, 'waiting');

    RETURN next_pos;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION join_waitlist(UUID, UUID) TO authenticated;

SELECT '014_fix_join_waitlist applied! ✓';
