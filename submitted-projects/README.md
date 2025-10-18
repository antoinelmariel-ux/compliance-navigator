# Dossier des projets soumis

Déposez ici vos fichiers JSON de projets pour qu'ils apparaissent automatiquement
sur la page d'accueil avec le statut « Soumis ».

## Format des fichiers

Chaque fichier doit contenir les réponses du projet. Deux formats sont
supportés :

1. **Export depuis l'application** – tel que généré par l'option d'export.
   Exemple :

   ```json
   {
     "version": 1,
     "generatedAt": "2025-01-30T10:52:43.000Z",
     "project": {
       "name": "Nom du projet",
       "answers": {
         "projectName": "Nom du projet"
       }
     }
   }
   ```

2. **Objet projet brut** – avec au minimum les clefs `answers` et `projectName`.
   Exemple :

   ```json
   {
     "projectName": "Nom du projet",
     "answers": {
       "projectName": "Nom du projet"
     }
   }
   ```

Les fichiers peuvent contenir des métadonnées supplémentaires (`id`,
`submittedAt`, `lastUpdated`, etc.). Elles seront utilisées lorsqu'elles sont
présentes.

## Découverte automatique des fichiers

L'application tente d'identifier automatiquement tous les fichiers `.json`
présents dans ce dossier.

Si l'hébergement ne permet pas l'indexation automatique d'un dossier, ajoutez
un fichier `index.json` listant explicitement les fichiers ou les projets :

- Tableau de noms de fichiers : `['projet-a.json', 'projet-b.json']`
- Objet avec une clef `files` ou `projects` :

  ```json
  {
    "files": ["projet-a.json", "projet-b.json"],
    "projects": [
      { "projectName": "Projet inline", "answers": {} }
    ]
  }
  ```

Les projets décrits directement dans `projects` sont importés sans fichier
supplémentaire.

