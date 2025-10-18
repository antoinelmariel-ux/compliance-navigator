import { normalizeConditionGroups } from './conditionGroups.js';

const normalizeAnswerForComparison = (answer) => {
  if (Array.isArray(answer)) {
    return answer;
  }

  if (answer && typeof answer === 'object') {
    if (typeof answer.value !== 'undefined') {
      return answer.value;
    }

    if (typeof answer.name !== 'undefined') {
      return answer.name;
    }
  }

  return answer;
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

  switch (condition.operator) {
    case 'equals':
      if (Array.isArray(answer)) {
        return answer.includes(condition.value);
      }
      return answer === condition.value;
    case 'not_equals':
      if (Array.isArray(answer)) {
        return !answer.includes(condition.value);
      }
      return answer !== condition.value;
    case 'contains':
      if (Array.isArray(answer)) {
        return answer.includes(condition.value);
      }
      if (typeof answer === 'string') {
        return answer.includes(condition.value);
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

export const shouldShowQuestion = (question, answers) => {
  const conditionGroups = normalizeConditionGroups(question);

  if (conditionGroups.length === 0) {
    return true;
  }

  return conditionGroups.every(group => {
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

  if (questionType === 'file' && answer && typeof answer === 'object') {
    const size = typeof answer.size === 'number' ? ` (${Math.round(answer.size / 1024)} Ko)` : '';
    return `${answer.name || 'Fichier joint'}${size}`;
  }

  return Array.isArray(answer) ? answer.join(', ') : String(answer);
};

export { normalizeAnswerForComparison };
