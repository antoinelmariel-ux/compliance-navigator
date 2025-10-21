const DEFAULT_FIELDS = [
  {
    id: 'projectName',
    label: 'Titre du projet',
    type: 'text',
    enabled: true
  },
  {
    id: 'teamLead',
    label: 'Lead du projet',
    type: 'text',
    enabled: true
  },
  {
    id: 'teamLeadTeam',
    label: 'Équipe du lead projet',
    type: 'select',
    enabled: true
  },
  {
    id: 'dateOrder',
    label: 'Ordre des projets',
    type: 'sort',
    enabled: true,
    defaultValue: 'desc'
  }
];

const DEFAULT_SORT_VALUE = 'desc';

const DEFAULT_ORDER_INDEX = new Map(DEFAULT_FIELDS.map((field, index) => [field.id, index]));

export const createDefaultProjectFiltersConfig = () => ({
  fields: DEFAULT_FIELDS.map(field => ({ ...field })),
  sortOrder: DEFAULT_SORT_VALUE
});

const sanitizeLabel = (label, fallback) => {
  if (typeof label !== 'string') {
    return fallback;
  }

  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const sanitizeBoolean = (value, fallback = true) => {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
};

const sanitizeSortValue = (value, fallback = DEFAULT_SORT_VALUE) => {
  return value === 'asc' || value === 'desc' ? value : fallback;
};

export const normalizeProjectFilterConfig = (config) => {
  const base = createDefaultProjectFiltersConfig();

  if (!config || typeof config !== 'object') {
    return base;
  }

  const normalizedFields = [];
  const seen = new Set();

  if (Array.isArray(config.fields)) {
    config.fields.forEach((field) => {
      if (!field || typeof field !== 'object') {
        return;
      }

      const defaultIndex = DEFAULT_ORDER_INDEX.get(field.id);
      if (defaultIndex === undefined) {
        return;
      }

      const defaultField = DEFAULT_FIELDS[defaultIndex];
      const normalizedField = {
        ...defaultField,
        label: sanitizeLabel(field.label, defaultField.label),
        enabled: sanitizeBoolean(field.enabled, defaultField.enabled)
      };

      if (defaultField.type === 'sort') {
        normalizedField.defaultValue = sanitizeSortValue(field.defaultValue, defaultField.defaultValue || DEFAULT_SORT_VALUE);
      }

      normalizedFields.push(normalizedField);
      seen.add(field.id);
    });
  }

  DEFAULT_FIELDS.forEach((field) => {
    if (!seen.has(field.id)) {
      normalizedFields.push({ ...field });
    }
  });

  normalizedFields.sort((a, b) => {
    const indexA = DEFAULT_ORDER_INDEX.get(a.id) ?? 0;
    const indexB = DEFAULT_ORDER_INDEX.get(b.id) ?? 0;
    return indexA - indexB;
  });

  const sortOrder = sanitizeSortValue(config.sortOrder, DEFAULT_SORT_VALUE);

  const normalizedSortField = normalizedFields.find(field => field.id === 'dateOrder');
  if (normalizedSortField) {
    normalizedSortField.defaultValue = sanitizeSortValue(
      normalizedSortField.defaultValue,
      DEFAULT_FIELDS.find(field => field.id === 'dateOrder')?.defaultValue || DEFAULT_SORT_VALUE
    );
  }

  return {
    fields: normalizedFields,
    sortOrder
  };
};

export const updateProjectFilterField = (config, fieldId, updates = {}) => {
  const normalized = normalizeProjectFilterConfig(config);
  const fields = normalized.fields.map((field) => {
    if (field.id !== fieldId) {
      return field;
    }

    const patch = { ...field };

    if (Object.prototype.hasOwnProperty.call(updates, 'label')) {
      patch.label = sanitizeLabel(updates.label, field.label);
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'enabled')) {
      patch.enabled = sanitizeBoolean(updates.enabled, field.enabled);
    }

    if (field.type === 'sort' && Object.prototype.hasOwnProperty.call(updates, 'defaultValue')) {
      patch.defaultValue = sanitizeSortValue(updates.defaultValue, field.defaultValue);
    }

    return patch;
  });

  return {
    ...normalized,
    fields
  };
};

export const resetProjectFiltersConfig = () => createDefaultProjectFiltersConfig();
