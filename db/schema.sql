-- ============================================
-- APTYS - Schéma de base de données
-- Prévention santé personnalisée
-- Conforme RGPD - Données de santé sensibles
-- ============================================

-- Table des utilisateurs (données minimales)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Langue et consentement
    language VARCHAR(5) DEFAULT 'fr', -- 'fr', 'en'
    consent_given_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consent_withdrawn_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées RGPD
    last_access_at TIMESTAMP WITH TIME ZONE,
    data_retention_until TIMESTAMP WITH TIME ZONE, -- Pour auto-suppression après X années
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT language_check CHECK (language IN ('fr', 'en'))
);

-- Index pour performance
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Table des données personnelles (chiffrées au repos si besoin)
CREATE TABLE user_personal_data (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Données de base
    age INTEGER CHECK (age >= 0 AND age <= 150),
    sex_at_birth VARCHAR(10) CHECK (sex_at_birth IN ('female', 'male', 'other', 'prefer_not_to_say')),
    
    -- Facteurs de risque
    is_smoker BOOLEAN DEFAULT FALSE,
    smoking_pack_years DECIMAL(5,2), -- Pour fumeurs : paquets/jour × années
    bmi DECIMAL(5,2) CHECK (bmi >= 10 AND bmi <= 100), -- Indice de masse corporelle
    
    -- Métadonnées
    is_draft BOOLEAN DEFAULT TRUE, -- true = brouillon, false = soumis
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT one_record_per_user UNIQUE(user_id)
);

CREATE INDEX idx_personal_data_user_id ON user_personal_data(user_id);

-- Table des antécédents personnels
CREATE TABLE personal_medical_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Type de condition
    condition_type VARCHAR(100) NOT NULL, -- 'cancer_breast', 'diabetes', 'hypertension', etc.
    condition_name VARCHAR(255), -- Nom lisible (optionnel, pour affichage)
    
    -- Détails
    diagnosed_at DATE, -- Date du diagnostic (peut être approximative)
    notes TEXT, -- Notes additionnelles
    
    -- Audit
    created_by VARCHAR(50) DEFAULT 'user' -- 'user' ou 'import'
);

CREATE INDEX idx_personal_history_user_id ON personal_medical_history(user_id);
CREATE INDEX idx_personal_history_condition ON personal_medical_history(condition_type);

-- Table des antécédents familiaux (1er degré)
CREATE TABLE family_medical_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Relation familiale
    relationship VARCHAR(50) NOT NULL CHECK (relationship IN (
        'mother', 'father', 'brother', 'sister', 'son', 'daughter'
    )),
    
    -- Condition médicale
    condition_type VARCHAR(100) NOT NULL, -- 'cancer_breast', 'cancer_colon', 'diabetes', etc.
    condition_name VARCHAR(255), -- Nom lisible
    
    -- Détails
    age_at_diagnosis INTEGER CHECK (age_at_diagnosis >= 0 AND age_at_diagnosis <= 150),
    notes TEXT,
    
    -- Audit
    created_by VARCHAR(50) DEFAULT 'user'
);

CREATE INDEX idx_family_history_user_id ON family_medical_history(user_id);
CREATE INDEX idx_family_history_condition ON family_medical_history(condition_type);
CREATE INDEX idx_family_history_relationship ON family_medical_history(relationship);

-- Table des documents uploadés (métadonnées seulement)
CREATE TABLE uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Métadonnées du fichier
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100),
    
    -- Stockage (chemin vers fichier chiffré)
    encrypted_file_path VARCHAR(500) NOT NULL, -- Chemin relatif dans data/uploads/
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    
    -- Métadonnées additionnelles
    document_type VARCHAR(50), -- 'medical_report', 'lab_results', 'imaging', 'other'
    description TEXT,
    
    -- Audit et sécurité
    uploaded_by_ip VARCHAR(45), -- IPv4 ou IPv6
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_documents_user_id ON uploaded_documents(user_id);
CREATE INDEX idx_documents_deleted_at ON uploaded_documents(deleted_at) WHERE deleted_at IS NULL;

-- Table des recommandations générées
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Identification de la recommandation
    recommendation_code VARCHAR(100) NOT NULL, -- 'mammography', 'colorectal_fit', etc.
    recommendation_name VARCHAR(255) NOT NULL,
    
    -- Détails
    interval_recommendation VARCHAR(100), -- '2 years', 'annual', etc.
    age_start INTEGER,
    age_end INTEGER,
    evidence_level VARCHAR(100), -- Niveau de preuve
    source_reference VARCHAR(500), -- URL ou référence HAS/UE
    
    -- Contexte de génération
    engine_version VARCHAR(20) DEFAULT '1.0', -- Version du moteur de recommandations
    reasoning TEXT, -- Explication de pourquoi cette reco a été générée
    
    -- Métadonnées
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1 = urgent, 5 = facultatif
    is_active BOOLEAN DEFAULT TRUE,
    archived_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_code ON recommendations(recommendation_code);
CREATE INDEX idx_recommendations_active ON recommendations(is_active) WHERE is_active = TRUE;

-- Table des liens de partage sécurisés
CREATE TABLE share_links (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Token de partage (hashé pour sécurité)
    share_token VARCHAR(64) UNIQUE NOT NULL, -- Token hex (32 bytes = 64 chars)
    
    -- Validité
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    -- Contrôle d'accès
    max_access_count INTEGER DEFAULT 1, -- Nombre maximum d'accès autorisés
    access_count INTEGER DEFAULT 0,
    
    -- Métadonnées
    created_by_ip VARCHAR(45),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_by_ip VARCHAR(45)
);

CREATE INDEX idx_share_links_token ON share_links(share_token);
CREATE INDEX idx_share_links_user_id ON share_links(user_id);
CREATE INDEX idx_share_links_expires_at ON share_links(expires_at);

-- Table d'audit pour conformité RGPD
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Utilisateur concerné
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action effectuée
    action_type VARCHAR(50) NOT NULL, -- 'consent_given', 'consent_withdrawn', 'data_exported', 'data_deleted', etc.
    action_details JSONB,
    
    -- Contexte
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Résultat
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'partial'))
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue pour obtenir le profil complet d'un utilisateur
CREATE VIEW user_complete_profile AS
SELECT 
    u.id as user_id,
    u.created_at,
    u.language,
    u.consent_given_at,
    upd.age,
    upd.sex_at_birth,
    upd.is_smoker,
    upd.bmi,
    upd.is_draft,
    upd.submitted_at,
    COUNT(DISTINCT pmh.id) as personal_conditions_count,
    COUNT(DISTINCT fmh.id) as family_conditions_count,
    COUNT(DISTINCT ud.id) as documents_count,
    COUNT(DISTINCT r.id) as recommendations_count
FROM users u
LEFT JOIN user_personal_data upd ON u.id = upd.user_id
LEFT JOIN personal_medical_history pmh ON u.id = pmh.user_id
LEFT JOIN family_medical_history fmh ON u.id = fmh.user_id
LEFT JOIN uploaded_documents ud ON u.id = ud.user_id AND ud.deleted_at IS NULL
LEFT JOIN recommendations r ON u.id = r.user_id AND r.is_active = TRUE
WHERE u.deleted_at IS NULL
GROUP BY u.id, upd.age, upd.sex_at_birth, upd.is_smoker, upd.bmi, upd.is_draft, upd.submitted_at;

-- ============================================
-- TRIGGERS pour updated_at automatique
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_data_updated_at
    BEFORE UPDATE ON user_personal_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FONCTION pour suppression conforme RGPD
-- ============================================

CREATE OR REPLACE FUNCTION gdpr_delete_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Soft delete de l'utilisateur
    UPDATE users 
    SET deleted_at = CURRENT_TIMESTAMP,
        consent_withdrawn_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Log de l'action
    INSERT INTO audit_logs (user_id, action_type, action_details)
    VALUES (p_user_id, 'data_deleted', jsonb_build_object('deleted_at', CURRENT_TIMESTAMP));
    
    -- Les autres tables sont supprimées via CASCADE
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION pour export de données (RGPD)
-- ============================================

CREATE OR REPLACE FUNCTION gdpr_export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user', (SELECT row_to_json(u.*) FROM users u WHERE id = p_user_id),
        'personal_data', (SELECT row_to_json(upd.*) FROM user_personal_data upd WHERE user_id = p_user_id),
        'personal_history', (SELECT jsonb_agg(row_to_json(pmh.*)) FROM personal_medical_history pmh WHERE user_id = p_user_id),
        'family_history', (SELECT jsonb_agg(row_to_json(fmh.*)) FROM family_medical_history fmh WHERE user_id = p_user_id),
        'documents', (SELECT jsonb_agg(row_to_json(ud.*)) FROM uploaded_documents ud WHERE user_id = p_user_id AND deleted_at IS NULL),
        'recommendations', (SELECT jsonb_agg(row_to_json(r.*)) FROM recommendations r WHERE user_id = p_user_id AND is_active = TRUE)
    ) INTO v_result;
    
    -- Log de l'export
    INSERT INTO audit_logs (user_id, action_type, action_details)
    VALUES (p_user_id, 'data_exported', jsonb_build_object('exported_at', CURRENT_TIMESTAMP));
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTAIRES sur les tables (documentation)
-- ============================================

COMMENT ON TABLE users IS 'Utilisateurs du système - données minimales et consentement RGPD';
COMMENT ON TABLE user_personal_data IS 'Données personnelles de santé (âge, sexe, facteurs de risque)';
COMMENT ON TABLE personal_medical_history IS 'Antécédents médicaux personnels de l''utilisateur';
COMMENT ON TABLE family_medical_history IS 'Antécédents médicaux familiaux (1er degré uniquement)';
COMMENT ON TABLE uploaded_documents IS 'Métadonnées des documents uploadés (fichiers stockés chiffrés sur disque)';
COMMENT ON TABLE recommendations IS 'Recommandations de dépistage générées par le moteur';
COMMENT ON TABLE share_links IS 'Liens de partage sécurisés avec expiration et limite d''accès';
COMMENT ON TABLE audit_logs IS 'Journal d''audit pour conformité RGPD et traçabilité';

COMMENT ON COLUMN users.consent_given_at IS 'Date du consentement explicite RGPD';
COMMENT ON COLUMN users.data_retention_until IS 'Date d''auto-suppression des données (ex: 3 ans après dernier accès)';
COMMENT ON COLUMN user_personal_data.is_draft IS 'TRUE = brouillon non soumis, FALSE = données finalisées';
COMMENT ON COLUMN uploaded_documents.encrypted_file_path IS 'Chemin relatif vers le fichier chiffré (AES-256-GCM)';
COMMENT ON COLUMN recommendations.reasoning IS 'Explication textuelle de pourquoi cette recommandation a été générée (transparence)';
