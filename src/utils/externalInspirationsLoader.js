const DIRECTORY_PATH = './submitted-inspirations/';
const SEQUENTIAL_PREFIX = 'inspiration';
const SEQUENTIAL_MAX_ATTEMPTS = 200;
const SEQUENTIAL_MAX_CONSECUTIVE_MISSES = 5;

const isFileProtocol = () =>
  typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';

const fetchWithXmlHttpRequest = (url) => new Promise((resolve) => {
  if (typeof XMLHttpRequest === 'undefined') {
    resolve(null);
    return;
  }

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) {
        return;
      }

      const isSuccessfulStatus = xhr.status >= 200 && xhr.status < 400;
      const canAllowStatusZero = isFileProtocol() && xhr.status === 0 && typeof xhr.responseText === 'string';

      if (isSuccessfulStatus || canAllowStatusZero) {
        resolve(typeof xhr.responseText === 'string' ? xhr.responseText : null);
        return;
      }

      resolve(null);
    };

    xhr.onerror = () => resolve(null);
    xhr.send(null);
  } catch (error) {
    resolve(null);
  }
});

const fetchText = async (url) => {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[externalInspirationsLoader] Ressource texte introuvable :', url, error);
    }
  }

  if (isFileProtocol()) {
    const fallbackText = await fetchWithXmlHttpRequest(url);
    if (typeof fallbackText === 'string') {
      return fallbackText;
    }
  }

  return null;
};

const fetchJson = async (url) => {
  const text = await fetchText(url);

  if (typeof text !== 'string') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[externalInspirationsLoader] JSON introuvable :', url, error);
    }
    return null;
  }
};

const toChecksum = (sourceId, payload) => {
  try {
    return JSON.stringify({ sourceId, payload });
  } catch (error) {
    return `${sourceId}:${Date.now()}`;
  }
};

const normalizeDocuments = (documents) =>
  Array.isArray(documents)
    ? documents
        .map((doc) => ({
          name: typeof doc?.name === 'string' ? doc.name.trim() : '',
          url: typeof doc?.url === 'string' ? doc.url.trim() : ''
        }))
        .filter((doc) => doc.name.length > 0 || doc.url.length > 0)
    : [];

const normalizeInspirationPayload = (payload, sourceId) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const raw = payload.inspiration && typeof payload.inspiration === 'object'
    ? payload.inspiration
    : payload.project && typeof payload.project === 'object'
      ? payload.project
      : payload;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const id = typeof raw.id === 'string' && raw.id.trim().length > 0
    ? raw.id
    : `external-${sourceId}`;

  return {
    ...raw,
    id,
    title: typeof raw.title === 'string' ? raw.title : raw.name || raw.projectName || 'Inspiration importée',
    labName: typeof raw.labName === 'string' ? raw.labName : '',
    target: typeof raw.target === 'string' ? raw.target : '',
    typology: typeof raw.typology === 'string' ? raw.typology : '',
    therapeuticArea: typeof raw.therapeuticArea === 'string' ? raw.therapeuticArea : '',
    country: typeof raw.country === 'string' ? raw.country : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    link: typeof raw.link === 'string' ? raw.link : '',
    review: typeof raw.review === 'string' ? raw.review : '',
    documents: normalizeDocuments(raw.documents),
    visibility: raw.visibility === 'shared' ? 'shared' : 'personal',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString()
  };
};

export const loadSubmittedInspirationsFromDirectory = async () => {
  const entries = [];
  let index = 1;
  let misses = 0;

  while (index <= SEQUENTIAL_MAX_ATTEMPTS && misses < SEQUENTIAL_MAX_CONSECUTIVE_MISSES) {
    const filename = `${SEQUENTIAL_PREFIX}${index}.json`;
    const url = `${DIRECTORY_PATH}${filename}`;
    const payload = await fetchJson(url);

    if (payload) {
      const sourceId = filename;
      const project = normalizeInspirationPayload(payload, sourceId);
      if (project) {
        const checksum = toChecksum(sourceId, project);
        entries.push({
          sourceId,
          project: {
            ...project,
            externalSourceId: sourceId,
            externalSourceChecksum: checksum
          },
          checksum
        });
      }
      misses = 0;
    } else {
      misses += 1;
    }

    index += 1;
  }

  return entries;
};
