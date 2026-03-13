-- RPC functions for atomic operations

-- Increment session balance
CREATE OR REPLACE FUNCTION increment_session_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET session_balance = session_balance + 1
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement session balance
CREATE OR REPLACE FUNCTION decrement_session_balance(p_member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET session_balance = GREATEST(0, session_balance - 1)
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment class participants
CREATE OR REPLACE FUNCTION increment_participants(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE class_sessions
  SET current_participants = current_participants + 1
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement class participants
CREATE OR REPLACE FUNCTION decrement_participants(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE class_sessions
  SET current_participants = GREATEST(0, current_participants - 1)
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_session_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_session_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_participants(UUID) TO authenticated;
