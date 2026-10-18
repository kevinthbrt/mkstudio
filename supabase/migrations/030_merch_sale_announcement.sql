-- Migration 030 : date d'envoi de l'email d'ouverture d'une vente.
-- Renseignée au moment de l'envoi, elle garantit qu'une vente n'est annoncée
-- qu'une seule fois, même si l'admin la rouvre ou clique deux fois.
ALTER TABLE merch_sales ADD COLUMN IF NOT EXISTS announced_at TIMESTAMPTZ;
