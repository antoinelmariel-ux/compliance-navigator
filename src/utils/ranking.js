const DEFAULT_WEIGHTS = [5, 4, 3, 2, 1];

const normalizeCriteria = (criteria) => {
  if (!Array.isArray(criteria)) {
    return [];
  }

  return criteria
    .map(item => ({
      id: typeof item?.id === 'string' && item.id.trim() !== ''
        ? item.id.trim()
        : (typeof item?.label === 'string' ? item.label.trim().toLowerCase().replace(/\s+/g, '-') : ''),
      label: typeof item?.label === 'string' ? item.label.trim() : '',
      description: typeof item?.description === 'string' ? item.description.trim() : ''
    }))
    .filter(item => item.id && item.label);
};

const normalizeEntries = (entries) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map(entry => {
      const id = typeof entry?.id === 'string' && entry.id.trim() !== ''
        ? entry.id.trim()
        : (typeof entry?.name === 'string' ? entry.name.trim().toLowerCase().replace(/\s+/g, '-') : '');

      const name = typeof entry?.name === 'string' ? entry.name.trim() : '';

      if (!id || !name) {
        return null;
      }

      const normalizedScores = {};
      Object.entries(entry.scores || {}).forEach(([criterionId, score]) => {
        const parsed = Number(score);
        normalizedScores[criterionId] = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      });

      return {
        id,
        name,
        scores: normalizedScores,
        contact: typeof entry?.contact === 'string' ? entry.contact.trim() : '',
        website: typeof entry?.website === 'string' ? entry.website.trim() : '',
        notes: typeof entry?.notes === 'string' ? entry.notes.trim() : '',
        previousProject: typeof entry?.previousProject === 'string' ? entry.previousProject.trim() : '',
        opinion: typeof entry?.opinionText === 'string'
          ? entry.opinionText.trim()
          : (typeof entry?.opinion === 'string' ? entry.opinion.trim() : '')
      };
    })
    .filter(Boolean);
};

export const normalizeRankingConfig = (config) => {
  const title = typeof config?.title === 'string' && config.title.trim() !== ''
    ? config.title.trim()
    : 'Base de données';

  const criteria = normalizeCriteria(config?.criteria);
  const entries = normalizeEntries(config?.entries);

  return { title, criteria, entries };
};

const buildWeightMap = (criteriaOrder = []) => {
  if (!Array.isArray(criteriaOrder)) {
    return {};
  }

  const weights = {};
  criteriaOrder.forEach((criterionId, index) => {
    const weight = DEFAULT_WEIGHTS[index] ?? Math.max(DEFAULT_WEIGHTS[DEFAULT_WEIGHTS.length - 1] - index + DEFAULT_WEIGHTS.length - 1, 1);
    weights[criterionId] = weight;
  });
  return weights;
};

const computeEntryScore = (entry, weightMap, ignoredCriteria) => {
  if (!entry) {
    return 0;
  }

  const ignored = new Set(Array.isArray(ignoredCriteria) ? ignoredCriteria : []);

  return Object.entries(weightMap).reduce((total, [criterionId, weight]) => {
    if (!criterionId || ignored.has(criterionId)) {
      return total;
    }

    const score = Number(entry.scores?.[criterionId]);
    const sanitizedScore = Number.isFinite(score) ? score : 0;
    return total + sanitizedScore * weight;
  }, 0);
};

export const computeRankingRecommendations = (answer, config, limit = 3) => {
  if (!config) {
    return [];
  }

  const normalizedConfig = normalizeRankingConfig(config);
  const criteriaOrder = Array.isArray(answer?.prioritized)
    ? answer.prioritized.filter(id => normalizedConfig.criteria.some(criterion => criterion.id === id))
    : [];
  const ignoredCriteria = Array.isArray(answer?.ignored)
    ? answer.ignored.filter(id => normalizedConfig.criteria.some(criterion => criterion.id === id))
    : [];

  if (criteriaOrder.length === 0 && ignoredCriteria.length === 0) {
    return [];
  }

  const weightMap = buildWeightMap(criteriaOrder);

  const scoredEntries = normalizedConfig.entries.map(entry => ({
    ...entry,
    score: computeEntryScore(entry, weightMap, ignoredCriteria)
  }));

  const sorted = scoredEntries
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return sorted.slice(0, Math.max(1, limit)).map(entry => ({
    id: entry.id,
    name: entry.name,
    contact: entry.contact,
    website: entry.website,
    notes: entry.notes,
    previousProject: entry.previousProject,
    opinion: entry.opinion,
    score: entry.score,
    scores: entry.scores
  }));
};

export const formatRankingAnswer = (answer, criteria) => {
  if (!answer) {
    return '';
  }

  const ordered = Array.isArray(answer.prioritized) ? answer.prioritized : [];
  const ignored = Array.isArray(answer.ignored) ? answer.ignored : [];

  if (ordered.length === 0 && ignored.length === 0) {
    return '';
  }

  const criteriaById = new Map((criteria || []).map(item => [item.id, item.label]));

  const priorities = ordered
    .map(id => criteriaById.get(id))
    .filter(Boolean)
    .map((label, index) => `${index + 1}. ${label}`)
    .join(' \u2192 ');

  const ignoredLabels = ignored
    .map(id => criteriaById.get(id))
    .filter(Boolean);

  if (ignoredLabels.length === 0) {
    return priorities;
  }

  return `${priorities} (sans importance : ${ignoredLabels.join(', ')})`;
};
