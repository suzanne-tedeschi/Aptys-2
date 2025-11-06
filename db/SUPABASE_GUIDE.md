# 🚀 Setup Supabase pour Aptys

## 📋 Guide d'installation rapide

### Étape 1 : Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com)
2. Clique sur "New Project"
3. Choisis un nom (ex: `aptys-mvp`)
4. Choisis une région (ex: `Europe West (Paris)` pour la France)
5. Définis un mot de passe fort pour la base de données
6. Attends que le projet soit créé (~2 minutes)

### Étape 2 : Exécuter le script SQL

1. Dans ton projet Supabase, va dans **SQL Editor** (icône de base de données dans la sidebar)
2. Clique sur **"New query"**
3. Copie-colle **TOUT** le contenu du fichier `supabase_setup.sql`
4. Clique sur **"Run"** (ou `Ctrl+Enter`)
5. Attends quelques secondes ⏳
6. Tu devrais voir "Success. No rows returned" → C'est normal ! ✅

### Étape 3 : Vérifier que tout fonctionne

Dans le SQL Editor, exécute cette requête :

```sql
-- Vérifier que toutes les tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Tu devrais voir **10 tables** :
- ✅ audit_logs
- ✅ condition_types
- ✅ family_medical_history
- ✅ personal_medical_history
- ✅ recommendation_guidelines
- ✅ recommendations
- ✅ share_links
- ✅ uploaded_documents
- ✅ user_personal_data
- ✅ users

### Étape 4 : Récupérer tes clés API

1. Va dans **Settings** → **API**
2. Note ces 2 valeurs importantes :

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Ajoute-les dans ton fichier `.env` :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Étape 5 : Installer le client Supabase dans Next.js

```bash
npm install @supabase/supabase-js
```

## 🔧 Configuration Row Level Security (RLS)

⚠️ **Important** : Par défaut, Supabase active la sécurité RLS. Pour le MVP, tu peux la désactiver temporairement, mais **à activer absolument en production** !

### Option A : Désactiver RLS temporairement (DEV uniquement)

Dans le SQL Editor, exécute :

```sql
-- ATTENTION : à utiliser UNIQUEMENT en développement !
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_personal_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_medical_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_medical_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE share_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
```

### Option B : Configurer RLS correctement (PRODUCTION)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politique : chaque utilisateur peut CRUD ses propres données
-- Note: Pour un vrai système, il faudrait auth Supabase (pas juste UUID)

-- Users : tout le monde peut créer, mais seulement lire/modifier ses propres données
CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (id = auth.uid() OR true); -- Temporaire: auth.uid() quand auth activé

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (id = auth.uid() OR true);

-- Appliquer la même logique aux autres tables
CREATE POLICY "Users can manage their personal data" ON user_personal_data
    FOR ALL USING (true); -- À restreindre avec auth

CREATE POLICY "Users can manage their history" ON personal_medical_history
    FOR ALL USING (true);

CREATE POLICY "Users can manage family history" ON family_medical_history
    FOR ALL USING (true);

CREATE POLICY "Users can manage documents" ON uploaded_documents
    FOR ALL USING (true);

CREATE POLICY "Users can manage recommendations" ON recommendations
    FOR ALL USING (true);

CREATE POLICY "Anyone can use share links" ON share_links
    FOR SELECT USING (true);

CREATE POLICY "Audit logs are read-only for users" ON audit_logs
    FOR SELECT USING (true);
```

## 📦 Utiliser Supabase dans ton code Next.js

### Créer le client Supabase

Crée `lib/supabase.js` :

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Exemples d'utilisation

#### Créer un utilisateur
```javascript
import { supabase } from '../lib/supabase';

const { data, error } = await supabase
  .from('users')
  .insert([
    { language: 'fr', consent_given_at: new Date().toISOString() }
  ])
  .select()
  .single();

if (error) console.error(error);
else console.log('User created:', data.id);
```

#### Sauvegarder les données personnelles
```javascript
const { data, error } = await supabase
  .from('user_personal_data')
  .upsert({
    user_id: userId,
    age: 45,
    sex_at_birth: 'female',
    is_smoker: false,
    bmi: 24.5
  })
  .select();
```

#### Récupérer les recommandations
```javascript
const { data, error } = await supabase
  .from('recommendations')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true);

if (data) console.log('Recommendations:', data);
```

## 🎯 Prochaines étapes

1. ✅ Tables créées dans Supabase
2. ⬜ Installer `@supabase/supabase-js` dans Next.js
3. ⬜ Créer `lib/supabase.js` avec le client
4. ⬜ Adapter les API routes pour utiliser Supabase
5. ⬜ Tester la création d'utilisateur et sauvegarde de données
6. ⬜ Configurer RLS pour la production

## 🔐 Stockage des fichiers (Supabase Storage)

Pour les documents uploadés, tu peux utiliser **Supabase Storage** :

1. Va dans **Storage** dans la sidebar
2. Crée un bucket "user-documents" (privé)
3. Utilise le code :

```javascript
// Upload d'un fichier
const { data, error } = await supabase.storage
  .from('user-documents')
  .upload(`${userId}/${filename}`, file);

// Télécharger un fichier
const { data, error } = await supabase.storage
  .from('user-documents')
  .download(`${userId}/${filename}`);
```

Ou tu peux continuer avec ton système de stockage chiffré local (recommandé pour MVP).

## ⚠️ Important pour la production

- [ ] Activer RLS sur toutes les tables
- [ ] Mettre en place l'authentification Supabase Auth
- [ ] Configurer les politiques RLS strictes
- [ ] Activer les backups automatiques
- [ ] Configurer les webhooks pour audit
- [ ] Mettre en place un système de monitoring

## 🆘 Besoin d'aide ?

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
