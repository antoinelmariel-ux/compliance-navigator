# Préparer l’intégration de Microsoft Graph API (sans clé) — Guide technique

> Objectif : proposer une stratégie robuste pour préparer l’intégration de Microsoft Graph avant l’obtention de la clé API, afin d’être opérationnel dès que l’accès sera accordé. Ce document est pensé pour une équipe qui développera avec ChatGPT Codex et qui veut minimiser les risques techniques et organisationnels.

## 1) Résumé exécutif

**Stratégie recommandée** : construire une **couche d’intégration Graph isolée** (adapter + contrats) et un **jeu de données de simulation** réaliste, afin de développer l’ensemble des parcours fonctionnels **sans dépendre de la clé**. Dès que l’accès Graph est délivré, on remplace le simulateur par l’adapter Graph en production. Cette approche réduit le risque, facilite les tests, et force une modélisation claire des permissions.

**Pourquoi cette stratégie ?**
- **Les parcours métier peuvent être livrés avant l’accès Graph** (mock + données locales).
- **Les règles d’accès et de gouvernance** (projets perso, co‑édition, commentaires compliance, etc.) sont **définies en amont**.
- **Les endpoints, structures JSON, et conventions d’auth** sont figés tôt, limitant les retours en arrière.

## 2) Contexte fonctionnel

L’intégration doit permettre :
- **Voir uniquement ses propres projets en brouillon**.
- **Définir si une inspiration est personnelle ou visible par tous**.
- **Partager un projet en co‑édition depuis la “vitrine”**.
- **Afficher le nom de la personne qui ajoute des sticky notes** sur une vitrine.
- **Permettre aux porteurs de compliance de commenter** les projets depuis la partie synthèse.
- **Modifier les fichiers JSON** des projets stockés sur SharePoint.
- **Charger des fichiers** sur SharePoint depuis des sections personnalisées type visionneuse.
- **Gérer les droits d’accès au backoffice**.

**Contraintes** :
- **Modifier des fichiers JSON** sur SharePoint **(pas de listes SharePoint)**.
- Préparer l’intégration **avant d’avoir la clé**.

## 3) Architecture cible (vue logique)

```
[Front-end]
   |  (auth + token)
   v
[API / Service d’intégration]
   |-- GraphAdapter (production)
   |-- MockAdapter (local/staging sans clé)
   |-- StorageContract (JSON + fichiers)
   v
[Microsoft Graph]
   |-- SharePoint Site
   |-- Document Library (JSON, assets, commentaires)
```

### 3.1 Pourquoi un service d’intégration ?
- **Sécurise** les tokens et les secrets (pas côté client).
- **Centralise** la logique d’accès et de conformité (par ex. filtrage des projets brouillons selon l’utilisateur).
- **Stabilise** les contrats (payloads JSON, conventions d’URL, versioning).

> Si un service back-end n’est pas envisagé, il faudra une logique de sécurité plus stricte (CORS, permissions Graph, et durcissement des scopes). Cela augmente le risque de fuite de tokens et la complexité d’administration.

## 4) Préparation sans clé : stratégie détaillée

### 4.1 Définir les contrats JSON (source de vérité)
Créez un **schéma JSON versionné** pour chaque type d’objet :
- **ProjectDraft** (projet brouillon)
- **ProjectPublished** (projet publié/vitrine)
- **Inspiration** (personnelle ou publique)
- **Annotation/StickyNote**
- **ComplianceComment**
- **BackOfficeAccess**

**Inclure systématiquement** :
- `id`, `ownerId`, `visibility`, `createdAt`, `updatedAt`, `version`, `audit` (auteur, rôle).
- `permissions` (ex. `canEdit`, `canComment`, `isComplianceReviewer`).

> Ces schémas servent d’interface stable entre l’app, le simulateur, et Graph.

### 4.2 Modéliser l’arborescence SharePoint
Proposition d’arborescence (documents uniquement) :
```
/ComplianceNavigator
  /projects
    /drafts
      /{userId}
        project-{projectId}.json
    /published
      project-{projectId}.json
  /inspirations
    /private
      /{userId}
        inspiration-{inspirationId}.json
    /public
      inspiration-{inspirationId}.json
  /annotations
    /{projectId}
      notes-{scope}.json
  /compliance-comments
    /{projectId}
      comments.json
  /backoffice
    access.json
  /assets
    /{projectId}
      (fichiers uploadés)
```

### 4.3 Construire un **MockAdapter** (sans clé)
- Implémente les mêmes méthodes que l’adapter Graph.
- Utilise un stockage local (fichiers JSON sur disque ou base légère).
- **Simule les permissions** (règles d’accès selon l’utilisateur). 
- Fournit des **fixtures réalistes** (ex. 10 projets, 5 inspirations, 3 reviewers compliance).

**Exemples d’API du contrat d’adapter :**
- `listDraftProjects(userId)`
- `getProject(projectId)`
- `updateProject(projectId, payload)`
- `uploadAsset(projectId, file)`
- `addAnnotation(projectId, note)`
- `addComplianceComment(projectId, comment)`
- `getBackOfficeAccess()`
- `setBackOfficeAccess(accessList)`

### 4.4 Mettre en place des **tests d’intégration contractuels**
- **Tests identiques** contre `MockAdapter` et `GraphAdapter`.
- Les tests vérifient :
  - filtres d’accès (brouillons, visibilité, co‑édition),
  - cohérence des JSON,
  - respect des permissions.

### 4.5 Préparer un plan de migration
- Les JSON du mock doivent être **compatibles** avec les JSON Graph.
- Prévoir un script de migration rapide si nécessaire (ex. `migrate_mock_to_graph`).

## 5) Stratégie d’authentification (anticipée)

### 5.1 Flux recommandé
- **Azure AD + OAuth 2.0** avec **Authorization Code Flow**.
- Idéalement via un **back-end** (sécurise les tokens, refresh, etc.).

### 5.2 Scopes Graph à anticiper
Selon les besoins décrits :
- `Sites.Read.All` / `Sites.ReadWrite.All` (lecture/écriture SharePoint)
- `Files.Read.All` / `Files.ReadWrite.All` (fichiers)
- `User.Read` (nom de l’utilisateur pour les annotations)

> Les scopes exacts dépendront de la gouvernance interne (application vs delegated permissions). Il est essentiel de les **documenter dès maintenant** pour éviter des allers-retours avec l’admin M365.

### 5.3 Gestion des rôles
- **Rôles métier** : `project_owner`, `co_editor`, `compliance_reviewer`, `backoffice_admin`.
- Mapper ces rôles à des **groupes Azure AD** et appliquer les règles d’accès côté service.

## 6) Mapping des besoins fonctionnels vers Graph + JSON

| Besoin | Stockage JSON | Règle d’accès | Opération Graph | Remarques |
|---|---|---|---|---|
| Projets brouillons visibles par l’auteur | `/projects/drafts/{userId}/project-{id}.json` | `ownerId === userId` | `driveItem` read | filtrer côté service |
| Inspiration personnelle/publique | `/inspirations/private|public` | `visibility` + owner | `driveItem` read/write | déplacer fichier pour changer visibilité |
| Co‑édition depuis vitrine | `/projects/published/` + rights | `coEditors` | `driveItem` + permissions | utiliser permissions de fichiers Graph |
| Nom auteur sticky note | `/annotations/{projectId}/notes-{scope}.json` | `userId` | read/write | inclure `displayName` via `User.Read` |
| Commentaires compliance | `/compliance-comments/{projectId}/comments.json` | `role === compliance` | read/write | champ `reviewer` + date |
| Modifier JSON projet | `/projects/...` | `canEdit` | read/write | versionner les JSON |
| Charger fichiers sur SharePoint | `/assets/{projectId}` | `canEdit` | upload session | pour gros fichiers |
| Accès backoffice | `/backoffice/access.json` | admin only | read/write | liste blanche d’IDs |

## 7) Gouvernance des fichiers JSON

### 7.1 Versioning
- Chaque JSON contient `version` + `lastModifiedBy` + `lastModifiedAt`.
- Conserver un **historique** (optionnel) via un sous-dossier `/history`.

### 7.2 Concurrence (co‑édition)
- Gérer un **`etag`/`@odata.etag`** côté Graph.
- En cas de conflit : fusion simple ou retour d’erreur avec option de rechargement.

### 7.3 Sécurité & audit
- Journaliser : qui lit/écrit quoi, quand, et avec quel rôle.
- Masquer les champs sensibles côté client si besoin.

## 8) Checklist de préparation avant la clé

✅ **Contrats JSON stabilisés**

✅ **MockAdapter fonctionnel + fixtures**

✅ **Tests contractuels** (Mock vs Graph)

✅ **Schéma d’arborescence SharePoint validé**

✅ **Définition des scopes et rôles**

✅ **Plan de migration des données**

✅ **Documentation d’intégration** (ce fichier)

## 9) Plan d’action dès réception de la clé

1. **Créer l’application Azure AD** (si pas déjà fait).
2. **Configurer les permissions Graph**.
3. **Valider la structure du site SharePoint**.
4. **Implémenter GraphAdapter** (respect du contrat).
5. **Exécuter les tests contractuels**.
6. **Basculer MockAdapter → GraphAdapter**.
7. **Piloter une phase de pré‑prod** avec données réelles.

## 10) Recommandations spécifiques pour un développement avec ChatGPT Codex

- **Garder des interfaces stables** : contrat d’adapter et schémas JSON.
- **Faire relire les prompts de Codex** pour éviter les divergences de structure.
- **Préparer des snippets** (fichiers modèles) pour la logique Graph (auth, upload, permissions, etag).
- **Tester en continu** (mock puis graph) pour éviter un écart de comportement.

## 11) Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Scopes Graph trop permissifs | Sécurité | Définir scope minimal + validation admin |
| Conflits d’écriture JSON | Perte de données | Utiliser etag + stratégie de merge |
| Modèle d’accès trop complexe | Retards | Clarifier rôles et responsabilités |
| Différences Mock vs Graph | Bugs en prod | Tests contractuels systématiques |

---

**Conclusion** : la meilleure stratégie est d’anticiper l’intégration Graph par un **contrat d’adapter stable**, un **mock réaliste**, et une **modélisation claire des fichiers JSON**. Cela permet d’avancer immédiatement sans clé, tout en garantissant une transition fluide quand l’accès Graph sera disponible.
