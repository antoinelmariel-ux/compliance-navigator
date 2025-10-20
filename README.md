# Compliance Navigator

Prototype React monopage d'aide à la décision compliance lancé directement depuis `index.html`.

## Fonctionnalités principales

### Vue Chef de Projet
- **Onboarding guidé** : un écran d'accueil présente le périmètre couvert (données, localisation, partenaires) et les prérequis à réunir avant de commencer, afin d'accélérer la collecte d'informations auprès des métiers.
- **Questionnaire adaptatif** : les questions s'affichent dynamiquement selon les réponses précédentes grâce au moteur de conditions (`equals`, `not_equals`, `contains`). Cela permet de ne solliciter que les thèmes pertinents (RGPD, sanctions, éthique, etc.) et d'éviter les redites.
- **Progression pilotée** : barre d'avancement, navigation précédent/suivant, validation des réponses obligatoires et rappel des sections à compléter pour limiter les oublis lors de la constitution du dossier.
- **Synthèse automatique** : génération d'un rapport projet instantané qui récapitule le périmètre, le niveau de complexité compliance, les actions à initier et les équipes à mobiliser. Exportable ou partageable depuis l'interface.
- **Recommandations actionnables** : affichage pour chaque équipe des contacts référents, des expertises couvertes et des questions préparatoires à anticiper avant un passage en comité.
- **Gestion des risques** : consolidation des risques issus des règles déclenchées avec niveau de criticité, priorité, mesures de mitigation suggérées et to-do pour préparer les jalons réglementaires.
- **Traçabilité du parcours** : historique des réponses et des sections parcourues pour faciliter la reprise ultérieure d'un dossier et le suivi des mises à jour.

### Vue Équipe Compliance & Back-Office
- **Pilotage du référentiel** : visualisation en un coup d'œil des questions, règles et risques actifs pour vérifier la couverture réglementaire et la cohérence des parcours.
- **Éditeur de questions** : ajout, suppression ou modification du libellé, des options, du caractère obligatoire et des conditions d'affichage via glisser-déposer afin d'orchestrer de nouveaux scénarios.
- **Éditeur de règles** : configuration des conditions de déclenchement, association des équipes, des questions de relance et des risques, avec aperçu des impacts sur la synthèse projet.
- **Gestion des équipes** : mise à jour du nom, du contact, du champ d'expertise et de la capacité de prise en charge pour chaque équipe interne afin de refléter l'organisation cible.
- **Aperçu structuré** : consultation rapide des règles, conditions et risques pour faciliter la maintenance du référentiel et préparer les comités de gouvernance compliance.
- **Boucle d'amélioration continue** : remontée des cas d'usage fréquemment exclus (grâce aux réponses « autres » ou aux options non couvertes) pour ajuster le référentiel et aligner les exigences réglementaires.
- **Préparation des audits** : documentation centralisée des justificatifs (questions posées, critères évalués, risques identifiés) facilitant la réponse aux contrôles internes ou externes.

## Pistes de nouvelles fonctionnalités

### Expérience utilisateur
- **Guidage contextuel** : tutoriels intégrés et micro-contenus d'aide pour expliquer la logique des questions ou des règles qui s'affichent.
- **Mode brouillon** : permettre aux chefs de projet de sauvegarder plusieurs scénarios de réponses et d'y revenir plus tard avant validation définitive.
- **Accessibilité renforcée** : vérifier la conformité RGAA/WCAG (navigation clavier, contraste, lecteurs d'écran).

### Collaboration et gouvernance
- **Gestion multi-utilisateurs** : comptes personnalisés avec historique des parcours remplis et possibilité de commenter les réponses.
- **Workflow de validation** : soumission à un expert compliance, attribution des dossiers et suivi des statuts (à traiter, en revue, validé).
- **Notifications et rappels** : envoi d'e-mails ou intégration Teams pour notifier les parties prenantes lors des changements de statut ou des échéances.

### Analyse et reporting
- **Tableau de bord synthétique** : statistiques sur les projets (volume, niveau de risque, équipes sollicitées) avec filtres temporels.
- **Export des rapports** : génération PDF/Excel des synthèses et des risques pour diffusion aux comités de pilotage.
- **Mesure de complétude** : indicateurs de qualité des réponses (taux de questions optionnelles renseignées, temps moyen de complétion).

### Intégrations techniques
- **Connexion aux référentiels internes** : synchroniser les informations des équipes, règles ou contacts avec les systèmes maîtres (CRM, annuaires).
- **API REST/GraphQL** : exposer les données collectées pour alimenter d'autres outils internes ou automatiser des relances.
- **Authentification d'entreprise** : support SSO (Azure AD/Okta) pour sécuriser l'accès et tracer les opérations sensibles.

## Démarrage
Aucune étape de build n'est nécessaire :
1. Ouvrir `index.html` dans un navigateur moderne.
2. Le point d'entrée `src/main.jsx` est compilé à la volée par Babel (préréglages `env` et `react`) et charge automatiquement les modules de l'application.
3. React, ReactDOM et Babel Standalone sont embarqués localement (pas de dépendance CDN) ; Tailwind CSS reste chargé via CDN.

## Architecture de l'application
- **`src/components`** : regroupe les composants d'interface réutilisables (navigation, formulaires, synthèses).
- **`src/data`** : contient les référentiels initialisés au chargement (questions, règles, équipes) et peut servir de base à une intégration API.
- **`src/hooks`** : centralise la logique réutilisable (gestion d'état du questionnaire, calcul des risques, navigation).
- **`src/utils`** : expose les fonctions d'aide (évaluation des conditions, formatage des rapports, filtres de recherche).
- **`src/styles`** : héberge la configuration Tailwind et les styles globaux complémentaires.
- **`index.html`** : point d'entrée statique configurant Babel Standalone, Tailwind et montant l'application.
- **`submitted-projects/`** : dossier surveillé automatiquement. Ajoutez-y des fichiers JSON de projets pour qu'ils apparaissent dans l'accueil avec le statut « Soumis ».

## Tests et qualité
- **Validation manuelle** : ouvrir `index.html` et parcourir le questionnaire Chef de Projet pour vérifier l'enchaînement des questions, la génération de synthèse et les recommandations affichées.
- **Linting recommandé** : utiliser `npm install && npx eslint src --max-warnings=0` si l'on souhaite ajouter une chaîne de build Node pour garantir la cohérence du code.
- **Accessibilité** : contrôler les contrastes et la navigation clavier via des outils comme Axe DevTools ou Lighthouse pour conserver un parcours conforme RGAA/WCAG.

## Personnalisation
- L'ensemble des référentiels (questions, règles, équipes) est éditable directement depuis le back-office intégré.
- Pour des modifications structurelles plus poussées, adaptez `initialQuestions`, `initialRules` et `initialTeams` dans `src/data/` et les utilitaires dans `src/utils/`.
