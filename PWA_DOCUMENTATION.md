# Documentation PWA - Gesclic

## Vue d'ensemble

Gesclic est configuré comme une Progressive Web App (PWA) complète, permettant l'installation sur desktop et mobile, le fonctionnement offline, et une expérience utilisateur native.

## Configuration Technique

### Dépendances
- `vite-plugin-pwa` v1.3.0 - Plugin Vite pour PWA
- `sharp` - Traitement d'images pour génération d'icônes

### Fichiers de Configuration

#### 1. `vite.config.ts`
Configuration principale du plugin PWA avec:
- **Manifest**: Métadonnées de l'application
- **Workbox**: Stratégies de cache avancées
- **Auto-update**: Mises à jour automatiques du service worker

#### 2. `index.html`
Meta tags PWA pour:
- iOS (apple-mobile-web-app-*)
- Android (theme-color, mobile-web-app-capable)
- SEO (Open Graph, Twitter Cards)
- Performance (preconnect)

#### 3. `src/main.tsx`
Enregistrement du service worker en production uniquement

## Icônes PWA

### Génération
Les icônes sont générées automatiquement depuis le logo source:
```bash
npm run generate-icons
```

### Tailles Générées
- `favicon.ico` - Format ICO multi-taille
- `favicon-16x16.png` - 16x16 pixels
- `favicon-32x32.png` - 32x32 pixels
- `apple-touch-icon.png` - 180x180 pixels (iOS)
- `android-chrome-192x192.png` - 192x192 pixels
- `android-chrome-512x512.png` - 512x512 pixels
- `mask-icon.svg` - SVG pour Safari

### Source
Logo original: `src/assets/Logo_Gesclic.png`

## Stratégies de Cache Workbox

### 1. Supabase API (NetworkFirst)
- **Cache**: `supabase-api-cache`
- **Durée**: 5 minutes
- **Max Entries**: 100
- **Timeout**: 10 secondes
- **Stratégie**: NetworkFirst avec fallback au cache

### 2. Images Statiques (CacheFirst)
- **Cache**: `static-images-cache`
- **Durée**: 30 jours
- **Max Entries**: 200
- **Extensions**: png, jpg, jpeg, svg, gif, webp, ico

### 3. Google Fonts (CacheFirst)
- **Cache**: `google-fonts-cache`
- **Durée**: 1 an
- **Max Entries**: 20
- **Domaines**: fonts.googleapis.com, fonts.gstatic.com

### 4. JavaScript/CSS (StaleWhileRevalidate)
- **Cache**: `static-resources-cache`
- **Durée**: 7 jours
- **Max Entries**: 100
- **Stratégie**: StaleWhileRevalidate pour performance optimale

### 5. Daily.co API (NetworkFirst)
- **Cache**: `daily-api-cache`
- **Durée**: 24 heures
- **Max Entries**: 50
- **Stratégie**: NetworkFirst pour les appels vidéo

## Manifest PWA

### Métadonnées
```json
{
  "name": "Gesclic",
  "short_name": "Gesclic",
  "description": "Système de gestion médicale complet pour les professionnels de santé",
  "theme_color": "#0f172a",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/"
}
```

### Raccourcis
- **Patients**: `/patients` - Gérer les patients
- **Rendez-vous**: `/appointments` - Voir les rendez-vous
- **Télémédecine**: `/telemedicine` - Sessions vidéo

### Catégories
medical, healthcare, productivity, business

## Installation

### Installation sur Desktop (Chrome/Edge)
1. Ouvrir l'application en HTTPS
2. Cliquer sur l'icône d'installation dans la barre d'adresse
3. Confirmer l'installation

### Installation sur Mobile (iOS)
1. Ouvrir dans Safari
2. Cliquer sur "Partager"
3. Choisir "Sur l'écran d'accueil"

### Installation sur Mobile (Android)
1. Ouvrir dans Chrome
2. Cliquer sur le menu (⋮)
3. Choisir "Installer l'application"

## Développement

### Mode Développement
Le service worker n'est pas activé en mode développement pour éviter les problèmes de cache.

### Mode Production
```bash
npm run build
npm run preview
```

### Test du Service Worker
1. Ouvrir Chrome DevTools
2. Aller dans l'onglet "Application"
3. Vérifier "Service Workers"
4. Tester le mode offline

## Mises à jour

### Stratégie
- `skipWaiting: true` - Mise à jour immédiate
- `clientsClaim: true` - Activation immédiate
- `registerType: 'autoUpdate'` - Détection automatique

### Workflow
1. Nouvelle version déployée
2. Service worker détecte la mise à jour
3. Nouveau SW téléchargé en arrière-plan
4. Activation au prochain chargement
5. Les utilisateurs sont notifiés

## Performance

### Optimisations
- Preconnect pour Google Fonts
- Cache des assets statiques
- Lazy loading des routes
- Code splitting automatique
- Compression gzip activée

### Lighthouse Scores Cibles
- Performance: >90
- PWA: 100
- Accessibility: >90
- Best Practices: >90
- SEO: >90

## Sécurité

### HTTPS Requis
La PWA nécessite HTTPS pour fonctionner correctement (sauf localhost).

### Content Security Policy
Configurer CSP pour autoriser:
- `self` pour les ressources locales
- `fonts.googleapis.com` pour les fonts
- `*.supabase.co` pour l'API
- `api.daily.co` pour la vidéo

## Dépannage

### Service Worker ne s'enregistre pas
- Vérifier HTTPS
- Vérifier que le mode est production
- Consulter la console pour les erreurs

### Icônes ne s'affichent pas
- Vérifier les chemins dans le manifest
- Régénérer les icônes avec `npm run generate-icons`
- Vérifier les permissions du dossier public

### Cache obsolète
- Désinstaller la PWA
- Vider le cache du navigateur
- Réinstaller

## Déploiement

### Vercel
La configuration PWA est compatible avec Vercel. Le build automatique génère le service worker.

### Autres Plateformes
Assurer que:
- Le dossier `dist` est servi
- Les fichiers statiques sont accessibles
- HTTPS est activé
- Les headers de cache sont configurés

## Maintenance

### Mise à jour des Icônes
1. Remplacer `src/assets/Logo_Gesclic.png`
2. Exécuter `npm run generate-icons`
3. Rebuild avec `npm run build`

### Mise à jour du Manifest
Modifier `vite.config.ts` dans la section `VitePWA({ manifest: {...} })`

### Ajustement du Cache
Modifier `vite.config.ts` dans la section `workbox.runtimeCaching`

## Ressources

- [Documentation Vite PWA](https://vite-plugin-pwa.netlify.app/)
- [Documentation Workbox](https://developers.google.com/web/tools/workbox)
- [Lighthouse PWA Criteria](https://web.dev/pwa-checklist/)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
