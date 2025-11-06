# Guide de Migration - Améliorations du questionnaire

## 📅 Date : 30 octobre 2025

## 🎯 Objectif
Cette migration ajoute deux améliorations majeures au questionnaire de santé :

1. **Distinction côté maternel/paternel** pour les antécédents familiaux
2. **Upload de comptes-rendus PDF** pour chaque dépistage effectué

---

## 🔄 Changements de la base de données

### 1. Table `family_medical_history`

**Nouvelles colonnes :**
- `family_side` : VARCHAR(20) - Indique si l'antécédent est côté maternel, paternel ou inconnu
  - Valeurs possibles : `'maternal'`, `'paternal'`, `'unknown'`
  - Par défaut : `'unknown'`

**Nouveaux relationships :**
En plus des existants (mother, father, brother, sister, son, daughter), ajout de :
- `maternal_grandmother`, `maternal_grandfather`
- `paternal_grandmother`, `paternal_grandfather`
- `maternal_aunt`, `maternal_uncle`
- `paternal_aunt`, `paternal_uncle`

**Nouvel index :**
- `idx_family_history_side` sur la colonne `family_side`

---

### 2. Table `uploaded_documents`

**Nouvelles colonnes :**

- `document_category` : VARCHAR(50) - Catégorie du document
  - Valeurs possibles : 
    - `'screening_report'` : Compte-rendu de dépistage
    - `'medical_report'` : Rapport médical
    - `'prescription'` : Ordonnance
    - `'lab_results'` : Résultats de laboratoire
    - `'imaging'` : Imagerie médicale
    - `'other'` : Autre

- `screening_type` : VARCHAR(50) - Type de dépistage (si applicable)
  - Valeurs possibles :
    - `'mammography'` : Mammographie
    - `'colonoscopy'` : Coloscopie
    - `'pap_smear'` : Frottis cervical
    - `'blood_test'` : Bilan sanguin
    - `'dental'` : Visite dentaire
    - `'other'` : Autre

- `screening_date` : DATE - Date du dépistage (si applicable)

**Nouveaux index :**
- `idx_documents_category` sur `document_category`
- `idx_documents_screening_type` sur `screening_type`

---

## 📋 Instructions de migration

### Si vous avez déjà créé les tables :

1. **Connectez-vous à Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Exécutez le fichier `migration_add_family_side_and_screening_docs.sql`

```sql
-- Le script gère automatiquement :
-- - L'ajout des nouvelles colonnes
-- - La mise à jour des contraintes
-- - La création des index
-- - Les valeurs par défaut pour les données existantes
```

### Si vous créez les tables pour la première fois :

Utilisez directement le fichier `supabase_setup.sql` qui contient déjà toutes les modifications.

---

## 💡 Impact sur l'application

### Frontend (questionnaire)

**Étape 5 - Antécédents familiaux :**
- Interface divisée en deux sections distinctes :
  - 👩 **Côté maternel** (fond jaune/orange)
  - 👨 **Côté paternel** (fond bleu)
- Chaque section permet de sélectionner :
  - Types de cancer (8 options)
  - Maladies cardiovasculaires précoces
  - Diabète de type 2
  - Alzheimer/démence
  - Autres conditions

**Étape 7 - Dépistages effectués :**
- Chaque dépistage a maintenant :
  - Un champ de date (type `month`)
  - Un bouton d'upload de PDF
  - Un indicateur visuel "✓ Compte-rendu uploadé"
- Dépistages catégorisés par couleur :
  - 🟡 Jaune : Mammographie, Frottis cervical (femmes)
  - 🔵 Bleu : Coloscopie, Bilan sanguin
  - 🟢 Vert : Visite dentaire

### Backend (API)

**`/api/upload` :**
Nouveaux paramètres acceptés :
```javascript
{
  userId: "uuid",
  filename: "mammographie_2024.pdf",
  data: "base64...",
  documentCategory: "screening_report",  // NOUVEAU
  screeningType: "mammography",          // NOUVEAU
  screeningDate: "2024-10"              // NOUVEAU
}
```

**Fonction `uploadFile()` :**
```javascript
uploadFile(file, screeningType, screeningDate)
// Exemple :
uploadFile(file, 'mammography', '2024-10')
```

---

## 🔍 Requêtes SQL utiles

### Récupérer tous les antécédents côté maternel d'un utilisateur
```sql
SELECT * FROM family_medical_history 
WHERE user_id = 'xxx' 
AND family_side = 'maternal';
```

### Récupérer tous les comptes-rendus de mammographie
```sql
SELECT * FROM uploaded_documents 
WHERE user_id = 'xxx' 
AND document_category = 'screening_report'
AND screening_type = 'mammography'
ORDER BY screening_date DESC;
```

### Statistiques des dépistages uploadés
```sql
SELECT 
  screening_type,
  COUNT(*) as count,
  MAX(screening_date) as last_screening
FROM uploaded_documents
WHERE document_category = 'screening_report'
AND deleted_at IS NULL
GROUP BY screening_type;
```

---

## ⚠️ Points d'attention

1. **Données existantes :** Les antécédents familiaux existants auront `family_side = 'unknown'`
2. **Migration manuelle :** Si nécessaire, vous pouvez mettre à jour manuellement les données :
   ```sql
   UPDATE family_medical_history 
   SET family_side = 'maternal' 
   WHERE relationship IN ('mother', 'maternal_grandmother', 'maternal_grandfather');
   ```

3. **Fichiers PDF uniquement :** L'interface accepte uniquement les PDF (`accept=".pdf"`)
4. **Chiffrement :** Tous les fichiers restent chiffrés avec AES-256-GCM avant stockage

---

## 🧪 Tests recommandés

1. ✅ Créer un nouvel utilisateur et remplir le questionnaire complet
2. ✅ Vérifier que les antécédents maternels/paternels sont bien séparés
3. ✅ Uploader un PDF pour chaque type de dépistage
4. ✅ Vérifier que les métadonnées sont correctement enregistrées dans Supabase
5. ✅ Vérifier que les fichiers sont bien chiffrés localement

---

## 📚 Documentation liée

- `supabase_setup.sql` : Script complet de création
- `migration_add_family_side_and_screening_docs.sql` : Script de migration
- `pages/intake.js` : Questionnaire frontend
- `pages/api/upload.js` : API d'upload de fichiers

---

## 🆘 Support

En cas de problème, vérifiez :
1. Les logs de la console frontend
2. Les logs de l'API Next.js
3. Les logs de Supabase (Table Editor → Query logs)
4. Que les contraintes CHECK sont respectées
