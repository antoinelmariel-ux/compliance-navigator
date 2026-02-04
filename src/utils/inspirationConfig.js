const DEFAULT_INSPIRATION_FILTERS = {
  fields: [
    {
      id: 'companyName',
      label: 'Entreprise',
      type: 'text',
      enabled: true,
      sourceQuestionId: 'companyName'
    },
    {
      id: 'contactName',
      label: 'Nom du contact (personne physique)',
      type: 'text',
      enabled: true,
      sourceQuestionId: 'contactName'
    },
    {
      id: 'role',
      label: 'Rôle',
      type: 'select',
      enabled: true,
      options: [
        'Directeur commercial',
        'Directrice commerciale',
        'Responsable affaires réglementaires',
        'Responsable logistique',
        'Responsable qualité',
        'Directeur général'
      ],
      sourceQuestionId: 'role'
    },
    {
      id: 'countries',
      label: 'Pays',
      type: 'select',
      enabled: true,
      options: [
        'Allemagne',
        'Arabie saoudite',
        'Belgique',
        'Brésil',
        'Canada',
        'Espagne',
        'États-Unis',
        'Finlande',
        'France',
        'Italie',
        'Luxembourg',
        'Maroc',
        'Mexique',
        'Norvège',
        'Portugal',
        'Royaume-Uni',
        'Singapour',
        'Suède'
      ],
      sourceQuestionId: 'countries'
    },
    {
      id: 'situation',
      label: 'Situation',
      type: 'select',
      enabled: true,
      options: ['Identifié', 'En prise de contact', 'En relation'],
      sourceQuestionId: 'situation'
    }
  ]
};

const DEFAULT_INSPIRATION_FORM_FIELDS = {
  fields: [
    {
      id: 'companyName',
      label: 'Entreprise',
      type: 'text',
      required: true,
      enabled: true,
      placeholder: "Nom de l'entreprise"
    },
    {
      id: 'contactName',
      label: 'Nom du contact (personne physique)',
      type: 'text',
      required: true,
      enabled: true
    },
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      enabled: true,
      placeholder: 'contact@distributeur.com'
    },
    {
      id: 'website',
      label: 'Site internet',
      type: 'url',
      required: false,
      enabled: true,
      placeholder: 'https://...'
    },
    {
      id: 'role',
      label: 'Rôle',
      type: 'text',
      required: true,
      enabled: true,
      placeholder: 'Directeur commercial'
    },
    {
      id: 'countries',
      label: 'Pays',
      type: 'multi_select',
      required: true,
      enabled: true,
      options: [
        'Allemagne',
        'Arabie saoudite',
        'Belgique',
        'Brésil',
        'Canada',
        'Espagne',
        'États-Unis',
        'Finlande',
        'France',
        'Italie',
        'Luxembourg',
        'Maroc',
        'Mexique',
        'Norvège',
        'Portugal',
        'Royaume-Uni',
        'Singapour',
        'Suède'
      ]
    },
    {
      id: 'situation',
      label: 'Situation',
      type: 'select',
      required: true,
      enabled: true,
      options: ['Identifié', 'En prise de contact', 'En relation']
    },
    {
      id: 'review',
      label: 'Avis',
      type: 'long_text',
      required: false,
      enabled: true
    }
  ]
};

const clone = (value) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
};

const sanitizeIdentifier = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
};

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

const sanitizeOptionsList = (options) => {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => (typeof option === 'string' ? option.trim() : ''))
    .filter(Boolean);
};

const sanitizeEmptyOptionLabel = (value, fallback = 'Toutes les valeurs') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const normalizeFilterField = (field) => {
  if (!field || typeof field !== 'object') {
    return null;
  }

  const id = sanitizeIdentifier(field.id);
  if (!id) {
    return null;
  }

  const rawType = typeof field.type === 'string' ? field.type : 'text';
  const type = rawType === 'select' ? 'select' : 'text';

  const normalized = {
    id,
    label: sanitizeLabel(field.label, id),
    type,
    enabled: sanitizeBoolean(field.enabled, true)
  };

  const sourceQuestionId = sanitizeIdentifier(field.sourceQuestionId);
  if (sourceQuestionId) {
    normalized.sourceQuestionId = sourceQuestionId;
  }

  if (type === 'select') {
    normalized.options = sanitizeOptionsList(field.options);
    if (Object.prototype.hasOwnProperty.call(field, 'emptyOptionLabel')) {
      normalized.emptyOptionLabel = sanitizeEmptyOptionLabel(field.emptyOptionLabel);
    }
  }

  return normalized;
};

const normalizeFormField = (field) => {
  if (!field || typeof field !== 'object') {
    return null;
  }

  const id = sanitizeIdentifier(field.id);
  if (!id) {
    return null;
  }

  const type = typeof field.type === 'string' ? field.type : 'text';

  const normalized = {
    id,
    label: sanitizeLabel(field.label, id),
    type,
    enabled: sanitizeBoolean(field.enabled, true)
  };

  if (typeof field.required === 'boolean') {
    normalized.required = field.required;
  }

  if (typeof field.placeholder === 'string') {
    normalized.placeholder = field.placeholder;
  }

  if (type === 'select' || type === 'multi_select') {
    normalized.options = sanitizeOptionsList(field.options);
  }

  return normalized;
};

const normalizeFilterConfig = (config, fallback) => {
  if (!config || typeof config !== 'object') {
    return clone(fallback);
  }

  if (!Array.isArray(config.fields)) {
    return clone(fallback);
  }

  const fields = config.fields.map(normalizeFilterField).filter(Boolean);
  return { fields };
};

const normalizeFormConfig = (config, fallback) => {
  const base = config && typeof config === 'object' ? config : {};
  const fields = Array.isArray(base.fields) ? base.fields.map(normalizeFormField).filter(Boolean) : [];

  if (fields.length === 0) {
    return clone(fallback);
  }

  return { fields };
};

export const createDefaultInspirationFiltersConfig = () => clone(DEFAULT_INSPIRATION_FILTERS);

export const createDefaultInspirationFormConfig = () => clone(DEFAULT_INSPIRATION_FORM_FIELDS);

export const normalizeInspirationFiltersConfig = (config) =>
  normalizeFilterConfig(config, DEFAULT_INSPIRATION_FILTERS);

export const normalizeInspirationFormConfig = (config) =>
  normalizeFormConfig(config, DEFAULT_INSPIRATION_FORM_FIELDS);

export const resetInspirationFiltersConfig = () => createDefaultInspirationFiltersConfig();

export const resetInspirationFormConfig = () => createDefaultInspirationFormConfig();

export const updateInspirationFilterField = (config, fieldId, updates) => {
  const normalized = normalizeInspirationFiltersConfig(config);
  const nextFields = normalized.fields.map((field) => {
    if (field.id !== fieldId) {
      return field;
    }

    const updated = { ...field };

    if (Object.prototype.hasOwnProperty.call(updates, 'label')) {
      updated.label = updates.label;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'enabled')) {
      updated.enabled = updates.enabled;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'type')) {
      updated.type = updates.type === 'select' ? 'select' : 'text';
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'options') && updated.type === 'select') {
      updated.options = updates.options;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'emptyOptionLabel') && updated.type === 'select') {
      updated.emptyOptionLabel = updates.emptyOptionLabel;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'sourceQuestionId')) {
      updated.sourceQuestionId = updates.sourceQuestionId;
    }

    return normalizeFilterField(updated) || field;
  });

  return { ...normalized, fields: nextFields };
};

export const updateInspirationFormField = (config, fieldId, updates) => {
  const normalized = normalizeInspirationFormConfig(config);
  const nextFields = normalized.fields.map((field) => {
    if (field.id !== fieldId) {
      return field;
    }

    const updated = { ...field, ...updates };
    return normalizeFormField(updated) || field;
  });

  return { ...normalized, fields: nextFields };
};
