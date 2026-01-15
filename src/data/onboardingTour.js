export const initialOnboardingTourConfig = {
  allowClose: true,
  showStepDots: true,
  labels: {
    next: 'Suivant',
    prev: 'Précédent',
    close: 'Fermer',
    finish: 'Terminer'
  },
  steps: [
    {
      id: 'welcome',
      target: '#tour-onboarding-anchor',
      title: 'Bienvenue sur Project Navigator',
      content: 'Découvrons ensemble comment cadrer votre projet pas à pas.',
      showDefaultButtons: false,
      actions: [
        {
          id: 'path-full',
          label: 'Parcours complet',
          action: 'next',
          variant: 'primary'
        },
        {
          id: 'path-showcase',
          label: 'Voir la vitrine',
          action: 'goTo',
          stepId: 'showcase-top',
          variant: 'ghost'
        },
        {
          id: 'path-import',
          label: 'Importer un projet',
          action: 'goTo',
          stepId: 'project-import',
          variant: 'ghost'
        }
      ]
    },
    {
      id: 'create-project',
      target: '[data-tour-id="home-create-project"]',
      title: 'Lancer un nouveau projet',
      content: 'Cliquez ici pour démarrer. Nous allons utiliser un projet de démonstration pour l’exemple.',
      placement: 'bottom'
    },
    {
      id: 'question-overview',
      target: '[data-tour-id="question-main-content"]',
      title: 'Répondre aux questions',
      content: 'Renseignez les informations demandées étape par étape pour qualifier votre initiative.'
    },
    {
      id: 'question-guidance',
      target: '[data-tour-id="question-guidance-toggle"]',
      title: 'Comprendre chaque question',
      content: 'Chaque étape propose des conseils contextualisés pour répondre sereinement.'
    },
    {
      id: 'project-save-anytime',
      target: '[data-tour-id="question-save-draft"]',
      title: 'Sauvegarder à tout moment',
      content: 'Téléchargez un brouillon de votre projet quand vous le souhaitez et rechargez-le depuis l’accueil. Attention, il n\'y a pas de sauvegarde automatique.'
    },
    {
      id: 'questionnaire-finish',
      target: '[data-tour-id="questionnaire-finish"]',
      title: 'Fin du formulaire',
      content: 'Sur la dernière question, cliquez sur “Voir la synthèse” pour accéder au rapport complet.'
    },
    {
      id: 'compliance-report-top',
      target: '[data-tour-id="synthesis-summary"]',
      title: 'Lire le rapport de compliance',
      content: 'Retrouvez ici le résumé du projet avec l\'ensemble des informations que vous avez remplies. Vous pouvez revenir en arrière pour les modifier.',
      scrollIntoViewOptions: {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      }
    },
    {
      id: 'compliance-teams',
      target: '[data-tour-id="synthesis-teams"]',
      title: 'Identifier les équipes compliance',
      content: 'Visualisez les interlocuteurs clés, leurs priorités et les questions à anticiper pour préparer vos échanges.'
    },
    {
      id: 'compliance-risks',
      target: '[data-tour-id="synthesis-risks"]',
      title: 'Risques et points de vigilance',
      content: 'Analysez les risques identifiés et les points de vigilance compliance à adresser en priorité.'
    },
    {
      id: 'compliance-submit',
      target: '[data-tour-id="synthesis-submit"]',
      title: 'Soumettre le projet',
      content: 'Envoyez votre rapport directement par e-mail aux équipes concernées.'
    },
    {
      id: 'compliance-save',
      target: '[data-tour-id="synthesis-save"]',
      title: 'Sauvegarder depuis la synthèse',
      content: 'Téléchargez le fichier du projet pour le partager ou le reprendre ultérieurement.'
    },
    {
      id: 'compliance-showcase-button',
      target: '[data-tour-id="synthesis-showcase"]',
      title: 'Ouvrir la vitrine du projet',
      content: 'Accédez à la vitrine du projet générée automatiquement pour présenter votre initiative.'
    },
    {
      id: 'showcase-top',
      target: '[data-tour-id="showcase-hero"]',
      title: 'Présenter votre projet',
      content:
        'Parcourez la vitrine présentant votre projet avec une mise en page le mettant en valeur. Parfait pour une présentation à votre manager !',
      scrollIntoViewOptions: {
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      },
      scrollDuration: 5200
    },
    {
      id: 'showcase-bottom',
      target: '[data-tour-id="showcase-roadmap"]',
      title: 'Explorer la suite de la vitrine',
      content: 'Vous retrouvez sur la vitrine les jalons de votre projet mais également les alertes liées à des problématiques de respect de certains délais.',
      scrollIntoViewOptions: {
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      },
      scrollDuration: 3200
    },
    {
      id: 'showcase-edit-trigger',
      target: '[data-tour-id="showcase-edit-trigger"]',
      title: 'Modifier la vitrine',
      content: 'Activez le mode édition pour ajuster les contenus avant diffusion.'
    },
    {
      id: 'showcase-edit',
      target: '[data-tour-id="showcase-edit-panel"]',
      title: 'Personnaliser la vitrine',
      content: 'Adaptez textes, messages clés et jalons pour refléter fidèlement votre projet. Ses informations sont automatiquement mise à jour dans le rapport de compliance.'
    },
    {
      id: 'showcase-custom-sections',
      target: '[data-tour-id="showcase-edit-panel"]',
      title: 'Créer des sections personnalisées',
      content:
        'Ajoutez des sections sur-mesure avec différents modèles : listes, colonnes, accroches et même des blocs qui intègrent des documents (PDF, slides, etc.).'
    },
    {
      id: 'showcase-save-edits',
      target: '[data-tour-id="showcase-save-edits"]',
      title: 'Enregistrer les modifications',
      content: 'Validez vos ajustements pour mettre à jour immédiatement la vitrine.'
    },
    {
      id: 'showcase-display-modes',
      target: '[data-tour-id="showcase-display-modes"]',
      title: 'Choisir l’affichage & activer les commentaires',
      content:
        'Sélectionnez un affichage Light ou complet pour masquer certaines informations pendant vos présentations. Lors du partage, vous pouvez aussi autoriser les commentaires : des post-its fictifs illustrent le résultat.'
    },
    {
      id: 'showcase-comments',
      target: '[data-tour-id="showcase-preview"]',
      title: 'Illustrer les commentaires',
      content:
        'La vitrine peut être commentée : les post-its s’affichent directement sur la vitrine pour recueillir les retours des parties prenantes.'
    },
    {
      id: 'showcase-back-to-report',
      target: '[data-tour-id="showcase-back-to-report"]',
      title: 'Retourner à la synthèse',
      content: 'Revenez au rapport de synthèse pour poursuivre votre préparation et éventuellement enregistrer la dernière version de votre projet.'
    },
    {
      id: 'project-import',
      target: '[data-tour-id="home-import-project"]',
      title: 'Charger un projet existant',
      content: 'Vous pouvez importer un projet enregistrer pour reprendre son édition avant soumission à la compliance.'
    },
    {
      id: 'project-filters',
      target: '[data-tour-id="home-filters"]',
      title: 'Découvrir les projets',
      content: 'Filtrez les initiatives par nom, équipe ou date et laissez vous inspirer.'
    }
  ]
};
