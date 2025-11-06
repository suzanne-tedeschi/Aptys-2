-- ============================================
-- APTYS - Setup Supabase complet
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Active l'extension UUID (si pas déjà activée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES PRINCIPALES
-- ============================================

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Langue et consentement
    language VARCHAR(5) DEFAULT 'fr',
    consent_given_at TIMESTAMPTZ NOT NULL,
    consent_withdrawn_at TIMESTAMPTZ,
    
    -- Métadonnées RGPD
    last_access_at TIMESTAMPTZ,
    data_retention_until TIMESTAMPTZ,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT language_check CHECK (language IN ('fr', 'en'))
);

-- Table des données personnelles
CREATE TABLE user_personal_data (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Données de base
    age INTEGER CHECK (age >= 0 AND age <= 150),
    sex_at_birth VARCHAR(10) CHECK (sex_at_birth IN ('female', 'male', 'other', 'prefer_not_to_say')),
    weight_kg DECIMAL(5,2) CHECK (weight_kg >= 20 AND weight_kg <= 300),
    height_cm DECIMAL(5,2) CHECK (height_cm >= 50 AND height_cm <= 250),
    
    -- Facteurs de risque
    is_smoker BOOLEAN DEFAULT FALSE,
    smoking_pack_years DECIMAL(5,2),
    bmi DECIMAL(5,2) CHECK (bmi >= 10 AND bmi <= 100),
    
    -- Santé reproductive (femmes)
    pregnancies INTEGER CHECK (pregnancies >= 0),
    menopause_age INTEGER CHECK (menopause_age >= 30 AND menopause_age <= 65),
    hormonal_treatment BOOLEAN DEFAULT FALSE,
    breastfeeding_months INTEGER CHECK (breastfeeding_months >= 0),
    hormonal_contraception VARCHAR(50) CHECK (hormonal_contraception IN (
        'never', 'past', 'current_pill', 'current_iud', 'current_other'
    )),
    hormonal_contraception_years INTEGER CHECK (hormonal_contraception_years >= 0 AND hormonal_contraception_years <= 50),
    
    -- Métadonnées
    is_draft BOOLEAN DEFAULT TRUE,
    submitted_at TIMESTAMPTZ,
    
    CONSTRAINT one_record_per_user UNIQUE(user_id)
);

-- Table des antécédents personnels
CREATE TABLE personal_medical_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    condition_type VARCHAR(100) NOT NULL,
    condition_name VARCHAR(255),
    diagnosed_at DATE,
    notes TEXT,
    created_by VARCHAR(50) DEFAULT 'user'
);

-- Table des antécédents familiaux
CREATE TABLE family_medical_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Côté familial (maternel ou paternel)
    family_side VARCHAR(20) NOT NULL CHECK (family_side IN ('maternal', 'paternal', 'unknown')),
    
    relationship VARCHAR(50) NOT NULL CHECK (relationship IN (
        'mother', 'father', 'brother', 'sister', 'son', 'daughter',
        'maternal_grandmother', 'maternal_grandfather',
        'paternal_grandmother', 'paternal_grandfather',
        'maternal_aunt', 'maternal_uncle',
        'paternal_aunt', 'paternal_uncle'
    )),
    
    condition_type VARCHAR(100) NOT NULL,
    condition_name VARCHAR(255),
    age_at_diagnosis INTEGER CHECK (age_at_diagnosis >= 0 AND age_at_diagnosis <= 150),
    notes TEXT,
    created_by VARCHAR(50) DEFAULT 'user'
);

-- Table des documents uploadés (métadonnées uniquement)
CREATE TABLE uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100),
    
    -- Stockage (chemin Supabase Storage ou fichier chiffré)
    storage_path VARCHAR(500) NOT NULL,
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    -- Chemin vers l'extrait texte compagnon (fichier .txt chiffré) et extrait court
    extracted_text_path VARCHAR(500),
    extracted_text_snippet TEXT,
    
    -- Type de document (compte-rendu de dépistage, autre document médical)
    document_type VARCHAR(50),
    document_category VARCHAR(50) CHECK (document_category IN (
        'screening_report', 'medical_report', 'prescription', 'lab_results', 'imaging', 'other'
    )),
    screening_type VARCHAR(50) CHECK (screening_type IN (
        'mammography', 'colonoscopy', 'pap_smear', 'blood_test', 'dental', 'other'
    )),
    screening_date DATE,
    
    description TEXT,
    uploaded_by_ip VARCHAR(45),
    deleted_at TIMESTAMPTZ
);

-- Table des recommandations
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    recommendation_code VARCHAR(100) NOT NULL,
    recommendation_name VARCHAR(255) NOT NULL,
    
    interval_recommendation VARCHAR(100),
    age_start INTEGER,
    age_end INTEGER,
    evidence_level VARCHAR(100),
    source_reference VARCHAR(500),
    
    engine_version VARCHAR(20) DEFAULT '1.0',
    reasoning TEXT,
    
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    is_active BOOLEAN DEFAULT TRUE,
    archived_at TIMESTAMPTZ
);

-- Table des liens de partage
CREATE TABLE share_links (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    share_token VARCHAR(64) UNIQUE NOT NULL,
    
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    
    max_access_count INTEGER DEFAULT 1,
    access_count INTEGER DEFAULT 0,
    
    created_by_ip VARCHAR(45),
    last_accessed_at TIMESTAMPTZ,
    last_accessed_by_ip VARCHAR(45)
);

-- Table d'audit
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'partial'))
);

-- ============================================
-- TABLES DE RÉFÉRENCE
-- ============================================

-- Types de conditions médicales
CREATE TABLE condition_types (
    code VARCHAR(100) PRIMARY KEY,
    name_fr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icd10_code VARCHAR(10),
    description_fr TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guidelines de recommandations
CREATE TABLE recommendation_guidelines (
    code VARCHAR(100) PRIMARY KEY,
    name_fr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    min_age INTEGER,
    max_age INTEGER,
    sex_restriction VARCHAR(10) CHECK (sex_restriction IN ('female', 'male', NULL)),
    
    interval_recommendation VARCHAR(100),
    
    has_source_url VARCHAR(500),
    eu_source_url VARCHAR(500),
    evidence_level VARCHAR(100),
    last_updated DATE,
    
    description_fr TEXT,
    description_en TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_personal_data_user_id ON user_personal_data(user_id);

CREATE INDEX idx_personal_history_user_id ON personal_medical_history(user_id);
CREATE INDEX idx_personal_history_condition ON personal_medical_history(condition_type);

CREATE INDEX idx_family_history_user_id ON family_medical_history(user_id);
CREATE INDEX idx_family_history_condition ON family_medical_history(condition_type);
CREATE INDEX idx_family_history_side ON family_medical_history(family_side);

CREATE INDEX idx_documents_user_id ON uploaded_documents(user_id);
CREATE INDEX idx_documents_deleted_at ON uploaded_documents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_category ON uploaded_documents(document_category);
CREATE INDEX idx_documents_screening_type ON uploaded_documents(screening_type);

CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_code ON recommendations(recommendation_code);
CREATE INDEX idx_recommendations_active ON recommendations(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_share_links_token ON share_links(share_token);
CREATE INDEX idx_share_links_user_id ON share_links(user_id);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- TRIGGERS POUR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
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
-- FONCTIONS UTILES
-- ============================================

-- Fonction pour export RGPD
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
    
    INSERT INTO audit_logs (user_id, action_type, action_details)
    VALUES (p_user_id, 'data_exported', jsonb_build_object('exported_at', NOW()));
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour suppression RGPD
CREATE OR REPLACE FUNCTION gdpr_delete_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET deleted_at = NOW(),
        consent_withdrawn_at = NOW()
    WHERE id = p_user_id;
    
    INSERT INTO audit_logs (user_id, action_type, action_details)
    VALUES (p_user_id, 'data_deleted', jsonb_build_object('deleted_at', NOW()));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VUE POUR PROFIL COMPLET
-- ============================================

CREATE OR REPLACE VIEW user_complete_profile AS
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
-- DONNÉES DE RÉFÉRENCE (SEED DATA)
-- ============================================

-- Insertion des types de conditions
INSERT INTO condition_types (code, name_fr, name_en, category, icd10_code) VALUES
-- Cancers
('cancer_breast', 'Cancer du sein', 'Breast cancer', 'cancer', 'C50'),
('cancer_colon', 'Cancer colorectal', 'Colorectal cancer', 'cancer', 'C18'),
('cancer_prostate', 'Cancer de la prostate', 'Prostate cancer', 'cancer', 'C61'),
('cancer_lung', 'Cancer du poumon', 'Lung cancer', 'cancer', 'C34'),
('cancer_ovarian', 'Cancer des ovaires', 'Ovarian cancer', 'cancer', 'C56'),
('cancer_cervical', 'Cancer du col de l''utérus', 'Cervical cancer', 'cancer', 'C53'),
-- Cardiovasculaires
('hypertension', 'Hypertension artérielle', 'Hypertension', 'cardiovascular', 'I10'),
('coronary_disease', 'Maladie coronarienne', 'Coronary artery disease', 'cardiovascular', 'I25'),
('stroke', 'Accident vasculaire cérébral', 'Stroke', 'cardiovascular', 'I64'),
-- Métaboliques
('diabetes_type1', 'Diabète de type 1', 'Type 1 diabetes', 'metabolic', 'E10'),
('diabetes_type2', 'Diabète de type 2', 'Type 2 diabetes', 'metabolic', 'E11'),
('obesity', 'Obésité', 'Obesity', 'metabolic', 'E66'),
('hypercholesterolemia', 'Hypercholestérolémie', 'Hypercholesterolemia', 'metabolic', 'E78'),
-- Respiratoires
('asthma', 'Asthme', 'Asthma', 'respiratory', 'J45'),
('copd', 'BPCO', 'COPD', 'respiratory', 'J44'),
-- Autres
('osteoporosis', 'Ostéoporose', 'Osteoporosis', 'musculoskeletal', NULL),
('depression', 'Dépression', 'Depression', 'mental_health', NULL);

-- Insertion des guidelines de recommandations
INSERT INTO recommendation_guidelines (
    code, name_fr, name_en, category, 
    min_age, max_age, sex_restriction, 
    interval_recommendation, evidence_level,
    description_fr
) VALUES
(
    'mammography',
    'Mammographie de dépistage',
    'Screening mammography',
    'cancer_screening',
    50, 74, 'female',
    'Tous les 2 ans',
    'Recommandation forte (HAS)',
    'Dépistage organisé du cancer du sein par mammographie tous les 2 ans pour les femmes de 50 à 74 ans.'
),
(
    'colorectal_fit',
    'Test immunologique fécal (FIT)',
    'Fecal immunochemical test',
    'cancer_screening',
    50, 74, NULL,
    'Tous les 2 ans',
    'Recommandation forte (HAS)',
    'Dépistage organisé du cancer colorectal par test immunologique fécal tous les 2 ans.'
),
(
    'cervical_cytology',
    'Frottis cervico-utérin',
    'Cervical cytology',
    'cancer_screening',
    25, 65, 'female',
    'Tous les 3 ans (25-30 ans), tous les 5 ans avec test HPV (30-65 ans)',
    'Recommandation forte (HAS)',
    'Dépistage du cancer du col de l''utérus.'
),
(
    'blood_pressure_screening',
    'Mesure de la tension artérielle',
    'Blood pressure screening',
    'cardiovascular_screening',
    18, NULL, NULL,
    'À chaque consultation ou au moins tous les 3 ans',
    'Recommandation forte (HAS)',
    'Dépistage de l''hypertension artérielle chez tous les adultes.'
),
(
    'diabetes_screening',
    'Dépistage du diabète',
    'Diabetes screening',
    'metabolic_screening',
    45, NULL, NULL,
    'Tous les 3 ans (ou plus fréquent si facteurs de risque)',
    'Recommandation (HAS)',
    'Dépistage du diabète de type 2 par glycémie à jeun ou HbA1c.'
);

-- ============================================
-- COMMENTAIRES (Documentation)
-- ============================================

COMMENT ON TABLE users IS 'Utilisateurs - données minimales et consentement RGPD';
COMMENT ON TABLE user_personal_data IS 'Données personnelles de santé (âge, sexe, facteurs de risque)';
COMMENT ON TABLE personal_medical_history IS 'Antécédents médicaux personnels';
COMMENT ON TABLE family_medical_history IS 'Antécédents médicaux familiaux (1er et 2e degré, avec distinction maternel/paternel)';
COMMENT ON TABLE uploaded_documents IS 'Métadonnées des documents uploadés (comptes-rendus de dépistage, documents médicaux)';
COMMENT ON TABLE recommendations IS 'Recommandations de dépistage générées';
COMMENT ON TABLE share_links IS 'Liens de partage sécurisés';
COMMENT ON TABLE audit_logs IS 'Journal d''audit RGPD';
