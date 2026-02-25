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

## Pas à pas détaillé — Ce qu’il faut créer dans SharePoint

> Objectif : disposer d’un environnement SharePoint prêt pour l’application **avant** de brancher le code Graph.

### Étape 0 — Préparer les prérequis
1. Vérifier que vous avez un compte avec un rôle permettant de créer des listes/bibliothèques sur le site cible (propriétaire de site recommandé).
2. Confirmer l’URL du site de travail (exemple : `https://<tenant>.sharepoint.com/sites/compliance-navigator`).
3. Lister les personnes qui auront un accès lecture seule, édition, et administration.

### Étape 1 — Créer le site (si non existant)
1. Dans le centre d’administration SharePoint ou depuis la page d’accueil SharePoint, créer un **Site d’équipe** dédié.
2. Nom conseillé : `Compliance Navigator` (ou équivalent métier).
3. Associer un groupe Microsoft 365 uniquement si c’est aligné avec votre gouvernance ; sinon rester sur un site sans groupe.
4. Noter l’URL définitive du site (elle sera requise pour l’identification du `siteId` côté Graph).

### Étape 2 — Créer les listes SharePoint
Créer ces listes avec les noms exacts (ou documenter un mapping strict si vous changez les noms).

#### 2.1 Liste `Projects`
1. Créer une liste vide nommée `Projects`.
2. Ajouter les colonnes minimales :
   - `Title` (texte, obligatoire) : nom du projet.
   - `ProjectId` (texte, obligatoire, unique) : identifiant fonctionnel.
   - `Status` (choix, obligatoire) : `Draft`, `InReview`, `Approved`, `Rejected`.
   - `OwnerEmail` (texte ou personne) : propriétaire du projet.
   - `_version` (nombre, obligatoire, défaut `1`) : version applicative en complément ETag.
   - `LastBusinessUpdate` (date/heure) : dernière mise à jour fonctionnelle.
3. Activer le versioning des éléments de liste (au moins versions majeures).
4. Désactiver les pièces jointes sur la liste si les documents sont gérés exclusivement en bibliothèque.

#### 2.2 Liste `ProjectEdits`
1. Créer une liste vide nommée `ProjectEdits`.
2. Ajouter les colonnes :
   - `Title` (texte) : résumé court de l’édition.
   - `ProjectId` (texte, indexé) : lien logique vers `Projects.ProjectId`.
   - `EditedBy` (texte ou personne).
   - `EditedAt` (date/heure).
   - `PatchJson` (plusieurs lignes de texte, texte brut) : payload de modification.
   - `Result` (choix) : `Applied`, `Conflict`, `Rejected`.
3. Conserver suffisamment d’historique selon vos règles de conformité.

#### 2.3 Liste `InspirationItems`
1. Créer une liste vide nommée `InspirationItems`.
2. Colonnes conseillées :
   - `Title` (texte, obligatoire).
   - `SubmittedBy` (texte ou personne).
   - `SubmittedAt` (date/heure).
   - `Description` (plusieurs lignes de texte).
   - `LinkedProjectId` (texte, optionnel).

#### 2.4 Liste `ReferenceData`
1. Créer une liste vide nommée `ReferenceData`.
2. Colonnes conseillées :
   - `Title` (texte, obligatoire) : clé lisible.
   - `RefType` (choix, obligatoire) : `Rule`, `Team`, `RiskWeight`, `Config`.
   - `RefKey` (texte, obligatoire).
   - `RefValueJson` (plusieurs lignes de texte, texte brut).
   - `IsActive` (oui/non, défaut `Oui`).
3. Activer le versioning (utile pour tracer les changements de paramétrage).

### Étape 3 — Créer la bibliothèque documentaire
1. Créer une bibliothèque nommée `ProjectDocuments`.
2. Ajouter des colonnes de métadonnées :
   - `ProjectId` (texte, obligatoire, indexé).
   - `DocumentType` (choix : `Brief`, `Legal`, `Validation`, `Other`).
   - `ConfidentialityLevel` (choix : `Internal`, `Restricted`).
3. Définir une convention d’arborescence (ex. un dossier par `ProjectId`).
4. Activer le versioning des documents (majeures + mineures si nécessaire).

### Étape 4 — Configurer les permissions SharePoint (site + listes)
1. Créer trois groupes SharePoint (ou réutiliser des groupes existants) :
   - `Compliance Navigator Visitors` (lecture).
   - `Compliance Navigator Members` (contribution/édition).
   - `Compliance Navigator Owners` (contrôle total).
2. Sur le site :
   - attribuer lecture à `Visitors` ;
   - attribuer modification à `Members` ;
   - attribuer contrôle total à `Owners`.
3. Sur les listes sensibles (ex. `ProjectEdits`) :
   - casser l’héritage **uniquement si nécessaire** ;
   - limiter l’accès aux personnes autorisées audit/compliance.
4. Documenter chaque dérogation d’héritage (qui, pourquoi, durée).

### Étape 5 — Valider la structure côté métier/IT
1. Créer 2–3 éléments de test dans chaque liste.
2. Charger 2–3 fichiers test dans `ProjectDocuments`.
3. Vérifier : types de colonnes, champs obligatoires, valeurs de choix, droits effectifs.
4. Exporter un jeu de preuves (captures + checklist) pour validation conjointe métier/IT.

---

## Pas à pas détaillé — Configuration des droits Microsoft Graph

> Objectif : donner à l’application les droits minimums nécessaires, avec consentement et contrôle.

### Étape 1 — Enregistrer l’application dans Entra ID
1. Ouvrir **Microsoft Entra admin center** → **App registrations** → **New registration**.
2. Nommer l’app (ex. `compliance-navigator-spa`).
3. Type de comptes : en général “Single tenant” (sauf besoin multi-tenant explicite).
4. Ajouter la Redirect URI de la SPA (ex. `https://.../index.html` ou URL réelle de l’app hébergée).
5. Enregistrer et conserver : `Application (client) ID` et `Directory (tenant) ID`.

### Étape 2 — Déclarer les permissions Graph minimales
Dans **API permissions** → **Add a permission** → **Microsoft Graph** :

1. **Delegated permissions** (utilisateur connecté) :
   - `User.Read` (profil de l’utilisateur courant, `/me`).
   - `Sites.Read.All` (lecture du site/listes) *ou* `Sites.ReadWrite.All` si écriture requise.
   - `Files.Read.All` (lecture documents) *ou* `Files.ReadWrite.All` si upload/modification.
2. Si l’application doit agir sans utilisateur (batch/service), ajouter en plus des **Application permissions** adaptées (cas plus sensible, à éviter pour une SPA pure).
3. Appliquer le principe de moindre privilège : commencer en lecture, élargir seulement si nécessaire.

### Étape 3 — Demander le consentement administrateur
1. Dans **API permissions**, cliquer **Grant admin consent for <Tenant>**.
2. Vérifier l’état “Granted for …” sur chaque permission.
3. Capturer une preuve (capture écran ou export) pour l’audit sécurité.

### Étape 4 — Configurer l’authentification SPA (MSAL)
1. Dans l’app Entra : **Authentication** → plateforme **Single-page application**.
2. Déclarer toutes les Redirect URI nécessaires (dev/recette/prod).
3. Activer l’émission de tokens compatibles MSAL SPA (ID token / Access token selon besoin).
4. Configurer les URL de logout post-déconnexion si votre politique SSO l’impose.

### Étape 5 — Restreindre l’accès à SharePoint côté ressource
1. Même avec des permissions Graph accordées, l’utilisateur doit avoir des droits SharePoint réels sur le site/listes/documents.
2. Aligner les groupes SharePoint (`Visitors/Members/Owners`) avec les rôles métier.
3. Vérifier qu’un utilisateur sans accès SharePoint ne peut pas lire les données via Graph.

### Étape 6 — Vérifier techniquement les permissions
Exécuter des tests de bout en bout (Postman, Graph Explorer, ou application) :
1. `/me` doit fonctionner avec `User.Read`.
2. Lecture de listes (`/sites/{site-id}/lists/...`) doit fonctionner selon droits.
3. Écriture liste/fichier doit réussir pour un utilisateur éditeur et échouer pour un lecteur.
4. Documenter les statuts attendus (200/201 en succès, 403 en refus).

### Étape 7 — Tableau de mapping recommandé (droit ↔ usage)
| Usage applicatif | Permission Graph minimale | Type | Remarque |
|---|---|---|---|
| Lire l’utilisateur connecté | `User.Read` | Delegated | Indispensable pour personnaliser l’UI |
| Lire les listes SharePoint | `Sites.Read.All` | Delegated | Suffisant en mode consultation |
| Créer/modifier des items de liste | `Sites.ReadWrite.All` | Delegated | Requis pour CRUD métier |
| Lire des documents | `Files.Read.All` | Delegated | Pour affichage/téléchargement |
| Ajouter/modifier des documents | `Files.ReadWrite.All` | Delegated | Pour dépôt et mise à jour |

### Étape 8 — Checklist de conformité sécurité
- [ ] Principe de moindre privilège documenté.
- [ ] Consentement admin tracé.
- [ ] Rôles métier ↔ groupes SharePoint validés.
- [ ] Tests d’accès positif/négatif exécutés.
- [ ] Journalisation des accès et modifications définie.

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
