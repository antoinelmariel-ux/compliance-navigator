export const initialRules =  [
  {
    id: 'rule_story_foundations',
    name: 'Narration de base à structurer',
    conditions: [],
    conditionLogic: 'all',
    teams: ['story'],
    questions: {
      story: [
        'Le slogan résume-t-il la promesse en moins de 10 mots ?',
        'La proposition de valeur précise-t-elle bien le public, le problème et le bénéfice clé ?',
        'Les pain points sont-ils formulés dans le langage de l’audience ?'
      ]
    },
    risks: [
      {
        title: 'Promesse à affiner',
        description: 'Sans promesse claire dès le hero, le pitch perd en impact dès les premières secondes.',
        level: 'Modéré',
        mitigation: 'Tester plusieurs formulations courtes et les faire relire par un pair.',
        priority: 'Recommandé'
      }
    ],
    priority: 'Recommandé'
  },
  {
    id: 'rule_public_launch',
    name: 'Diffusion grand public',
    conditions: [
      { question: 'targetAudience', operator: 'contains', value: 'Grand public / clients finaux' }
    ],
    conditionLogic: 'all',
    teams: ['story', 'press'],
    questions: {
      story: [
        'Le ton est-il inclusif et dépourvu de jargon ?',
        'Une illustration forte est-elle identifiée pour soutenir le message ?'
      ],
      press: [
        'Les éléments de preuve sont-ils sourcés et prêts à être partagés ?',
        'Un plan de diffusion média ou social est-il esquissé ?'
      ]
    },
    risks: [
      {
        title: 'Narration grand public insuffisamment adaptée',
        description: 'Un message trop technique peut créer une rupture d’adhésion chez les audiences larges.',
        level: 'Moyen',
        mitigation: 'Simplifier les formulations et prévoir une validation éditoriale.',
        priority: 'Important'
      }
    ],
    priority: 'Important'
  },
  {
    id: 'rule_investor_focus',
    name: 'Roadshow investisseurs',
    conditions: [
      { question: 'targetAudience', operator: 'contains', value: 'Investisseurs' }
    ],
    conditionLogic: 'all',
    teams: ['growth', 'partners'],
    questions: {
      growth: [
        'Les chiffres de marché et de traction sont-ils consolidés dans un format partageable ?',
        "Le plan d'impact financier ou d'adoption est-il prêt à être commenté ?"
      ],
      partners: [
        'Les synergies ou partenariats stratégiques sont-ils clairement identifiés ?',
        'Les besoins de financement ou de ressources sont-ils explicites ?'
      ]
    },
    risks: [
      {
        title: 'Dossier investisseurs incomplet',
        description: 'Sans indicateurs solides, la crédibilité business peut être questionnée lors du pitch.',
        level: 'Élevé',
        mitigation: 'Préparer un one-pager financier et valider les hypothèses clés avec l’équipe growth.',
        priority: 'Critique'
      }
    ],
    priority: 'Critique'
  },
  {
    id: 'rule_partner_activation',
    name: 'Activation partenaires & prescripteurs',
    conditions: [
      { question: 'targetAudience', operator: 'contains', value: 'Partenaires ou prescripteurs' }
    ],
    conditionLogic: 'all',
    teams: ['partners', 'product'],
    questions: {
      partners: [
        'Le rôle attendu des partenaires est-il décrit clairement ?',
        'Les bénéfices mutuels sont-ils tangibles et chiffrés ?'
      ],
      product: [
        'Une démonstration spécifique partenaires est-elle prévue ?',
        'Les ressources (kits, argumentaires) sont-elles identifiées ?'
      ]
    },
    risks: [
      {
        title: 'Proposition partenaire à clarifier',
        description: 'Sans proposition de valeur bilatérale, la collaboration risque de manquer d’engagement.',
        level: 'Moyen',
        mitigation: 'Formaliser les bénéfices partagés et préparer des assets dédiés.',
        priority: 'Important'
      }
    ],
    priority: 'Important'
  },
  {
    id: 'rule_launch_runway',
    name: 'Runway avant lancement',
    conditions: [
      {
        type: 'timing',
        startQuestion: 'campaignKickoffDate',
        endQuestion: 'launchDate',
        complianceProfiles: [
          {
            id: 'standard_story',
            label: 'Narratif prêt',
            description: 'Temps minimal pour construire la narration et les assets essentiels.',
            requirements: {
              story: { minimumWeeks: 4 },
              product: { minimumWeeks: 4 }
            }
          },
          {
            id: 'public_launch',
            label: 'Diffusion grand public',
            description: 'Prévoir un buffer supplémentaire pour orchestrer la communication externe.',
            conditions: [
              { question: 'targetAudience', operator: 'contains', value: 'Grand public / clients finaux' }
            ],
            requirements: {
              story: { minimumWeeks: 6 },
              press: { minimumWeeks: 6 }
            }
          },
          {
            id: 'investor_roadshow',
            label: 'Roadshow investisseurs',
            description: 'Temps recommandé pour consolider les éléments financiers et partenariaux.',
            conditions: [
              { question: 'targetAudience', operator: 'contains', value: 'Investisseurs' }
            ],
            requirements: {
              growth: { minimumWeeks: 7 },
              partners: { minimumWeeks: 7 }
            }
          }
        ]
      }
    ],
    conditionLogic: 'all',
    teams: ['story', 'product', 'growth'],
    questions: {
      story: [
        'Le rétroplanning de production des contenus est-il aligné avec la date de lancement ?'
      ],
      product: [
        'Les démonstrations et preuves produit sont-elles planifiées dans le calendrier ?'
      ],
      growth: [
        'Les KPI de suivi post-lancement sont-ils définis avant la diffusion ?'
      ]
    },
    risks: [
      {
        title: 'Runway insuffisant',
        description: 'Un délai trop court entre kick-off et lancement fragilise la qualité du storytelling.',
        level: 'Moyen',
        mitigation: 'Allonger la phase de préparation ou prioriser les assets critiques.',
        priority: 'Important'
      }
    ],
    priority: 'Important'
  }
];
