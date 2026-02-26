# Plan détaillé de migration vers SharePoint + Microsoft Graph

## 1) Objectif cible

Migrer la webapp pour :
- authentifier et identifier le **current user** via Microsoft Graph,
- stocker les données collaboratives dans des **listes SharePoint**,
- enregistrer les modifications **au fil de l’eau** (autosave),
- gérer les **modifications simultanées** (co-édition) côté webapp et backoffice,
- conserver le bouton **Soumettre** (chef de projet) qui déclenche l’envoi automatique d’un e-mail via Graph,
- centraliser les pièces jointes/fichiers dans SharePoint.

> Conséquence produit : suppression des boutons “Enregistrer” et “Charger”, remplacés par synchronisation continue, indicateurs d’état (“sauvegardé”, “sync en cours”, “conflit détecté”), et mécanismes de reprise.

---

## 2) Architecture cible (vue d’ensemble)

### 2.1 Composants
- **Frontend webapp** (existant) :
  - couche d’accès données abstraite (`DataProvider`) ;
  - mode actuel local/mock + futur mode Graph ;
  - gestion d’état optimiste + synchronisation asynchrone.
- **SharePoint Online** :
  - listes métier (projets, inspirations, commentaires, sticky notes, etc.) ;
  - bibliothèques de documents pour les fichiers.
- **Microsoft Graph API** :
  - `/me` pour current user ;
  - endpoints SharePoint Lists / DriveItem ;
  - envoi d’e-mail lors de la soumission (`/users/{id}/sendMail` ou `/me/sendMail` selon modèle d’autorisation).
- **Backoffice** :
  - même couche d’autosave + gestion de conflits ;
  - mêmes règles de concurrence, journalisation et audit.

### 2.2 Principes de concurrence
- **Autosave incrémental** : envoi différé (debounce 500–1200ms) + flush immédiat sur blur/changement de section.
- **Versionning** : utiliser eTag/`lastModifiedDateTime` + colonne `rowVersion` pour détecter les conflits.
- **Conflits** :
  - tentative de fusion champ par champ si possible,
  - sinon créer un état “conflit” avec proposition de résolution.
- **Traçabilité** : journal d’édition (qui, quand, quoi) pour audit compliance.

---

## 3) Phase de pré-lancement (sans clé API)

Objectif : tout préparer pour brancher l’API en quelques heures dès que vous avez les accès.

### 3.1 Préparer le code (sans dépendre de Graph)
1. **Créer une couche d’abstraction unique** pour les accès données :
   - `GraphDataProvider` (futur réel),
   - `MockSharePointProvider` (immédiat, local JSON).
2. **Remplacer les points de persistance directe** (local storage/export manuel) par ce provider.
3. **Activer l’autosave global** :
   - suppression logique des actions “save/load” dans les flows,
   - sauvegarde automatique sur toute modification de projet/inspiration/showcase/commentaires/backoffice.
4. **Ajouter un gestionnaire de file d’attente offline** :
   - queue des patchs non envoyés,
   - retry exponentiel,
   - indicateur de synchronisation.
5. **Ajouter la gestion de concurrence** :
   - conserver `etag` / `rowVersion` côté client,
   - refuser mise à jour si version obsolète,
   - récupération + comparaison + UI de résolution.

### 3.2 Préparer les mocks “façon SharePoint”
Utiliser des fichiers JSON structurés comme des listes SharePoint pour simuler les opérations CRUD et les collisions.

Fichiers mock recommandés (et fournis dans ce repo) :
- `mock-sharepoint-lists/projects.json`
- `mock-sharepoint-lists/inspirations.json`
- `mock-sharepoint-lists/showcase-sticky-notes.json`
- `mock-sharepoint-lists/compliance-comments.json`
- `mock-sharepoint-lists/project-discussions.json`
- `mock-sharepoint-lists/backoffice-changes.json`
- `mock-sharepoint-lists/project-members.json`
- `mock-sharepoint-lists/files-index.json`

### 3.3 Préparer les règles UX collaboration
- Afficher en permanence un statut : “Synchronisé”, “Synchronisation…”, “Hors ligne”, “Conflit”.
- Afficher “Dernière modification par X à HH:mm”.
- Avertir avant soumission si des changements sont encore en queue.
- Sur showcase/sticky notes : synchronisation quasi temps réel (polling court ou subscriptions plus tard).

### 3.4 Gouvernance et sécurité (à anticiper)
- Définir rôles : chef de projet, équipe compliance, administrateur/backoffice.
- Cartographier droits SharePoint par liste et colonne sensible.
- Préparer stratégie RGPD : rétention, archivage, suppression, export.
- Définir modèle d’audit minimal : `createdBy`, `updatedBy`, `updatedAt`, `changeReason`.

---

## 4) Phase de pré-développement (design SharePoint détaillé)

## 4.1 Listes SharePoint à créer

### A. `Projects`
- `ProjectId` (texte unique)
- `Title`
- `Status` (Draft / Submitted / InReview / Approved / Rejected)
- `OwnerEmail`
- `CurrentEditorEmail`
- `AnswersJson` (multiline JSON)
- `AnalysisJson` (multiline JSON)
- `ProgressAnswered`
- `ProgressTotal`
- `SubmissionDate`
- `LastAutosaveAt`
- `RowVersion`
- `CreatedByEmail`, `UpdatedByEmail`

### B. `Inspirations`
- `InspirationId`
- `Title`
- `Visibility` (Personal / Shared)
- `InspirationJson` (multiline JSON : labName, target, typology, therapeuticArea, country, description, link, review, documents, etc.)
- `RowVersion`
- `CreatedByEmail`, `UpdatedByEmail`, `UpdatedAt`

### C. `ShowcaseStickyNotes`
- `StickyId`
- `ProjectId`
- `ShowcaseSection`
- `AnchorJson` (position/zone)
- `Content`
- `Color`
- `Resolved` (bool)
- `RowVersion`
- `CreatedByEmail`, `UpdatedByEmail`, `UpdatedAt`

### D. `ComplianceComments`
- `CommentId`
- `ProjectId`
- `SectionKey`
- `Message`
- `CommentType` (Question / Recommendation / Blocking)
- `ThreadId` (si fil)
- `Resolved`
- `RowVersion`
- `CreatedByEmail`, `UpdatedByEmail`, `UpdatedAt`

### E. `ProjectDiscussions`
- `MessageId`
- `ProjectId`
- `ThreadId`
- `SenderEmail`
- `RecipientRole`
- `Message`
- `AttachmentsJson`
- `RowVersion`
- `CreatedAt`, `UpdatedAt`

### F. `ProjectMembers`
- `EntryId`
- `ProjectId`
- `MemberEmail`
- `Role` (Owner / Contributor / Compliance / Viewer)
- `CanSubmit` (bool)

### G. `BackofficeChanges`
- `ChangeId`
- `EntityType` (Rule, Question, Team, Config…)
- `EntityId`
- `PayloadJson`
- `ChangeType` (Create / Update / Delete)
- `RequiresValidation`
- `RowVersion`
- `CreatedByEmail`, `UpdatedByEmail`, `UpdatedAt`

### H. Bibliothèque `ProjectFiles`
- Arborescence par `ProjectId` / `InspirationId`
- Métadonnées : `EntityType`, `EntityId`, `UploadedBy`, `UploadedAt`, `Checksum`

## 4.2 Informations à partager à ChatGPT Codex quand vous recevez la clé API

Préparer ce “pack d’onboarding” :
1. `tenantId`, `clientId`, (éventuellement `clientSecret` si app confidentielle côté serveur).
2. Type d’app : SPA pure, backend API, ou hybride.
3. URL site SharePoint + `siteId` + nom/ID des listes créées.
4. Permissions Graph validées (delegated/app permissions) + consentement admin.
5. Règles de sécurité : qui peut lire/écrire/soumettre/envoyer les mails.
6. Adresse(s) de destination des e-mails de soumission.
7. Politique de rétention et exigences d’audit.
8. Mapping final UI → colonnes SharePoint (fichier de mapping).

## 4.3 Configuration de la clé / App Microsoft Graph

### Étapes Azure App Registration
1. Créer l’app dans Entra ID.
2. Définir redirect URIs (dev/staging/prod).
3. Activer tokens nécessaires (ID + access token selon flux).
4. Ajouter permissions Graph minimales :
   - `User.Read`
   - `Sites.ReadWrite.All` (ou scopes plus fins si possible)
   - `Mail.Send` (pour soumission)
   - éventuellement `Files.ReadWrite.All`
5. Appliquer **admin consent**.
6. Mettre en place stockage sécurisé des secrets (si backend).

### Configuration applicative
- Variables d’environnement (exemples) :
  - `GRAPH_TENANT_ID`
  - `GRAPH_CLIENT_ID`
  - `GRAPH_REDIRECT_URI`
  - `GRAPH_SCOPES=User.Read Sites.ReadWrite.All Mail.Send`
  - `SHAREPOINT_SITE_ID`
- Initialiser MSAL + token cache.
- Brancher `GraphDataProvider` à la place du mock.

---

## 5) Soumission projet (bouton conservé)

Le bouton “Soumettre le projet” reste visible pour le chef de projet.

Nouveau comportement :
1. Vérifier que la queue d’autosave est vide.
2. Passer `Status=Submitted` dans `Projects`.
3. Écrire un enregistrement d’audit (qui a soumis, quand).
4. Envoyer automatiquement un e-mail via Graph :
   - sujet standardisé,
   - résumé projet,
   - lien SharePoint / webapp.
5. Notifier l’UI en succès/échec avec retry si échec mail.

---

## 6) Plan de tests recommandé

- **Tests de concurrence** : 2–3 navigateurs modifiant le même projet simultanément.
- **Tests offline/online** : coupure réseau pendant édition, puis resynchronisation.
- **Tests de charge légère** : rafales d’édition sticky notes/commentaires.
- **Tests d’autorisations** : utilisateur non autorisé tente une soumission ou un edit backoffice.
- **Tests e-mail** : soumission déclenche un unique e-mail, non dupliqué en retry.

---

## 7) Risques fréquents et parades

- **Conflits fréquents** → fusion granulaire + verrouillage doux par section active.
- **Surcharge listes SharePoint** → indexer colonnes (`ProjectId`, `UpdatedAt`, `Status`) + pagination.
- **Dérive des schémas** → versionner les schémas JSON (`schemaVersion`).
- **Latence Graph** → UI optimiste + queue + retries.
- **Permissions trop larges** → principe du moindre privilège.

---

## 8) Checklist exécutable (ordre conseillé)

1. Introduire `DataProvider` + `MockSharePointProvider`.
2. Brancher autosave partout (webapp + backoffice).
3. Ajouter gestion des conflits et indicateurs UI.
4. Créer les listes SharePoint (ou mocks définitifs).
5. Implémenter soumission + workflow e-mail (mock puis réel).
6. Basculer du mock vers Graph le jour de la clé API.
7. Exécuter la campagne de tests de co-édition.
8. Go-live progressif (pilot puis généralisation).

---

## 9) Livrables préparés dans ce repo

- Ce document de migration : `docs/migration-sharepoint-graph.md`
- Mocks de listes SharePoint dans : `mock-sharepoint-lists/`

