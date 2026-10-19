-- Migration 029 : durcissement de la sécurité
--
-- Failles corrigées (toutes exploitables par un simple appel à l'API
-- Supabase avec la clé publique du site, sans passer par l'interface) :
--
--   1. Inscription en admin : handle_new_user recopiait le rôle depuis les
--      métadonnées envoyées par la personne qui s'inscrit.
--   2. Un adhérent pouvait modifier librement sa ligne profiles : rôle,
--      soldes de séances, statut de compte test.
--   3. Les fonctions de solde et de compteur de places (increment_*,
--      decrement_*) étaient exécutables par tout le monde, même sans être
--      connecté, pour n'importe quel adhérent.
--   4. Un adhérent pouvait créer ou modifier ses réservations directement
--      (marquer une séance comme débitée, changer de cours, rouvrir une
--      réservation annulée…) et s'inscrire en liste d'attente au nom d'un autre.
--   5. book_massage_session acceptait un prix fourni par l'appelant.
--   6. N'importe quel adhérent pouvait remplacer le tampon des factures
--      (à corriger dans le tableau de bord, voir la fin du fichier).
--
-- Appliquée en production en plusieurs étapes (029a à 029e) : l'outil de
-- migration bloque sur les DROP, d'où les CREATE OR REPLACE TRIGGER.
--
-- Compatibilité : le site actuellement en ligne fait encore certaines
-- opérations depuis le navigateur (annulation d'une réservation puis
-- remboursement de la séance). Ces opérations restent possibles, mais
-- uniquement dans leur forme légitime : un adhérent ne peut se rembourser
-- que les places d'une réservation débitée qu'il vient lui-même d'annuler,
-- une seule fois par annulation.

-- ─── Outils ──────────────────────────────────────────────────────────────────

-- Appel de confiance : un admin connecté, ou le serveur (clé service_role).
CREATE OR REPLACE FUNCTION is_trusted_caller()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin() OR COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
$$;

CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid()
$$;

-- Écriture faite directement par un navigateur (et non par une fonction de
-- confiance ou le serveur), par quelqu'un qui n'est pas admin.
-- current_user vaut « authenticated » ou « anon » pour une requête directe,
-- le propriétaire de la fonction à l'intérieur d'une fonction SECURITY DEFINER,
-- et « service_role » côté serveur.
CREATE OR REPLACE FUNCTION is_direct_member_write()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT current_user IN ('authenticated', 'anon') AND NOT is_admin()
$$;

CREATE OR REPLACE FUNCTION guest_count(p_guest_names TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM unnest(string_to_array(COALESCE(p_guest_names, ''), ',')) AS g
  WHERE btrim(g) <> ''
$$;

-- Journal des remboursements faits depuis le navigateur pendant la transition :
-- une ligne par place remboursée, rattachée à une annulation précise.
CREATE TABLE IF NOT EXISTS member_refund_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES class_bookings(id) ON DELETE CASCADE,
  cancelled_at TIMESTAMPTZ NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('balance', 'participants')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS member_refund_ledger_booking_idx ON member_refund_ledger(booking_id, cancelled_at, kind);
ALTER TABLE member_refund_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON member_refund_ledger FROM anon, authenticated;

-- Réserve une place de remboursement pour l'adhérent connecté, sur une
-- réservation débitée qu'il a annulée il y a moins de 15 minutes.
-- Renvoie false s'il n'y a plus rien de légitime à rembourser.
CREATE OR REPLACE FUNCTION claim_member_refund(
  p_kind TEXT,
  p_session_types TEXT[],
  p_session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT b.id, b.cancelled_at INTO v_booking
  FROM class_bookings b
  JOIN class_sessions s ON s.id = b.class_session_id
  WHERE b.member_id = current_profile_id()
    AND b.status = 'cancelled'
    AND b.cancelled_at > now() - interval '15 minutes'
    AND s.session_type = ANY(p_session_types)
    AND (p_session_id IS NULL OR b.class_session_id = p_session_id)
    AND (p_kind <> 'balance' OR b.session_debited)
    AND (
      SELECT COUNT(*) FROM member_refund_ledger l
      WHERE l.booking_id = b.id AND l.cancelled_at = b.cancelled_at AND l.kind = p_kind
    ) < 1 + guest_count(b.guest_names)
  ORDER BY b.cancelled_at DESC
  LIMIT 1
  FOR UPDATE OF b;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO member_refund_ledger (booking_id, cancelled_at, kind)
  VALUES (v_booking.id, v_booking.cancelled_at, p_kind);
  RETURN true;
END;
$$;

-- ─── 1. Inscription : le rôle n'est plus jamais pris dans les métadonnées ───

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    'member'
  );
  RETURN NEW;
END;
$$;

-- ─── 2. Profils : un adhérent ne modifie que ses informations personnelles ──

CREATE OR REPLACE FUNCTION guard_profile_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT is_direct_member_write() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Création de secours du profil à la connexion : toujours un adhérent sans solde.
    NEW.role := 'member';
    NEW.collective_balance := 0;
    NEW.individual_balance := 0;
    NEW.duo_balance := 0;
    NEW.is_test_account := false;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.collective_balance IS DISTINCT FROM OLD.collective_balance
     OR NEW.individual_balance IS DISTINCT FROM OLD.individual_balance
     OR NEW.duo_balance IS DISTINCT FROM OLD.duo_balance
     OR NEW.is_test_account IS DISTINCT FROM OLD.is_test_account
     OR NEW.legal_status IS DISTINCT FROM OLD.legal_status
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'forbidden_profile_change' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER guard_profile_write BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_profile_write();

-- ─── 4. Réservations : un adhérent peut seulement annuler, dans les délais ──

CREATE OR REPLACE FUNCTION guard_booking_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_session class_sessions%ROWTYPE;
BEGIN
  IF NOT is_direct_member_write() THEN
    RETURN NEW;
  END IF;

  -- Les réservations passent par book_collective_session ou par le serveur.
  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'forbidden_booking_insert' USING ERRCODE = '42501';
  END IF;

  IF OLD.status <> 'confirmed' OR NEW.status <> 'cancelled'
     OR NEW.member_id IS DISTINCT FROM OLD.member_id
     OR NEW.class_session_id IS DISTINCT FROM OLD.class_session_id
     OR NEW.session_debited IS DISTINCT FROM OLD.session_debited
     OR NEW.booked_at IS DISTINCT FROM OLD.booked_at
     OR NEW.guest_names IS DISTINCT FROM OLD.guest_names
     OR NEW.guest_name IS DISTINCT FROM OLD.guest_name
     OR NEW.guest_email IS DISTINCT FROM OLD.guest_email
     OR NEW.massage_price IS DISTINCT FROM OLD.massage_price
     OR NEW.massage_discount_applied IS DISTINCT FROM OLD.massage_discount_applied
     OR NEW.massage_product_id IS DISTINCT FROM OLD.massage_product_id
     OR NEW.invoice_order_id IS DISTINCT FROM OLD.invoice_order_id THEN
    RAISE EXCEPTION 'forbidden_booking_change' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_session FROM class_sessions WHERE id = OLD.class_session_id;
  IF v_session.start_time - make_interval(hours => v_session.min_cancel_hours) < now() THEN
    RAISE EXCEPTION 'cancellation_too_late' USING ERRCODE = '42501';
  END IF;

  -- L'heure d'annulation fait foi pour les remboursements : elle n'est pas
  -- laissée au choix du navigateur.
  NEW.cancelled_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER guard_booking_write BEFORE INSERT OR UPDATE ON class_bookings
  FOR EACH ROW EXECUTE FUNCTION guard_booking_write();

-- Liste d'attente : inscription via join_waitlist, l'adhérent peut seulement se retirer.
CREATE OR REPLACE FUNCTION guard_waitlist_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT is_direct_member_write() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'forbidden_waitlist_insert' USING ERRCODE = '42501';
  END IF;

  IF NEW.status <> 'cancelled'
     OR NEW.member_id IS DISTINCT FROM OLD.member_id
     OR NEW.class_session_id IS DISTINCT FROM OLD.class_session_id
     OR NEW.position IS DISTINCT FROM OLD.position THEN
    RAISE EXCEPTION 'forbidden_waitlist_change' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER guard_waitlist_write BEFORE INSERT OR UPDATE ON class_waitlists
  FOR EACH ROW EXECUTE FUNCTION guard_waitlist_write();

-- ─── 3. Soldes et compteurs de places ────────────────────────────────────────
-- Admin et serveur : inchangé. Adhérent : uniquement le remboursement
-- légitime d'une annulation qu'il vient de faire (voir claim_member_refund).

CREATE OR REPLACE FUNCTION increment_collective_balance(p_member_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller() AND (
    p_member_id IS DISTINCT FROM current_profile_id()
    OR NOT claim_member_refund('balance', ARRAY['collective'])
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET collective_balance = collective_balance + 1 WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_individual_balance(p_member_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller() AND (
    p_member_id IS DISTINCT FROM current_profile_id()
    OR NOT claim_member_refund('balance', ARRAY['individual'])
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET individual_balance = individual_balance + 1 WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_duo_balance(p_member_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller() AND (
    p_member_id IS DISTINCT FROM current_profile_id()
    OR NOT claim_member_refund('balance', ARRAY['duo'])
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET duo_balance = duo_balance + 1 WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_participants(session_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller()
     AND NOT claim_member_refund('participants', ARRAY['collective', 'individual', 'duo'], session_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE class_sessions SET current_participants = GREATEST(0, current_participants - 1)
  WHERE id = decrement_participants.session_id;
END;
$$;

-- Débits et ajouts de places : jamais faits par un adhérent depuis le navigateur.
CREATE OR REPLACE FUNCTION increment_participants(session_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE class_sessions SET current_participants = current_participants + 1
  WHERE id = increment_participants.session_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_collective_balance(p_member_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET collective_balance = GREATEST(0, collective_balance - 1) WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_individual_balance(p_member_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET individual_balance = GREATEST(0, individual_balance - 1) WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_duo_balance(p_member_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET duo_balance = GREATEST(0, duo_balance - 1) WHERE id = p_member_id;
END;
$$;

-- Anciennes fonctions de solde unique, plus utilisées par le site.
CREATE OR REPLACE FUNCTION increment_session_balance(p_member_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET collective_balance = collective_balance + 1 WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_session_balance(p_member_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_trusted_caller() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET collective_balance = GREATEST(0, collective_balance - 1) WHERE id = p_member_id;
END;
$$;

-- Liste d'attente : on ne s'inscrit que soi-même (sauf admin / serveur).
CREATE OR REPLACE FUNCTION join_waitlist(p_member_id UUID, p_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_pos         INTEGER;
  existing_status  TEXT;
BEGIN
  IF NOT is_trusted_caller() AND p_member_id IS DISTINCT FROM current_profile_id() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO existing_status
  FROM class_waitlists
  WHERE member_id = p_member_id AND class_session_id = p_session_id;

  IF existing_status IS NOT NULL THEN
    IF existing_status = 'waiting' THEN
      SELECT position INTO next_pos
      FROM class_waitlists
      WHERE member_id = p_member_id AND class_session_id = p_session_id;
      RETURN next_pos;
    ELSE
      SELECT COALESCE(MAX(position), 0) + 1 INTO next_pos
      FROM class_waitlists
      WHERE class_session_id = p_session_id AND status = 'waiting';

      UPDATE class_waitlists
        SET status = 'waiting', position = next_pos
      WHERE member_id = p_member_id AND class_session_id = p_session_id;

      RETURN next_pos;
    END IF;
  ELSE
    SELECT COALESCE(MAX(position), 0) + 1 INTO next_pos
    FROM class_waitlists
    WHERE class_session_id = p_session_id AND status = 'waiting';

    INSERT INTO class_waitlists (member_id, class_session_id, position, status)
    VALUES (p_member_id, p_session_id, next_pos, 'waiting');

    RETURN next_pos;
  END IF;
END;
$$;

-- ─── Droits d'exécution ──────────────────────────────────────────────────────

-- Personne ne doit pouvoir appeler ces fonctions sans être connecté.
REVOKE EXECUTE ON FUNCTION
  increment_collective_balance(UUID), increment_individual_balance(UUID), increment_duo_balance(UUID),
  decrement_collective_balance(UUID), decrement_individual_balance(UUID), decrement_duo_balance(UUID),
  increment_session_balance(UUID), decrement_session_balance(UUID),
  increment_participants(UUID), decrement_participants(UUID),
  join_waitlist(UUID, UUID), book_collective_session(UUID, UUID, TEXT),
  award_manual_achievement(UUID, TEXT)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  increment_collective_balance(UUID), increment_individual_balance(UUID), increment_duo_balance(UUID),
  decrement_collective_balance(UUID), decrement_individual_balance(UUID), decrement_duo_balance(UUID),
  increment_session_balance(UUID), decrement_session_balance(UUID),
  increment_participants(UUID), decrement_participants(UUID),
  join_waitlist(UUID, UUID), book_collective_session(UUID, UUID, TEXT),
  award_manual_achievement(UUID, TEXT)
TO authenticated, service_role;

-- 5. Réservation de massage : uniquement par le serveur, qui calcule le prix.
REVOKE EXECUTE ON FUNCTION book_massage_session(UUID, UUID, NUMERIC, BOOLEAN, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION book_massage_session(UUID, UUID, NUMERIC, BOOLEAN, UUID, TEXT, TEXT)
  TO service_role;

-- Fonctions internes : appelées par les déclencheurs ou par d'autres fonctions.
REVOKE EXECUTE ON FUNCTION claim_member_refund(TEXT, TEXT[], UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION award_xp_on_booking() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION book_collective_session(UUID, UUID, TEXT) SET search_path = public;
ALTER FUNCTION book_massage_session(UUID, UUID, NUMERIC, BOOLEAN, UUID, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION award_manual_achievement(UUID, TEXT) SET search_path = public;
ALTER FUNCTION award_xp_on_booking() SET search_path = public;
ALTER FUNCTION get_waitlist_count(UUID) SET search_path = public;
ALTER FUNCTION is_admin() SET search_path = public;

-- ─── 6. Tampon des factures ──────────────────────────────────────────────────
-- Les règles du bucket « stamps » ne peuvent plus être modifiées en SQL :
-- Supabase réserve la table storage.objects à son rôle interne. À faire dans
-- le tableau de bord, Storage > Policies > stamps : remplacer la condition des
-- trois règles « Authenticated upload / update / delete stamps » par
--   bucket_id = 'stamps' AND public.is_admin()
