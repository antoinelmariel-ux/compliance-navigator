export const initialValidationCommitteeConfig = {
  enabled: true,
  committees: [
    {
      id: 'committee-default',
      name: 'Comité de validation',
      emails: ['comite.validation@company.com', 'secretariat.validation@company.com'],
      questionTriggers: {
        matchMode: 'any',
        questionIds: []
      },
      answerTriggers: {
        matchMode: 'any',
        conditions: []
      },
      ruleTriggers: {
        matchMode: 'any',
        ruleIds: []
      },
      riskTriggers: {
        requireRisks: false,
        minRiskCount: null,
        minRiskLevel: '',
        minRiskScore: null
      },
      teamTriggers: {
        minTeamsCount: null
      }
    }
  ]
};
