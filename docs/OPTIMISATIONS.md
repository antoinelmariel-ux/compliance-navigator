# Optimisations apportées

Cette itération vise à fluidifier le parcours principal en réduisant les recalculs et les écritures inutiles dans le stockage local.

## Synthèse des changements

- **Déduplication des calculs coûteux** : la liste des questions actives et les résumés des conditions sont maintenant mémoïsés. Cela limite les filtrages/re-mappages successifs lors de chaque rendu React.
- **Handlers stabilisés** : les fonctions d'interaction (`onAnswer`, navigation, etc.) sont encapsulées dans `useCallback` pour éviter les recréations à chaque rendu et diminuer les re-render dans les sous-composants.
- **Persistance plus douce** : la sauvegarde dans `localStorage` est exécutée de manière différée (debounce) afin de réduire les écritures lors d'une saisie rapide.

## Bénéfices attendus

- Une interface plus réactive quand le questionnaire comporte beaucoup de conditions imbriquées.
- Moins de risques de "jank" lors de la frappe grâce à des écritures `localStorage` espacées.
- Une meilleure prévisibilité des re-rendus et une consommation mémoire plus stable.

## Pistes complémentaires

- Ajouter des tests de performance (ex. profils React DevTools) sur des scénarios volumineux pour quantifier le gain.
- Mettre en place un mémoïsage similaire dans la génération du rapport de synthèse si celui-ci devient complexe.
- Introduire un découpage du bundle (code-splitting) lorsque l'application grandira ou sera servie via un serveur.
