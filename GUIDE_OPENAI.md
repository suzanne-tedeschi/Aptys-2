# 🤖 Guide : Recommandations médicales par OpenAI GPT-4o

## 📋 Vue d'ensemble

Le système génère des recommandations de dépistage personnalisées en utilisant **GPT-4o d'OpenAI**, le modèle le plus avancé et rapide d'OpenAI.

### Flux complet :
1. ✅ Utilisateur remplit le questionnaire de santé (8 étapes)
2. 📄 Génération automatique d'un résumé médical structuré
3. 🤖 Envoi à GPT-4o avec prompt médical expert
4. 📊 GPT-4o analyse et génère des recommandations basées sur les guidelines HAS/INCa
5. 💾 Sauvegarde dans Supabase
6. 📋 Affichage sur le dashboard avec priorités et justifications

---

## 🔧 Configuration requise

### 1. Créer un compte OpenAI

1. **Va sur** : https://platform.openai.com/signup
2. **Créer un compte** (avec email ou compte Google)
3. **Vérifier l'email**
4. **Ajouter des crédits** : https://platform.openai.com/account/billing/overview
   - Cliquer sur "Add payment method"
   - Ajouter une carte bancaire
   - Ajouter des crédits (minimum : $5)
   - **Coût par analyse** : ~$0.01-0.015 (très économique)
5. **Générer une clé API** : https://platform.openai.com/api-keys
   - Cliquer sur "Create new secret key"
   - Donner un nom (ex: "Aptys Production")
   - **COPIER LA CLÉ** (commence par `sk-proj-...` ou `sk-...`)
   - ⚠️ Tu ne pourras plus la voir après !

### 2. Configurer la clé API

Ouvre `/Users/suzannetedeschi/Desktop/Aptys/.env.local` et remplace :

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Par ta vraie clé :

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANT** : Ne jamais commiter cette clé dans Git ! Le fichier `.env.local` est déjà dans `.gitignore`.

### 3. Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C dans le terminal)
# Relancer
npm run dev
```

---

## 💰 Coûts estimés

### Modèle : GPT-4o (Dernier modèle OpenAI)
- **Input** : $2.50 / 1M tokens
- **Output** : $10.00 / 1M tokens

### Par analyse complète :
- Input : ~2500 tokens (résumé médical + prompt) = **$0.00625**
- Output : ~800 tokens (8-10 recommandations JSON) = **$0.008**
- **TOTAL : ~$0.015 par patient** 💰

### Pour 1000 patients :
- **Coût total : ~$15**
- **Avec $5 de crédits** : ~330 analyses complètes

### Comparaison avec Claude :
- **Claude 3.5 Sonnet** : ~$0.02 / analyse
- **GPT-4o** : ~$0.015 / analyse ✅ **25% moins cher**
- **GPT-4o** est aussi **plus rapide** (5-10 secondes vs 10-20 secondes)

---

## 🚀 Comment tester

### Test 1 : Profil femme à haut risque

1. **Va sur** http://localhost:3000
2. **Onboarding** : Accepte les conditions
3. **Remplis le questionnaire** avec ces données :

**PROFIL TEST : Femme 55 ans à haut risque**

- **Étape 1** : 55 ans, Femme, 68 kg, 165 cm
- **Étape 2** : Fumeuse, 15 cig/jour, 30 ans, Alcool occasionnel
- **Étape 3** : Pas de maladie chronique
- **Étape 4** : HTA ✓, Cholestérol ✓
- **Étape 5** : Antécédents maternels : Cancer du sein ✓ + Diabète ✓
- **Étape 6** : 2 grossesses, Ménopausée à 52 ans, Contraception 12 ans
- **Étape 7** : Mammographie en 2023
- **Étape 8** : Pas d'exposition particulière

4. **Soumettre** : Clique sur "Soumettre le questionnaire"
5. **Observe** : Overlay de chargement (5-15 sec)
6. **Dashboard** : Tu devrais voir ~8-12 recommandations personnalisées

---

## 📊 Ce que tu verras dans les logs

Dans le terminal du serveur (où tourne `npm run dev`) :

```
📄 Génération du résumé médical...
--- RÉSUMÉ MÉDICAL GÉNÉRÉ ---
=== PROFIL DU PATIENT ===
Âge : 55 ans
Sexe : Femme
...
--- FIN RÉSUMÉ ---

🤖 Appel de GPT-4o pour analyse médicale...
📊 Parsing de la réponse...
--- RÉPONSE BRUTE DE GPT-4o ---
{
  "recommendations": [
    {
      "id": "mammography-high-risk",
      "name": "Surveillance renforcée du cancer du sein",
      "priority": 5,
      ...
    }
  ],
  ...
}
--- FIN RÉPONSE ---

💾 Sauvegarde de 9 recommandations dans Supabase...
✅ 9 recommandations sauvegardées avec succès
```

---

## 🔍 Vérification dans Supabase

```sql
-- Voir les recommandations générées par GPT-4o
SELECT 
  recommendation_name,
  priority,
  interval_recommendation,
  reasoning,
  evidence_level,
  engine_version
FROM recommendations 
WHERE user_id = 'ton-user-id' 
  AND is_active = true 
  AND engine_version = 'GPT-4o'
ORDER BY priority DESC;

-- Voir le nombre de tokens utilisés
SELECT 
  action_details->>'tokens_used' as tokens,
  action_details->>'recommendations_count' as count,
  created_at
FROM audit_logs 
WHERE action_type = 'recommendations_generated' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ⚡ Avantages de GPT-4o vs Claude

### **GPT-4o** ✅
- ✅ **Plus rapide** : 5-10 secondes (vs 10-20 pour Claude)
- ✅ **Moins cher** : $0.015/analyse (vs $0.02 pour Claude)
- ✅ **JSON natif** : Mode `response_format: { type: "json_object" }`
- ✅ **Plus de connaissance médicale récente** (données jusqu'à octobre 2023)
- ✅ **Meilleure cohérence** sur des tâches structurées

### **Claude 3.5 Sonnet**
- ✅ **Plus conservateur** médicalement (moins de sur-diagnostic)
- ✅ **Contexte plus grand** : 200K tokens (vs 128K pour GPT-4o)
- ✅ **Meilleur raisonnement** sur cas complexes

### **Verdict** : 
Pour des recommandations de dépistage basées sur guidelines, **GPT-4o est idéal** (rapide, précis, économique). Pour des cas très complexes nécessitant beaucoup de nuances, Claude peut être préférable.

---

## 🚨 Debugging

### Problème 1 : "OPENAI_API_KEY not configured"
**Solution** :
1. Vérifie que `.env.local` contient ta vraie clé API
2. La clé doit commencer par `sk-proj-` ou `sk-`
3. Redémarre le serveur (`Ctrl+C` puis `npm run dev`)

### Problème 2 : "Failed to parse GPT-4o response"
**Raison** : GPT-4o n'a pas retourné du JSON valide (rare avec `json_object` mode)
**Solution** :
- Vérifie les logs dans la console serveur
- La réponse brute sera affichée pour debug

### Problème 3 : "Insufficient quota"
**Raison** : Tu n'as plus de crédits OpenAI
**Solution** :
- Va sur https://platform.openai.com/account/billing/overview
- Ajoute des crédits ($5 minimum)

### Problème 4 : "Rate limit exceeded"
**Raison** : Trop de requêtes en peu de temps (plan gratuit limité)
**Solution** :
- Attends 1 minute
- Ou upgrade vers un plan payant (pas de limite)

---

## 🔐 Sécurité

1. ✅ **Clé API** : Stockée côté serveur uniquement (`.env.local`)
2. ✅ **Données médicales** : Jamais exposées au client
3. ✅ **RGPD** : Données pseudonymisées (UUID)
4. ✅ **Logs** : Audit complet dans `audit_logs`
5. ⚠️ **OpenAI** : Les données sont envoyées à OpenAI (USA)
   - Pour conformité RGPD stricte, préférer un modèle auto-hébergé
   - Ou utiliser Azure OpenAI (serveurs EU disponibles)

---

## 📚 Fichiers modifiés

### 1. `/lib/medicalPrompt.js`
- Prompt optimisé pour GPT-4o
- Insiste sur format JSON strict
- Même contenu médical (guidelines HAS/INCa)

### 2. `/pages/api/generate-recommendations.js`
- Remplacé `Anthropic` par `OpenAI`
- Utilise `gpt-4o` avec `response_format: { type: "json_object" }`
- Enregistre `tokens_used` dans les logs
- `engine_version` = "GPT-4o" dans la BDD

### 3. `/pages/intake.js`
- Message d'erreur mis à jour (OpenAI au lieu d'Anthropic)

### 4. `.env.local`
- `ANTHROPIC_API_KEY` → `OPENAI_API_KEY`

---

## ✅ Checklist finale

Avant de tester :

- [ ] Compte OpenAI créé : https://platform.openai.com/signup
- [ ] Carte bancaire ajoutée
- [ ] Crédits ajoutés (minimum $5)
- [ ] Clé API copiée : https://platform.openai.com/api-keys
- [ ] `.env.local` mis à jour avec `OPENAI_API_KEY`
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Test avec profil femme 55 ans
- [ ] Recommandations visibles dans le dashboard
- [ ] Vérification dans Supabase (engine_version = "GPT-4o")

---

## 🔄 Revenir à Claude (si besoin)

Si tu veux revenir à Claude plus tard :

1. Réinstaller `@anthropic-ai/sdk` : `npm install @anthropic-ai/sdk`
2. Changer `OPENAI_API_KEY` → `ANTHROPIC_API_KEY` dans `.env.local`
3. Modifier `/pages/api/generate-recommendations.js` (import OpenAI → Anthropic)
4. Redémarrer le serveur

---

## 📈 Monitoring des coûts

Pour suivre tes dépenses OpenAI :
- **Dashboard** : https://platform.openai.com/usage
- **Définir une limite** : https://platform.openai.com/account/limits
- **Alertes email** : Configure des alertes à 80% de ton budget

---

## 🎉 Prêt !

Le système est maintenant configuré pour utiliser **GPT-4o** au lieu de Claude.

**Avantages** :
- ✅ 25% moins cher
- ✅ 2x plus rapide
- ✅ JSON natif (moins d'erreurs de parsing)
- ✅ Interface OpenAI plus familière

**Pour tester** :
1. Configure ta clé API OpenAI dans `.env.local`
2. Redémarre le serveur
3. Remplis le questionnaire
4. Admire les recommandations personnalisées ! 🚀

---

**Questions ?** Vérifie les logs dans le terminal ou dans Supabase `audit_logs` !
