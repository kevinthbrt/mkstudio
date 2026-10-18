-- Migration 031 : l'admin crée ou modifie la commande d'un adhérent.
--
-- - merch_orders.paid_amount : montant encaissé au moment où la commande a été
--   marquée réglée. Si l'admin modifie ensuite la commande, l'écart avec le
--   nouveau total indique ce qui reste à encaisser ou à rembourser.
-- - admin_save_merch_order : crée (p_order_id NULL) ou remplace le contenu
--   d'une commande. Autorisé tant que la commande fournisseur n'est pas passée,
--   y compris après la date butoir et boutique désactivée. Prix relus en base,
--   au tarif actuel. Appelée uniquement par le serveur, après vérification que
--   l'appelant est admin.

ALTER TABLE merch_orders ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2);
UPDATE merch_orders SET paid_amount = total WHERE paid_at IS NOT NULL AND paid_amount IS NULL;

CREATE OR REPLACE FUNCTION admin_save_merch_order(
  p_order_id UUID,
  p_sale_id UUID,
  p_member_id UUID,
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
  v_order merch_orders%ROWTYPE;
  v_line JSONB;
  v_item merch_items%ROWTYPE;
  v_variant TEXT;
  v_quantity INTEGER;
  v_total NUMERIC(10,2) := 0;
  v_previous NUMERIC(10,2);
  v_order_id UUID;
BEGIN
  SELECT * INTO v_sale FROM merch_sales WHERE id = p_sale_id FOR SHARE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'sale_not_found');
  END IF;

  -- Le récap est parti chez le fournisseur : on ne touche plus aux commandes.
  IF v_sale.status NOT IN ('draft', 'open') THEN
    RETURN jsonb_build_object('success', false, 'error', 'sale_locked');
  END IF;

  IF p_payment_method NOT IN ('cheque', 'virement', 'especes') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_payment_method');
  END IF;

  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array'
     OR jsonb_array_length(p_lines) = 0 OR jsonb_array_length(p_lines) > 30 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_lines');
  END IF;

  IF p_order_id IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_member_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'member_not_found');
    END IF;
    INSERT INTO merch_orders (sale_id, member_id, payment_method, total, note)
    VALUES (p_sale_id, p_member_id, p_payment_method, 0, NULLIF(btrim(p_note), ''))
    RETURNING id INTO v_order_id;
  ELSE
    SELECT * INTO v_order FROM merch_orders WHERE id = p_order_id AND sale_id = p_sale_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'order_not_found');
    END IF;
    IF v_order.status <> 'confirmed' THEN
      RETURN jsonb_build_object('success', false, 'error', 'already_cancelled');
    END IF;
    v_order_id := v_order.id;
    v_previous := v_order.total;

    DELETE FROM merch_order_lines WHERE order_id = v_order_id;
    UPDATE merch_orders
    SET payment_method = p_payment_method, note = NULLIF(btrim(p_note), '')
    WHERE id = v_order_id;
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    -- Contrairement aux adhérents, l'admin peut utiliser un article masqué.
    SELECT * INTO v_item
    FROM merch_items
    WHERE id = (v_line->>'item_id')::UUID AND sale_id = p_sale_id;

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

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'created', p_order_id IS NULL,
    'total', v_total,
    'previous_total', v_previous
  );
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_lines');
  WHEN raise_exception THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION admin_save_merch_order(UUID, UUID, UUID, TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_save_merch_order(UUID, UUID, UUID, TEXT, JSONB, TEXT) TO service_role;
