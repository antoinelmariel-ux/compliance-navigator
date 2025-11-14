# Documentation d'Architecture

## 1. Description générale de la solution
- **Type d'application :** interface monopage React montée sans outil de build grâce à un chargeur dynamique (`module-loader.js`) qui expose `React` et `ReactDOM` côté navigateur avant d'initialiser `src/main.jsx` depuis `index.html`.
- **Responsabilité principale :** guider les équipes dans la qualification de projets marketing/santé, en collectant les informations clefs, en évaluant les risques de conformité et en générant des livrables (synthèse, vitrine marketing, exports) à partager avec les parties prenantes.
- **Flux utilisateur haut niveau :**
  1. Sélection ou création d'un projet depuis l'écran d'accueil.
  2. Remplissage du questionnaire dynamique.
  3. Génération d'une synthèse des risques et recommandations.
  4. Accès éventuel à la vitrine marketing ou au back-office pour ajuster questions/règles.

## 2. Architecture applicative
### 2.1 Vue générale
- `index.html` charge les bibliothèques front (React, ReactDOM, Babel, TourGuide) puis délègue à `src/module-loader.js` la résolution dynamique des modules locaux avant de monter l'application via `src/main.jsx`.
- `src/main.jsx` détecte l'API de rendu disponible (`createRoot` ou `render`) et instancie le composant racine `<App />`.
- `src/App.jsx` centralise l'état métier (projets, réponses, règles, poids de risque, équipes, filtres) et orchestre le routage interne entre les écrans principaux.

### 2.2 Composition détaillée
- **Écran d'accueil (`HomeScreen.jsx`) :** liste les projets en cours, applique les filtres paramétrables, gère la duplication/suppression et sert d'accès vers questionnaire, synthèse ou vitrine.
- **Questionnaire (`QuestionnaireScreen.jsx`) :** enchaîne les questions conditionnelles, valide les réponses, enregistre des brouillons et gère les jalons (dates + descriptions) quand nécessaire.
- **Synthèse (`SynthesisReport.jsx`) :** calcule les risques à partir des règles et des poids, affiche les recommandations par équipe ainsi que la complexité globale du dossier.
- **Vitrine marketing (`ProjectShowcase.jsx`) :** met en forme les réponses destinées aux sections marketing (héros, équipe, plan d'action…).
- **Back-office (`BackOffice.jsx` + `BackOfficeDashboard.jsx`) :** sécurisé par mot de passe, permet d'administrer questions, règles, filtres et pondérations de risques via des éditeurs dédiés (`QuestionEditor.jsx`, `RuleEditor.jsx`).
- **Utilitaires (`src/utils/`) :** offrent la logique métier transversale : persistance locale, analyse des règles, normalisation des projets, export des fichiers, calcul des risques.

## 3. Exigences fonctionnelles clés
- Créer, cloner, filtrer, exporter ou supprimer un projet depuis l'accueil.
- Parcourir un questionnaire dynamique avec aide contextuelle, validation des champs obligatoires et sauvegarde de brouillon.
- Calculer automatiquement les équipes à mobiliser et les risques associés selon les règles déclaratives et les pondérations configurées.
- Générer un rapport synthétique riche (risques, planning, dépendances) et une vitrine marketing basée sur les réponses fournies.
- Permettre aux administrateurs, via le back-office, d'ajuster le référentiel de questions, de définir les règles d'activation des équipes/risques et de configurer les filtres de tri.
- Charger des projets prédéfinis (ex. démonstration) ou depuis un dossier `submitted-projects` pour accélérer la prise en main.

## 4. Structure des données et pseudo-base
### 4.1 Questions et formulaires
- `src/data/questions.js` fournit un tableau `initialQuestions` où chaque entrée décrit un champ (type, options, conditions, métadonnées de vitrine, aide contextuelle).
- Les conditions d'affichage reposent sur des groupes logiques (`conditionGroups`) et des opérateurs (`equals`, `contains`, etc.) utilisés aussi bien côté questionnaire que dans le back-office.

### 4.2 Règles métiers et risques
- `src/data/rules.js` définit `initialRules`, qui associe des conditions sur les réponses à des équipes mobilisées, des questions complémentaires et des risques à afficher.
- `src/data/riskWeights.js` et `src/data/riskLevelRules.js` paramètrent la pondération des risques et les seuils de complexité globale.
- `src/data/teams.js` référence les équipes (BPP, IT, Privacy, etc.) et leur rôle dans la revue des projets.

### 4.3 Projets et exemples
- `src/data/demoProject.js` expose un projet de démonstration et un snapshot de réponses pour illustrer le parcours complet.
- `submitted-projects/directory-snapshot.js` (chargé au runtime) permet d'importer des projets externes dans l'accueil.

## 5. Structure des fichiers et organisation
```
compliance-navigator/
├── index.html                # Point d'entrée HTML et chargement des vendors
├── src/
│   ├── main.jsx              # Bootstrap React
│   ├── App.jsx               # Conteneur d'état et orchestration
│   ├── components/           # Interfaces (Questionnaire, Synthèse, BackOffice…)
│   ├── data/                 # Référentiels (questions, règles, équipes, exemples)
│   ├── utils/                # Logique métier et helpers transverses
│   ├── styles/               # Feuilles de style Tailwind, fonts, vitrines
│   └── vendor/               # Bundles React, ReactDOM, Babel, TourGuide
├── docs/                     # Documentation technique (architecture, optimisations)
├── submitted-projects/       # Snapshots de projets finalisés à charger côté client
├── scripts/                  # Scripts de maintenance/outillage éventuels
└── mentions-legales.html     # Page statique des mentions légales avec footer versionné
```

## 6. Traçabilité et évolutivité
- Les constantes de version (`APP_VERSION` et footer statique) doivent être alignées à chaque livraison pour assurer la traçabilité.
- L'ajout de nouvelles questions ou règles suit un modèle déclaratif : enrichir les fichiers `src/data`, puis affiner la logique de calcul si besoin via les utilitaires (`rules.js`, `risk.js`).
- La persistance locale est désactivée par défaut (`ENABLE_PERSISTENCE = false`), mais le module `utils/storage.js` est prêt à être réactivé si l'on souhaite conserver l'état des projets côté navigateur.
