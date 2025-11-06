# Aptys — MVP prévention personnalisée

Version initiale MVP (Next.js). L'objectif : collecte minimale, consentement RGPD, moteur de recommandations simple, stockage chiffré des pièces jointes, dashboard et partage sécurisé.

Principaux points
- Framework: Next.js
- Stockage des fichiers chiffré au repos (AES-GCM)
- Moteur de recommandations rule-based (retourne examens avec intervalle et source)

Installation

1. Copier .env.example en `.env` et définir `STORAGE_KEY` (32 bytes base64) et `SHARE_TOKEN_SECRET`.
2. npm install
3. npm run dev

Supabase / Déploiement
----------------------

1. Copier `.env.example` en `.env.local` et remplir les variables :
	- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (valeurs du projet Supabase "Aptys").
	- `SUPABASE_SERVICE_ROLE_KEY` (à conserver en secret, serveur seulement).
	- `STORAGE_KEY` (base64, 32 bytes) utilisé pour chiffrer les fichiers locaux.

2. Pour créer les tables dans votre projet Supabase, exécutez le SQL contenu dans `db/supabase_setup.sql` depuis l'éditeur SQL de Supabase ou via psql (voir `scripts/import_supabase.sh`).

3. Si vous migrez des données depuis un ancien projet, utilisez `pg_dump` / `pg_restore` ou export CSV et import via l'interface Supabase. Faites une sauvegarde avant toute opération destructive.

Important: Ne commitez jamais vos clés (`.env.local`) dans le dépôt public. Utilisez les variables d'environnement du service d'hébergement pour déployer en production.

Endpoints importants
- POST /api/user/create -> crée un utilisateur et retourne userId
- POST /api/user/{id}/draft -> sauvegarde un brouillon
- POST /api/upload -> upload base64 -> stocke chiffré
- POST /api/recommendations -> retourne recommandations (nécessite input normalisé)
- POST /api/share -> crée lien de partage limité dans le temps

Notes légales et conformité

Le site n'est pas un dispositif médical et ne fournit pas de diagnostic. Le site affiche un avertissement clair à l'utilisateur: Ne remplace pas l'avis médical — consultez votre professionnel de santé. Les données sont stockées localement dans le dossier `data/` chiffrées. L'utilisateur peut demander suppression et retrait du consentement via l'API.

Limites MVP
- Pas d'authentification complète (identifiant unique par utilisateur)
- PDF export basique (impression navigateur) — peut être amélioré
