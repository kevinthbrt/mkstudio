-- The award_xp_on_booking trigger (see 015_gamification_system.sql) fires on
-- every INSERT into class_bookings and unconditionally writes to user_xp /
-- user_streaks, both of which have member_id UUID NOT NULL REFERENCES
-- profiles(id). Guest bookings (walk-ins with no account: massage guests,
-- and now collective/duo guests registered by the admin) have member_id
-- NULL, which made the trigger raise a not-null-violation and roll back the
-- booking insert. Skip XP/streak/achievement processing for guest bookings.

CREATE OR REPLACE FUNCTION award_xp_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_session_type text;
  v_xp_to_award integer := 0;
  v_current_week text;
  v_last_week text;
  v_is_first_this_week boolean := false;
  v_streak_current integer := 0;
  v_sessions_count integer;
  v_class_types_count integer;
  v_guests_count integer;
  v_membership_months integer;
  v_total_class_types integer;
  v_achievement record;
  v_already_has boolean;
BEGIN
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  IF NEW.member_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT cs.session_type INTO v_session_type
  FROM class_sessions cs WHERE cs.id = NEW.class_session_id;

  v_xp_to_award := CASE v_session_type
    WHEN 'individual' THEN 15
    WHEN 'duo'        THEN 12
    ELSE                   10
  END;

  INSERT INTO user_xp (member_id, total_xp, level, title)
  VALUES (NEW.member_id, 0, 1, 'Novice')
  ON CONFLICT (member_id) DO NOTHING;

  INSERT INTO user_streaks (member_id, current_streak_weeks, longest_streak_weeks)
  VALUES (NEW.member_id, 0, 0)
  ON CONFLICT (member_id) DO NOTHING;

  v_current_week := to_char(now(), 'IYYY-IW');

  SELECT last_session_week, current_streak_weeks
  INTO v_last_week, v_streak_current
  FROM user_streaks WHERE member_id = NEW.member_id;

  IF v_last_week IS NULL OR v_last_week != v_current_week THEN
    v_is_first_this_week := true;
    v_xp_to_award := v_xp_to_award + 5;
  END IF;

  UPDATE user_xp SET total_xp = total_xp + v_xp_to_award, updated_at = now()
  WHERE member_id = NEW.member_id;

  UPDATE user_xp SET
    level = CASE
      WHEN total_xp >= 12000 THEN 8 WHEN total_xp >= 6000 THEN 7
      WHEN total_xp >= 3000  THEN 6 WHEN total_xp >= 1500 THEN 5
      WHEN total_xp >= 700   THEN 4 WHEN total_xp >= 300  THEN 3
      WHEN total_xp >= 100   THEN 2 ELSE 1
    END,
    title = CASE
      WHEN total_xp >= 12000 THEN 'Légende' WHEN total_xp >= 6000 THEN 'Champion'
      WHEN total_xp >= 3000  THEN 'Elite'   WHEN total_xp >= 1500 THEN 'Expert'
      WHEN total_xp >= 700   THEN 'Confirmé' WHEN total_xp >= 300 THEN 'Assidu'
      WHEN total_xp >= 100   THEN 'Régulier' ELSE 'Novice'
    END,
    updated_at = now()
  WHERE member_id = NEW.member_id;

  IF v_is_first_this_week THEN
    IF v_last_week IS NULL THEN
      UPDATE user_streaks SET current_streak_weeks = 1, longest_streak_weeks = 1,
        last_session_week = v_current_week, updated_at = now()
      WHERE member_id = NEW.member_id;
      v_streak_current := 1;
    ELSIF v_last_week = to_char((now()::date - 7), 'IYYY-IW') THEN
      UPDATE user_streaks SET
        current_streak_weeks = current_streak_weeks + 1,
        longest_streak_weeks = GREATEST(longest_streak_weeks, current_streak_weeks + 1),
        last_session_week = v_current_week, updated_at = now()
      WHERE member_id = NEW.member_id
      RETURNING current_streak_weeks INTO v_streak_current;
    ELSE
      UPDATE user_streaks SET current_streak_weeks = 1,
        last_session_week = v_current_week, updated_at = now()
      WHERE member_id = NEW.member_id;
      v_streak_current := 1;
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_sessions_count
  FROM class_bookings WHERE member_id = NEW.member_id AND status = 'confirmed';

  SELECT COUNT(DISTINCT cs.class_type_id) INTO v_class_types_count
  FROM class_bookings cb
  JOIN class_sessions cs ON cs.id = cb.class_session_id
  WHERE cb.member_id = NEW.member_id AND cb.status = 'confirmed';

  SELECT COUNT(*) INTO v_guests_count
  FROM class_bookings
  WHERE member_id = NEW.member_id AND status = 'confirmed'
    AND guest_names IS NOT NULL AND guest_names != '';

  SELECT (EXTRACT(YEAR FROM age(now(), created_at)) * 12 +
          EXTRACT(MONTH FROM age(now(), created_at)))::integer
  INTO v_membership_months FROM profiles WHERE id = NEW.member_id;

  SELECT COUNT(*) INTO v_total_class_types FROM class_types;

  FOR v_achievement IN
    SELECT * FROM achievements WHERE condition_type != 'manual' ORDER BY sort_order
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM user_achievements
      WHERE member_id = NEW.member_id AND achievement_id = v_achievement.id
    ) INTO v_already_has;

    IF NOT v_already_has THEN
      IF (
        (v_achievement.condition_type = 'sessions_count'    AND v_sessions_count    >= v_achievement.condition_value) OR
        (v_achievement.condition_type = 'streak_weeks'      AND v_streak_current    >= v_achievement.condition_value) OR
        (v_achievement.condition_type = 'class_types_count' AND v_achievement.condition_value IS NOT NULL AND v_class_types_count >= v_achievement.condition_value) OR
        (v_achievement.condition_type = 'class_types_count' AND v_achievement.condition_value IS NULL     AND v_class_types_count >= v_total_class_types) OR
        (v_achievement.condition_type = 'guests_count'      AND v_guests_count      >= v_achievement.condition_value) OR
        (v_achievement.condition_type = 'membership_months' AND v_membership_months >= v_achievement.condition_value)
      ) THEN
        INSERT INTO user_achievements (member_id, achievement_id)
        VALUES (NEW.member_id, v_achievement.id) ON CONFLICT DO NOTHING;

        UPDATE user_xp SET total_xp = total_xp + v_achievement.xp_reward, updated_at = now()
        WHERE member_id = NEW.member_id;

        UPDATE user_xp SET
          level = CASE
            WHEN total_xp >= 12000 THEN 8 WHEN total_xp >= 6000 THEN 7
            WHEN total_xp >= 3000  THEN 6 WHEN total_xp >= 1500 THEN 5
            WHEN total_xp >= 700   THEN 4 WHEN total_xp >= 300  THEN 3
            WHEN total_xp >= 100   THEN 2 ELSE 1
          END,
          title = CASE
            WHEN total_xp >= 12000 THEN 'Légende' WHEN total_xp >= 6000 THEN 'Champion'
            WHEN total_xp >= 3000  THEN 'Elite'   WHEN total_xp >= 1500 THEN 'Expert'
            WHEN total_xp >= 700   THEN 'Confirmé' WHEN total_xp >= 300 THEN 'Assidu'
            WHEN total_xp >= 100   THEN 'Régulier' ELSE 'Novice'
          END,
          updated_at = now()
        WHERE member_id = NEW.member_id;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
