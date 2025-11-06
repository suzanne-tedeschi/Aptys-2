# Base de données Aptys - Documentation

## 📋 Vue d'ensemble

Ce dossier contient le schéma de base de données PostgreSQL pour l'application Aptys de prévention santé personnalisée, conforme aux exigences RGPD pour les données de santé sensibles.

## 🗂️ Structure des fichiers

- **`schema.sql`** : Schéma complet de la base de données (tables, indexes, triggers, fonctions)
- **`seed_data.sql`** : Données de référence (types de conditions médicales, recommandations standard)
- **`queries.sql`** : Exemples de requêtes SQL courantes et utiles

## 📊 Diagramme des tables

```
users (table principale)
  ├── user_personal_data (1:1)
  ├── personal_medical_history (1:N)
  ├── family_medical_history (1:N)
  ├── uploaded_documents (1:N)
  ├── recommendations (1:N)
  ├── share_links (1:N)
  └── audit_logs (1:N)

Tables de référence (optionnelles) :
  ├── condition_types
  └── recommendation_guidelines
```

## 🔑 Tables principales

### 1. **users**
Informations minimales sur les utilisateurs + consentement RGPD
- `id` (UUID) : Identifiant unique
- `consent_given_at` : Date du consentement explicite (OBLIGATOIRE)
- `consent_withdrawn_at` : Date de retrait du consentement
- `language` : Langue préférée (fr/en)
- `deleted_at` : Soft delete pour conformité RGPD

### 2. **user_personal_data**
Données personnelles de santé (1 seul enregistrement par user)
- Âge, sexe à la naissance
- Facteurs de risque : tabac, IMC
- Statut : brouillon vs. soumis

### 3. **personal_medical_history**
Antécédents médicaux personnels (multiple)
- Type de condition (standardisé)
- Date de diagnostic
- Notes additionnelles

### 4. **family_medical_history**
Antécédents familiaux au 1er degré (multiple)
- Relation familiale (père, mère, frère, sœur, etc.)
- Type de condition
- Âge au diagnostic

### 5. **uploaded_documents**
Métadonnées des documents uploadés (fichiers stockés chiffrés sur disque)
- Nom original, taille, type MIME
- Chemin vers fichier chiffré
- Algorithme de chiffrement (AES-256-GCM)

### 6. **recommendations**
Recommandations de dépistage générées
- Code et nom de la recommandation
- Intervalle conseillé
- Niveau de preuve et source
- Raisonnement (transparence)

### 7. **share_links**
Liens de partage sécurisés avec expiration
- Token unique (hashé)
- Date d'expiration
- Compteur d'accès limité

### 8. **audit_logs**
Journal d'audit pour conformité RGPD
- Actions (consentement, export, suppression)
- IP, user agent
- Statut (succès/échec)

## 🚀 Installation

### Prérequis
- PostgreSQL 12+ (recommandé : 14+)
- Extension `pgcrypto` pour UUID (généralement incluse)

### Étapes

1. **Créer la base de données**
```bash
createdb aptys_db
```

2. **Exécuter le schéma principal**
```bash
psql -d aptys_db -f schema.sql
```

3. **Charger les données de référence (optionnel mais recommandé)**
```bash
psql -d aptys_db -f seed_data.sql
```

4. **Vérifier l'installation**
```bash
psql -d aptys_db -c "\dt"  # Lister les tables
psql -d aptys_db -c "SELECT COUNT(*) FROM condition_types;"
```

## 🔒 Sécurité et conformité RGPD

### Chiffrement
- **Fichiers** : Chiffrés au repos avec AES-256-GCM (voir `lib/storage.js`)
- **Base de données** : Utiliser PostgreSQL avec chiffrement TLS/SSL en production
- **Données sensibles** : Considérer le chiffrement au niveau colonne pour données très sensibles

### Conformité RGPD

✅ **Consentement explicite** : Enregistré dans `users.consent_given_at`

✅ **Droit à l'oubli** : Fonction `gdpr_delete_user_data(uuid)` pour suppression

✅ **Droit d'accès** : Fonction `gdpr_export_user_data(uuid)` retourne toutes les données en JSON

✅ **Traçabilité** : Table `audit_logs` pour journal des actions

✅ **Minimisation** : Collecte uniquement des données nécessaires

✅ **Rétention limitée** : Champ `data_retention_until` pour auto-suppression

### Recommandations production

1. **Activer SSL/TLS** pour PostgreSQL
   ```
   # postgresql.conf
   ssl = on
   ssl_cert_file = '/path/to/server.crt'
   ssl_key_file = '/path/to/server.key'
   ```

2. **Sauvegardes chiffrées**
   ```bash
   pg_dump aptys_db | gpg --encrypt > backup_$(date +%Y%m%d).sql.gpg
   ```

3. **Rôles et permissions**
   ```sql
   CREATE ROLE aptys_app WITH LOGIN PASSWORD 'STRONG_PASSWORD';
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aptys_app;
   REVOKE DELETE ON audit_logs FROM aptys_app; -- Audit logs ne doivent pas être modifiables
   ```

4. **Hébergeur santé** : En France, les données de santé doivent être hébergées chez un hébergeur agréé (HDS). Considérer :
   - OVHcloud (HDS)
   - Scaleway (HDS)
   - AWS/Azure avec conformité HDS

## 📝 Exemples d'utilisation

### Créer un utilisateur complet

```sql
-- 1. Créer l'utilisateur
INSERT INTO users (language, consent_given_at)
VALUES ('fr', CURRENT_TIMESTAMP)
RETURNING id;
-- Supposons que l'id retourné est '123e4567-e89b-12d3-a456-426614174000'

-- 2. Ajouter données personnelles
INSERT INTO user_personal_data (user_id, age, sex_at_birth, is_smoker, bmi)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 45, 'female', false, 24.5);

-- 3. Ajouter antécédents familiaux
INSERT INTO family_medical_history (user_id, relationship, condition_type, condition_name, age_at_diagnosis)
VALUES 
  ('123e4567-e89b-12d3-a456-426614174000', 'mother', 'cancer_breast', 'Cancer du sein', 52),
  ('123e4567-e89b-12d3-a456-426614174000', 'father', 'diabetes_type2', 'Diabète type 2', 58);

-- 4. Générer recommandations
INSERT INTO recommendations (user_id, recommendation_code, recommendation_name, interval_recommendation, evidence_level, source_reference)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'mammography', 'Mammographie', 'Tous les 2 ans', 'HAS', 'https://has-sante.fr');
```

### Exporter les données d'un utilisateur (RGPD)

```sql
SELECT gdpr_export_user_data('123e4567-e89b-12d3-a456-426614174000');
```

### Supprimer un utilisateur (RGPD)

```sql
SELECT gdpr_delete_user_data('123e4567-e89b-12d3-a456-426614174000');
```

## 🔧 Maintenance

### Nettoyage régulier (cron job recommandé)

```sql
-- Supprimer les liens de partage expirés depuis > 30 jours
DELETE FROM share_links 
WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Archiver les logs d'audit > 2 ans
INSERT INTO audit_logs_archive SELECT * FROM audit_logs 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years';
DELETE FROM audit_logs 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years';
```

### Monitoring

```sql
-- Taille de la base de données
SELECT pg_size_pretty(pg_database_size('aptys_db'));

-- Nombre d'utilisateurs actifs
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;

-- Recommandations les plus fréquentes
SELECT recommendation_code, COUNT(*) 
FROM recommendations 
WHERE is_active = TRUE 
GROUP BY recommendation_code 
ORDER BY COUNT(*) DESC;
```

## 📚 Ressources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RGPD - CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [HAS - Haute Autorité de Santé](https://www.has-sante.fr/)
- [Hébergement données de santé (HDS)](https://esante.gouv.fr/labels-certifications/hds)

## ⚠️ Notes importantes

1. **Ce schéma est un MVP** : Pour la production, considérer :
   - Partitionnement des tables (audit_logs, recommendations)
   - Réplication pour haute disponibilité
   - Chiffrement au niveau colonne pour données ultra-sensibles

2. **Codes ICD-10 et SNOMED** : Les codes fournis sont des exemples. Utiliser des référentiels officiels en production.

3. **Rétention des données** : Définir une politique claire (ex: 3 ans après dernière connexion) et automatiser avec un job cron.

4. **Tests de restauration** : Tester régulièrement la restauration des backups.
