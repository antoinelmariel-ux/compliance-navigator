export const contractComplianceComments = [
  {
    id: 'legal',
    team: 'Juridique',
    status: 'Validé',
    owner: 'Camille Dupont',
    comment:
      'Les clauses de responsabilité sont alignées avec notre modèle standard. Prévoir une annexe pour les garanties IP.'
  },
  {
    id: 'regulatory',
    team: 'Affaires réglementaires',
    status: 'À clarifier',
    owner: 'Nadia El Idrissi',
    comment:
      'Ajouter une mention explicite sur la traçabilité des lots et les obligations de pharmacovigilance trimestrielles.'
  },
  {
    id: 'privacy',
    team: 'Données & Privacy',
    status: 'Validé',
    owner: 'Hugo Martin',
    comment:
      'Aucune donnée sensible identifiée. Prévoir toutefois une revue annuelle si le périmètre digital évolue.'
  },
  {
    id: 'finance',
    team: 'Finance',
    status: 'Recommandation',
    owner: 'Sarah Lemoine',
    comment:
      'Sécuriser un mécanisme d’ajustement des remises en cas d’écart > 10% sur le forecast volume.'
  }
];

export const contractClauseSummaries = [
  {
    id: 'dates',
    title: 'Date de début et date de fin',
    summary:
      'Démarrage prévu au 1er juin 2025 avec une durée initiale de 36 mois. Renouvellement automatique sur 12 mois sauf dénonciation 6 mois avant terme.'
  },
  {
    id: 'roles',
    title: 'Rôles et responsabilités',
    summary:
      'Le distributeur gère l’enregistrement local, la distribution et la pharmacovigilance. LFB fournit les dossiers réglementaires, la formation et le support qualité.'
  },
  {
    id: 'liability',
    title: 'Limites de responsabilité',
    summary:
      'Plafond de responsabilité fixé à 150% du chiffre d’affaires annuel net. Exclusions : faute lourde, non-conformité réglementaire intentionnelle.'
  },
  {
    id: 'funding',
    title: 'Financement',
    summary:
      'Budget marketing cofinancé à 60/40. Paiements trimestriels avec avance initiale de 120k€ pour lancement.'
  },
  {
    id: 'audit',
    title: 'Audit',
    summary:
      'Audit qualité annuel planifié. Droit d’audit ad hoc sous 30 jours en cas d’incident majeur.'
  }
];

export const contractPreviewSections = [
  {
    id: 'scope',
    title: 'Objet du contrat',
    content:
      'Le présent contrat encadre la distribution des gammes Neuroline et Cardio+ dans la zone UE Sud, avec exclusivité conditionnelle aux objectifs annuels.'
  },
  {
    id: 'quality',
    title: 'Qualité & conformité',
    content:
      'Les parties s’engagent à respecter les BPF/BPD applicables. Un comité de pilotage qualité se réunira tous les trimestres.'
  },
  {
    id: 'termination',
    title: 'Résiliation',
    content:
      'Chaque partie peut résilier avec un préavis de 6 mois. En cas de non-conformité critique, la résiliation est immédiate.'
  }
];
