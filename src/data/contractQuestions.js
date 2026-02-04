export const initialContractQuestions = [
  {
    id: 'contractPartner',
    type: 'searchable_select',
    question: 'Quel distributeur souhaitez-vous contractualiser ?',
    options: [],
    required: true,
    placeholder: 'Rechercher un partenaire comparé',
    guidance: {
      objective: 'Sélectionner le distributeur prioritaire issu de la phase de comparaison.',
      details: 'Le choix doit correspondre à un partenaire évalué afin d’assurer la traçabilité des décisions.',
      tips: [
        'Tapez quelques lettres pour filtrer la liste.',
        'Si la liste est vide, revenez à la comparaison pour sélectionner des partenaires.'
      ]
    }
  },
  {
    id: 'contractTerritory',
    type: 'long_text',
    question: 'Sur quels territoires le distributeur sera-t-il autorisé à vendre les médicaments ?',
    options: [],
    required: true,
    placeholder: 'Pays, régions, périmètres exclusifs ou non.'
  },
  {
    id: 'contractProducts',
    type: 'long_text',
    question: 'Quels médicaments, gammes ou indications sont concernés par le contrat ?',
    options: [],
    required: true,
    placeholder: 'Ex. Gamme X, produits OTC, spécialités hospitalières...'
  },
  {
    id: 'contractExclusivity',
    type: 'choice',
    question: 'Souhaitez-vous accorder une exclusivité de distribution ?',
    options: [
      'Exclusivité totale',
      'Exclusivité partielle (par canal ou territoire)',
      'Aucune exclusivité'
    ],
    required: true
  },
  {
    id: 'contractDuration',
    type: 'choice',
    question: 'Quelle est la durée envisagée du contrat ?',
    options: [
      '1 an',
      '2 ans',
      '3 ans',
      '5 ans',
      'Durée indéterminée'
    ],
    required: true
  },
  {
    id: 'contractVolumeForecast',
    type: 'number',
    question: 'Quel volume annuel prévisionnel souhaitez-vous engager (en unités) ?',
    options: [],
    required: false,
    numberUnit: 'unités'
  },
  {
    id: 'contractPricingPolicy',
    type: 'long_text',
    question: 'Quels principes de prix, remises ou marges doivent être encadrés ?',
    options: [],
    required: true,
    placeholder: 'Prix catalogue, remises conditionnelles, plafonds de marge...'
  },
  {
    id: 'contractRegulatoryRoles',
    type: 'multi_choice',
    question: 'Quelles responsabilités réglementaires doivent être précisées ?',
    options: [
      'Demande et maintien des AMM',
      'Pharmacovigilance locale',
      'Matériovigilance / réclamations qualité',
      'Déclarations douanières / importations',
      'Rappels de lots'
    ],
    required: true
  },
  {
    id: 'contractLogistics',
    type: 'long_text',
    question: 'Quelles obligations logistiques et de stockage doivent figurer au contrat ?',
    options: [],
    required: true,
    placeholder: 'GDP, chaîne du froid, niveaux de stock de sécurité...'
  },
  {
    id: 'contractComplianceClauses',
    type: 'multi_choice',
    question: 'Quelles clauses de conformité sont incontournables ?',
    options: [
      'Anti-corruption et cadeaux',
      'Contrôle des tiers et sous-distributeurs',
      'Protection des données personnelles',
      'Sanctions / embargos',
      'Audit et accès aux informations'
    ],
    required: true
  },
  {
    id: 'contractStartDate',
    type: 'date',
    question: 'Quelle est la date de démarrage cible du contrat ?',
    options: [],
    required: false
  },
  {
    id: 'contractTermination',
    type: 'long_text',
    question: 'Quelles conditions de résiliation ou de sortie souhaitez-vous prévoir ?',
    options: [],
    required: true,
    placeholder: 'Préavis, faute grave, non-respect des obligations...'
  }
];
