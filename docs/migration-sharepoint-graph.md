# Plan de migration vers SharePoint + Microsoft Graph

## Objectif
Préparer **dès maintenant** la migration de l’application vers un hébergement SharePoint, avec une future connexion à **Microsoft Graph** pour :

- récupérer les informations du **current user** ;
- lire/écrire les données métiers dans des **listes SharePoint** ;
- gérer les modifications continues et simultanées (ex. projets) ;
- stocker les fichiers projet directement dans SharePoint.

---

## Phase 1 — Pré-lancement (sans accès API)

### 1) Cadrage cible (architecture)
- Hébergement de la webapp sur SharePoint (site dédié ou espace applicatif).
- Données structurées dans des **listes SharePoint**.
- Fichiers déposés dans une **bibliothèque de documents** SharePoint.
- Appel Microsoft Graph via une couche d’accès (service unique côté front).

### 2) Préparer le modèle de données “SharePoint-ready”
Définir les listes cibles (exemples minimum) :

- `Projects` : métadonnées projet, statut, owner, version de ligne.
- `ProjectEdits` : journal des modifications (audit).
- `InspirationItems` : inspirations soumises.
- `ReferenceData` : dictionnaires de configuration (règles, équipes, pondérations).

Créer les schémas mock (JSON) dans le repo pour figer les contrats de données.

### 3) Simuler Microsoft Graph localement
- Continuer d’utiliser un mock current user (`src/data/graph-current-user.json`).
- Ajouter des mocks de listes SharePoint (fichiers JSON) pour valider :
  - création projet ;
  - mise à jour concurrente (version/etag simulé) ;
  - reprise en cas de conflit.

### 4) Préparer la couche d’accès aux données
Mettre en place une abstraction unique (pattern conseillé) :

- `dataProvider.getCurrentUser()`
- `dataProvider.listProjects()`
- `dataProvider.createProject()`
- `dataProvider.updateProject(id, patch, version)`

En pré-lancement, l’implémentation lit/écrit dans les fichiers mock. Le jour J, on remplace uniquement l’implémentation par Graph.

### 5) Préparer la gestion de concurrence
Pour les mises à jour simultanées :
- stocker un champ de version (`_version`) ou ETag simulé dans chaque enregistrement ;
- envoyer la version connue au moment de sauvegarder ;
- refuser la sauvegarde si version obsolète et proposer :
  - rechargement,
  - fusion,
  - ou écrasement explicite.

### 6) Préparer la sécurité et la gouvernance
- Lister les permissions Graph nécessaires (lecture profil, lecture/écriture listes/fichiers).
- Définir rôles fonctionnels (lecteur, éditeur, admin compliance).
- Définir politique de journalisation (qui modifie quoi et quand).

### 7) Checklist de readiness (avant clé API)
- [ ] Schémas de listes validés métier/IT.
- [ ] Mocks de listes disponibles dans le repo.
- [ ] Contrats dataProvider stabilisés.
- [ ] Scénarios de conflit testés localement.
- [ ] Plan de bascule documenté (feature flag Graph).

---

## Phase 2 — Mise en service (API obtenue)

## Informations à me fournir dès que vous avez la clé API

Pour que je puisse implémenter rapidement l’intégration Graph avec Codex, merci de préparer les éléments suivants :

### 1) Accès et authentification
- Tenant ID (Entra ID).
- Client ID de l’application enregistrée.
- Mode d’authentification attendu (SPA + PKCE recommandé, ou autre contrainte interne).
- URI(s) de redirection autorisées (dev, recette, prod).
- Environnements disponibles et URL SharePoint associées.

### 2) Cible SharePoint
- URL du site SharePoint cible.
- Identifiants/noms exacts des listes à utiliser (`Projects`, `ProjectEdits`, `InspirationItems`, etc.).
- Schéma de chaque liste : nom interne des colonnes, type, obligatoire/non, valeurs autorisées.
- Bibliothèque documentaire cible (nom, arborescence attendue, convention de nommage).

### 3) Permissions Graph et sécurité
- Permissions Graph accordées (ex. `User.Read`, `Sites.ReadWrite.All`, `Files.ReadWrite.All`) et état du consentement admin.
- Règles d’autorisation métier (qui peut lire/éditer/valider).
- Contraintes sécurité/compliance (rétention, masquage, journalisation, DLP éventuelle).

### 4) Contrats fonctionnels à figer
- Mapping final entre les champs UI actuels et les colonnes SharePoint.
- Règles de gestion sur les statuts et transitions.
- Politique de gestion des conflits (rechargement, fusion, écrasement autorisé ou non).
- Stratégie de versionnage (ETag uniquement ou champ fonctionnel complémentaire).

### 5) Exploitation et observabilité
- Stratégie d’environnements (feature flag, pilote, généralisation).
- Niveau de logs attendu (technique + audit métier).
- Politique de retry/timeouts et gestion du throttling.
- Contact(s) référent(s) IT/Sécu pour lever rapidement les blocages.

### 6) Données de test minimales
- 2–3 utilisateurs de test avec rôles différents.
- Un jeu de données SharePoint de test (projets, inspirations, pièces jointes).
- 1 scénario de conflit d’édition reproductible.

Avec ces éléments, je pourrai coder la couche `dataProvider` Graph, brancher l’authentification, implémenter les accès listes/fichiers et activer la gestion de concurrence avec un plan de bascule maîtrisé.

### 1) Enregistrement applicatif Azure AD / Entra ID
- Créer l’application.
- Configurer les URI de redirection.
- Générer secret/certificat selon stratégie.
- Activer les permissions Graph requises + consentement admin.

### 2) Authentification et tokens
- Intégrer la librairie d’authentification Microsoft (MSAL).
- Implémenter login/logout et renouvellement de token.
- Brancher `getCurrentUser()` sur `/me` via Graph.

### 3) Brancher les listes SharePoint
Remplacer la couche mock par les appels Graph vers :
- sites,
- listes,
- items,
- drive/files.

Conserver la même interface `dataProvider` pour éviter les impacts UI.

### 4) Activer la concurrence réelle
- Utiliser l’ETag SharePoint/Graph.
- Sur update, envoyer la précondition version.
- En cas de `412 Precondition Failed`, afficher un flow de résolution de conflit.

### 5) Migration des données initiales
- Importer les données locales (JSON actuels) dans les listes SharePoint.
- Contrôler la cohérence des champs obligatoires.
- Vérifier traçabilité (création/modification/date/auteur).

### 6) Durcissement production
- Monitoring des erreurs Graph.
- Retries sur erreurs transitoires (throttling, timeouts).
- Sauvegarde/reprise des brouillons côté client en cas de coupure.

### 7) Go-live progressif
- Feature flag pour activer Graph par population pilote.
- Recette utilisateur (création, édition simultanée, pièces jointes).
- Généralisation après validation.

---

## Stratégie recommandée de fichiers sur SharePoint
- **Listes** : données structurées (projets, statuts, champs de gouvernance).
- **Bibliothèque de documents** : livrables, annexes, exports.
- Lier chaque document à un `projectId` pour garder une vue 360.

---

## Risques clés à anticiper
- Limites SharePoint (volumétrie, colonnes lookup, throttling).
- Conflits d’édition non gérés côté UI.
- Permissions trop larges (sécurité).
- Couplage trop fort UI ↔ API (à éviter via `dataProvider`).

---

## Livrables préparés dans ce repo
- Plan de migration (ce document).
- Mocks de listes SharePoint dans `sharepoint-mocks/lists/`.
- Mock current user déjà présent dans `src/data/graph-current-user.json`.
