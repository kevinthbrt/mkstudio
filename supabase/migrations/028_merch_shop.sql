-- Migration 028 : boutique éphémère de merchandising
--
-- Fonctionnement :
--   1. L'admin crée une vente (merch_sales) avec une date butoir et ses articles.
--   2. Tant que la vente est ouverte et la date butoir non atteinte, les
--      adhérents commandent et s'engagent à payer par chèque, virement ou
--      espèces. Aucun paiement en ligne.
--   3. À la date butoir, l'admin dispose du récapitulatif par article et par
--      taille, passe la commande fournisseur, puis remet les articles.
--
-- Les commandes passent uniquement par les fonctions place_merch_order et
-- cancel_merch_order, appelées côté serveur avec la clé service_role : les
-- adhérents n'ont aucun droit d'écriture direct sur les commandes.
--
-- merch_settings.shop_enabled est l'interrupteur global de l'admin : boutique
-- désactivée = invisible pour les adhérents et commandes refusées.
--
-- Les photos des articles sont envoyées par le serveur (clé service_role) dans
-- le bucket public « merch » : aucune règle de stockage n'est nécessaire, et
-- Supabase n'autorise plus à en créer en SQL de toute façon.
--
-- Écrite sans DROP : l'outil de migration Supabase bloque dessus.

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS merch_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  closes_at TIMESTAMPTZ NOT NULL,
  payment_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'supplier_ordered', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES merch_sales(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  -- Tailles ou variantes proposées (ex. {XS,S,M,L,XL}). Vide = article sans variante.
  variants TEXT[] NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES merch_sales(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cheque', 'virement', 'especes')),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  note TEXT,
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merch_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES merch_orders(id) ON DELETE CASCADE,
  -- SET NULL : supprimer un article ne doit pas effacer l'historique des commandes,
  -- d'où le nom et le prix recopiés sur la ligne.
  item_id UUID REFERENCES merch_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  variant TEXT,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 50),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0)
);

-- Interrupteur global de la boutique (une seule ligne).
CREATE TABLE IF NOT EXISTS merch_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  shop_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO merch_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS merch_items_sale_id_idx ON merch_items(sale_id);
CREATE INDEX IF NOT EXISTS merch_orders_sale_id_idx ON merch_orders(sale_id);
CREATE INDEX IF NOT EXISTS merch_orders_member_id_idx ON merch_orders(member_id);
CREATE INDEX IF NOT EXISTS merch_order_lines_order_id_idx ON merch_order_lines(order_id);

CREATE OR REPLACE TRIGGER update_merch_sales_updated_at BEFORE UPDATE ON merch_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_merch_items_updated_at BEFORE UPDATE ON merch_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Sécurité (RLS) ──────────────────────────────────────────────────────────

ALTER TABLE merch_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Ventes : les brouillons ne sont visibles que par l'admin.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_sales' AND policyname = 'Members view published merch sales') THEN
    CREATE POLICY "Members view published merch sales" ON merch_sales
      FOR SELECT TO authenticated
      USING (status <> 'draft' OR is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_sales' AND policyname = 'Admins manage merch sales') THEN
    CREATE POLICY "Admins manage merch sales" ON merch_sales
      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;

  -- Articles : visibles dès que leur vente est publiée.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_items' AND policyname = 'Members view published merch items') THEN
    CREATE POLICY "Members view published merch items" ON merch_items
      FOR SELECT TO authenticated
      USING (
        is_admin()
        OR EXISTS (SELECT 1 FROM merch_sales s WHERE s.id = sale_id AND s.status <> 'draft')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_items' AND policyname = 'Admins manage merch items') THEN
    CREATE POLICY "Admins manage merch items" ON merch_items
      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;

  -- Commandes : chacun voit les siennes, l'admin voit et gère tout.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_orders' AND policyname = 'Members view own merch orders') THEN
    CREATE POLICY "Members view own merch orders" ON merch_orders
      FOR SELECT TO authenticated
      USING (
        is_admin()
        OR member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_orders' AND policyname = 'Admins manage merch orders') THEN
    CREATE POLICY "Admins manage merch orders" ON merch_orders
      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_order_lines' AND policyname = 'Members view own merch order lines') THEN
    CREATE POLICY "Members view own merch order lines" ON merch_order_lines
      FOR SELECT TO authenticated
      USING (
        is_admin()
        OR order_id IN (
          SELECT o.id FROM merch_orders o
          WHERE o.member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_order_lines' AND policyname = 'Admins manage merch order lines') THEN
    CREATE POLICY "Admins manage merch order lines" ON merch_order_lines
      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;

  -- Interrupteur : lisible par tous les connectés, modifiable par l'admin.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_settings' AND policyname = 'Authenticated read merch settings') THEN
    CREATE POLICY "Authenticated read merch settings" ON merch_settings
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merch_settings' AND policyname = 'Admins manage merch settings') THEN
    CREATE POLICY "Admins manage merch settings" ON merch_settings
      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- ─── Passer une commande ─────────────────────────────────────────────────────
-- p_lines : [{ "item_id": "...", "variant": "M" | null, "quantity": 2 }, ...]
-- Le prix est toujours relu en base : le client n'envoie jamais de montant.

CREATE OR REPLACE FUNCTION place_merch_order(
  p_member_id UUID,
  p_sale_id UUID,
  p_payment_method TEXT,
  p_lines JSONB,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale merch_sales%ROWTYPE;
  v_line JSONB;
  v_item merch_items%ROWTYPE;
  v_variant TEXT;
  v_quantity INTEGER;
  v_total NUMERIC(10,2) := 0;
  v_order_id UUID;
BEGIN
  SELECT * INTO v_sale FROM merch_sales WHERE id = p_sale_id FOR SHARE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'sale_not_found');
  END IF;

  IF v_sale.status <> 'open' OR v_sale.closes_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'sale_closed');
  END IF;

  IF NOT COALESCE((SELECT shop_enabled FROM merch_settings), false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'shop_disabled');
  END IF;

  IF p_payment_method NOT IN ('cheque', 'virement', 'especes') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_payment_method');
  END IF;

  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array'
     OR jsonb_array_length(p_lines) = 0 OR jsonb_array_length(p_lines) > 30 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_lines');
  END IF;

  INSERT INTO merch_orders (sale_id, member_id, payment_method, total, note)
  VALUES (p_sale_id, p_member_id, p_payment_method, 0, NULLIF(btrim(p_note), ''))
  RETURNING id INTO v_order_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    SELECT * INTO v_item
    FROM merch_items
    WHERE id = (v_line->>'item_id')::UUID
      AND sale_id = p_sale_id
      AND active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'item_unavailable';
    END IF;

    v_quantity := (v_line->>'quantity')::INTEGER;
    IF v_quantity IS NULL OR v_quantity < 1 OR v_quantity > 50 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;

    v_variant := NULLIF(btrim(v_line->>'variant'), '');
    IF cardinality(v_item.variants) > 0 THEN
      IF v_variant IS NULL OR NOT (v_variant = ANY(v_item.variants)) THEN
        RAISE EXCEPTION 'invalid_variant';
      END IF;
    ELSE
      v_variant := NULL;
    END IF;

    INSERT INTO merch_order_lines (order_id, item_id, item_name, variant, quantity, unit_price)
    VALUES (v_order_id, v_item.id, v_item.name, v_variant, v_quantity, v_item.price);

    v_total := v_total + v_item.price * v_quantity;
  END LOOP;

  UPDATE merch_orders SET total = v_total WHERE id = v_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'total', v_total);
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_lines');
  WHEN raise_exception THEN
    -- Annule la commande partiellement insérée et renvoie le motif.
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ─── Annuler sa commande ─────────────────────────────────────────────────────
-- Possible pour l'adhérent tant que la vente est ouverte, la date butoir non
-- atteinte et la commande non encore réglée. Au-delà, seul l'admin intervient.

CREATE OR REPLACE FUNCTION cancel_merch_order(
  p_member_id UUID,
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order merch_orders%ROWTYPE;
  v_sale merch_sales%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM merch_orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND OR v_order.member_id <> p_member_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'order_not_found');
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_cancelled');
  END IF;

  IF v_order.paid_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_paid');
  END IF;

  SELECT * INTO v_sale FROM merch_sales WHERE id = v_order.sale_id;
  IF v_sale.status <> 'open' OR v_sale.closes_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'sale_closed');
  END IF;

  UPDATE merch_orders
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Ces fonctions prennent p_member_id en paramètre : elles ne doivent être
-- appelables que par le serveur (service_role), jamais directement par un
-- navigateur, sinon n'importe qui pourrait commander au nom d'un autre.
REVOKE ALL ON FUNCTION place_merch_order(UUID, UUID, TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION cancel_merch_order(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION place_merch_order(UUID, UUID, TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_merch_order(UUID, UUID) TO service_role;

-- ─── Images des articles ─────────────────────────────────────────────────────
-- Bucket public : les photos sont lisibles par leur URL. L'envoi se fait par
-- la route serveur /api/admin/boutique/upload, avec la clé service_role.

INSERT INTO storage.buckets (id, name, public)
VALUES ('merch', 'merch', true)
ON CONFLICT (id) DO UPDATE SET public = true;
