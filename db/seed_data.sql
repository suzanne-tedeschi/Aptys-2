-- ============================================
-- APTYS - Données de référence (seed data)
-- Types de conditions médicales standardisées
-- ============================================

-- Table de référence pour les types de conditions (optionnel mais recommandé)
CREATE TABLE IF NOT EXISTS condition_types (
    code VARCHAR(100) PRIMARY KEY,
    name_fr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'cancer', 'cardiovascular', 'metabolic', etc.
    icd10_code VARCHAR(10), -- Code ICD-10 si applicable
    snomed_code VARCHAR(20), -- Code SNOMED CT si applicable
    description_fr TEXT,
    description_en TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cancers
INSERT INTO condition_types (code, name_fr, name_en, category, icd10_code) VALUES
('cancer_breast', 'Cancer du sein', 'Breast cancer', 'cancer', 'C50'),
('cancer_colon', 'Cancer colorectal', 'Colorectal cancer', 'cancer', 'C18'),
('cancer_prostate', 'Cancer de la prostate', 'Prostate cancer', 'cancer', 'C61'),
('cancer_lung', 'Cancer du poumon', 'Lung cancer', 'cancer', 'C34'),
('cancer_ovarian', 'Cancer des ovaires', 'Ovarian cancer', 'cancer', 'C56'),
('cancer_cervical', 'Cancer du col de l''utérus', 'Cervical cancer', 'cancer', 'C53'),
('cancer_skin_melanoma', 'Mélanome', 'Melanoma', 'cancer', 'C43'),
('cancer_thyroid', 'Cancer de la thyroïde', 'Thyroid cancer', 'cancer', 'C73');

-- Maladies cardiovasculaires
INSERT INTO condition_types (code, name_fr, name_en, category, icd10_code) VALUES
('hypertension', 'Hypertension artérielle', 'Hypertension', 'cardiovascular', 'I10'),
('coronary_disease', 'Maladie coronarienne', 'Coronary artery disease', 'cardiovascular', 'I25'),
('heart_failure', 'Insuffisance cardiaque', 'Heart failure', 'cardiovascular', 'I50'),
('atrial_fibrillation', 'Fibrillation auriculaire', 'Atrial fibrillation', 'cardiovascular', 'I48'),
('stroke', 'Accident vasculaire cérébral', 'Stroke', 'cardiovascular', 'I64');

-- Maladies métaboliques
INSERT INTO condition_types (code, name_fr, name_en, category, icd10_code) VALUES
('diabetes_type1', 'Diabète de type 1', 'Type 1 diabetes', 'metabolic', 'E10'),
('diabetes_type2', 'Diabète de type 2', 'Type 2 diabetes', 'metabolic', 'E11'),
('obesity', 'Obésité', 'Obesity', 'metabolic', 'E66'),
('hypercholesterolemia', 'Hypercholestérolémie', 'Hypercholesterolemia', 'metabolic', 'E78'),
('thyroid_disorder', 'Trouble thyroïdien', 'Thyroid disorder', 'metabolic', 'E07');

-- Maladies respiratoires
INSERT INTO condition_types (code, name_fr, name_en, category, icd10_code) VALUES
('asthma', 'Asthme', 'Asthma', 'respiratory', 'J45'),
('copd', 'BPCO', 'COPD', 'respiratory', 'J44');

-- Autres
INSERT INTO condition_types (code, name_fr, name_en, category) VALUES
('osteoporosis', 'Ostéoporose', 'Osteoporosis', 'musculoskeletal'),
('depression', 'Dépression', 'Depression', 'mental_health'),
('anxiety', 'Troubles anxieux', 'Anxiety disorder', 'mental_health'),
('chronic_kidney_disease', 'Maladie rénale chronique', 'Chronic kidney disease', 'renal'),
('liver_disease', 'Maladie hépatique', 'Liver disease', 'hepatic');

-- ============================================
-- Table de référence pour les recommandations
-- (mapping codes -> guidelines officiels)
-- ============================================

CREATE TABLE IF NOT EXISTS recommendation_guidelines (
    code VARCHAR(100) PRIMARY KEY,
    name_fr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'cancer_screening', 'cardiovascular', etc.
    
    -- Critères d'application
    min_age INTEGER,
    max_age INTEGER,
    sex_restriction VARCHAR(10) CHECK (sex_restriction IN ('female', 'male', NULL)),
    
    -- Recommandations
    interval_recommendation VARCHAR(100), -- '2 years', 'annual', 'every 5 years'
    
    -- Sources officielles
    has_source_url VARCHAR(500),
    eu_source_url VARCHAR(500),
    evidence_level VARCHAR(100),
    last_updated DATE,
    
    -- Texte explicatif
    description_fr TEXT,
    description_en TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dépistages du cancer
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
    'Dépistage du cancer du col de l''utérus par frottis ou test HPV selon l''âge.'
);

-- Dépistages cardiovasculaires
INSERT INTO recommendation_guidelines (
    code, name_fr, name_en, category,
    min_age, interval_recommendation, evidence_level,
    description_fr
) VALUES
(
    'blood_pressure_screening',
    'Mesure de la tension artérielle',
    'Blood pressure screening',
    'cardiovascular_screening',
    18, 'À chaque consultation ou au moins tous les 3 ans',
    'Recommandation forte (HAS)',
    'Dépistage de l''hypertension artérielle chez tous les adultes.'
),
(
    'lipid_screening',
    'Bilan lipidique',
    'Lipid screening',
    'cardiovascular_screening',
    40, 'Tous les 5 ans (ou plus fréquent selon risque)',
    'Recommandation (HAS)',
    'Dépistage des dyslipidémies pour prévenir les maladies cardiovasculaires.'
);

-- Dépistages métaboliques
INSERT INTO recommendation_guidelines (
    code, name_fr, name_en, category,
    min_age, interval_recommendation, evidence_level,
    description_fr
) VALUES
(
    'diabetes_screening',
    'Dépistage du diabète',
    'Diabetes screening',
    'metabolic_screening',
    45, 'Tous les 3 ans (ou plus fréquent si facteurs de risque)',
    'Recommandation (HAS)',
    'Dépistage du diabète de type 2 par glycémie à jeun ou HbA1c.'
);

COMMENT ON TABLE condition_types IS 'Référentiel standardisé des types de conditions médicales avec codes ICD-10';
COMMENT ON TABLE recommendation_guidelines IS 'Référentiel des recommandations de dépistage basées sur les guidelines HAS/UE';
