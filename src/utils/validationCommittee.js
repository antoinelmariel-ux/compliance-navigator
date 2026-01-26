const COMPLEXITY_ORDER = ['Faible', 'Moyen', 'Élevé'];

const normalizeQuestionTriggers = (value) => {
  const questionIds = Array.isArray(value?.questionIds)
    ? value.questionIds.filter((id) => typeof id === 'string' && id.trim().length > 0)
    : [];
  const matchMode = value?.matchMode === 'all' ? 'all' : 'any';

  return {
    matchMode,
    questionIds
  };
};

const normalizeRiskTriggers = (value) => {
  const requireRisks = Boolean(value?.requireRisks);
  const rawMinRiskCount = value?.minRiskCount;
  const minRiskCount = rawMinRiskCount === null || rawMinRiskCount === undefined || rawMinRiskCount === ''
    ? null
    : Number.isFinite(Number(rawMinRiskCount))
      ? Math.max(1, Number(rawMinRiskCount))
      : null;
  const minRiskLevel = COMPLEXITY_ORDER.includes(value?.minRiskLevel)
    ? value.minRiskLevel
    : '';

  return {
    requireRisks,
    minRiskCount,
    minRiskLevel
  };
};

const normalizeTeamTriggers = (value) => {
  const rawMinTeamsCount = value?.minTeamsCount;
  const minTeamsCount = rawMinTeamsCount === null || rawMinTeamsCount === undefined || rawMinTeamsCount === ''
    ? null
    : Number.isFinite(Number(rawMinTeamsCount))
      ? Math.max(1, Number(rawMinTeamsCount))
      : null;

  return {
    minTeamsCount
  };
};

export const normalizeValidationCommitteeConfig = (value = {}) => {
  return {
    enabled: value?.enabled !== false,
    questionTriggers: normalizeQuestionTriggers(value?.questionTriggers),
    riskTriggers: normalizeRiskTriggers(value?.riskTriggers),
    teamTriggers: normalizeTeamTriggers(value?.teamTriggers)
  };
};

const isAnswerProvided = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
};

const isComplexityAtLeast = (actual, minimum) => {
  if (!actual || !minimum) {
    return false;
  }

  const actualIndex = COMPLEXITY_ORDER.indexOf(actual);
  const minimumIndex = COMPLEXITY_ORDER.indexOf(minimum);

  if (actualIndex === -1 || minimumIndex === -1) {
    return false;
  }

  return actualIndex >= minimumIndex;
};

export const shouldRequireValidationCommittee = (config, context = {}) => {
  const normalized = normalizeValidationCommitteeConfig(config);
  if (!normalized.enabled) {
    return false;
  }

  const answers = context?.answers || {};
  const analysis = context?.analysis || {};
  const relevantTeams = Array.isArray(context?.relevantTeams) ? context.relevantTeams : [];
  const risks = Array.isArray(analysis?.risks) ? analysis.risks : [];

  const triggers = [];

  if (normalized.questionTriggers.questionIds.length > 0) {
    const questionMatches = normalized.questionTriggers.questionIds.map((questionId) =>
      isAnswerProvided(answers?.[questionId])
    );
    triggers.push(
      normalized.questionTriggers.matchMode === 'all'
        ? questionMatches.every(Boolean)
        : questionMatches.some(Boolean)
    );
  }

  if (normalized.riskTriggers.requireRisks) {
    triggers.push(risks.length > 0);
  }

  if (normalized.riskTriggers.minRiskCount) {
    triggers.push(risks.length >= normalized.riskTriggers.minRiskCount);
  }

  if (normalized.riskTriggers.minRiskLevel) {
    triggers.push(isComplexityAtLeast(analysis?.complexity, normalized.riskTriggers.minRiskLevel));
  }

  if (normalized.teamTriggers.minTeamsCount) {
    triggers.push(relevantTeams.length >= normalized.teamTriggers.minTeamsCount);
  }

  return triggers.some(Boolean);
};
