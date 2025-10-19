import { extractProjectName } from './projects.js';
import { analyzeAnswers } from './rules.js';
import { normalizeProjectEntry } from './projectNormalization.js';
import { sanitizeFileName } from './projectExport.js';

const DIRECTORY_PATH = './submitted-projects/';
const MANIFEST_CANDIDATES = ['index.json', 'manifest.json', 'projects.json'];

const createStaticDirectorySnapshot = () => {
  if (typeof import.meta === 'undefined' || typeof import.meta.glob !== 'function') {
    return { files: [], payloads: new Map() };
  }

  try {
    const modules = import.meta.glob('../submitted-projects/*.json', { eager: true });
    const files = [];
    const payloads = new Map();

    Object.entries(modules).forEach(([modulePath, moduleValue]) => {
      const match = modulePath.match(/submitted-projects\/(.+\.json)$/i);
      if (!match) {
        return;
      }

      const relativePath = match[1];
      const payload =
        moduleValue && typeof moduleValue === 'object' && 'default' in moduleValue
          ? moduleValue.default
          : moduleValue;

      files.push(relativePath);
      if (payload) {
        payloads.set(relativePath, payload);
      }
    });

    return { files, payloads };
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[externalProjectsLoader] Snapshot local échoué :', error);
    }
    return { files: [], payloads: new Map() };
  }
};

const fetchJson = async (url) => {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[externalProjectsLoader] JSON introuvable :', url, error);
    }
    return null;
  }
};

const fetchText = async (url) => {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[externalProjectsLoader] Ressource texte introuvable :', url, error);
    }
    return null;
  }
};

const sanitizeRelativePath = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  let normalized = value.trim();
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized, window.location.href);
    normalized = parsed.pathname.replace(/^[./]+/, '');
  } catch (error) {
    normalized = normalized.replace(/^\.\//, '').replace(/^\//, '');
  }

  if (normalized.includes('..')) {
    return null;
  }

  return normalized;
};

const deduplicate = (items) => {
  const seen = new Set();
  const result = [];

  items.forEach(item => {
    if (!item || seen.has(item)) {
      return;
    }
    seen.add(item);
    result.push(item);
  });

  return result;
};

const STATIC_DIRECTORY_SNAPSHOT = createStaticDirectorySnapshot();
const STATIC_DIRECTORY_FILES = deduplicate(STATIC_DIRECTORY_SNAPSHOT.files);
const STATIC_DIRECTORY_PAYLOADS = STATIC_DIRECTORY_SNAPSHOT.payloads;

const extractFilesFromManifest = (manifest) => {
  if (!manifest) {
    return { files: [], inlineProjects: [] };
  }

  if (Array.isArray(manifest)) {
    if (manifest.every(entry => typeof entry === 'string')) {
      return { files: manifest, inlineProjects: [] };
    }

    if (manifest.every(entry => entry && typeof entry === 'object' && !Array.isArray(entry))) {
      return { files: [], inlineProjects: manifest };
    }
  }

  if (typeof manifest === 'object') {
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    const projects = Array.isArray(manifest.projects) ? manifest.projects : [];

    if (files.length > 0 || projects.length > 0) {
      return { files, inlineProjects: projects };
    }
  }

  return { files: [], inlineProjects: [] };
};

const extractFilesFromDirectoryListing = (html) => {
  if (typeof DOMParser === 'undefined') {
    return [];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    const candidates = anchors
      .map(anchor => anchor.getAttribute('href'))
      .filter(Boolean)
      .map(href => href.split('?')[0])
      .filter(href => /\.json$/i.test(href));

    return deduplicate(candidates.map(sanitizeRelativePath).filter(Boolean));
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[externalProjectsLoader] Impossible de lire le listing :', error);
    }
    return [];
  }
};

const toChecksum = (sourceId, payload) => {
  try {
    return JSON.stringify({ sourceId, payload });
  } catch (error) {
    return `${sourceId}:${Date.now()}`;
  }
};

const normalizeAnswers = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value;
};

const extractProjectPayload = (rawProject) => {
  if (!rawProject || typeof rawProject !== 'object' || Array.isArray(rawProject)) {
    return null;
  }

  if (rawProject.project && typeof rawProject.project === 'object') {
    return {
      id: rawProject.project.id || rawProject.project.projectId,
      projectName:
        rawProject.project.projectName ||
        rawProject.project.name ||
        rawProject.project.title ||
        rawProject.project.projet ||
        rawProject.project.nom,
      answers: normalizeAnswers(rawProject.project.answers),
      submittedAt:
        rawProject.project.submittedAt ||
        rawProject.project.submitted_at ||
        rawProject.generatedAt ||
        rawProject.createdAt ||
        rawProject.project.generatedAt,
      lastUpdated:
        rawProject.project.lastUpdated ||
        rawProject.project.updatedAt ||
        rawProject.updatedAt,
      metadata: rawProject
    };
  }

  if (rawProject.answers && typeof rawProject.answers === 'object') {
    return {
      id: rawProject.id || rawProject.projectId,
      projectName:
        rawProject.projectName ||
        rawProject.name ||
        rawProject.title,
      answers: normalizeAnswers(rawProject.answers),
      submittedAt:
        rawProject.submittedAt ||
        rawProject.submitted_at ||
        rawProject.createdAt,
      lastUpdated: rawProject.lastUpdated || rawProject.updatedAt,
      metadata: rawProject
    };
  }

  return null;
};

const buildUniqueId = (candidates, usedIds) => {
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') {
      continue;
    }

    const sanitized = sanitizeFileName(candidate, '').toLowerCase();
    if (!sanitized) {
      continue;
    }

    let unique = sanitized;
    let suffix = 2;
    while (usedIds.has(unique)) {
      unique = `${sanitized}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(unique);
    return unique;
  }

  let index = 1;
  let fallback = `imported-${index}`;
  while (usedIds.has(fallback)) {
    index += 1;
    fallback = `imported-${index}`;
  }

  usedIds.add(fallback);
  return fallback;
};

const buildProjectEntry = (
  payload,
  sourceId,
  {
    questions,
    rules,
    riskLevelRules,
    riskWeights,
    fallbackQuestionsLength,
    usedIds
  }
) => {
  const extracted = extractProjectPayload(payload);
  if (!extracted) {
    return null;
  }

  const answers = extracted.answers;
  const inferredName =
    extracted.projectName ||
    extractProjectName(answers, questions) ||
    'Projet importé';

  const candidatesForId = [
    payload.id,
    extracted.id,
    inferredName,
    sourceId.replace(/\.json$/i, '')
  ];

  const projectId = buildUniqueId(candidatesForId, usedIds);
  const analysis = analyzeAnswers(answers, rules, riskLevelRules, riskWeights);
  const submittedAt =
    extracted.submittedAt ||
    payload.submittedAt ||
    payload.generatedAt ||
    payload.createdAt ||
    null;
  const lastUpdated =
    extracted.lastUpdated ||
    payload.lastUpdated ||
    payload.updatedAt ||
    submittedAt;

  const normalizedProject = normalizeProjectEntry({
    id: projectId,
    projectName: inferredName,
    answers,
    analysis,
    status: 'submitted',
    submittedAt,
    lastUpdated,
    externalSourceId: sourceId,
    externalSourceChecksum: toChecksum(sourceId, payload),
    isImported: true
  }, fallbackQuestionsLength);

  return normalizedProject;
};

const loadProjectsFromFiles = async (files, context) => {
  const results = [];

  for (const file of files) {
    const relativePath = sanitizeRelativePath(file);
    if (!relativePath) {
      continue;
    }

    const url = `${DIRECTORY_PATH}${relativePath}`;
    let payload = await fetchJson(url);
    if (!payload && STATIC_DIRECTORY_PAYLOADS.has(relativePath)) {
      try {
        payload = JSON.parse(JSON.stringify(STATIC_DIRECTORY_PAYLOADS.get(relativePath)));
      } catch (error) {
        payload = STATIC_DIRECTORY_PAYLOADS.get(relativePath);
      }
    }

    if (!payload) {
      continue;
    }

    const project = buildProjectEntry(payload, relativePath, context);
    if (!project) {
      continue;
    }

    results.push({
      project,
      sourceId: relativePath,
      checksum: project.externalSourceChecksum
    });
  }

  return results;
};

const loadInlineProjects = (projects = [], context) => {
  return projects
    .map((payload, index) => {
      const sourceId = `inline-${index + 1}`;
      const project = buildProjectEntry(payload, sourceId, context);
      if (!project) {
        return null;
      }

      return {
        project,
        sourceId,
        checksum: project.externalSourceChecksum
      };
    })
    .filter(Boolean);
};

const discoverProjectFiles = async () => {
  for (const manifestFile of MANIFEST_CANDIDATES) {
    const manifest = await fetchJson(`${DIRECTORY_PATH}${manifestFile}`);
    const { files, inlineProjects } = extractFilesFromManifest(manifest);
    if (files.length > 0 || inlineProjects.length > 0) {
      return { files: deduplicate(files), inlineProjects };
    }
  }

  const htmlListing = await fetchText(DIRECTORY_PATH);
  const discoveredFiles = htmlListing
    ? extractFilesFromDirectoryListing(htmlListing)
    : [];
  const files = deduplicate([...discoveredFiles, ...STATIC_DIRECTORY_FILES]);

  return { files, inlineProjects: [] };
};

export const loadSubmittedProjectsFromDirectory = async ({
  questions,
  rules,
  riskLevelRules,
  riskWeights,
  fallbackQuestionsLength,
  existingProjects = []
} = {}) => {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return [];
  }

  const usedIds = new Set(
    Array.isArray(existingProjects)
      ? existingProjects.map(project => project && project.id).filter(Boolean)
      : []
  );

  const context = {
    questions,
    rules,
    riskLevelRules,
    riskWeights,
    fallbackQuestionsLength,
    usedIds
  };

  try {
    const { files, inlineProjects } = await discoverProjectFiles();
    const inlineResults = loadInlineProjects(inlineProjects, context);
    const fileResults = await loadProjectsFromFiles(files, context);

    return [...inlineResults, ...fileResults];
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[externalProjectsLoader] Chargement impossible :', error);
    }
    return [];
  }
};

