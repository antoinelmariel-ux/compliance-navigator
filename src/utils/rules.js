import { normalizeAnswerForComparison } from './questions.js';
import { normalizeConditionGroups } from './conditionGroups.js';
import { sanitizeRuleCondition } from './ruleConditions.js';

const DEFAULT_COMPLEXITY_RULES = [
  { id: 'default_low', label: 'Faible', minRisks: 0, maxRisks: 1 },
  { id: 'default_medium', label: 'Modérée', minRisks: 2, maxRisks: 3 },
  { id: 'default_high', label: 'Élevée', minRisks: 4, maxRisks: null }
];

const normalizeRiskLevelRules = (rules) => {
  if (!Array.isArray(rules) || rules.length === 0) {
    return DEFAULT_COMPLEXITY_RULES;
  }

  return rules
    .map((rule, index) => {
      const minRisks = Number.isFinite(rule?.minRisks)
        ? Math.max(0, Math.floor(rule.minRisks))
        : 0;
      const maxRisks = Number.isFinite(rule?.maxRisks)
        ? Math.max(0, Math.floor(rule.maxRisks))
        : null;

      return {
        id: rule?.id || `risk_level_${index + 1}`,
        label: typeof rule?.label === 'string' && rule.label.trim() !== ''
          ? rule.label.trim()
          : `Niveau ${index + 1}`,
        description: typeof rule?.description === 'string'
          ? rule.description.trim()
          : '',
        minRisks,
        maxRisks
      };
    })
    .sort((a, b) => {
      if (a.minRisks !== b.minRisks) {
        return a.minRisks - b.minRisks;
      }

      const aMax = a.maxRisks === null ? Number.POSITIVE_INFINITY : a.maxRisks;
      const bMax = b.maxRisks === null ? Number.POSITIVE_INFINITY : b.maxRisks;

      if (aMax !== bMax) {
        return aMax - bMax;
      }

      return a.id.localeCompare(b.id);
    });
};

const resolveComplexityLevel = (riskCount, riskLevelRules) => {
  const normalizedRules = normalizeRiskLevelRules(riskLevelRules);
  const firstRule = normalizedRules[0];

  for (let index = 0; index < normalizedRules.length; index += 1) {
    const rule = normalizedRules[index];
    const matchesMinimum = riskCount >= rule.minRisks;
    const matchesMaximum =
      rule.maxRisks === null || rule.maxRisks === undefined
        ? true
        : riskCount <= rule.maxRisks;

    if (matchesMinimum && matchesMaximum) {
      return { label: rule.label, rule };
    }
  }

  const fallback = riskCount < (firstRule?.minRisks ?? 0)
    ? firstRule
    : normalizedRules[normalizedRules.length - 1];
  return { label: fallback?.label || 'Modérée', rule: fallback || null };
};

const toOptionalNonNegativeNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed < 0 ? 0 : parsed;
};

const sanitizeRiskTimingConstraint = (constraint = {}) => {
  const enabled = Boolean(constraint?.enabled);
  const startQuestion = typeof constraint?.startQuestion === 'string' ? constraint.startQuestion : '';
  const endQuestion = typeof constraint?.endQuestion === 'string' ? constraint.endQuestion : '';

  return {
    enabled,
    startQuestion,
    endQuestion,
    minimumWeeks: toOptionalNonNegativeNumber(constraint?.minimumWeeks),
    minimumDays: toOptionalNonNegativeNumber(constraint?.minimumDays)
  };
};

const matchesCondition = (condition, answers) => {
  if (!condition || !condition.question) {
    return true;
  }

  const rawAnswer = answers[condition.question];
  if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '') {
    return false;
  }

  const answer = normalizeAnswerForComparison(rawAnswer);
  const operator = condition.operator || 'equals';
  const expected = condition.value;

  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  switch (operator) {
    case 'equals':
      if (Array.isArray(answer)) {
        return answer.includes(expected);
      }
      return answer === expected;
    case 'not_equals':
      if (Array.isArray(answer)) {
        return !answer.includes(expected);
      }
      return answer !== expected;
    case 'contains':
      if (Array.isArray(answer)) {
        return answer.includes(expected);
      }
      if (typeof answer === 'string') {
        return answer.toLowerCase().includes(String(expected).toLowerCase());
      }
      return false;
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte': {
      if (Array.isArray(answer)) {
        return false;
      }

      const answerNumber = toNumber(answer);
      const expectedNumber = toNumber(expected);

      if (answerNumber === null || expectedNumber === null) {
        return false;
      }

      switch (operator) {
        case 'lt':
          return answerNumber < expectedNumber;
        case 'lte':
          return answerNumber <= expectedNumber;
        case 'gt':
          return answerNumber > expectedNumber;
        case 'gte':
          return answerNumber >= expectedNumber;
        default:
          return false;
      }
    }
    default:
      return false;
  }
};

const matchesConditionGroup = (conditions, answers, logic = 'all') => {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  const normalizedLogic = logic === 'any' ? 'any' : 'all';

  if (normalizedLogic === 'any') {
    return conditions.some(condition => matchesCondition(condition, answers));
  }

  return conditions.every(condition => matchesCondition(condition, answers));
};

const computeTimingDiff = (condition, answers) => {
  if (!condition.startQuestion || !condition.endQuestion) {
    return null;
  }

  const startAnswer = answers[condition.startQuestion];
  const endAnswer = answers[condition.endQuestion];

  if (!startAnswer || !endAnswer) {
    return null;
  }

  const startDate = new Date(startAnswer);
  const endDate = new Date(endAnswer);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  const diffInMs = endDate.getTime() - startDate.getTime();
  if (diffInMs < 0) {
    return null;
  }

  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  return {
    startDate,
    endDate,
    diffInDays,
    diffInWeeks: diffInDays / 7
  };
};

const normalizeTimingRequirement = (value) => {
  if (value === undefined || value === null || value === '') {
    return {};
  }

  if (typeof value === 'number') {
    return { minimumWeeks: value };
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? {} : { minimumWeeks: parsed };
  }

  if (typeof value === 'object') {
    const result = {};

    if (typeof value.minimumWeeks === 'number') {
      result.minimumWeeks = value.minimumWeeks;
    } else if (typeof value.minimumWeeks === 'string' && value.minimumWeeks.trim() !== '') {
      const parsed = Number(value.minimumWeeks);
      if (!Number.isNaN(parsed)) {
        result.minimumWeeks = parsed;
      }
    }

    if (typeof value.minimumDays === 'number') {
      result.minimumDays = value.minimumDays;
    } else if (typeof value.minimumDays === 'string' && value.minimumDays.trim() !== '') {
      const parsed = Number(value.minimumDays);
      if (!Number.isNaN(parsed)) {
        result.minimumDays = parsed;
      }
    }

    return result;
  }

  return {};
};

const getActiveTimelineProfiles = (condition, answers) => {
  const profiles = Array.isArray(condition.complianceProfiles)
    ? condition.complianceProfiles
    : [];

  if (profiles.length === 0) {
    return [];
  }

  const matching = profiles.filter(profile =>
    matchesConditionGroup(profile.conditions, answers, profile.conditionLogic)
  );

  if (matching.length > 0) {
    return matching;
  }

  return profiles.filter(profile => !profile.conditions || profile.conditions.length === 0);
};

export const evaluateRule = (rule, answers) => {
  const timingContexts = [];
  const conditionGroups = normalizeConditionGroups(rule, sanitizeRuleCondition);

  const evaluateTimingCondition = (condition) => {
    const diff = computeTimingDiff(condition, answers);

    if (!diff) {
      timingContexts.push({
        type: 'timing',
        diff: null,
        profiles: [],
        satisfied: false,
        startQuestion: condition.startQuestion,
        endQuestion: condition.endQuestion
      });
      return false;
    }

    const activeProfiles = getActiveTimelineProfiles(condition, answers);
    const normalizedProfiles = activeProfiles.map(profile => ({
      id: profile.id || `profile_${Date.now()}`,
      label: profile.label || 'Exigence de timing',
      description: profile.description || '',
      requirements: Object.fromEntries(
        Object.entries(profile.requirements || {}).map(([teamId, value]) => [
          teamId,
          normalizeTimingRequirement(value)
        ])
      )
    }));

    let satisfied = true;

    normalizedProfiles.forEach(profile => {
      Object.values(profile.requirements).forEach(requirement => {
        if (requirement.minimumDays !== undefined && diff.diffInDays < requirement.minimumDays) {
          satisfied = false;
        }

        if (requirement.minimumWeeks !== undefined && diff.diffInWeeks < requirement.minimumWeeks) {
          satisfied = false;
        }
      });
    });

    if (typeof condition.minimumWeeks === 'number' && diff.diffInWeeks < condition.minimumWeeks) {
      satisfied = false;
    }

    if (typeof condition.maximumWeeks === 'number' && diff.diffInWeeks > condition.maximumWeeks) {
      satisfied = false;
    }

    if (typeof condition.minimumDays === 'number' && diff.diffInDays < condition.minimumDays) {
      satisfied = false;
    }

    if (typeof condition.maximumDays === 'number' && diff.diffInDays > condition.maximumDays) {
      satisfied = false;
    }

    timingContexts.push({
      type: 'timing',
      diff,
      profiles: normalizedProfiles,
      satisfied,
      startQuestion: condition.startQuestion,
      endQuestion: condition.endQuestion
    });

    return satisfied;
  };

  const evaluateSingleCondition = (condition) => {
    const conditionType = condition.type || 'question';

    if (conditionType === 'timing') {
      return evaluateTimingCondition(condition);
    }

    return matchesCondition(condition, answers);
  };

  const groupResults = conditionGroups.map(group => {
    const conditions = Array.isArray(group.conditions) ? group.conditions : [];
    if (conditions.length === 0) {
      return true;
    }

    const logic = group.logic === 'any' ? 'any' : 'all';
    const results = conditions.map(evaluateSingleCondition);

    return logic === 'any' ? results.some(Boolean) : results.every(Boolean);
  });

  const triggered = conditionGroups.length === 0
    ? true
    : groupResults.every(Boolean);

  return { triggered, timingContexts };
};

export const analyzeAnswers = (answers, rules, riskLevelRules) => {
  const evaluations = rules.map(rule => ({ rule, evaluation: evaluateRule(rule, answers) }));

  const teamsSet = new Set();
  const allQuestions = {};
  const allRisks = [];
  const timelineByTeam = {};
  const timingDetails = [];

  evaluations.forEach(({ rule, evaluation }) => {
    if (evaluation.triggered) {
      rule.teams.forEach(teamId => teamsSet.add(teamId));

      Object.entries(rule.questions).forEach(([teamId, questions]) => {
        if (!allQuestions[teamId]) {
          allQuestions[teamId] = [];
        }
        allQuestions[teamId].push(...questions);
      });

      const processedRisks = (Array.isArray(rule.risks) ? rule.risks : [])
        .map(risk => {
          const ruleTeams = Array.isArray(rule.teams) ? rule.teams : [];
          const preferredTeam = typeof risk?.teamId === 'string' && risk.teamId
            ? risk.teamId
            : (ruleTeams[0] || '');
          const timingConstraint = sanitizeRiskTimingConstraint(risk?.timingConstraint);

          const baseRisk = {
            ...risk,
            priority: risk?.priority || 'Recommandé',
            teamId: preferredTeam,
            teams: preferredTeam ? [preferredTeam] : [],
            ruleId: rule.id,
            ruleName: rule.name,
            timingConstraint
          };

          if (!timingConstraint.enabled) {
            if (preferredTeam) {
              teamsSet.add(preferredTeam);
            }
            return baseRisk;
          }

          const diff = computeTimingDiff(timingConstraint, answers);
          if (!diff) {
            return null;
          }

          const requiredWeeks = typeof timingConstraint.minimumWeeks === 'number'
            ? timingConstraint.minimumWeeks
            : undefined;
          const requiredDays = typeof timingConstraint.minimumDays === 'number'
            ? timingConstraint.minimumDays
            : undefined;

          const meetsWeeks = requiredWeeks === undefined || diff.diffInWeeks >= requiredWeeks;
          const meetsDays = requiredDays === undefined || diff.diffInDays >= requiredDays;

          if (meetsWeeks && meetsDays) {
            return null;
          }

          if (preferredTeam) {
            teamsSet.add(preferredTeam);
          }

          return {
            ...baseRisk,
            timingViolation: {
              startQuestion: timingConstraint.startQuestion,
              endQuestion: timingConstraint.endQuestion,
              requiredWeeks,
              requiredDays,
              actualWeeks: diff.diffInWeeks,
              actualDays: diff.diffInDays,
              meetsWeeks,
              meetsDays
            }
          };
        })
        .filter(Boolean);

      allRisks.push(...processedRisks);
    }

    evaluation.timingContexts.forEach(context => {
      if (!context || !context.diff) {
        timingDetails.push({
          ruleId: rule.id,
          ruleName: rule.name,
          satisfied: context?.satisfied ?? false,
          diff: null,
          profiles: []
        });
        return;
      }

      const { diff } = context;
      const contextEntry = {
        ruleId: rule.id,
        ruleName: rule.name,
        satisfied: context.satisfied,
        diff,
        profiles: context.profiles
      };

      timingDetails.push(contextEntry);

      context.profiles.forEach(profile => {
        Object.entries(profile.requirements || {}).forEach(([teamId, requirement]) => {
          if (!teamId) return;

          const normalized = normalizeTimingRequirement(requirement);
          const hasRequirement =
            normalized.minimumWeeks !== undefined || normalized.minimumDays !== undefined;

          if (!hasRequirement) {
            return;
          }

          if (!timelineByTeam[teamId]) {
            timelineByTeam[teamId] = [];
          }

          const meetsWeeks =
            normalized.minimumWeeks === undefined || diff.diffInWeeks >= normalized.minimumWeeks;
          const meetsDays =
            normalized.minimumDays === undefined || diff.diffInDays >= normalized.minimumDays;

          timelineByTeam[teamId].push({
            profileId: profile.id,
            profileLabel: profile.label,
            description: profile.description,
            requiredWeeks: normalized.minimumWeeks,
            requiredDays: normalized.minimumDays,
            actualWeeks: diff.diffInWeeks,
            actualDays: diff.diffInDays,
            satisfied: meetsWeeks && meetsDays
          });
        });
      });
    });
  });

  const { label: complexity, rule: complexityRule } = resolveComplexityLevel(allRisks.length, riskLevelRules);

  return {
    triggeredRules: evaluations.filter(({ evaluation }) => evaluation.triggered).map(({ rule }) => rule),
    teams: Array.from(teamsSet),
    questions: allQuestions,
    risks: allRisks,
    timeline: {
      byTeam: timelineByTeam,
      details: timingDetails
    },
    complexity,
    complexityRule
  };
};

export {
  matchesCondition,
  matchesConditionGroup,
  computeTimingDiff,
  normalizeTimingRequirement,
  getActiveTimelineProfiles,
  sanitizeRiskTimingConstraint
};
