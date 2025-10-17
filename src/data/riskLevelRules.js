export const initialRiskLevelRules = [
  {
    id: 'risk_low',
    label: 'Faible',
    minRisks: 0,
    maxRisks: 1,
    description: "0 à 1 risque identifié : suivi standard avec un point de validation suffisant."
  },
  {
    id: 'risk_medium',
    label: 'Modérée',
    minRisks: 2,
    maxRisks: 3,
    description: '2 à 3 risques identifiés : coordination accrue avec les équipes expertes.'
  },
  {
    id: 'risk_high',
    label: 'Élevée',
    minRisks: 4,
    maxRisks: null,
    description: '4 risques et plus : plan d’actions prioritaire à piloter avec le sponsor compliance.'
  }
];
