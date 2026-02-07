import { applyConditionGroups, normalizeConditionGroups } from './conditionGroups.js';
import { formatRankingAnswer } from './ranking.js';

export const EXTRA_CHECKBOX_SUFFIX = '__extra_checkbox';

export const buildExtraCheckboxQuestionId = (questionId) => {
  if (!questionId || typeof questionId !== 'string') {
    return '';
  }

  return `${questionId}${EXTRA_CHECKBOX_SUFFIX}`;
};

export const isExtraCheckboxQuestionId = (questionId) => {
  if (!questionId || typeof questionId !== 'string') {
    return false;
  }

  return questionId.endsWith(EXTRA_CHECKBOX_SUFFIX);
};

export const getConditionQuestionEntries = (questions = []) => {
  if (!Array.isArray(questions)) {
    return [];
  }

  const entries = [...questions];

  questions.forEach((question) => {
    if (!question || !question.id) {
      return;
    }

    const extraCheckbox = question.extraCheckbox;
    const label = typeof extraCheckbox?.label === 'string' ? extraCheckbox.label.trim() : '';
    const enabled = Boolean(extraCheckbox?.enabled);

    if (!enabled || label.length === 0) {
      return;
    }

    entries.push({
      id: buildExtraCheckboxQuestionId(question.id),
      question: `${question.question || question.id} · Case à cocher : ${label}`,
      type: 'boolean'
    });
  });

  return entries;
};

const normalizeAnswerForComparison = (answer) => {
  if (Array.isArray(answer)) {
    return answer;
  }

  if (answer && typeof answer === 'object') {
    if (Array.isArray(answer.values)) {
      return answer.values;
    }
    if (typeof answer.value !== 'undefined') {
      return answer.value;
    }

    if (typeof answer.name !== 'undefined') {
      return answer.name;
    }
  }

  return answer;
};

export const normalizeConditionValueForAnswer = (answer, expected) => {
  if (typeof answer === 'boolean') {
    if (expected === true || expected === 'true') {
      return true;
    }
    if (expected === false || expected === 'false') {
      return false;
    }
  }

  return expected;
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const evaluateQuestionCondition = (condition, answers) => {
  const rawAnswer = answers[condition.question];
  if (Array.isArray(rawAnswer) && rawAnswer.length === 0) return false;
  if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '') return false;

  const answer = normalizeAnswerForComparison(rawAnswer);
  const normalizedExpected = normalizeConditionValueForAnswer(
    Array.isArray(answer) ? answer[0] : answer,
    condition.value
  );

  switch (condition.operator) {
    case 'equals':
      if (Array.isArray(answer)) {
        return answer.includes(normalizedExpected);
      }
      return answer === normalizedExpected;
    case 'not_equals':
      if (Array.isArray(answer)) {
        return !answer.includes(normalizedExpected);
      }
      return answer !== normalizedExpected;
    case 'contains':
      if (Array.isArray(answer)) {
        return answer.includes(normalizedExpected);
      }
      if (typeof answer === 'string') {
        return answer.includes(normalizedExpected);
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
      const expectedNumber = toNumber(condition.value);

      if (answerNumber === null || expectedNumber === null) {
        return false;
      }

      switch (condition.operator) {
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

const evaluateConditionGroups = (conditionGroups, answers) => {
  if (conditionGroups.length === 0) {
    return true;
  }

  return conditionGroups.every((group) => {
    const groupConditions = Array.isArray(group.conditions) ? group.conditions : [];
    if (groupConditions.length === 0) {
      return true;
    }

    const logic = group.logic === 'any' ? 'any' : 'all';

    if (logic === 'any') {
      return groupConditions.some(condition => evaluateQuestionCondition(condition, answers));
    }

    return groupConditions.every(condition => evaluateQuestionCondition(condition, answers));
  });
};

export const shouldShowQuestion = (question, answers) => {
  const conditionGroups = normalizeConditionGroups(question);
  return evaluateConditionGroups(conditionGroups, answers);
};

export const normalizeQuestionOption = (option) => {
  const baseOption =
    option && typeof option === 'object' && !Array.isArray(option) ? { ...option } : { label: option };
  const rawLabel = baseOption.label ?? baseOption.value;
  const label = typeof rawLabel === 'string' || typeof rawLabel === 'number' || typeof rawLabel === 'boolean'
    ? String(rawLabel)
    : '';
  const rawVisibility = baseOption.visibility;
  const visibility = rawVisibility === 'conditional' || rawVisibility === 'disabled' ? rawVisibility : 'always';
  const conditionGroups = normalizeConditionGroups(baseOption);
  const rawSubType = baseOption.subType;
  const subType = rawSubType === 'multi_choice' || rawSubType === 'choice' ? rawSubType : null;
  const rawSubOptions = Array.isArray(baseOption.subOptions) ? baseOption.subOptions : [];

  return applyConditionGroups(
    {
      ...baseOption,
      label,
      visibility,
      subType,
      subOptions: rawSubOptions
        .map(normalizeQuestionOption)
        .filter(optionEntry => optionEntry.label && optionEntry.label.trim() !== '')
    },
    conditionGroups
  );
};

export const normalizeOtherOption = (config) => {
  if (!config || typeof config !== 'object') {
    return { enabled: false, label: 'Autre', placeholder: '' };
  }

  return {
    enabled: Boolean(config.enabled),
    label: typeof config.label === 'string' ? config.label : 'Autre',
    placeholder: typeof config.placeholder === 'string' ? config.placeholder : ''
  };
};

export const normalizeQuestionOptions = (questionOrOptions, { includeOther = true } = {}) => {
  const options = Array.isArray(questionOrOptions?.options)
    ? questionOrOptions.options
    : Array.isArray(questionOrOptions)
      ? questionOrOptions
      : [];

  const normalizedOptions = options
    .map(normalizeQuestionOption)
    .filter(option => option.label && option.label.trim() !== '');

  if (!includeOther) {
    return normalizedOptions;
  }

  const otherOption = normalizeOtherOption(questionOrOptions?.otherOption);
  const otherLabel = typeof otherOption.label === 'string' ? otherOption.label.trim() : '';

  if (otherOption.enabled && otherLabel.length > 0) {
    normalizedOptions.push({
      ...normalizeQuestionOption({ label: otherLabel }),
      isOther: true
    });
  }

  return normalizedOptions;
};

export const getQuestionOptionLabels = (questionOrOptions) =>
  normalizeQuestionOptions(questionOrOptions).map(option => option.label);

export const shouldShowOption = (option, answers) => {
  const normalized = normalizeQuestionOption(option);

  if (normalized.visibility === 'disabled') {
    return false;
  }

  if (normalized.visibility !== 'conditional') {
    return true;
  }

  const conditionGroups = Array.isArray(normalized.conditionGroups) ? normalized.conditionGroups : [];
  return evaluateConditionGroups(conditionGroups, answers);
};

export const formatAnswer = (question, answer) => {
  if (answer === null || answer === undefined) {
    return '';
  }

  const questionType = (question && question.type) || 'choice';

  if (questionType === 'date') {
    const parsed = new Date(answer);
    if (Number.isNaN(parsed.getTime())) {
      return String(answer);
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(parsed);
  }

  if (questionType === 'milestone_list') {
    const entries = Array.isArray(answer) ? answer : [];

    const formattedEntries = entries
      .map(item => {
        const rawDate = typeof item?.date === 'string' ? item.date.trim() : '';
        const rawDescription = typeof item?.description === 'string' ? item.description.trim() : '';

        if (!rawDate && !rawDescription) {
          return null;
        }

        let formattedDate = '';

        if (rawDate) {
          const parsed = new Date(rawDate);
          formattedDate = Number.isNaN(parsed.getTime())
            ? rawDate
            : new Intl.DateTimeFormat('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).format(parsed);
        }

        if (formattedDate && rawDescription) {
          return `${formattedDate} — ${rawDescription}`;
        }

        return formattedDate || rawDescription;
      })
      .filter(Boolean);

    return formattedEntries.join('\n');
  }

  if (questionType === 'multi_choice' && Array.isArray(answer)) {
    return answer.join(', ');
  }

  if (questionType === 'choice' && answer && typeof answer === 'object' && !Array.isArray(answer)) {
    const value = typeof answer.value !== 'undefined' ? answer.value : answer.name;
    const label = value == null ? '' : String(value);
    const children = Array.isArray(answer.children) ? answer.children : [];
    const otherText = typeof answer.otherText === 'string' ? answer.otherText.trim() : '';
    if (children.length === 0) {
      if (otherText) {
        return `${label} (${otherText})`;
      }
      return label;
    }
    const formattedChildren = children.map(item => String(item)).join(', ');
    if (otherText) {
      return `${label} (${formattedChildren} · ${otherText})`;
    }
    return `${label} (${formattedChildren})`;
  }

  if (questionType === 'multi_choice' && answer && typeof answer === 'object' && !Array.isArray(answer)) {
    const values = Array.isArray(answer.values) ? answer.values : [];
    const children = answer.children && typeof answer.children === 'object' ? answer.children : {};
    const otherText = typeof answer.otherText === 'string' ? answer.otherText.trim() : '';
    if (values.length === 0) {
      return '';
    }
    const otherLabel = typeof question?.otherOption?.label === 'string'
      ? question.otherOption.label.trim()
      : '';
    return values
      .map((value) => {
        const label = value == null ? '' : String(value);
        const childValues = Array.isArray(children[label]) ? children[label] : [];
        if (childValues.length === 0) {
          if (otherText && otherLabel && label === otherLabel) {
            return `${label} (${otherText})`;
          }
          return label;
        }
        const formattedChildren = childValues.map(item => String(item)).join(', ');
        if (otherText && otherLabel && label === otherLabel) {
          return `${label} (${formattedChildren} · ${otherText})`;
        }
        return `${label} (${formattedChildren})`;
      })
      .filter(Boolean)
      .join(', ');
  }

  if (questionType === 'ranking') {
    const criteria = Array.isArray(question?.rankingConfig?.criteria)
      ? question.rankingConfig.criteria
      : [];
    return formatRankingAnswer(answer, criteria);
  }

  if (questionType === 'file' && answer && typeof answer === 'object') {
    const size = typeof answer.size === 'number' ? ` (${Math.round(answer.size / 1024)} Ko)` : '';
    return `${answer.name || 'Fichier joint'}${size}`;
  }

  return Array.isArray(answer) ? answer.join(', ') : String(answer);
};

export { normalizeAnswerForComparison };
