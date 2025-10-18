const removeDiacritics = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const DEFAULT_RISK_WEIGHTING = Object.freeze({
  low: 1,
  medium: 3,
  high: 5
});

const sanitizeWeightValue = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return fallback;
};

export const normalizeRiskWeighting = (weighting) => {
  const base = typeof weighting === 'object' && weighting !== null
    ? weighting
    : {};

  return {
    low: sanitizeWeightValue(base.low, DEFAULT_RISK_WEIGHTING.low),
    medium: sanitizeWeightValue(base.medium, DEFAULT_RISK_WEIGHTING.medium),
    high: sanitizeWeightValue(base.high, DEFAULT_RISK_WEIGHTING.high)
  };
};

export const getRiskWeightKey = (level) => {
  const normalized = removeDiacritics(level);

  if (normalized.includes('eleve') || normalized.includes('haut') || normalized.includes('critique')) {
    return 'high';
  }

  if (
    normalized.includes('moyen') ||
    normalized.includes('modere') ||
    normalized.includes('moderee') ||
    normalized.includes('intermediaire')
  ) {
    return 'medium';
  }

  if (normalized.includes('faible') || normalized.includes('bas') || normalized.includes('mineur')) {
    return 'low';
  }

  if (normalized.includes('fort')) {
    return 'high';
  }

  return 'medium';
};

export const getRiskWeightValue = (level, weighting) => {
  const normalizedWeighting = normalizeRiskWeighting(weighting);
  const key = getRiskWeightKey(level);
  return normalizedWeighting[key] ?? normalizedWeighting.low;
};

export const computeRiskScore = (risks, weighting) => {
  const normalizedWeighting = normalizeRiskWeighting(weighting);

  if (!Array.isArray(risks) || risks.length === 0) {
    return 0;
  }

  return risks.reduce((total, risk) => {
    const key = getRiskWeightKey(risk?.level);
    const weight = normalizedWeighting[key] ?? normalizedWeighting.low;
    return total + weight;
  }, 0);
};
