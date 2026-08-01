# Guide de Tests Manuels - Phases 1 & 2

Ce document décrit les procédures de test manuel pour toutes les fonctionnalités des Phases 1 & 2 de Gesclic.

## Prérequis

- Environnement de staging configuré
- Variables d'environnement définies (VITE_DAILY_API_KEY, VITE_WEBHOOK_SECRET)
- Base de données Supabase avec migrations appliquées
- Compte utilisateur avec rôle admin pour tests complets

---

## Phase 1: Télémédecine

### Test 1: Création de Session Vidéo
1. Naviguer vers `/telemedicine`
2. Cliquer sur "Nouvelle Session"
3. Sélectionner un rendez-vous existant
4. Vérifier que la session est créée avec statut "scheduled"
5. Confirmer que le room Daily.co est généré

### Test 2: Rejoindre une Session
1. Sélectionner une session "scheduled"
2. Cliquer sur "Rejoindre"
3. Vérifier que le statut passe à "in_progress"
4. Confirmer que l'interface vidéo s'affiche
5. Tester la qualité vidéo et audio

### Test 3: Terminer une Session
1. Pendant une session active, cliquer sur "Terminer"
2. Remplir les notes cliniques (optionnel)
3. Vérifier que le statut passe à "completed"
4. Confirmer que la durée est enregistrée

### Test 4: Configuration des Paramètres
1. Aller à l'onglet "Paramètres"
2. Modifier les options (recording, screen sharing, etc.)
3. Sauvegarder
4. Vérifier que les modifications sont persistées

---

## Phase 1: Sécurité

### Test 1: Activation MFA
1. Naviguer vers `/security`
2. Dans l'onglet MFA, cliquer sur "Activer MFA"
3. Vérifier que le QR code s'affiche
4. Scanner le QR code avec Google Authenticator
5. Entrer le code à 6 chiffres
6. Confirmer que MFA est activé

### Test 2: Vérification MFA
1. Après activation, se déconnecter
2. Se reconnecter
3. Vérifier que le code MFA est demandé
4. Entrer un code incorrect → doit échouer
5. Entrer le code correct → doit réussir

### Test 3: Codes de Secours
1. Dans les paramètres MFA, afficher les codes de secours
3. Copier un code de secours
4. Utiliser un code de secours pour la connexion
5. Vérifier que le code utilisé est invalidé

### Test 4: Désactivation MFA
1. Cliquer sur "Désactiver MFA"
2. Confirmer dans la boîte de dialogue
3. Vérifier que MFA est désactivé
4. Se reconnecter sans MFA

### Test 5: Logs d'Audit
1. Aller à l'onglet "Audit"
2. Vérifier que les actions sont enregistrées
3. Filtrer par date et utilisateur
4. Confirmer l'export CSV fonctionne

### Test 6: Événements de Sécurité
1. Aller à l'onglet "Événements"
2. Vérifier les événements de sécurité
3. Marquer un événement comme résolu
4. Ajouter des notes de résolution

---

## Phase 1: Analytics Avancés

### Test 1: Dashboard Revenus
1. Naviguer vers `/advanced-analytics`
2. Aller à l'onglet "Revenus"
3. Vérifier que les graphiques s'affichent
4. Changer la période (7j, 30j, 90j)
5. Confirmer que les données se mettent à jour

### Test 2: Métriques Patients
1. Aller à l'onglet "Patients"
2. Vérifier les métriques (acquisition, rétention, satisfaction)
3. Filtrer par période
4. Confirmer l'export des données

### Test 3: Métriques Opérationnelles
1. Aller à l'onglet "Opérations"
2. Vérifier le taux d'utilisation des rendez-vous
3. Vérifier le taux de no-show
4. Vérifier l'efficacité du personnel

### Test 4: Santé Financière
1. Aller à l'onglet "Finance"
2. Vérifier les ratios financiers
3. Vérifier la marge bénéficiaire
4. Vérifier le flux de trésorerie

### Test 5: Performance des Prestataires
1. Aller à l'onglet "Prestataires"
2. Vérifier les statistiques par médecin
3. Trier par taux de complétion
4. Vérifier les détails individuels

### Test 6: Rafraîchissement des Données
1. Cliquer sur "Rafraîchir"
2. Vérifier que les vues matérialisées sont mises à jour
3. Confirmer que les données sont à jour

---

## Phase 2: API Platform

### Test 1: Création de Clé API
1. Naviguer vers `/api-platform`
2. Aller à l'onglet "Clés API"
3. Cliquer sur "Nouvelle Clé"
4. Remplir le nom et les scopes
5. Sélectionner le tier de rate limiting
6. Créer et copier la clé

### Test 2: Validation de Clé API
1. Utiliser la clé générée dans une requête API
2. Vérifier que la clé est validée
3. Tester avec une clé invalide → doit échouer
4. Tester avec une clé inactive → doit échouer

### Test 3: Rate Limiting
1. Faire plusieurs requêtes rapidement
2. Vérifier que le rate limiting fonctionne
3. Attendre la fin de la fenêtre
4. Confirmer que les requêtes reprennent

### Test 4: Logs de Requêtes
1. Aller à l'onglet "Logs"
2. Faire quelques requêtes API
3. Vérifier que les logs apparaissent
4. Filtrer par statut, méthode, chemin
5. Vérifier les détails d'une requête

### Test 5: Statistiques d'Utilisation
1. Aller à l'onglet "Statistiques"
2. Vérifier le nombre total de requêtes
3. Vérifier le temps de réponse moyen
4. Vérifier le taux de succès
5. Vérifier les IPs uniques

### Test 6: Gestion des Webhooks
1. Aller à l'onglet "Webhooks"
2. Créer une nouvelle souscription
3. Définir l'URL et les événements
4. Activer la souscription
5. Tester la livraison

### Test 7: Documentation API
1. Aller à l'onglet "Documentation"
2. Vérifier que les endpoints sont listés
3. Consulter les détails d'un endpoint
4. Vérifier les exemples de requêtes

---

## Phase 2: Workflow Automation

### Test 1: Création de Workflow
1. Naviguer vers `/workflow-automation`
2. Aller à l'onglet "Workflows"
3. Cliquer sur "Nouveau Workflow"
4. Définir le nom et la description
5. Créer des nœuds (trigger, action)
6. Connecter les nœuds
7. Sauvegarder le workflow

### Test 2: Activation de Workflow
1. Sélectionner un workflow en draft
2. Cliquer sur "Activer"
3. Vérifier que le statut passe à "active"
4. Confirmer que le workflow est exécutable

### Test 3: Exécution Manuelle
1. Sélectionner un workflow actif
2. Cliquer sur "Exécuter"
3. Fournir les données d'entrée
4. Vérifier que l'exécution démarre
5. Suivre la progression

### Test 4: Historique d'Exécution
1. Aller à l'onglet "Exécutions"
2. Vérifier l'historique des exécutions
3. Voir les détails d'une exécution
4. Vérifier les logs d'exécution
5. Vérifier les données de sortie

### Test 5: Templates de Workflow
1. Aller à l'onglet "Templates"
2. Parcourir les templates disponibles
3. Créer un workflow depuis un template
4. Personnaliser le workflow
5. Sauvegarder

### Test 6: Variables de Workflow
1. Sélectionner un workflow
2. Aller à l'onglet "Variables"
3. Ajouter une variable
4. Modifier une variable
5. Supprimer une variable

### Test 7: Pause et Archivage
1. Mettre en pause un workflow actif
2. Vérifier que les exécutions s'arrêtent
3. Archiver un workflow
4. Vérifier qu'il n'apparaît plus dans la liste active

---

## Phase 2: Webhooks

### Test 1: Création de Souscription
1. Naviguer vers `/webhooks`
2. Cliquer sur "Nouvelle Souscription"
3. Définir le nom et l'URL
4. Sélectionner les événements
5. Créer et copier le secret

### Test 2: Test de Livraison
1. Sélectionner une souscription
2. Cliquer sur "Tester"
3. Vérifier que le webhook est livré
4. Confirmer la réponse du serveur

### Test 3: Historique d'Événements
1. Aller à l'onglet "Événements"
2. Vérifier l'historique des livraisons
3. Filtrer par statut (succès, échec)
4. Voir les détails d'un événement

### Test 4: Retry de Webhook
1. Sélectionner un événement échoué
2. Cliquer sur "Réessayer"
3. Vérifier que la livraison est réessayée
4. Confirmer le succès ou l'échec

### Test 5: Statistiques de Livraison
1. Aller à l'onglet "Statistiques"
2. Vérifier le taux de succès
3. Vérifier le nombre total de livraisons
4. Vérifier les échecs

### Test 6: Modification de Souscription
1. Sélectionner une souscription
2. Modifier l'URL ou les événements
3. Sauvegarder
4. Tester la nouvelle configuration

### Test 7: Régénération du Secret
1. Sélectionner une souscription
2. Cliquer sur "Régénérer le Secret"
3. Confirmer l'action
4. Copier le nouveau secret

---

## Tests Cross-Fonctionnels

### Test 1: RBAC (Contrôle d'Accès)
1. Se connecter avec différents rôles (admin, medecin, secretaire)
2. Vérifier que l'accès aux pages est correct
3. Confirmer que les actions sont limitées selon le rôle

### Test 2: Responsive Design
1. Tester sur desktop (1920x1080)
2. Tester sur tablette (768x1024)
3. Tester sur mobile (375x667)
4. Vérifier que l'UI est adaptée

### Test 3: Performance
1. Mesurer le temps de chargement des pages
2. Vérifier que les animations sont fluides
3. Confirmer que les requêtes API sont rapides

### Test 4: Error Handling
1. Simuler des erreurs réseau
2. Vérifier que les messages d'erreur sont clairs
3. Confirmer que les toast notifications s'affichent

### Test 5: Loading States
1. Vérifier que les loaders s'affichent pendant le chargement
2. Confirmer que les états vides sont gérés
3. Vérifier que les boutons sont désactivés pendant les actions

---

## Checklist de Validation

- [ ] Toutes les pages chargent sans erreur
- [ ] Tous les formulaires valident correctement
- [ ] Toutes les API calls réussissent
- [ ] Les notifications toast s'affichent
- [ ] Les états de chargement sont visibles
- [ ] Le responsive design fonctionne
- [ ] Le RBAC est correctement appliqué
- [ ] Les erreurs sont gérées gracieusement
- [ ] Les données sont persistées correctement
- [ ] Les exports fonctionnent

---

## Rapport de Bugs

Documenter tout bug trouvé avec:
- Description détaillée
- Étapes pour reproduire
- Comportement attendu vs réel
- Capture d'écran si applicable
- Sévérité (blocant, critique, majeur, mineure)
