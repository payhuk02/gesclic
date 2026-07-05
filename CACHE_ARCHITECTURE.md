# Architecture de Cache - Gesclic

## Vue d'Ensemble

Gesclic implémente une architecture de cache multi-niveaux robuste et enterprise-grade, conçue pour offrir des performances optimales, une expérience offline-first, et une scalabilité exceptionnelle. Cette architecture s'inspire des meilleures pratiques de plateformes comme Shopify, Stripe et Vercel.

## Architecture Multi-Niveaux

### Niveau 1: Memory Cache (RAM)
- **Vitesse**: Ultra-rapide (< 1ms)
- **Capacité**: 100 entrées maximum
- **Durée**: Volatile (perdu au rechargement)
- **Utilisation**: Données très fréquemment accédées

### Niveau 2: IndexedDB (Persistent)
- **Vitesse**: Rapide (~10-50ms)
- **Capacité**: Plusieurs GB
- **Durée**: Persistante (survive au rechargement)
- **Utilisation**: Données critiques et offline

### Niveau 3: React Query (Application)
- **Vitesse**: Variable (dépend du cache)
- **Capacité**: Configurable
- **Durée**: Session
- **Utilisation**: Gestion d'état serveur

### Niveau 4: Service Worker (Network)
- **Vitesse**: Variable (dépend du réseau)
- **Capacité**: Illimitée
- **Durée**: Configurable (Workbox)
- **Utilisation**: Assets statiques et API

## Composants Principaux

### 1. Cache Service (`src/lib/cache/cache-service.ts`)

Service central de gestion du cache multi-niveaux.

#### Fonctionnalités Clés
- **Get**: Récupération hiérarchique (Memory → IndexedDB → Network)
- **Set**: Écriture simultanée sur tous les niveaux
- **Delete**: Suppression synchronisée
- **Invalidate**: Invalidation par tags
- **Cleanup**: Nettoyage automatique des entrées expirées
- **Warmup**: Préchargement des données critiques
- **Prefetch**: Préfetch intelligent

#### Configuration TTL
```typescript
SHORT: 5 minutes          // Données volatiles
MEDIUM: 15 minutes        // Données standard
LONG: 1 heure            // Données stables
VERY_LONG: 24 heures     // Données persistantes
PERSISTENT: 7 jours      // Données critiques
```

#### Tags d'Invalidation
```typescript
PATIENTS, APPOINTMENTS, MEDICAL_RECORDS, PRESCRIPTIONS,
PAYMENTS, STAFF, CLINIC_SETTINGS, USER_PROFILE,
TELEmedicine, API_KEYS, WEBHOOKS, WORKFLOWS, ANALYTICS
```

### 2. IndexedDB (`src/lib/cache/db.ts`)

Base de données persistante pour le cache offline.

#### Schéma
```typescript
interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  tags: string[];
  metadata?: Record<string, any>;
}
```

#### Avantages
- Persistance des données
- Capacité élevée
- Recherche par tags
- Métadonnées flexibles

### 3. React Query Config (`src/lib/cache/react-query-config.ts`)

Configuration avancée de React Query.

#### Stratégies
- **staleTime**: 15 minutes par défaut
- **gcTime**: 24 heures
- **retry**: Intelligent (pas sur 4xx)
- **refetchOnWindowFocus**: Désactivé (meilleur UX)
- **refetchOnReconnect**: Activé
- **networkMode**: online-only

#### Query Keys
Générateurs de clés cohérents pour:
- Patients
- Appointments
- Medical Records
- Prescriptions
- Payments
- Staff
- Clinic Settings
- Analytics

### 4. Cache Warming (`src/lib/cache/cache-warming.ts`)

Service de préchargement des données critiques.

#### Stratégies de Warmup
- **User Data**: Profile, settings, staff
- **Dashboard**: Appointments, patients, analytics
- **Patient Detail**: Records, prescriptions, history

#### Hook React
```typescript
const { warmDashboard, warmPatient } = useCacheWarming();
```

### 5. Cache Invalidation (`src/lib/cache/cache-invalidation.ts`)

Service d'invalidation automatique et temps réel.

#### Mécanismes
- **Manuel**: Par tags ou clés
- **Automatique**: Supabase Realtime
- **Événementiel**: Système d'événements personnalisé

#### Réactions aux Changements
- Patient → Invalide records, prescriptions, appointments
- Appointment → Invalide analytics, calendar
- Settings → Invalide staff, configuration
- Payment → Invalide analytics, invoices

### 6. Cache Monitoring (`src/lib/cache/cache-monitoring.ts`)

Service de monitoring et métriques.

#### Métriques Collectées
- Hit rate / Miss rate
- Temps de réponse moyen
- Erreurs
- Par endpoint
- Par tag

#### États de Santé
- **Healthy**: Hit rate ≥ 70%, errors < 10
- **Degraded**: Hit rate ≥ 50%, errors < 50
- **Unhealthy**: Hit rate < 50% ou errors ≥ 50

#### Rapports
- Performance summary
- Top endpoints
- Top tags
- Recommendations

### 7. Offline-First (`src/lib/cache/offline-first.ts`)

Service pour fonctionnement offline.

#### Fonctionnalités
- **Queue d'opérations**: Sync quand back online
- **Retry automatique**: Jusqu'à 3 tentatives
- **Données offline**: Fallback intelligent
- **Prefetch offline**: Préchargement critique

#### Hook React
```typescript
const { isOnline, queueStatus, getOfflineData } = useOfflineFirst();
```

## Hooks Personnalisés

### useCachedQuery
Hook pour requêtes avec cache multi-niveaux.

```typescript
const { data, isLoading } = useCachedQuery(
  'key',
  fetcher,
  { ttl: CACHE_TTL.MEDIUM, tags: [CACHE_TAGS.PATIENTS] }
);
```

### usePatient
Hook optimisé pour les données patients.

```typescript
const { data } = usePatient(patientId, fetcher);
// Auto-prefetch medical records et prescriptions
```

### useAppointments
Hook pour les rendez-vous avec refresh automatique.

```typescript
const { data } = useAppointments(filters, fetcher);
// Refetch toutes les 5 minutes
```

### useClinicSettings
Hook pour les settings avec cache longue durée.

```typescript
const { data } = useClinicSettings(clinicId, fetcher);
// Cache 24 heures
```

### useCacheStats
Hook pour monitoring en temps réel.

```typescript
const stats = useCacheStats();
// { hits, misses, hitRate, size, byTag }
```

### useOfflineData
Hook pour données offline-first.

```typescript
const { data, isOnline } = useOfflineData(key, fetcher);
// Fonctionne offline avec cached data
```

## Stratégies de Cache par Type de Données

### Patients
- **TTL**: LONG (1 heure)
- **Tags**: PATIENTS
- **Warming**: Sur dashboard et liste
- **Invalidation**: Sur modification

### Appointments
- **TTL**: SHORT (5 minutes)
- **Tags**: APPOINTMENTS
- **Refresh**: Toutes les 5 minutes
- **Invalidation**: Sur création/modification

### Medical Records
- **TTL**: MEDIUM (15 minutes)
- **Tags**: MEDICAL_RECORDS
- **Prefetch**: Avec patient detail
- **Invalidation**: Sur modification

### Clinic Settings
- **TTL**: VERY_LONG (24 heures)
- **Tags**: CLINIC_SETTINGS
- **Warming**: Au login
- **Invalidation**: Sur modification admin

### Analytics
- **TTL**: MEDIUM (15 minutes)
- **Tags**: ANALYTICS
- **Refresh**: Manuel ou périodique
- **Invalidation**: Sur nouvelles données

## Patterns de Utilisation

### Pattern 1: Cache-Aside
```typescript
const data = await cacheService.get(key);
if (!data) {
  const fresh = await fetcher();
  await cacheService.set(key, fresh);
}
```

### Pattern 2: Write-Through
```typescript
await api.update(data);
await cacheService.set(key, data);
await cacheInvalidationService.invalidateByTags(tags);
```

### Pattern 3: Write-Behind (Offline)
```typescript
if (!isOnline) {
  await offlineFirstService.queueOperation({
    type: 'update',
    endpoint: 'patients',
    data
  });
} else {
  await api.update(data);
}
```

### Pattern 4: Refresh-Ahead
```typescript
// Préfetch data avant navigation
cacheService.prefetch(nextPageKey, fetcher);
```

## Performance

### Benchmarks Cibles
- **Memory Cache**: < 1ms
- **IndexedDB**: < 50ms
- **React Query**: < 100ms
- **Hit Rate**: > 70%
- **Offline Recovery**: < 1s

### Optimisations
- Code splitting automatique
- Lazy loading des routes
- Compression gzip
- Prefetch DNS
- Preconnect aux APIs critiques

## Sécurité

### Protection des Données
- Chiffrement IndexedDB (optionnel)
- Sanitization des données
- Validation des entrées
- Rate limiting

### Gestion des Erreurs
- Fallback graceful
- Retry avec backoff
- Error boundaries
- Logging structuré

## Monitoring

### Métriques Clés
- Cache hit rate
- Average response time
- Error rate
- Queue size (offline)
- Storage usage

### Alertes
- Hit rate < 50%
- Error rate > 10%
- Queue size > 100
- Storage > 80%

## Déploiement

### Configuration Production
```typescript
const queryClient = createQueryClient();
queryClient.setDefaultOptions({
  queries: {
    staleTime: CACHE_TTL.MEDIUM,
    gcTime: CACHE_TTL.VERY_LONG,
    retry: 3,
  }
});
```

### Monitoring Production
- Intégration avec APM (Datadog, New Relic)
- Export des métriques
- Alertes automatiques
- Dashboards personnalisés

## Maintenance

### Nettoyage Automatique
- Cleanup toutes les 5 minutes
- Suppression des entrées expirées
- Éviction LRU quand plein
- Compression des données

### Mises à Jour
- Migration du schéma IndexedDB
- Mise à jour des stratégies TTL
- Ajustement des tags
- Optimisation des queries

## Best Practices

### ✅ À Faire
1. Toujours utiliser les hooks personnalisés
2. Définir des tags cohérents
3. Configurer TTL appropriés
4. Implémenter l'invalidation
5. Monitorer les métriques
6. Tester le mode offline
7. Précharger les données critiques

### ❌ À Éviter
1. Contourner le cache service
2. TTL trop courts ou trop longs
3. Oublier l'invalidation
4. Ignorer les erreurs de cache
5. Surcharger le memory cache
6. Ne pas tester offline
7. Hardcoder les clés de cache

## Exemples d'Implémentation

### Exemple 1: Patient Detail
```typescript
function PatientDetail({ patientId }) {
  const { data: patient } = usePatient(patientId, fetchPatient);
  const { data: records } = useQuery({
    queryKey: queryKeys.medicalRecords.patient(patientId),
    queryFn: fetchMedicalRecords
  });
  
  // Auto-prefetch des prescriptions
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.prescriptions.patient(patientId)
    });
  }, [patientId]);
  
  return <PatientView patient={patient} records={records} />;
}
```

### Exemple 2: Mutation avec Invalidation
```typescript
function UpdatePatientForm({ patientId }) {
  const mutation = useMutation({
    mutationFn: updatePatient,
    onSuccess: () => {
      cacheInvalidationService.onPatientChange(patientId, 'update');
    }
  });
  
  return <Form onSubmit={mutation.mutate} />;
}
```

### Exemple 3: Offline-First
```typescript
function PatientList() {
  const { data, isOnline } = useOfflineData(
    'patients',
    fetchPatients
  );
  
  if (!isOnline) {
    return <OfflineWarning data={data} />;
  }
  
  return <PatientTable patients={data} />;
}
```

## Ressources

- [Dexie.js Documentation](https://dexie.org/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Offline-First Patterns](https://web.dev/offline-first/)

## Support

Pour toute question ou problème lié à l'architecture de cache:
1. Consulter cette documentation
2. Vérifier les métriques de monitoring
3. Consulter les logs du cache service
4. Contacter l'équipe d'architecture
