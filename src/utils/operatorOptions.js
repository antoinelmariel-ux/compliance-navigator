const TEXT_OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Est égal à (=)' },
  { value: 'not_equals', label: 'Est différent de (≠)' },
  { value: 'contains', label: 'Contient' }
];

const NUMBER_OPERATOR_OPTIONS = [
  { value: 'lt', label: 'Inférieur (<)' },
  { value: 'lte', label: 'Inférieur ou égal (≤)' },
  { value: 'equals', label: 'Égal (=)' },
  { value: 'gte', label: 'Supérieur ou égal (≥)' },
  { value: 'gt', label: 'Supérieur (>)' }
];

const OPERATOR_LABELS = {
  equals: 'est égal à',
  not_equals: 'est différent de',
  contains: 'contient',
  lt: 'est inférieur à',
  lte: 'est inférieur ou égal à',
  gt: 'est supérieur à',
  gte: 'est supérieur ou égal à'
};

export const getOperatorOptionsForType = (questionType = 'choice') => {
  return questionType === 'number' ? NUMBER_OPERATOR_OPTIONS : TEXT_OPERATOR_OPTIONS;
};

export const ensureOperatorForType = (questionType = 'choice', operator = 'equals') => {
  const options = getOperatorOptionsForType(questionType);
  if (options.some(option => option.value === operator)) {
    return operator;
  }

  return options.length > 0 ? options[0].value : 'equals';
};

export const getOperatorLabel = (operator) => {
  return OPERATOR_LABELS[operator] || operator || '=';
};

export const getOperatorOptions = () => {
  return {
    text: TEXT_OPERATOR_OPTIONS,
    number: NUMBER_OPERATOR_OPTIONS
  };
};
