-- ==========================================
-- GAMIFICATION SYSTEM
-- ==========================================

-- 1. Achievements definition table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  category text NOT NULL CHECK (category IN ('sessions', 'streaks', 'explorer', 'social', 'loyalty', 'special')),
  xp_reward integer NOT NULL DEFAULT 0,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  condition_type text CHECK (condition_type IN ('sessions_count', 'streak_weeks', 'class_types_count', 'guests_count', 'membership_months', 'manual')),
  condition_value integer,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. User XP & level tracking
CREATE TABLE IF NOT EXISTS user_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT 'Novice',
  updated_at timestamptz DEFAULT now()
);

-- 3. User achievements unlocked
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(member_id, achievement_id)
);

-- 4. User streaks (weekly)
CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak_weeks integer NOT NULL DEFAULT 0,
  longest_streak_weeks integer NOT NULL DEFAULT 0,
  last_session_week text,
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_read_authenticated" ON achievements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_xp_read_authenticated" ON user_xp
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_achievements_read_own" ON user_achievements
  FOR SELECT TO authenticated USING (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "user_streaks_read_own" ON user_streaks
  FOR SELECT TO authenticated USING (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- SEED: Achievements
-- ==========================================
INSERT INTO achievements (code, name, description, icon, category, xp_reward, rarity, condition_type, condition_value, sort_order) VALUES
('first_session',  'Première Séance',    'Tu as complété ta toute première séance. L''aventure commence !',      '🌱', 'sessions', 10,  'common',    'sessions_count', 1,   10),
('sessions_10',    'Déjà 10 !',          'Tu as complété 10 séances. Tu prends de bonnes habitudes !',            '🏅', 'sessions', 25,  'common',    'sessions_count', 10,  20),
('sessions_25',    'Régulier',           '25 séances au compteur. Tu es un vrai habitué !',                       '🥈', 'sessions', 50,  'common',    'sessions_count', 25,  30),
('sessions_50',    'Vétéran',            '50 séances ! Tu fais partie des piliers du studio.',                    '🥇', 'sessions', 100, 'rare',      'sessions_count', 50,  40),
('sessions_100',   'Centurion',          '100 séances ! Un engagement hors du commun.',                           '🏆', 'sessions', 200, 'epic',      'sessions_count', 100, 50),
('sessions_200',   'Légende',            '200 séances. Tu es une véritable source d''inspiration.',               '👑', 'sessions', 500, 'legendary', 'sessions_count', 200, 60),
('streak_2',  'En Forme',    '2 semaines consécutives ! La régularité paie.',                      '🔥', 'streaks', 20,  'common',    'streak_weeks', 2,  110),
('streak_4',  'Habitude',    '1 mois sans interruption ! C''est bien parti.',                      '💪', 'streaks', 50,  'common',    'streak_weeks', 4,  120),
('streak_8',  'Inarrêtable', '2 mois consécutifs ! Rien ne peut t''arrêter.',                     '⚡', 'streaks', 100, 'rare',      'streak_weeks', 8,  130),
('streak_16', 'Invincible',  '4 mois consécutifs ! Une détermination exemplaire.',                 '🌟', 'streaks', 200, 'epic',      'streak_weeks', 16, 140),
('streak_52', 'Machine',     '1 an sans jamais manquer une semaine. Tout simplement incroyable.',  '💎', 'streaks', 500, 'legendary', 'streak_weeks', 52, 150),
('explorer_3',   'Curieux',    'Tu as essayé 3 types de cours différents. Bravo !',               '🗺️', 'explorer', 30,  'common', 'class_types_count', 3, 210),
('explorer_5',   'Polyvalent', 'Tu as essayé 5 types de cours. Vraiment polyvalent !',            '🎯', 'explorer', 75,  'rare',   'class_types_count', 5, 220),
('explorer_all', 'All-in',    'Tu as essayé tous les types de cours disponibles !',               '🌈', 'explorer', 150, 'epic',   'class_types_count', 7, 230),
('first_guest', 'Bon Ambassadeur', 'Tu as amené un ami pour la première fois. Merci !',           '🤝', 'social', 25, 'common', 'guests_count', 1, 310),
('guests_5',    'Animateur',       'Tu as amené 5 amis ! L''équipe grandit grâce à toi.',         '👥', 'social', 75, 'rare',   'guests_count', 5, 320),
('loyalty_6m',  '6 Mois Ensemble',   'Cela fait 6 mois que tu es avec nous. Merci !',                '📅', 'loyalty', 50,  'common', 'membership_months', 6,  410),
('loyalty_1y',  '1 An avec Nous',    '1 an d''aventure commune. Fidélité exemplaire !',               '🎂', 'loyalty', 150, 'rare',   'membership_months', 12, 420),
('loyalty_2y',  '2 Ans de Fidélité', '2 ans ! Tu fais vraiment partie de la famille MK Studio.',    '💖', 'loyalty', 300, 'epic',   'membership_months', 24, 430),
('founding_member', 'Membre Fondateur', 'Tu fais partie des membres fondateurs de MK Studio.',       '⭐', 'special', 200, 'legendary', 'manual', NULL, 510),
('mvp_month',       'MVP du Mois',      'Élu MVP du mois par le coach. Félicitations !',              '🎁', 'special', 100, 'epic',      'manual', NULL, 520)
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- TRIGGER: Award XP on booking
-- ==========================================
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

CREATE TRIGGER trigger_award_xp_on_booking
AFTER INSERT ON class_bookings
FOR EACH ROW
EXECUTE FUNCTION award_xp_on_booking();

-- ==========================================
-- RPC: Award manual achievement (admin only)
-- ==========================================
CREATE OR REPLACE FUNCTION award_manual_achievement(
  p_member_id uuid,
  p_achievement_code text
)
RETURNS jsonb AS $$
DECLARE
  v_achievement achievements%ROWTYPE;
  v_already_has boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_achievement FROM achievements WHERE code = p_achievement_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Achievement not found');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE member_id = p_member_id AND achievement_id = v_achievement.id
  ) INTO v_already_has;

  IF v_already_has THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already earned');
  END IF;

  INSERT INTO user_xp (member_id, total_xp, level, title)
  VALUES (p_member_id, 0, 1, 'Novice') ON CONFLICT (member_id) DO NOTHING;

  INSERT INTO user_achievements (member_id, achievement_id)
  VALUES (p_member_id, v_achievement.id);

  UPDATE user_xp SET total_xp = total_xp + v_achievement.xp_reward, updated_at = now()
  WHERE member_id = p_member_id;

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
  WHERE member_id = p_member_id;

  RETURN jsonb_build_object('success', true, 'achievement', v_achievement.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
