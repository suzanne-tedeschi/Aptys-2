-- ============================================
-- MIGRATION: Ajout des champs de santé reproductive
-- Date: 30 octobre 2025
-- ============================================

-- 1. Ajouter les champs de poids et taille
ALTER TABLE user_personal_data 
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2) CHECK (weight_kg >= 20 AND weight_kg <= 300);

ALTER TABLE user_personal_data 
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2) CHECK (height_cm >= 50 AND height_cm <= 250);

-- 2. Ajouter les champs de santé reproductive (femmes)
ALTER TABLE user_personal_data 
ADD COLUMN IF NOT EXISTS pregnancies INTEGER CHECK (pregnancies >= 0);

ALTER TABLE user_personal_data 
ADD COLUMN IF NOT EXISTS menopause_age INTEGER CHECK (menopause_age >= 30 AND menopause_age <= 65);

ALTER TABLE user_personal_data 
ADD COLUMN IF NOT EXISTS hormonal_treatment BOOLEAN DEFAULT FALSE;

ALTER TABLE user_personal_data 
ADD COLUMN IF NOT EXISTS breastfeeding_months INTEGER CHECK (breastfeeding_months >= 0);

ALTER TABLE user_personal_data 
ADD COLUMN IF NOT EXISTS hormonal_contraception VARCHAR(50) 
CHECK (hormonal_contraception IN (
    'never', 'past', 'current_pill', 'current_iud', 'current_other'
));

ALTER TABLE user_personal_data 
ADD COLUMN IF NOT EXISTS hormonal_contraception_years INTEGER 
CHECK (hormonal_contraception_years >= 0 AND hormonal_contraception_years <= 50);

-- 3. Mettre à jour les commentaires
COMMENT ON COLUMN user_personal_data.weight_kg IS 'Poids en kilogrammes';
COMMENT ON COLUMN user_personal_data.height_cm IS 'Taille en centimètres';
COMMENT ON COLUMN user_personal_data.pregnancies IS 'Nombre total de grossesses (incluant fausses couches et IVG)';
COMMENT ON COLUMN user_personal_data.menopause_age IS 'Âge à la ménopause';
COMMENT ON COLUMN user_personal_data.hormonal_treatment IS 'Traitement hormonal substitutif (THS) actuel ou passé';
COMMENT ON COLUMN user_personal_data.breastfeeding_months IS 'Durée totale d\'allaitement en mois (cumulé pour tous les enfants)';
COMMENT ON COLUMN user_personal_data.hormonal_contraception IS 'Utilisation de contraception hormonale';
COMMENT ON COLUMN user_personal_data.hormonal_contraception_years IS 'Durée totale d\'utilisation de contraception hormonale en années';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
