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
- Charger de façon différée les écrans secondaires (back-office, showcase) et précharger uniquement les dépendances critiques de la page d'accueil.
- Virtualiser les listes longues (ex. historique de projets, questions) pour limiter le coût de rendu et les recalculs de layout.
- Optimiser les assets statiques (compression des images, `preload`/`font-display` pour les polices) afin de réduire le temps de chargement perçu.
- Mettre en cache les données locales et externes (avec une stratégie d'expiration) pour éviter les recalculs à chaque navigation.
