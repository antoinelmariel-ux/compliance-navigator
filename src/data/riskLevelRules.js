export const initialRiskLevelRules = [
  {
    "id": "risk_low",
    "label": "Faible",
    "minRisks": 0,
    "maxRisks": 1,
    "description": "Suivi standard avec un point de validation suffisant.",
    "maxScore": 1
  },
  {
    "id": "risk_medium",
    "label": "Modérée",
    "minRisks": 4,
    "maxRisks": 9,
    "description": "Coordination accrue avec les équipes expertes.",
    "minScore": 4,
    "maxScore": 9
  },
  {
    "id": "risk_high",
    "label": "Élevée",
    "minRisks": 10,
    "maxRisks": null,
    "description": "Plan d’actions prioritaire à piloter avec le sponsor compliance.",
    "minScore": 10
  }
];
