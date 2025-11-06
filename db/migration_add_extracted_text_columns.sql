-- Migration: ajouter colonnes pour stocker le chemin du texte extrait et un extrait court
-- Exécuter dans le SQL editor de Supabase ou via psql connecté à la base

BEGIN;

ALTER TABLE uploaded_documents
  ADD COLUMN IF NOT EXISTS extracted_text_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS extracted_text_snippet TEXT;

COMMENT ON COLUMN uploaded_documents.extracted_text_path IS 'Chemin vers le fichier texte chiffré compagnon (uploads/...) si présent';
COMMENT ON COLUMN uploaded_documents.extracted_text_snippet IS 'Extrait texte court (plain text) pour indexation/aperçu; ne doit pas contenir données sensibles complètes.';

COMMIT;

-- NOTE: Si vous préférez stocker l'extrait complet dans la base (encodé/chiffré), remplacez extracted_text_snippet par un champ TEXT chiffré
