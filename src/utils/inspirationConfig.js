const DEFAULT_INSPIRATION_FILTERS = {
  fields: [
    {
      id: 'labName',
      label: 'Nom du labo',
      type: 'select',
      enabled: true
    },
    {
      id: 'target',
      label: 'Cible du projet',
      type: 'select',
      enabled: true,
      options: ['PS', 'Patient', 'GP']
    },
    {
      id: 'typology',
      label: 'Typologie',
      type: 'select',
      enabled: true,
      options: ['Digital', 'Print']
    },
    {
      id: 'therapeuticArea',
      label: 'Aire thérapeutique',
      type: 'select',
      enabled: true,
      options: ['Immunologie', 'Hémostase', 'Soins intensifs']
    },
    {
      id: 'country',
      label: 'Pays',
      type: 'select',
      enabled: true,
      options: ['France', 'Europe', 'États-Unis', 'Autre']
    }
  ]
};

const DEFAULT_INSPIRATION_FORM_FIELDS = {
  fields: [
    {
      id: 'title',
      label: 'Titre du projet',
      type: 'text',
      required: true,
      enabled: true
    },
    {
      id: 'labName',
      label: 'Nom du laboratoire / association',
      type: 'text',
      required: true,
      enabled: true
    },
    {
      id: 'target',
      label: 'Cible du projet',
      type: 'select',
      required: true,
      enabled: true,
      options: ['PS', 'Patient', 'GP']
    },
    {
      id: 'typology',
      label: 'Typologie',
      type: 'select',
      required: true,
      enabled: true,
      options: ['Digital', 'Print']
    },
    {
      id: 'therapeuticArea',
      label: 'Aire thérapeutique',
      type: 'select',
      required: true,
      enabled: true,
      options: ['Immunologie', 'Hémostase', 'Soins intensifs']
    },
    {
      id: 'country',
      label: 'Pays',
      type: 'select',
      required: true,
      enabled: true,
      options: ['France', 'Europe', 'États-Unis', 'Autre']
    },
    {
      id: 'description',
      label: 'Description du projet',
      type: 'long_text',
      required: false,
      enabled: true
    },
    {
      id: 'link',
      label: 'Lien utile',
      type: 'url',
      required: false,
      enabled: true
    },
    {
      id: 'documents',
      label: 'Documents',
      type: 'documents',
      required: false,
      enabled: true
    },
    {
      id: 'review',
      label: 'Avis sur le projet',
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

const normalizeField = (field) => {
  if (!field || typeof field !== 'object') {
    return null;
  }

  const id = typeof field.id === 'string' ? field.id.trim() : '';
  if (!id) {
    return null;
  }

  const type = typeof field.type === 'string' ? field.type : 'text';

  const normalized = {
    id,
    label: typeof field.label === 'string' && field.label.trim().length > 0 ? field.label : id,
    type,
    enabled: field.enabled !== false
  };

  if (typeof field.required === 'boolean') {
    normalized.required = field.required;
  }

  if (type === 'select') {
    normalized.options = Array.isArray(field.options)
      ? field.options.map(option => (typeof option === 'string' ? option.trim() : '')).filter(Boolean)
      : [];
  }

  return normalized;
};

const normalizeConfig = (config, fallback) => {
  const base = config && typeof config === 'object' ? config : {};
  const fields = Array.isArray(base.fields) ? base.fields.map(normalizeField).filter(Boolean) : [];

  if (fields.length === 0) {
    return clone(fallback);
  }

  return { fields };
};

export const createDefaultInspirationFiltersConfig = () => clone(DEFAULT_INSPIRATION_FILTERS);

export const createDefaultInspirationFormConfig = () => clone(DEFAULT_INSPIRATION_FORM_FIELDS);

export const normalizeInspirationFiltersConfig = (config) =>
  normalizeConfig(config, DEFAULT_INSPIRATION_FILTERS);

export const normalizeInspirationFormConfig = (config) =>
  normalizeConfig(config, DEFAULT_INSPIRATION_FORM_FIELDS);

export const resetInspirationFiltersConfig = () => createDefaultInspirationFiltersConfig();

export const resetInspirationFormConfig = () => createDefaultInspirationFormConfig();

export const updateInspirationFilterField = (config, fieldId, updates) => {
  const normalized = normalizeInspirationFiltersConfig(config);
  const nextFields = normalized.fields.map((field) => {
    if (field.id !== fieldId) {
      return field;
    }

    const updated = { ...field, ...updates };
    return normalizeField(updated) || field;
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
    return normalizeField(updated) || field;
  });

  return { ...normalized, fields: nextFields };
};
