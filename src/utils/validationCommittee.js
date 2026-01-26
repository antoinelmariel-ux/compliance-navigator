const COMPLEXITY_ORDER = ['Faible', 'Moyen', 'Élevé'];
export const DEFAULT_COMMITTEE_ID = 'committee-default';

const sanitizeTextValue = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeEmails = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeTextValue(entry))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

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

const normalizeAnswerTriggerConditions = (conditions) => {
  if (!Array.isArray(conditions)) {
    return [];
  }

  return conditions
    .map((condition) => {
      const questionId = sanitizeTextValue(condition?.questionId);
      const rawValue = condition?.value;
      const value = typeof rawValue === 'string'
        ? rawValue.trim()
        : rawValue === 0 || rawValue === false
          ? String(rawValue)
          : '';

      if (!questionId || value.length === 0) {
        return null;
      }

      return {
        questionId,
        value
      };
    })
    .filter(Boolean);
};

const normalizeAnswerTriggers = (value) => ({
  matchMode: value?.matchMode === 'all' ? 'all' : 'any',
  conditions: normalizeAnswerTriggerConditions(value?.conditions)
});

const normalizeRuleTriggers = (value) => {
  const ruleIds = Array.isArray(value?.ruleIds)
    ? value.ruleIds.filter((id) => typeof id === 'string' && id.trim().length > 0)
    : [];
  const matchMode = value?.matchMode === 'all' ? 'all' : 'any';

  return {
    matchMode,
    ruleIds
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
  const rawMinRiskScore = value?.minRiskScore;
  const minRiskScore = rawMinRiskScore === null || rawMinRiskScore === undefined || rawMinRiskScore === ''
    ? null
    : Number.isFinite(Number(rawMinRiskScore))
      ? Math.max(0, Number(rawMinRiskScore))
      : null;

  return {
    requireRisks,
    minRiskCount,
    minRiskLevel,
    minRiskScore
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

const normalizeCommittee = (value = {}, index = 0) => {
  const id = sanitizeTextValue(value?.id) || `committee-${index + 1}`;
  const name = sanitizeTextValue(value?.name) || `Comité ${index + 1}`;
  const emails = normalizeEmails(value?.emails ?? value?.contacts);

  return {
    id,
    name,
    emails,
    questionTriggers: normalizeQuestionTriggers(value?.questionTriggers),
    answerTriggers: normalizeAnswerTriggers(value?.answerTriggers),
    ruleTriggers: normalizeRuleTriggers(value?.ruleTriggers),
    riskTriggers: normalizeRiskTriggers(value?.riskTriggers),
    teamTriggers: normalizeTeamTriggers(value?.teamTriggers)
  };
};

const buildDefaultCommittee = (value = {}) =>
  normalizeCommittee(
    {
      id: DEFAULT_COMMITTEE_ID,
      name: 'Comité de validation',
      ...value
    },
    0
  );

export const normalizeValidationCommitteeConfig = (value = {}) => {
  const hasCommittees = Array.isArray(value?.committees);
  const committees = hasCommittees
    ? value.committees.map((committee, index) => normalizeCommittee(committee, index))
    : [buildDefaultCommittee(value)];

  return {
    enabled: value?.enabled !== false,
    committees
  };
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

const getMinimumRiskScore = (risks) => {
  if (!Array.isArray(risks) || risks.length === 0) {
    return 0;
  }

  const weights = risks
    .map((risk) => (Number.isFinite(risk?.weight) ? risk.weight : null))
    .filter((weight) => weight !== null);

  if (weights.length === 0) {
    return 0;
  }

  return Math.min(...weights);
};

const shouldTriggerCommittee = (committee, context = {}) => {
  const analysis = context?.analysis || {};
  const relevantTeams = Array.isArray(context?.relevantTeams) ? context.relevantTeams : [];
  const risks = Array.isArray(analysis?.risks) ? analysis.risks : [];
  const triggeredRuleIds = Array.isArray(analysis?.triggeredRules)
    ? analysis.triggeredRules
        .map((rule) => rule?.id)
        .filter((id) => typeof id === 'string')
    : [];

  const triggers = [];

  if (committee.ruleTriggers.ruleIds.length > 0) {
    const ruleMatches = committee.ruleTriggers.ruleIds.map((ruleId) => triggeredRuleIds.includes(ruleId));
    triggers.push(
      ruleMatches.some(Boolean)
    );
  }

  if (committee.riskTriggers.requireRisks) {
    triggers.push(risks.length > 0);
  }

  if (committee.riskTriggers.minRiskCount) {
    triggers.push(risks.length >= committee.riskTriggers.minRiskCount);
  }

  if (committee.riskTriggers.minRiskLevel) {
    triggers.push(isComplexityAtLeast(analysis?.complexity, committee.riskTriggers.minRiskLevel));
  }

  if (committee.riskTriggers.minRiskScore !== null && committee.riskTriggers.minRiskScore !== undefined) {
    const minimumRiskScore = getMinimumRiskScore(risks);
    triggers.push(minimumRiskScore >= committee.riskTriggers.minRiskScore);
  }

  if (committee.teamTriggers.minTeamsCount) {
    triggers.push(relevantTeams.length >= committee.teamTriggers.minTeamsCount);
  }

  return triggers.some(Boolean);
};

export const getTriggeredValidationCommittees = (config, context = {}) => {
  const normalized = normalizeValidationCommitteeConfig(config);
  if (!normalized.enabled) {
    return [];
  }

  return normalized.committees.filter((committee) => shouldTriggerCommittee(committee, context));
};

export const shouldRequireValidationCommittee = (config, context = {}) =>
  getTriggeredValidationCommittees(config, context).length > 0;
