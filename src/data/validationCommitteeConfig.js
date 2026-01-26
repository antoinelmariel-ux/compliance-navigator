export const initialValidationCommitteeConfig = {
  enabled: true,
  questionTriggers: {
    matchMode: 'any',
    questionIds: []
  },
  riskTriggers: {
    requireRisks: false,
    minRiskCount: null,
    minRiskLevel: ''
  },
  teamTriggers: {
    minTeamsCount: null
  }
};
