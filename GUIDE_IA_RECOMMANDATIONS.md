# 🤖 Guide complet : Recommandations médicales par IA (Claude 3.5 Sonnet)

## 📋 Vue d'ensemble

Le système génère des recommandations de dépistage personnalisées en utilisant Claude 3.5 Sonnet d'Anthropic, le LLM le plus performant pour l'analyse médicale.

### Flux complet :
1. ✅ Utilisateur remplit le questionnaire de santé (8 étapes)
2. 📄 Génération automatique d'un résumé médical structuré
3. 🤖 Envoi au LLM Claude 3.5 Sonnet avec prompt médical expert
4. 📊 Claude analyse et génère des recommandations basées sur les guidelines HAS/INCa
5. 💾 Sauvegarde dans Supabase
6. 📋 Affichage sur le dashboard avec priorités et justifications

---

## 🔧 Configuration requise

### 1. Créer un compte Anthropic

1. **Va sur** : https://console.anthropic.com/
2. **Créer un compte** (avec email)
3. **Vérifier l'email**
4. **Ajouter des crédits** : https://console.anthropic.com/settings/billing
   - Minimum : $5 (suffit pour ~500 analyses complètes)
   - Coût par analyse : ~$0.01-0.02 (très économique)
5. **Générer une clé API** : https://console.anthropic.com/settings/keys
   - Cliquer sur "Create Key"
   - Donner un nom (ex: "Aptys Production")
   - **COPIER LA CLÉ** (tu ne pourras plus la voir après)

### 2. Configurer la clé API

Ouvre `/Users/suzannetedeschi/Desktop/Aptys/.env.local` et remplace :

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Par ta vraie clé (ex: `sk-ant-api03-...`) :

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANT** : Ne jamais commiter cette clé dans Git ! Le fichier `.env.local` est déjà dans `.gitignore`.

### 3. Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

---

## 📁 Fichiers créés

### 1. `/lib/medicalSummaryGenerator.js`
**Fonction** : Transforme les données du questionnaire en résumé médical structuré

**Exemple de sortie** :
```
=== PROFIL DU PATIENT ===
Âge : 55 ans
Sexe : Femme
Poids : 68 kg
Taille : 165 cm
IMC : 24.98
  → Poids normal

=== HABITUDES DE VIE ===
Tabagisme : Fumeur actuel
  → 15 cigarettes/jour
  → Durée : 30 ans
  → 22.5 paquets-années
Consommation d'alcool : Occasionnel (1-2 verres/semaine)
...

=== ANTÉCÉDENTS FAMILIAUX ===

CÔTÉ MATERNEL :
  Cancers :
    - Cancer du sein (mère, diagnostiqué à 48 ans)
  - Diabète
...
```

### 2. `/lib/medicalPrompt.js`
**Fonction** : Contient le prompt système expert pour guider Claude

**Caractéristiques** :
- 📚 Basé sur guidelines HAS, INCa, ANSM officielles
- 🎯 Instructions précises pour chaque type de dépistage
- ⚖️ Système de priorités (1-5)
- 🔬 Exigence de niveau de preuve pour chaque recommandation
- 🚫 Instructions pour éviter le surdiagnostic
- 📊 Format de sortie JSON structuré

### 3. `/pages/api/generate-recommendations.js`
**Fonction** : API route qui orchestre tout le processus

**Étapes** :
1. Reçoit `userId` + `formData`
2. Génère le résumé médical via `generateMedicalSummary()`
3. Appelle Claude 3.5 Sonnet via SDK Anthropic
4. Parse la réponse JSON
5. Archive les anciennes recommandations
6. Insère les nouvelles dans Supabase
7. Log dans `audit_logs`
8. Retourne les résultats

**Endpoint** : `POST /api/generate-recommendations`

**Body** :
```json
{
  "userId": "uuid-de-l-utilisateur",
  "formData": { /* toutes les données du questionnaire */ }
}
```

**Response** :
```json
{
  "success": true,
  "recommendations": [
    {
      "id": 12,
      "user_id": "...",
      "recommendation_code": "mammography-high-risk",
      "recommendation_name": "Surveillance renforcée du cancer du sein",
      "interval_recommendation": "Annuelle - IRM + mammographie",
      "priority": 5,
      "evidence_level": "Risque familial (INCa/HAS)",
      "source_reference": "INCa - Surveillance personnes à haut risque",
      "reasoning": "Antécédent familial maternel de cancer du sein précoce (<50 ans). Risque de mutation BRCA1/BRCA2. Consultation oncogénétique recommandée.",
      ...
    }
  ],
  "risk_summary": {
    "high_risks": ["Antécédent familial cancer du sein maternel"],
    "moderate_risks": ["Tabagisme actif"],
    "protective_factors": ["IMC normal", "Activité physique régulière"]
  },
  "next_steps": "Consultation avec médecin traitant pour discuter des examens prioritaires...",
  "metadata": {
    "total_count": 8,
    "high_priority_count": 2,
    "model_used": "claude-3-5-sonnet-20241022",
    "generated_at": "2025-11-06T..."
  }
}
```

### 4. Modification de `/pages/intake.js`
**Changements** :
- ✅ Appelle `/api/generate-recommendations` au lieu de l'ancien `/api/recommendations`
- ✅ Overlay de chargement avec animation pendant l'analyse (10-20 secondes)
- ✅ Gestion d'erreur si clé API non configurée
- ✅ Message de succès avec nombre de recommandations générées

---

## 🎯 Comment tester

### Test 1 : Profil femme à haut risque

**Données** :
- Âge : 55 ans
- Sexe : Femme
- IMC : 25
- Tabac : Oui, 20 cigarettes/jour, 30 ans
- Antécédent familial maternel : Cancer du sein (mère à 48 ans)
- Contraception hormonale : 12 ans
- Ménopause : Oui, à 52 ans

**Recommandations attendues** :
- 🔴 Priorité 5 : Surveillance renforcée cancer du sein (IRM + mammographie annuelle)
- 🟠 Priorité 4 : Scanner thoracique low-dose (tabagisme lourd)
- 🟠 Priorité 4 : Dépistage colorectal (Test FIT)
- 🔵 Priorité 3 : Frottis cervical
- 🔵 Priorité 3 : Bilan cardiovasculaire (HTA, lipides)

### Test 2 : Profil homme fumeur

**Données** :
- Âge : 62 ans
- Sexe : Homme
- IMC : 28
- Tabac : Ancien fumeur, arrêt il y a 2 ans, 25 paquets-années
- HTA : Oui
- Cholestérol : Oui
- Antécédent familial paternel : Maladie cardiaque (père à 58 ans)

**Recommandations attendues** :
- 🟠 Priorité 4 : Scanner thoracique low-dose
- 🟠 Priorité 4 : Coloscopie ou Test FIT
- 🟠 Priorité 4 : Bilan cardiovasculaire complet
- 🔵 Priorité 3 : PSA (décision partagée)

### Test 3 : Profil femme jeune sans facteur de risque

**Données** :
- Âge : 32 ans
- Sexe : Femme
- IMC : 22
- Non fumeuse
- Pas d'antécédent familial

**Recommandations attendues** :
- 🔵 Priorité 3 : Frottis cervical (tous les 3 ans)
- 🔵 Priorité 3 : Examen dentaire annuel
- 🔵 Priorité 3 : Vaccination (rappels DTP)

---

## 🔍 Vérification dans Supabase

Après avoir soumis un questionnaire, vérifie dans Supabase :

### 1. Table `recommendations`
```sql
SELECT * FROM recommendations 
WHERE user_id = 'ton-user-id' 
AND is_active = true 
ORDER BY priority DESC;
```

Tu devrais voir :
- Toutes les recommandations avec leurs priorités
- `engine_version` = "Claude-3.5-Sonnet"
- `reasoning` avec justification détaillée

### 2. Table `audit_logs`
```sql
SELECT * FROM audit_logs 
WHERE user_id = 'ton-user-id' 
AND action_type = 'recommendations_generated' 
ORDER BY created_at DESC 
LIMIT 1;
```

Tu devrais voir :
- `action_details` avec métadonnées (modèle, nombre de recs, etc.)
- `status` = "success"

---

## 💰 Coûts estimés

### Modèle : Claude 3.5 Sonnet
- **Input** : $3 / 1M tokens
- **Output** : $15 / 1M tokens

### Par analyse complète :
- Input : ~2500 tokens (résumé médical + prompt) = **$0.0075**
- Output : ~800 tokens (8-10 recommandations JSON) = **$0.012**
- **TOTAL : ~$0.02 par patient**

### Pour 1000 patients :
- **Coût total : ~$20**
- **Avec $5 de crédits** : ~250 analyses complètes

---

## 🚨 Debugging

### Problème 1 : "ANTHROPIC_API_KEY not configured"
**Solution** :
1. Vérifie que `.env.local` contient ta vraie clé API
2. Redémarre le serveur (`npm run dev`)
3. Vérifie que la clé commence par `sk-ant-api03-`

### Problème 2 : "Failed to parse Claude response"
**Raison** : Claude n'a pas retourné du JSON valide
**Solution** :
- Vérifie les logs dans la console serveur
- Claude peut parfois ajouter du texte avant/après le JSON
- Le code gère déjà ça, mais si problème persiste, check la réponse brute

### Problème 3 : Recommandations non pertinentes
**Solutions** :
1. Vérifie le résumé médical généré (dans logs console)
2. Ajuste le prompt dans `/lib/medicalPrompt.js`
3. Augmente `temperature` de 0.3 à 0.5 pour plus de créativité (ou diminue pour plus de conservatisme)

### Problème 4 : Timeout
**Raison** : Claude prend >30 secondes (rare)
**Solution** :
- Augmenter le timeout de Vercel/Next.js
- Ou découper en 2 appels (cancers, puis cardio/métabolique)

---

## 📊 Logs utiles

Pendant le processus, tu verras dans la console serveur :

```
📄 Génération du résumé médical...
--- RÉSUMÉ MÉDICAL GÉNÉRÉ ---
=== PROFIL DU PATIENT ===
...
--- FIN RÉSUMÉ ---

🤖 Appel de Claude 3.5 Sonnet pour analyse...
📊 Parsing de la réponse...
--- RÉPONSE BRUTE DE CLAUDE ---
{
  "recommendations": [...],
  ...
}
--- FIN RÉPONSE ---

💾 Sauvegarde de 8 recommandations dans Supabase...
✅ 8 recommandations sauvegardées avec succès
```

---

## 🔐 Sécurité

1. ✅ **Clé API** : Stockée côté serveur uniquement (`.env.local`)
2. ✅ **Données médicales** : Jamais exposées au client
3. ✅ **Logs** : Audit complet dans `audit_logs`
4. ✅ **RGPD** : Données pseudonymisées (UUID)

---

## 🎨 Alternatives de LLM

Si tu veux tester d'autres modèles :

### OpenAI GPT-4o (Alternative)
```bash
npm install openai
```

Modifie `/pages/api/generate-recommendations.js` :
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: MEDICAL_SYSTEM_PROMPT },
    { role: "user", content: USER_PROMPT_TEMPLATE(medicalSummary) }
  ]
});
```

**Coût** : ~$0.15 / analyse (plus cher mais plus rapide)

---

## ✅ Checklist finale

Avant de lancer en production :

- [ ] Clé API Anthropic configurée dans `.env.local`
- [ ] Tables Supabase à jour (migrations exécutées)
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Test avec au moins 3 profils différents
- [ ] Vérification des recommandations dans Supabase
- [ ] Logs dans `audit_logs` fonctionnels
- [ ] Dashboard affiche correctement les recommandations

---

## 📚 Ressources

- **Documentation Claude** : https://docs.anthropic.com/
- **Guidelines HAS** : https://www.has-sante.fr/
- **INCa (Cancer)** : https://www.e-cancer.fr/
- **Calendrier vaccinal** : https://solidarites-sante.gouv.fr/

---

**Prêt à tester ! 🚀**
