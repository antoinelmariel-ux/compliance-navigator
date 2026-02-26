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

const toInspirationEntry = (item) => ({
  id: item.InspirationId,
  title: item.Title || 'Inspiration importée',
  labName: item.LabName || '',
  target: item.Target || '',
  typology: item.Typology || '',
  therapeuticArea: item.TherapeuticArea || '',
  country: item.Country || '',
  description: item.Description || '',
  link: item.Link || '',
  review: item.Review || '',
  visibility: item.Visibility === 'Shared' ? 'shared' : 'personal',
  documents: Array.isArray(item.DocumentsJson) ? item.DocumentsJson : [],
  createdAt: item.CreatedAt || item.UpdatedAt || new Date().toISOString(),
  updatedAt: item.UpdatedAt || new Date().toISOString(),
  rowVersion: Number(item.RowVersion) || 1,
  ownerEmail: item.CreatedByEmail || '',
  lastModifiedBy: item.UpdatedByEmail || item.CreatedByEmail || ''
});

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
