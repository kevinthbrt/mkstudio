-- Migration 032 : plusieurs photos par article de la boutique.
-- images contient toutes les photos dans l'ordre d'affichage ; image_url reste
-- la photo principale (la première), utilisée notamment par l'email d'annonce.
ALTER TABLE merch_items ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';
