-- Add is_hidden column to class_sessions
-- Hidden sessions are not visible to members; admin can reveal them manually
ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Update default min_cancel_hours to 3h
ALTER TABLE class_sessions
  ALTER COLUMN min_cancel_hours SET DEFAULT 3;

-- Update RLS policy so members cannot see hidden sessions
DROP POLICY IF EXISTS "Members can view collective and their individual sessions" ON class_sessions;

CREATE POLICY "Members can view collective and their individual sessions" ON class_sessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      is_admin()
      OR (
        session_type = 'collective'
        AND is_hidden = false
      )
      OR assigned_member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );
