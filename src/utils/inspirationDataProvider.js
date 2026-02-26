import { initialMockSharePointInspirations } from '../data/mockSharePointInspirations.js';

const cloneDeep = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
};

const parseInspirationJson = (item) => {
  const payload = item?.InspirationJson;
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
      : (Array.isArray(item.DocumentsJson) ? item.DocumentsJson : []),
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

  listInspirationsSync() {
    return Array.from(this.inspirations.values()).map(toInspirationEntry);
  }
}

export const inspirationDataProvider = new MockInspirationProvider();
