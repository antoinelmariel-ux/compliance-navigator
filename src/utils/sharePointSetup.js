const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

const DEFAULT_GRAPH_CONFIG = {
  token: '',
  siteId: ''
};

const SHAREPOINT_RESOURCES = [
  {
    key: 'questions',
    listName: 'PN-Questions',
    title: 'Questions',
    description: 'Référentiel des questions Project Navigator.',
    toEntries: (payload) => (Array.isArray(payload?.questions) ? payload.questions : [])
      .map((entry, index) => ({
        title: entry?.id || `question-${index + 1}`,
        key: entry?.id || `question-${index + 1}`,
        payload: entry
      }))
  },
  {
    key: 'rules',
    listName: 'PN-Regles',
    title: 'Règles',
    description: 'Référentiel des règles Project Navigator.',
    toEntries: (payload) => (Array.isArray(payload?.rules) ? payload.rules : [])
      .map((entry, index) => ({
        title: entry?.id || `regle-${index + 1}`,
        key: entry?.id || `regle-${index + 1}`,
        payload: entry
      }))
  },
  {
    key: 'teams',
    listName: 'PN-Equipes',
    title: 'Équipes',
    description: 'Référentiel des équipes compliance.',
    toEntries: (payload) => (Array.isArray(payload?.teams) ? payload.teams : [])
      .map((entry, index) => ({
        title: entry?.id || `equipe-${index + 1}`,
        key: entry?.id || `equipe-${index + 1}`,
        payload: entry
      }))
  },
  {
    key: 'configuration',
    listName: 'PN-Configuration',
    title: 'Configuration',
    description: 'Paramétrage transverse Project Navigator.',
    toEntries: (payload) => [
      { key: 'riskLevelRules', payload: payload?.riskLevelRules || [] },
      { key: 'riskWeights', payload: payload?.riskWeights || {} },
      { key: 'projectFilters', payload: payload?.projectFilters || {} },
      { key: 'inspirationFilters', payload: payload?.inspirationFilters || {} },
      { key: 'inspirationFormFields', payload: payload?.inspirationFormFields || [] },
      { key: 'onboardingTourConfig', payload: payload?.onboardingTourConfig || {} },
      { key: 'validationCommitteeConfig', payload: payload?.validationCommitteeConfig || {} },
      { key: 'showcaseThemes', payload: payload?.showcaseThemes || [] },
      { key: 'adminEmails', payload: payload?.adminEmails || [] }
    ].map((entry) => ({
      title: entry.key,
      key: entry.key,
      payload: entry.payload
    }))
  }
];

const resolveGraphConfig = (overrides = {}) => {
  const fromWindow = typeof window !== 'undefined' ? window.__COMPLIANCE_NAVIGATOR_GRAPH__ : null;
  const fromStorage = typeof window !== 'undefined' && window.localStorage
    ? {
      token: window.localStorage.getItem('graphAccessToken') || '',
      siteId: window.localStorage.getItem('sharepointSiteId') || ''
    }
    : DEFAULT_GRAPH_CONFIG;

  return {
    token: overrides.token || fromWindow?.token || fromStorage.token || '',
    siteId: overrides.siteId || fromWindow?.siteId || fromStorage.siteId || ''
  };
};

const graphRequest = async (path, { token, method = 'GET', body } = {}) => {
  const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let details = '';
    try {
      const errorBody = await response.json();
      details = errorBody?.error?.message || '';
    } catch (error) {
      details = await response.text();
    }
    throw new Error(`Microsoft Graph ${method} ${path} a échoué (${response.status}). ${details}`.trim());
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const ensureList = async ({ token, siteId, listName, description }) => {
  const existing = await graphRequest(`/sites/${siteId}/lists?$filter=displayName eq '${listName}'`, { token });
  const existingList = Array.isArray(existing?.value) ? existing.value[0] : null;

  if (existingList?.id) {
    return existingList;
  }

  const created = await graphRequest(`/sites/${siteId}/lists`, {
    token,
    method: 'POST',
    body: {
      displayName: listName,
      description,
      columns: [
        {
          name: 'ConfigKey',
          text: {}
        },
        {
          name: 'PayloadJson',
          text: {
            allowMultipleLines: true,
            appendChangesToExistingText: false
          }
        }
      ],
      list: {
        template: 'genericList'
      }
    }
  });

  return created;
};

const clearListItems = async ({ token, siteId, listId }) => {
  const items = await graphRequest(`/sites/${siteId}/lists/${listId}/items?$expand=fields($select=id)`, { token });
  const collection = Array.isArray(items?.value) ? items.value : [];

  await Promise.all(collection.map((item) => graphRequest(
    `/sites/${siteId}/lists/${listId}/items/${item.id}`,
    { token, method: 'DELETE' }
  )));
};

const seedListItems = async ({ token, siteId, listId, entries }) => {
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    await graphRequest(`/sites/${siteId}/lists/${listId}/items`, {
      token,
      method: 'POST',
      body: {
        fields: {
          Title: entry.title,
          ConfigKey: entry.key,
          PayloadJson: JSON.stringify(entry.payload)
        }
      }
    });
  }
};

const ensureConfigurationLibrary = async ({ token, siteId }) => {
  const libraryName = 'PN-Documents-Configuration';
  const existing = await graphRequest(`/sites/${siteId}/drives`, { token });
  const match = Array.isArray(existing?.value)
    ? existing.value.find((drive) => drive?.name === libraryName)
    : null;

  if (match?.id) {
    return match;
  }

  // Les bibliothèques documentaires sont exposées via l'endpoint lists avec template documentLibrary.
  await graphRequest(`/sites/${siteId}/lists`, {
    token,
    method: 'POST',
    body: {
      displayName: libraryName,
      list: {
        template: 'documentLibrary'
      }
    }
  });

  const refreshed = await graphRequest(`/sites/${siteId}/drives`, { token });
  return Array.isArray(refreshed?.value)
    ? refreshed.value.find((drive) => drive?.name === libraryName) || null
    : null;
};

export const reinitializeSharePointConfiguration = async (payload, options = {}) => {
  const config = resolveGraphConfig(options);

  if (!config.token) {
    throw new Error('Token Graph manquant. Renseignez window.__COMPLIANCE_NAVIGATOR_GRAPH__.token ou localStorage.graphAccessToken.');
  }

  if (!config.siteId) {
    throw new Error('Identifiant SharePoint manquant. Renseignez window.__COMPLIANCE_NAVIGATOR_GRAPH__.siteId ou localStorage.sharepointSiteId.');
  }

  const summary = {
    siteId: config.siteId,
    lists: [],
    libraryName: ''
  };

  for (let index = 0; index < SHAREPOINT_RESOURCES.length; index += 1) {
    const definition = SHAREPOINT_RESOURCES[index];
    const entries = definition.toEntries(payload);
    const list = await ensureList({
      token: config.token,
      siteId: config.siteId,
      listName: definition.listName,
      description: definition.description
    });

    await clearListItems({ token: config.token, siteId: config.siteId, listId: list.id });
    await seedListItems({ token: config.token, siteId: config.siteId, listId: list.id, entries });

    summary.lists.push({
      key: definition.key,
      name: definition.listName,
      count: entries.length
    });
  }

  const library = await ensureConfigurationLibrary({ token: config.token, siteId: config.siteId });
  summary.libraryName = library?.name || 'PN-Documents-Configuration';

  return summary;
};
