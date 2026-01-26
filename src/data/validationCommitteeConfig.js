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
      riskTriggers: {
        requireRisks: false,
        minRiskCount: null,
        minRiskLevel: ''
      },
      teamTriggers: {
        minTeamsCount: null
      }
    }
  ]
};
