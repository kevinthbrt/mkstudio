-- ============================================
-- Migration 013: Atomic collective session booking
-- Prevents race conditions (overbooking) via row-level lock
-- Apply in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION book_collective_session(
  p_member_id  UUID,
  p_session_id UUID,
  p_guest_names TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_spots_left     INTEGER;
  v_guest_count    INTEGER := 0;
  v_total_needed   INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Security: caller must own the profile
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_member_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Count non-empty guest names
  IF p_guest_names IS NOT NULL AND trim(p_guest_names) <> '' THEN
    SELECT count(*) INTO v_guest_count
    FROM unnest(string_to_array(p_guest_names, ',')) AS g
    WHERE trim(g) <> '';
  END IF;
  v_total_needed := 1 + v_guest_count;

  -- Lock the session row to prevent concurrent overbooking
  SELECT max_participants - current_participants INTO v_spots_left
  FROM class_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_spots_left IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_not_found');
  END IF;

  IF v_spots_left < v_total_needed THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_spots', 'spots_left', v_spots_left);
  END IF;

  -- Check collective balance
  SELECT collective_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_member_id;

  IF v_current_balance < v_total_needed THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance', 'balance', v_current_balance);
  END IF;

  -- Create or reinstate booking
  INSERT INTO class_bookings (
    member_id, class_session_id, status, session_debited, guest_names, booked_at, cancelled_at
  )
  VALUES (
    p_member_id, p_session_id, 'confirmed', true,
    NULLIF(trim(p_guest_names), ''), now(), NULL
  )
  ON CONFLICT (member_id, class_session_id) DO UPDATE
    SET status        = 'confirmed',
        session_debited = true,
        guest_names   = NULLIF(trim(EXCLUDED.guest_names), ''),
        booked_at     = now(),
        cancelled_at  = NULL;

  -- Deduct balance
  UPDATE profiles
  SET collective_balance = GREATEST(0, collective_balance - v_total_needed)
  WHERE id = p_member_id;

  -- Increment participants counter
  UPDATE class_sessions
  SET current_participants = current_participants + v_total_needed
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success',     true,
    'spots_used',  v_total_needed,
    'new_balance', v_current_balance - v_total_needed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION book_collective_session(UUID, UUID, TEXT) TO authenticated;

SELECT '013_atomic_collective_booking applied! ✓';
