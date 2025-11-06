-- ============================================
-- APTYS - Requêtes SQL utiles
-- Exemples de requêtes courantes
-- ============================================

-- ============================================
-- 1. CRÉATION ET GESTION D'UTILISATEUR
-- ============================================

-- Créer un nouvel utilisateur avec consentement
INSERT INTO users (language, consent_given_at)
VALUES ('fr', CURRENT_TIMESTAMP)
RETURNING id, created_at;

-- Récupérer les informations complètes d'un utilisateur
SELECT * FROM user_complete_profile
WHERE user_id = 'UUID_HERE';

-- Marquer le consentement comme retiré
UPDATE users
SET consent_withdrawn_at = CURRENT_TIMESTAMP,
    deleted_at = CURRENT_TIMESTAMP
WHERE id = 'UUID_HERE';

-- ============================================
-- 2. ENREGISTREMENT DES DONNÉES PERSONNELLES
-- ============================================

-- Créer/mettre à jour le profil de santé (brouillon)
INSERT INTO user_personal_data (user_id, age, sex_at_birth, is_smoker, bmi, is_draft)
VALUES ('UUID_HERE', 45, 'female', FALSE, 24.5, TRUE)
ON CONFLICT (user_id) 
DO UPDATE SET
    age = EXCLUDED.age,
    sex_at_birth = EXCLUDED.sex_at_birth,
    is_smoker = EXCLUDED.is_smoker,
    bmi = EXCLUDED.bmi,
    updated_at = CURRENT_TIMESTAMP;

-- Finaliser le profil (soumettre)
UPDATE user_personal_data
SET is_draft = FALSE,
    submitted_at = CURRENT_TIMESTAMP
WHERE user_id = 'UUID_HERE';

-- ============================================
-- 3. ANTÉCÉDENTS MÉDICAUX
-- ============================================

-- Ajouter un antécédent personnel
INSERT INTO personal_medical_history (user_id, condition_type, condition_name, diagnosed_at)
VALUES ('UUID_HERE', 'hypertension', 'Hypertension artérielle', '2020-03-15');

-- Ajouter des antécédents familiaux (batch)
INSERT INTO family_medical_history (user_id, relationship, condition_type, condition_name, age_at_diagnosis)
VALUES 
    ('UUID_HERE', 'mother', 'cancer_breast', 'Cancer du sein', 52),
    ('UUID_HERE', 'father', 'diabetes_type2', 'Diabète de type 2', 58),
    ('UUID_HERE', 'sister', 'hypertension', 'Hypertension artérielle', 45);

-- Récupérer tous les antécédents d'un utilisateur
SELECT 
    'personnel' as type,
    condition_type,
    condition_name,
    diagnosed_at::TEXT as detail,
    NULL as relationship
FROM personal_medical_history
WHERE user_id = 'UUID_HERE'
UNION ALL
SELECT 
    'familial' as type,
    condition_type,
    condition_name,
    age_at_diagnosis::TEXT as detail,
    relationship
FROM family_medical_history
WHERE user_id = 'UUID_HERE'
ORDER BY type, condition_type;

-- ============================================
-- 4. UPLOAD DE DOCUMENTS
-- ============================================

-- Enregistrer un document uploadé
INSERT INTO uploaded_documents (
    user_id, 
    original_filename, 
    file_size_bytes, 
    mime_type,
    encrypted_file_path,
    document_type
)
VALUES (
    'UUID_HERE',
    'bilan_sanguin_2025.pdf',
    245678,
    'application/pdf',
    'uploads/UUID_HERE/1730304000000-bilan_sanguin_2025.pdf',
    'lab_results'
)
RETURNING id, created_at;

-- Lister tous les documents d'un utilisateur (non supprimés)
SELECT 
    id,
    original_filename,
    file_size_bytes,
    document_type,
    created_at
FROM uploaded_documents
WHERE user_id = 'UUID_HERE'
    AND deleted_at IS NULL
ORDER BY created_at DESC;

-- Soft delete d'un document
UPDATE uploaded_documents
SET deleted_at = CURRENT_TIMESTAMP
WHERE id = 'DOCUMENT_UUID_HERE';

-- ============================================
-- 5. GÉNÉRATION ET GESTION DES RECOMMANDATIONS
-- ============================================

-- Créer des recommandations pour un utilisateur
INSERT INTO recommendations (
    user_id, 
    recommendation_code, 
    recommendation_name,
    interval_recommendation,
    age_start,
    age_end,
    evidence_level,
    source_reference,
    reasoning,
    priority
)
VALUES 
(
    'UUID_HERE',
    'mammography',
    'Mammographie de dépistage',
    'Tous les 2 ans',
    50, 74,
    'Recommandation forte (HAS)',
    'https://www.has-sante.fr/...',
    'Générée car : femme, âge 45 ans (proche de 50), pas d''antécédent familial de cancer du sein',
    2
),
(
    'UUID_HERE',
    'colorectal_fit',
    'Test immunologique fécal (FIT)',
    'Tous les 2 ans',
    50, 74,
    'Recommandation forte (HAS)',
    'https://www.has-sante.fr/...',
    'Générée car : âge 45 ans (proche de 50), aucun antécédent familial',
    2
);

-- Récupérer toutes les recommandations actives d'un utilisateur
SELECT 
    recommendation_code,
    recommendation_name,
    interval_recommendation,
    evidence_level,
    source_reference,
    priority,
    reasoning
FROM recommendations
WHERE user_id = 'UUID_HERE'
    AND is_active = TRUE
ORDER BY priority ASC, recommendation_name;

-- Archiver une recommandation (si non pertinente)
UPDATE recommendations
SET is_active = FALSE,
    archived_at = CURRENT_TIMESTAMP
WHERE id = 123;

-- ============================================
-- 6. PARTAGE SÉCURISÉ
-- ============================================

-- Créer un lien de partage (expire dans 24h)
INSERT INTO share_links (
    user_id,
    share_token,
    expires_at,
    max_access_count
)
VALUES (
    'UUID_HERE',
    'GENERATED_TOKEN_HEX_64_CHARS',
    CURRENT_TIMESTAMP + INTERVAL '24 hours',
    5
)
RETURNING share_token, expires_at;

-- Vérifier la validité d'un token
SELECT 
    user_id,
    expires_at,
    access_count,
    max_access_count,
    revoked_at,
    CASE 
        WHEN revoked_at IS NOT NULL THEN 'revoked'
        WHEN expires_at < CURRENT_TIMESTAMP THEN 'expired'
        WHEN access_count >= max_access_count THEN 'max_access_reached'
        ELSE 'valid'
    END as status
FROM share_links
WHERE share_token = 'TOKEN_HERE';

-- Enregistrer un accès au lien
UPDATE share_links
SET access_count = access_count + 1,
    last_accessed_at = CURRENT_TIMESTAMP,
    last_accessed_by_ip = 'IP_ADDRESS'
WHERE share_token = 'TOKEN_HERE'
    AND expires_at > CURRENT_TIMESTAMP
    AND access_count < max_access_count
    AND revoked_at IS NULL;

-- Révoquer un lien de partage
UPDATE share_links
SET revoked_at = CURRENT_TIMESTAMP
WHERE share_token = 'TOKEN_HERE';

-- ============================================
-- 7. AUDIT ET CONFORMITÉ RGPD
-- ============================================

-- Logger une action (consentement donné)
INSERT INTO audit_logs (user_id, action_type, action_details, ip_address)
VALUES (
    'UUID_HERE',
    'consent_given',
    jsonb_build_object('timestamp', CURRENT_TIMESTAMP, 'language', 'fr'),
    '192.168.1.1'
);

-- Logger un export de données
INSERT INTO audit_logs (user_id, action_type, action_details, ip_address)
VALUES (
    'UUID_HERE',
    'data_exported',
    jsonb_build_object('format', 'json', 'timestamp', CURRENT_TIMESTAMP),
    '192.168.1.1'
);

-- Récupérer l'historique d'audit d'un utilisateur
SELECT 
    created_at,
    action_type,
    action_details,
    ip_address,
    status
FROM audit_logs
WHERE user_id = 'UUID_HERE'
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- 8. EXPORT COMPLET DES DONNÉES (RGPD)
-- ============================================

-- Utiliser la fonction d'export
SELECT gdpr_export_user_data('UUID_HERE');

-- ============================================
-- 9. SUPPRESSION CONFORME RGPD
-- ============================================

-- Suppression soft (recommandé)
SELECT gdpr_delete_user_data('UUID_HERE');

-- Suppression hard (définitive - utiliser avec précaution)
DELETE FROM users WHERE id = 'UUID_HERE';
-- Grâce à ON DELETE CASCADE, toutes les données liées sont supprimées

-- ============================================
-- 10. STATISTIQUES ET ANALYSE
-- ============================================

-- Nombre d'utilisateurs actifs
SELECT COUNT(*) as total_users
FROM users
WHERE deleted_at IS NULL;

-- Nombre d'utilisateurs par langue
SELECT language, COUNT(*) as count
FROM users
WHERE deleted_at IS NULL
GROUP BY language;

-- Nombre de recommandations générées par type
SELECT 
    recommendation_code,
    COUNT(*) as count,
    AVG(priority) as avg_priority
FROM recommendations
WHERE is_active = TRUE
GROUP BY recommendation_code
ORDER BY count DESC;

-- Antécédents familiaux les plus fréquents
SELECT 
    condition_type,
    COUNT(*) as frequency,
    COUNT(DISTINCT user_id) as unique_users
FROM family_medical_history
GROUP BY condition_type
ORDER BY frequency DESC
LIMIT 10;

-- Taux de complétion des profils
SELECT 
    COUNT(*) FILTER (WHERE is_draft = FALSE) * 100.0 / COUNT(*) as completion_rate
FROM user_personal_data;

-- ============================================
-- 11. NETTOYAGE ET MAINTENANCE
-- ============================================

-- Supprimer les liens de partage expirés (> 30 jours)
DELETE FROM share_links
WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Archiver les anciennes entrées d'audit (> 2 ans)
-- Note: à adapter selon politique de rétention
CREATE TABLE IF NOT EXISTS audit_logs_archive (LIKE audit_logs INCLUDING ALL);

INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years';

DELETE FROM audit_logs
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years';

-- Identifier les utilisateurs inactifs (> 1 an sans accès)
SELECT 
    id,
    created_at,
    last_access_at,
    CURRENT_TIMESTAMP - COALESCE(last_access_at, created_at) as inactivity_period
FROM users
WHERE deleted_at IS NULL
    AND COALESCE(last_access_at, created_at) < CURRENT_TIMESTAMP - INTERVAL '1 year'
ORDER BY last_access_at NULLS FIRST;
