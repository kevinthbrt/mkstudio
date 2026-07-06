DROP FUNCTION IF EXISTS book_massage_session(UUID, UUID, UUID, NUMERIC, BOOLEAN);

CREATE OR REPLACE FUNCTION book_massage_session(
  p_session_id UUID,
  p_product_id UUID,
  p_price NUMERIC,
  p_discount_applied BOOLEAN,
  p_member_id UUID DEFAULT NULL,
  p_guest_name TEXT DEFAULT NULL,
  p_guest_email TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_spots_left INTEGER;
BEGIN
  IF p_member_id IS NULL AND p_guest_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_identity');
  END IF;

  SELECT max_participants - current_participants INTO v_spots_left
  FROM class_sessions
  WHERE id = p_session_id AND session_type = 'massage' AND is_cancelled = false
  FOR UPDATE;

  IF v_spots_left IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_not_found');
  END IF;

  IF v_spots_left < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_spots');
  END IF;

  IF p_member_id IS NOT NULL THEN
    INSERT INTO class_bookings (
      member_id, class_session_id, status, session_debited, massage_product_id, massage_price, massage_discount_applied, booked_at, cancelled_at
    ) VALUES (
      p_member_id, p_session_id, 'confirmed', false, p_product_id, p_price, p_discount_applied, now(), NULL
    )
    ON CONFLICT (member_id, class_session_id) DO UPDATE
      SET status = 'confirmed',
          session_debited = false,
          massage_product_id = EXCLUDED.massage_product_id,
          massage_price = EXCLUDED.massage_price,
          massage_discount_applied = EXCLUDED.massage_discount_applied,
          booked_at = now(),
          cancelled_at = NULL;
  ELSE
    INSERT INTO class_bookings (
      member_id, class_session_id, status, session_debited, massage_product_id, massage_price, massage_discount_applied, guest_name, guest_email, booked_at, cancelled_at
    ) VALUES (
      NULL, p_session_id, 'confirmed', false, p_product_id, p_price, p_discount_applied, p_guest_name, p_guest_email, now(), NULL
    );
  END IF;

  UPDATE class_sessions
  SET current_participants = current_participants + 1
  WHERE id = p_session_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
