const INSPIRATION_INDEX_STORAGE_KEY = 'complianceNavigatorInspirationExportIndex';

const getStoredInspirationIndex = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(INSPIRATION_INDEX_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch (error) {
    return null;
  }
};

const storeNextInspirationIndex = (value) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(INSPIRATION_INDEX_STORAGE_KEY, String(value));
  } catch (error) {
    // Ignore storage failures.
  }
};

export const getNextInspirationExportIndex = () => {
  const stored = getStoredInspirationIndex();
  return stored || 1;
};

export const buildInspirationExport = (project) => {
  const payload = project && typeof project === 'object' ? project : {};
  const { externalSourceId, externalSourceChecksum, ...cleaned } = payload;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    inspiration: cleaned
  };
};

export const downloadInspirationJson = (project, { index } = {}) => {
  if (!project) {
    return false;
  }

  const exportPayload = buildInspirationExport(project);
  let jsonString = '';

  try {
    jsonString = JSON.stringify(exportPayload, null, 2);
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[inspirationExport] Impossible de sérialiser l\'inspiration :', error);
    }
    return false;
  }

  if (
    typeof document === 'undefined'
    || typeof URL === 'undefined'
    || typeof URL.createObjectURL !== 'function'
    || typeof Blob === 'undefined'
  ) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[inspirationExport] Environnement incompatible avec le téléchargement de fichiers.');
    }
    return false;
  }

  const safeIndex = Number.isFinite(index) && index > 0 ? index : getNextInspirationExportIndex();
  const fileName = `inspiration${safeIndex}.json`;

  try {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => {
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    }, 0);
    storeNextInspirationIndex(safeIndex + 1);
    return true;
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[inspirationExport] Téléchargement de l\'inspiration impossible :', error);
    }
    return false;
  }
};

export const exportInspirationToFile = (project) => downloadInspirationJson(project);
