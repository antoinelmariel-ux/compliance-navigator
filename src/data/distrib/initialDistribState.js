export const initialDistribState = {
  summary: {
    activeDistributors: 18,
    countriesCovered: 12,
    auditsInProgress: 4,
    contractsExpiring: 3
  },
  pipelineStages: [
    { id: 'sourcing', label: 'Sourcing', count: 6 },
    { id: 'qualification', label: 'Qualification', count: 5 },
    { id: 'negotiation', label: 'Négociation', count: 4 },
    { id: 'signature', label: 'Signature', count: 3 }
  ],
  distributors: [
    {
      id: 'distrib-aurora',
      name: 'Aurora Trading',
      country: 'Espagne',
      status: 'Qualification',
      score: 78,
      riskLevel: 'Modéré',
      areaManager: 'Lina Perez',
      complianceOwner: 'Marc Dubois',
      contractEnd: '2026-03-12',
      noGo: false
    },
    {
      id: 'distrib-nordic',
      name: 'Nordic Gate',
      country: 'Suède',
      status: 'Négociation',
      score: 84,
      riskLevel: 'Faible',
      areaManager: 'Johan Eriksen',
      complianceOwner: 'Sarah Klein',
      contractEnd: '2025-11-08',
      noGo: false
    },
    {
      id: 'distrib-alpine',
      name: 'Alpine Partners',
      country: 'Suisse',
      status: 'Audit',
      score: 62,
      riskLevel: 'Élevé',
      areaManager: 'Clara Meyer',
      complianceOwner: 'Samira Haddad',
      contractEnd: '2025-06-30',
      noGo: true
    },
    {
      id: 'distrib-atlas',
      name: 'Atlas Commercial',
      country: 'Maroc',
      status: 'Sourcing',
      score: 71,
      riskLevel: 'Modéré',
      areaManager: 'Youssef Rahmani',
      complianceOwner: 'Claire Petit',
      contractEnd: '2027-01-19',
      noGo: false
    }
  ],
  countryIntelligence: [
    {
      id: 'fr',
      name: 'France',
      riskLevel: 'Faible',
      keyRegulations: ['Loi Sapin II', 'RGPD', 'Devoir de vigilance'],
      priorities: ['Agents publics', 'Traçabilité supply', 'Formation anticorruption'],
      contractEnd: '2026-05-20'
    },
    {
      id: 'it',
      name: 'Italie',
      riskLevel: 'Modéré',
      keyRegulations: ['Modello 231', 'Anti-Mafia Compliance', 'RGPD'],
      priorities: ['Due diligence tier 2', 'Clauses anticorruption renforcées'],
      contractEnd: '2025-09-14'
    },
    {
      id: 'ae',
      name: 'Émirats Arabes Unis',
      riskLevel: 'Élevé',
      keyRegulations: ['AML Cabinet Decision', 'Sanctions Screening'],
      priorities: ['Contrôle des tiers', 'Audit transactionnel'],
      contractEnd: '2025-12-02'
    }
  ],
  evaluationWorkstreams: [
    {
      role: 'Area Manager',
      progress: 0.72,
      questions: [
        {
          id: 'am-coverage',
          label: 'Couverture commerciale et objectifs de volume',
          status: 'Validé',
          help: 'Documenter la couverture par segment et les objectifs de croissance.'
        },
        {
          id: 'am-resources',
          label: 'Capacité terrain et ressources de vente dédiées',
          status: 'En revue',
          help: 'Préciser l’organisation commerciale et les FTE.'
        },
        {
          id: 'am-references',
          label: 'Références clients locales et parts de marché',
          status: 'À compléter',
          help: 'Fournir 3 références vérifiables.'
        }
      ]
    },
    {
      role: 'Compliance',
      progress: 0.58,
      questions: [
        {
          id: 'co-screening',
          label: 'Screening sanctions & PEP',
          status: 'En revue',
          help: 'Valider la mise à jour des listes sanctions.'
        },
        {
          id: 'co-policy',
          label: 'Politique anticorruption locale',
          status: 'À compléter',
          help: 'Joindre les politiques internes et preuves de formation.'
        },
        {
          id: 'co-gifts',
          label: 'Pratiques cadeaux & hospitalité',
          status: 'Validé',
          help: 'Contrôle du seuil et processus d’approbation.'
        }
      ]
    }
  ],
  contractBriefing: {
    questions: [
      {
        id: 'brief-1',
        label: 'Quels engagements de performance doivent être contractualisés ?',
        hint: 'Utilisez les données du pipeline pour aligner les KPI.'
      },
      {
        id: 'brief-2',
        label: 'Quels flux financiers nécessitent une validation Compliance ?',
        hint: 'Vérifier les ristournes, incentives et remises exceptionnelles.'
      },
      {
        id: 'brief-3',
        label: 'Quels pays nécessitent une clause d’audit renforcée ?',
        hint: 'Appuyer sur la cartographie des risques pays.'
      }
    ],
    complianceNotes: [
      {
        author: 'Compliance',
        time: 'Hier, 17:45',
        message: 'Prévoir une clause d’audit trimestriel pour Alpine Partners.'
      },
      {
        author: 'Area Manager',
        time: 'Aujourd’hui, 09:20',
        message: 'Les volumes prévisionnels nécessitent une option de stockage local.'
      }
    ]
  },
  contractOverview: [
    {
      theme: 'Gouvernance',
      clauses: ['Comité de pilotage', 'Reporting mensuel', 'Escalade incidents']
    },
    {
      theme: 'Conformité',
      clauses: ['Clause anticorruption', 'Droit d’audit', 'Engagement RGPD']
    },
    {
      theme: 'Commercial',
      clauses: ['Objectifs de vente', 'Niveaux de remise', 'Territoires exclusifs']
    }
  ],
  amendments: [
    {
      id: 'amd-2024-01',
      title: 'Extension périmètre Sud',
      status: 'À valider',
      owner: 'Legal',
      updatedAt: '2024-10-12'
    },
    {
      id: 'amd-2024-02',
      title: 'Mise à jour clause de résiliation',
      status: 'En négociation',
      owner: 'Compliance',
      updatedAt: '2024-10-29'
    },
    {
      id: 'amd-2024-03',
      title: 'Nouvelle politique cadeaux',
      status: 'Signé',
      owner: 'Area Manager',
      updatedAt: '2024-11-04'
    }
  ],
  audits: [
    {
      id: 'audit-aurora',
      distributor: 'Aurora Trading',
      status: 'Plan d’action en cours',
      score: 82,
      nextReview: '2025-02-15',
      actions: [
        'Mettre à jour la charte cadeaux',
        'Renforcer la traçabilité des commissions'
      ]
    },
    {
      id: 'audit-alpine',
      distributor: 'Alpine Partners',
      status: 'Audit critique',
      score: 54,
      nextReview: '2024-12-20',
      actions: [
        'Suspendre les incentives hors contrat',
        'Former les équipes locales'
      ]
    }
  ],
  countryCoverage: [
    {
      country: 'France',
      distributor: 'Aurora Trading',
      contractEnd: '2026-05-20',
      status: 'Actif'
    },
    {
      country: 'Suède',
      distributor: 'Nordic Gate',
      contractEnd: '2025-11-08',
      status: 'Renouvellement'
    },
    {
      country: 'Suisse',
      distributor: 'Alpine Partners',
      contractEnd: '2025-06-30',
      status: 'Sous surveillance'
    },
    {
      country: 'Maroc',
      distributor: 'Atlas Commercial',
      contractEnd: '2027-01-19',
      status: 'Actif'
    }
  ],
  comparisons: [
    {
      id: 'cmp-aurora',
      name: 'Aurora Trading',
      score: 78,
      coverage: 'Europe du Sud',
      noGo: false
    },
    {
      id: 'cmp-nordic',
      name: 'Nordic Gate',
      score: 84,
      coverage: 'Nordics',
      noGo: false
    },
    {
      id: 'cmp-alpine',
      name: 'Alpine Partners',
      score: 62,
      coverage: 'DACH',
      noGo: true
    }
  ]
};
