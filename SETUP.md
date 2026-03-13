# MK Studio — Guide de mise en production

## 1. Configuration Supabase (OBLIGATOIRE)

### Appliquer les migrations

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu de `supabase/migrations/001_initial_schema.sql`
4. Copiez et exécutez le contenu de `supabase/migrations/002_rpc_functions.sql`

### Créer le premier compte admin

Dans le **SQL Editor** de Supabase, après avoir exécuté les migrations :

1. Allez dans **Authentication > Users** et créez un utilisateur avec email/password
2. Notez son UUID
3. Dans le **SQL Editor**, exécutez :

```sql
UPDATE profiles
SET role = 'admin'
WHERE user_id = 'VOTRE-UUID-ICI';
```

### Configuration Auth

Dans **Authentication > Providers** :
- Activez Email provider
- Désactivez "Confirm email" pour le développement (optionnel)

## 2. Déploiement Vercel

### Variables d'environnement Vercel

Ajoutez ces variables dans votre projet Vercel (Settings > Environment Variables) :

```
NEXT_PUBLIC_SUPABASE_URL=https://fjzzylksthpnunrqazdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### URL de redirection Auth

Dans Supabase **Authentication > URL Configuration** :
- Site URL : `https://votre-domaine.vercel.app`
- Redirect URLs : `https://votre-domaine.vercel.app/api/auth/callback`

## 3. Fonctionnalités

### Espace Adhérent
- Tableau de bord avec solde de séances
- Planning hebdomadaire avec inscription/désinscription
- Historique des séances
- Boutique pour acheter des packs
- Historique des achats avec téléchargement de factures

### Espace Admin
- Tableau de bord global (CA, membres, cours)
- Gestion des adhérents (créer, voir, ajuster le solde)
- Gestion des produits/packs
- Planning avec création de cours (uniques ou récurrents)
- Enregistrement des ventes avec génération de factures
- Paramètres de facturation (mentions légales françaises)

### Facturation
Les factures générées incluent toutes les mentions obligatoires françaises :
- Numéro de facture séquentiel
- Coordonnées complètes du prestataire
- SIRET obligatoire
- Mention TVA (art. 293 B du CGI)
- Conditions de paiement
- Pénalités de retard légales
