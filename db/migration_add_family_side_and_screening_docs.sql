-- ============================================
-- MIGRATION: Ajout côté familial et catégorisation des documents
-- Date: 30 octobre 2025
-- ============================================

-- 1. Ajouter la colonne family_side à family_medical_history
ALTER TABLE family_medical_history 
ADD COLUMN IF NOT EXISTS family_side VARCHAR(20) DEFAULT 'unknown' 
CHECK (family_side IN ('maternal', 'paternal', 'unknown'));

-- 2. Mettre à jour les relationships possibles
ALTER TABLE family_medical_history 
DROP CONSTRAINT IF EXISTS family_medical_history_relationship_check;

ALTER TABLE family_medical_history 
ADD CONSTRAINT family_medical_history_relationship_check 
CHECK (relationship IN (
    'mother', 'father', 'brother', 'sister', 'son', 'daughter',
    'maternal_grandmother', 'maternal_grandfather',
    'paternal_grandmother', 'paternal_grandfather',
    'maternal_aunt', 'maternal_uncle',
    'paternal_aunt', 'paternal_uncle'
));

-- 3. Ajouter les colonnes pour catégoriser les documents
ALTER TABLE uploaded_documents 
ADD COLUMN IF NOT EXISTS document_category VARCHAR(50) 
CHECK (document_category IN (
    'screening_report', 'medical_report', 'prescription', 'lab_results', 'imaging', 'other'
));

ALTER TABLE uploaded_documents 
ADD COLUMN IF NOT EXISTS screening_type VARCHAR(50) 
CHECK (screening_type IN (
    'mammography', 'colonoscopy', 'pap_smear', 'blood_test', 'dental', 'other'
));

ALTER TABLE uploaded_documents 
ADD COLUMN IF NOT EXISTS screening_date DATE;

-- 4. Mettre à jour les valeurs par défaut pour les documents existants
UPDATE uploaded_documents 
SET document_category = 'other' 
WHERE document_category IS NULL;

-- 5. Créer les nouveaux index
CREATE INDEX IF NOT EXISTS idx_family_history_side ON family_medical_history(family_side);
CREATE INDEX IF NOT EXISTS idx_documents_category ON uploaded_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_documents_screening_type ON uploaded_documents(screening_type);

-- 6. Mettre à jour les commentaires
COMMENT ON COLUMN family_medical_history.family_side IS 'Côté familial: maternel, paternel ou inconnu';
COMMENT ON COLUMN uploaded_documents.document_category IS 'Catégorie du document: compte-rendu de dépistage, rapport médical, etc.';
COMMENT ON COLUMN uploaded_documents.screening_type IS 'Type de dépistage si document_category = screening_report';
COMMENT ON COLUMN uploaded_documents.screening_date IS 'Date du dépistage si applicable';

-- 7. Mettre à jour les commentaires de table
COMMENT ON TABLE family_medical_history IS 'Antécédents médicaux familiaux (1er et 2e degré, avec distinction maternel/paternel)';
COMMENT ON TABLE uploaded_documents IS 'Métadonnées des documents uploadés (comptes-rendus de dépistage, documents médicaux)';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
