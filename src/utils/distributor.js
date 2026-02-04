const SITUATION_IDS = {
  evaluation: 'evaluation',
  contractReview: 'contract_review',
  underContract: 'under_contract'
};

const SITUATION_LABELS = {
  [SITUATION_IDS.evaluation]: 'En évaluation',
  [SITUATION_IDS.contractReview]: 'En revue de contrat',
  [SITUATION_IDS.underContract]: 'Sous contrat'
};

const normalizeSituationId = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (
    normalized === SITUATION_IDS.evaluation ||
    normalized.includes('évaluation') ||
    normalized.includes('evaluation')
  ) {
    return SITUATION_IDS.evaluation;
  }

  if (
    normalized === SITUATION_IDS.contractReview ||
    normalized.includes('revue') ||
    normalized.includes('review')
  ) {
    return SITUATION_IDS.contractReview;
  }

  if (
    normalized === SITUATION_IDS.underContract ||
    normalized.includes('sous contrat') ||
    normalized.includes('under contract') ||
    normalized.includes('contract')
  ) {
    return SITUATION_IDS.underContract;
  }

  return null;
};

export const resolveDistributorSituationId = (project) => {
  const candidates = [
    project?.distributorSituation,
    project?.answers?.distributorSituation,
    project?.contractStatus,
    project?.answers?.contractStatus,
    project?.situation,
    project?.answers?.situation
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const normalized = normalizeSituationId(candidates[index]);
    if (normalized) {
      return normalized;
    }
  }

  if (project?.status === 'submitted') {
    return SITUATION_IDS.contractReview;
  }

  return SITUATION_IDS.evaluation;
};

export const getDistributorSituationLabel = (situationId) =>
  SITUATION_LABELS[situationId] || SITUATION_LABELS[SITUATION_IDS.evaluation];

export const DISTRIBUTOR_SITUATION_OPTIONS = [
  {
    id: SITUATION_IDS.evaluation,
    label: SITUATION_LABELS[SITUATION_IDS.evaluation]
  },
  {
    id: SITUATION_IDS.contractReview,
    label: SITUATION_LABELS[SITUATION_IDS.contractReview]
  },
  {
    id: SITUATION_IDS.underContract,
    label: SITUATION_LABELS[SITUATION_IDS.underContract]
  }
];

export const DISTRIBUTOR_SITUATION_IDS = SITUATION_IDS;
