# Gesclic - Gestion Médicale SaaS

Gesclic est une application web SaaS multi-tenant pour la gestion de cliniques médicales. Elle permet aux professionnels de santé de gérer les patients, rendez-vous, dossiers médicaux, ordonnances, paiements et bien plus encore.

## Stack Technique

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router
- **Validation**: Zod
- **Testing**: Vitest + Playwright

## Architecture

### Multi-tenant
- Isolation par clinique avec système de `clinics` et `clinic_members`
- Row Level Security (RLS) sur toutes les tables
- 4 rôles utilisateurs: admin, medecin, secretaire, infirmier

### Structure du Projet

```
src/
├── components/       # Composants UI réutilisables
├── contexts/        # Context API (Auth, Clinic)
├── hooks/          # Hooks personnalisés (usePatients, useAppointments, etc.)
├── integrations/   # Intégrations Supabase
├── lib/            # Utilitaires et helpers
├── pages/          # Pages de l'application
├── types/          # Types TypeScript
└── utils/          # Fonctions utilitaires
```

## Installation

### Prérequis
- Node.js 18+
- Bun ou npm
- Compte Supabase

### Étapes

1. Cloner le repository
```bash
git clone <repository-url>
cd Gesclic
```

2. Installer les dépendances
```bash
bun install
# ou
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Éditer `.env` avec vos clés Supabase (obtenues depuis le dashboard Supabase Gesclic Pro):
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Daily.co (pour Télémédecine)
VITE_DAILY_API_KEY=your_daily_co_api_key

# Webhooks (signature)
VITE_WEBHOOK_SECRET=your_webhook_secret
```

4. Lancer les migrations Supabase
```bash
supabase db push
```

5. Démarrer le serveur de développement
```bash
bun run dev
# ou
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## Scripts Disponibles

- `bun run dev` - Serveur de développement
- `bun run build` - Build pour production
- `bun run preview` - Preview du build de production
- `bun run lint` - Linter le code
- `bun run test` - Lancer les tests unitaires
- `bun run test:e2e` - Lancer les tests E2E (Playwright)

## Pages Principales

- **Dashboard** - Vue d'ensemble de la clinique
- **Patients** - Gestion des patients
- **Rendez-vous** - Calendrier et gestion des RDV
- **Dossiers Médicaux** - Historique médical des patients
- **Ordonnances** - Création et gestion des prescriptions
- **Paiements** - Facturation et paiements
- **Laboratoire** - Résultats d'analyses
- **Pharmacie** - Gestion du stock
- **Personnel** - Gestion de l'équipe
- **Paramètres** - Configuration de la clinique
- **Rapports** - Statistiques et rapports

## Sécurité

- Authentification Supabase avec refresh token automatique
- RLS (Row Level Security) sur toutes les tables
- Protection des routes avec `ProtectedRoute`
- Rôles et permissions granulaires

## Développement

### Hooks Personnalisés
- `usePatients` - Gestion des patients
- `useAppointments` - Gestion des rendez-vous
- `useMedicalRecords` - Gestion des dossiers médicaux
- `usePrescriptions` - Gestion des ordonnances
- `usePayments` - Gestion des paiements

### Composants UI
L'application utilise shadcn/ui pour les composants réutilisables. Les composants personnalisés sont dans `src/components/`.

## Déploiement

### Vercel
1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement à chaque push

### Autres Plateformes
L'application peut être déployée sur Netlify, Railway, ou tout autre supportant les builds Vite.

## Contribution

1. Forker le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commiter (`git commit -m 'Ajouter ma fonctionnalité'`)
4. Pusher (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

## License

[À définir]

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur le repository GitHub.
