-- Migration pour ajouter les colonnes manquantes à la table recommendations
-- À exécuter dans l'éditeur SQL de Supabase

ALTER TABLE recommendations 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS note TEXT;

-- Vérification (optionnel)
COMMENT ON COLUMN recommendations.category IS 'Catégorie de la recommandation (lifestyle, medical, screening, etc.)';
COMMENT ON COLUMN recommendations.note IS 'Note pratique ou conseil supplémentaire pour l''utilisateur';
