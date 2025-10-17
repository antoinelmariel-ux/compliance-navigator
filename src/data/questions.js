export const initialQuestions =  [
  {
    id: 'projectName',
    type: 'text',
    question: "Quel est le nom du projet ou de l'offre ?",
    options: [],
    required: true,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: "Nommer clairement l'initiative pour qu'elle soit mémorisée dès les premières secondes.",
      details: "Le nom affiché dans la vitrine marketing sert de repère pour toutes les équipes qui contribuent au pitch.",
      tips: [
        'Renseignez le nom officiel ou celui que vous souhaitez tester auprès des parties prenantes.',
        'Si un nom de code interne existe, ajoutez-le entre parenthèses pour faciliter le suivi.'
      ]
    },
    showcase: {
      sections: ['hero'],
      usage: 'Titre principal affiché dans la vitrine marketing.'
    }
  },
  {
    id: 'projectSlogan',
    type: 'text',
    question: 'Quel slogan ou promesse courte souhaitez-vous mettre en avant ?',
    options: [],
    required: false,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: "Résumer l'accroche en moins de 10 mots pour capter l'attention immédiatement.",
      details: "Le slogan apparaît dans la hero section et doit être simple, mémorable et orienté bénéfice.",
      tips: [
        'Utilisez un verbe d’action qui évoque le résultat attendu.',
        'Préférez un ton conversationnel : adressez-vous directement à votre audience.'
      ]
    },
    showcase: {
      sections: ['hero'],
      usage: 'Promesse courte située sous le nom du projet.'
    }
  },
  {
    id: 'targetAudience',
    type: 'multi_choice',
    question: 'Quelles audiences doivent être convaincues en priorité ?',
    options: [
      'Grand public / clients finaux',
      'Professionnels ou experts métiers',
      'Décideurs internes / sponsors',
      'Investisseurs',
      'Partenaires ou prescripteurs'
    ],
    required: true,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: "Identifier les personae principaux pour adapter la narration et les preuves d'impact.",
      details: 'Chaque audience attend un angle différent : lister les cibles permet de personnaliser les sections du pitch.',
      tips: [
        'Sélectionnez plusieurs options si votre pitch est multicanal.',
        'Ajoutez des précisions dans vos notes internes si certains personae doivent recevoir un message dédié.'
      ]
    },
    showcase: {
      sections: ['hero'],
      usage: 'Badge « Audience principale » dans le bandeau de la vitrine.'
    }
  },
  {
    id: 'problemPainPoints',
    type: 'long_text',
    question: 'Listez 2 à 3 pain points concrets vécus par vos utilisateurs.',
    options: [],
    required: true,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Montrer que vous comprenez la réalité terrain de votre audience.',
      details: 'Chaque pain point s’affichera comme un bullet point pour renforcer l’empathie.',
      tips: [
        'Utilisez une ligne par pain point pour faciliter la lecture.',
        'Décrivez la situation vécue plutôt que la solution souhaitée.'
      ]
    },
    showcase: {
      sections: ['problem'],
      usage: 'Liste des irritants principaux affichée dans la colonne de gauche.'
    }
  },
  {
    id: 'solutionDescription',
    type: 'long_text',
    question: 'Décrivez en quoi consiste votre solution ou votre service.',
    options: [],
    required: true,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Clarifier l’expérience proposée avant de détailler les bénéfices.',
      details: 'Cette description introduit la section “Solution” et doit rester simple à comprendre.',
      tips: [
        'Structurez en 2-3 phrases : quoi, pour qui, comment.',
        'Évitez le vocabulaire interne : imaginez que vous présentez le concept à un prospect.'
      ]
    },
    showcase: {
      sections: ['solution'],
      usage: 'Bloc « Expérience proposée » dans la partie solution.'
    }
  },
  {
    id: 'solutionBenefits',
    type: 'long_text',
    question: 'Quels bénéfices tangibles votre solution apporte-t-elle ?',
    options: [],
    required: true,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Mettre en avant les résultats obtenus plutôt que les fonctionnalités.',
      details: 'Chaque ligne sera transformée en bénéfice clé dans la vitrine.',
      tips: [
        'Rédigez une phrase par bénéfice, orientée résultat (“Gain de 2h par semaine”).',
        'Priorisez les bénéfices les plus différenciants pour votre audience.'
      ]
    },
    showcase: {
      sections: ['solution'],
      usage: 'Liste des bénéfices clés dans la section solution.'
    }
  },
  {
    id: 'solutionComparison',
    type: 'long_text',
    question: 'En quoi votre approche se distingue-t-elle des alternatives actuelles ?',
    options: [],
    required: false,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Souligner la différenciation sans dénigrer la concurrence.',
      details: 'Cette réponse apparaît dans la section “Solution” comme une comparaison subtile.',
      tips: [
        'Comparez-vous à un comportement ou à une solution existante plutôt qu’à un concurrent direct.',
        'Appuyez-vous sur un bénéfice mesurable ou une expérience utilisateur plus fluide.'
      ]
    },
    showcase: {
      sections: ['solution'],
      usage: 'Bloc « Pourquoi c’est différent » dans la section solution.'
    }
  },
  {
    id: 'innovationProcess',
    type: 'long_text',
    question: 'Comment votre équipe transforme cette innovation en expérience fluide ?',
    options: [],
    required: false,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Décrire le process ou l’architecture qui garantit une exécution sans friction.',
      details: 'Cette réponse est mise en scène comme un mini schéma narratif.',
      tips: [
        'Décrivez 3 étapes clés maximum pour garder la lecture fluide.',
        'Mentionnez les outils, rituels ou partenaires qui rendent le parcours intuitif.'
      ]
    },
    showcase: {
      sections: ['innovation'],
      usage: 'Encart explicatif sur le fonctionnement de l’innovation.'
    }
  },
  {
    id: 'visionStatement',
    type: 'long_text',
    question: 'Quelle vision inspirante souhaitez-vous partager pour conclure la narration ?',
    options: [],
    required: false,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Projeter votre audience sur le futur souhaité grâce au projet.',
      details: 'Cette phrase finale apporte une touche émotionnelle dans la section “Potentiel & impact”.',
      tips: [
        'Employez le futur ou le conditionnel pour ouvrir sur la suite.',
        'Reliez la vision à l’impact sociétal, business ou humain que vous visez.'
      ]
    },
    showcase: {
      sections: ['impact'],
      usage: 'Citation de conclusion dans la section impact.'
    }
  },
  {
    id: 'campaignKickoffDate',
    type: 'date',
    question: 'Quand débutez-vous la préparation active de la campagne ?',
    options: [],
    required: false,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Poser le point de départ du run marketing.',
      details: 'Cette date permet de calculer le runway entre préparation et lancement.',
      tips: [
        'Indiquez la date à laquelle vous souhaitez lancer la production des supports.',
        'Mettez à jour la date si la préparation démarre plus tôt ou plus tard que prévu.'
      ]
    },
    showcase: {
      sections: ['timeline'],
      usage: 'Point de départ utilisé pour calculer le runway et les prochaines étapes.'
    }
  },
  {
    id: 'launchDate',
    type: 'date',
    question: 'Quelle est la date de lancement ou de reveal souhaitée ?',
    options: [],
    required: false,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Aligner toutes les parties prenantes sur la cible de lancement.',
      details: 'Associée à la date de kick-off, cette information permet de vérifier la faisabilité du planning.',
      tips: [
        'Renseignez la première date de mise en avant (événement, publication, annonce).',
        'Si la date n’est pas figée, indiquez l’hypothèse la plus réaliste pour planifier les ressources.'
      ]
    },
    showcase: {
      sections: ['timeline'],
      usage: 'Date cible utilisée pour le calcul du runway et du calendrier.'
    }
  },
  {
    id: 'teamLead',
    type: 'text',
    question: 'Qui porte la narration et coordonne le projet ?',
    options: [],
    required: true,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Identifier la personne qui centralise les retours et valide les contenus.',
      details: "Ce contact sera mentionné dans la vitrine pour renforcer la crédibilité de l'équipe.",
      tips: [
        'Indiquez prénom, nom et rôle.',
        'Ajoutez si besoin un canal de contact (LinkedIn, e-mail) dans vos notes internes.'
      ]
    },
    showcase: {
      sections: ['team'],
      usage: 'Bloc « Lead du projet » dans la section équipe.'
    }
  },
  {
    id: 'teamCoreMembers',
    type: 'long_text',
    question: 'Quels sont les membres clés qui incarnent le projet ?',
    options: [],
    required: false,
    conditions: [],
    conditionLogic: 'all',
    guidance: {
      objective: 'Mettre en avant la complémentarité de l’équipe.',
      details: 'Chaque ligne sera affichée comme un membre du “collectif moteur”.',
      tips: [
        'Mentionnez pour chaque personne le rôle ou l’expertise apportée.',
        'Incluez éventuellement les partenaires ou experts externes essentiels.'
      ]
    },
    showcase: {
      sections: ['team'],
      usage: 'Liste « Collectif moteur » dans la section équipe.'
    }
  }
];
