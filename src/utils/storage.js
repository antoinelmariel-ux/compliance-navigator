export const STORAGE_KEY = 'complianceNavigatorState';
// Désactivation temporaire de la persistance locale.
const ENABLE_PERSISTENCE = false;

export const loadPersistedState = () => {
  if (
    !ENABLE_PERSISTENCE ||
    typeof window === 'undefined' ||
    !window.localStorage
  ) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Impossible de charger l'état sauvegardé :", error);
    return null;
  }
};

export const persistState = (state) => {
  if (
    !ENABLE_PERSISTENCE ||
    typeof window === 'undefined' ||
    !window.localStorage
  ) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Impossible de sauvegarder l'état :", error);
  }
};
