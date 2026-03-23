import { initialMockSharePointInspirations } from '../data/mockSharePointInspirations.js';
import { graphConfig, isGraphRuntimeReady } from '../config/graphConfig.js';
import { graphRequest } from './graphAuth.js';

const cloneDeep = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch (error) {
      // fallback below
    }
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
};

const parseJsonField = (value, fallback) => {
  if (value === null || value === undefined || value === '') {
    return cloneDeep(fallback);
  }

  if (typeof value === 'object') {
    return cloneDeep(value);
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return cloneDeep(fallback);
    }
  }

  return cloneDeep(fallback);
};

const parseInspirationJson = (item) => {
  const payload = parseJsonField(item?.InspirationJson, {});
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }
  return payload;
};

const toInspirationEntry = (item) => {
  const inspirationJson = parseInspirationJson(item);

  return {
    id: item.InspirationId,
    title: item.Title || inspirationJson.title || 'Inspiration importée',
    labName: inspirationJson.labName || item.LabName || '',
    target: inspirationJson.target || item.Target || '',
    typology: inspirationJson.typology || item.Typology || '',
    therapeuticArea: inspirationJson.therapeuticArea || item.TherapeuticArea || '',
    country: inspirationJson.country || item.Country || '',
    description: inspirationJson.description || item.Description || '',
    link: inspirationJson.link || item.Link || '',
    review: inspirationJson.review || item.Review || '',
    visibility:
      (inspirationJson.visibility || '').toLowerCase() === 'shared' || item.Visibility === 'Shared'
        ? 'shared'
        : 'personal',
    documents: Array.isArray(inspirationJson.documents)
      ? inspirationJson.documents
      : parseJsonField(item.DocumentsJson, []),
    createdAt: item.CreatedAt || inspirationJson.createdAt || item.UpdatedAt || new Date().toISOString(),
    updatedAt: item.UpdatedAt || new Date().toISOString(),
    rowVersion: Number(item.RowVersion) || 1,
    ownerEmail: item.CreatedByEmail || '',
    lastModifiedBy: item.UpdatedByEmail || item.CreatedByEmail || ''
  };
};

class MockInspirationProvider {
  constructor() {
    this.inspirations = new Map();
    initialMockSharePointInspirations.forEach((item) => {
      if (item?.InspirationId) {
        this.inspirations.set(item.InspirationId, cloneDeep(item));
      }
    });
  }

  async listInspirations() {
    return Array.from(this.inspirations.values()).map(toInspirationEntry);
  }

  listInspirationsSync() {
    return Array.from(this.inspirations.values()).map(toInspirationEntry);
  }
}

const resolveListId = async (listName) => {
  const encodedName = listName.replace(/'/g, "''");
  const response = await graphRequest(`/sites/${graphConfig.siteId}/lists?$filter=displayName eq '${encodedName}'`);
  const match = Array.isArray(response?.value) ? response.value[0] : null;

  if (!match?.id) {
    throw new Error(`La liste SharePoint "${listName}" est introuvable sur le site ${graphConfig.siteId}.`);
  }

  return match.id;
};

class GraphInspirationProvider {
  constructor() {
    this.listIdPromise = null;
  }

  async getListId() {
    if (!this.listIdPromise) {
      this.listIdPromise = resolveListId(graphConfig.lists.inspirations);
    }
    return this.listIdPromise;
  }

  async listInspirations() {
    const listId = await this.getListId();
    const response = await graphRequest(`/sites/${graphConfig.siteId}/lists/${listId}/items?$expand=fields`);
    return (Array.isArray(response?.value) ? response.value : [])
      .map((item) => item?.fields || {})
      .filter((item) => !!item.InspirationId)
      .map(toInspirationEntry);
  }

  listInspirationsSync() {
    return [];
  }
}

export const inspirationDataProvider = isGraphRuntimeReady()
  ? new GraphInspirationProvider()
  : new MockInspirationProvider();
