import React, { useCallback, useEffect, useMemo, useRef, useState } from '../react.js';
import {
  Plus,
  Target,
  Rocket,
  Compass,
  Calendar,
  CheckCircle,
  Eye,
  Edit,
  Users,
  Trash2,
  Close,
  Sparkles
} from './icons.js';
import { VirtualizedList } from './VirtualizedList.jsx';
import { normalizeInspirationFiltersConfig } from '../utils/inspirationConfig.js';
import {
  DISTRIBUTOR_SITUATION_IDS,
  DISTRIBUTOR_SITUATION_OPTIONS,
  getDistributorSituationLabel,
  resolveDistributorSituationId
} from '../utils/distributor.js';
import cpiData from '../data/ICP 2024.json';

const formatDate = (isoDate) => {
  if (!isoDate) {
    return 'Date inconnue';
  }

  try {
    return new Date(isoDate).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Date inconnue';
  }
};

const getSafeString = (value) => (typeof value === 'string' ? value : '');
const normalizeEmail = (value) => getSafeString(value).trim().toLowerCase();

const normalizeInspirationFieldValues = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }

  return [];
};

const normalizeCountryName = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const resolveContractEndDate = (project) => {
  const candidates = [
    project?.contractEndDate,
    project?.answers?.contractEndDate,
    project?.contractEnd,
    project?.answers?.contractEnd,
    project?.answers?.contractEndAt
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return '';
};

const getCorruptionRiskLabel = (score) => {
  if (!Number.isFinite(score)) {
    return 'Indice ICP indisponible';
  }

  if (score >= 80) {
    return 'Risque de corruption faible';
  }

  if (score >= 60) {
    return 'Risque de corruption modéré';
  }

  if (score >= 40) {
    return 'Risque de corruption élevé';
  }

  return 'Risque de corruption critique';
};

const DEFAULT_SELECT_FILTER_VALUE = 'all';
const DEFAULT_TEXT_FILTER_VALUE = '';

const formatPercent = (value) => `${Math.round(value)}%`;

const formatRiskScore = (value) => {
  if (!Number.isFinite(value)) {
    return '—';
  }

  return Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
};

const getProjectTimestamp = (project) => {
  if (!project) {
    return 0;
  }

  const candidates = [project.lastUpdated, project.submittedAt, project.generatedAt];

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (!candidate) {
      continue;
    }

    const parsed = new Date(candidate).getTime();
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const getDistributorName = (project) => {
  const directName = getSafeString(project?.projectName).trim();
  if (directName.length > 0) {
    return directName;
  }

  const answerName = getSafeString(project?.answers?.projectName).trim();
  if (answerName.length > 0) {
    return answerName;
  }

  return 'Distributeur sans nom';
};

const normalizeDistributorCountries = (project) => {
  const candidates = [
    project?.countries,
    project?.answers?.countries,
    project?.answers?.country,
    project?.country
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const value = candidates[index];
    if (Array.isArray(value)) {
      const sanitized = value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
      if (sanitized.length > 0) {
        return sanitized;
      }
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return [value.trim()];
    }
  }

  return [];
};

const buildContractSummary = (project) => {
  const summary = project?.contractSummary || project?.answers?.contractSummary;
  if (summary && typeof summary === 'object') {
    return summary;
  }

  return null;
};

const buildInitialFiltersState = (config) => {
  const initial = {
    sortOrder: 'desc',
    sortOrderDefault: 'desc'
  };

  if (!config || !Array.isArray(config.fields)) {
    return initial;
  }

  config.fields.forEach((field) => {
    if (!field) {
      return;
    }

    if (field.id === 'dateOrder') {
      const defaultValue = field.defaultValue === 'asc' ? 'asc' : 'desc';
      initial.sortOrder = defaultValue;
      initial.sortOrderDefault = defaultValue;
      return;
    }

    if (field.type === 'select') {
      initial[field.id] = DEFAULT_SELECT_FILTER_VALUE;
    } else {
      initial[field.id] = '';
    }
  });

  return initial;
};

const SORT_LABELS = {
  desc: 'Les plus récents en premier',
  asc: 'Les plus anciens en premier'
};

const prospectSituationStyles = {
  'Identifié': {
    label: 'Identifié',
    className: 'border-orange-200 bg-orange-50 text-orange-700',
    dotClassName: 'bg-orange-500'
  },
  'En prise de contact': {
    label: 'En prise de contact',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClassName: 'bg-rose-500'
  },
  'En relation': {
    label: 'En relation',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    dotClassName: 'bg-blue-500'
  }
};

const distributorSituationStyles = {
  [DISTRIBUTOR_SITUATION_IDS.evaluation]: {
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    dotClassName: 'bg-blue-500'
  },
  [DISTRIBUTOR_SITUATION_IDS.contractReview]: {
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500'
  },
  [DISTRIBUTOR_SITUATION_IDS.underContract]: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500'
  }
};

export const DistribHomeScreen = ({
  projects = [],
  projectFilters,
  teamLeadOptions = [],
  inspirationProjects = [],
  inspirationFilters,
  countryProfiles = [],
  homeView = 'platform',
  navigatorLabel = 'Project Navigator',
  onHomeViewChange,
  onStartInspirationProject,
  onOpenInspirationProject,
  onStartNewProject,
  onOpenProject,
  onDeleteProject,
  onShowProjectShowcase,
  onImportProject,
  onDuplicateProject,
  isAdminMode = false,
  tourContext = null,
  currentUser = null
}) => {
  const currentUserEmail = useMemo(
    () => normalizeEmail(currentUser?.mail || currentUser?.userPrincipalName || ''),
    [currentUser]
  );
  const currentUserFirstName = getSafeString(currentUser?.givenName).trim();
  const heroHeadline = currentUserFirstName.length > 0
    ? `${currentUserFirstName}, pilotez vos distributeurs pharmaceutiques en quelques minutes`
    : 'Pilotez vos distributeurs pharmaceutiques en quelques minutes';
  const [comparisonSelection, setComparisonSelection] = useState(() => new Set());
  const [isComparisonValidated, setIsComparisonValidated] = useState(false);
  const [finalSelectionId, setFinalSelectionId] = useState('');
  const [selectionRationales, setSelectionRationales] = useState({});
  const [distributorFiltersState, setDistributorFiltersState] = useState(() => ({
    name: DEFAULT_TEXT_FILTER_VALUE,
    country: DEFAULT_SELECT_FILTER_VALUE,
    situation: DEFAULT_SELECT_FILTER_VALUE,
    sortOrder: 'desc'
  }));
  const normalizedInspirationFilters = useMemo(
    () => normalizeInspirationFiltersConfig(inspirationFilters),
    [inspirationFilters]
  );
  const [inspirationFiltersState, setInspirationFiltersState] = useState(() =>
    buildInitialFiltersState(normalizedInspirationFilters)
  );
  const fileInputRef = useRef(null);
  const countryReviewRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [deleteDialogState, setDeleteDialogState] = useState(() => ({
    isOpen: false,
    project: null
  }));
  const deleteCancelButtonRef = useRef(null);
  const deleteConfirmButtonRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [worldMapMarkup, setWorldMapMarkup] = useState('');

  const worldMapUrl = useMemo(
    () => new URL('../data/world map.svg', import.meta.url).href,
    []
  );

  const accessibleProjects = useMemo(() => {
    if (!Array.isArray(projects)) {
      return [];
    }

    if (isAdminMode || !currentUserEmail) {
      return projects;
    }

    return projects.filter((project) => {
      const ownerEmail = normalizeEmail(project?.ownerEmail);
      const sharedWith = Array.isArray(project?.sharedWith) ? project.sharedWith : [];
      const isShared = sharedWith.some((entry) => normalizeEmail(entry) === currentUserEmail);

      if (!ownerEmail && sharedWith.length === 0) {
        return true;
      }

      return ownerEmail === currentUserEmail || isShared;
    });
  }, [projects, isAdminMode, currentUserEmail]);

  const countryProfileLookup = useMemo(() => {
    const map = new Map();
    const entries = Array.isArray(countryProfiles) ? countryProfiles : [];
    entries.forEach((profile) => {
      if (profile?.iso2) {
        map.set(profile.iso2.toUpperCase(), profile);
      }
      if (profile?.name) {
        map.set(normalizeCountryName(profile.name), profile);
      }
    });
    return map;
  }, [countryProfiles]);

  const cpiLookup = useMemo(() => {
    const map = new Map();
    (Array.isArray(cpiData) ? cpiData : []).forEach((entry) => {
      const name = normalizeCountryName(entry?.['Country / Territory']);
      const rawScore = Number.parseFloat(entry?.['CPI 2024 score']);
      if (name) {
        map.set(name, Number.isFinite(rawScore) ? rawScore : null);
      }
    });
    return map;
  }, []);

  useEffect(() => {
    const projectIds = new Set(accessibleProjects.map((project) => project.id));
    setComparisonSelection((prev) => {
      const next = new Set([...prev].filter((id) => projectIds.has(id)));
      return next;
    });
  }, [accessibleProjects]);

  useEffect(() => {
    if (finalSelectionId && !comparisonSelection.has(finalSelectionId)) {
      setFinalSelectionId('');
    }
  }, [comparisonSelection, finalSelectionId]);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogState({ isOpen: false, project: null });
  }, []);

  const handleCancelDeleteProject = useCallback(() => {
    closeDeleteDialog();
  }, [closeDeleteDialog]);

  useEffect(() => {
    if (!tourContext?.isActive) {
      return;
    }

    if (typeof document === 'undefined') {
      return;
    }

    const { activeStep } = tourContext;
    let selector = null;

    if (activeStep === 'create-project') {
      selector = '[data-tour-id="home-create-project"]';
    } else if (activeStep === 'project-import') {
      selector = '[data-tour-id="home-import-project"]';
    } else if (activeStep === 'project-filters') {
      selector = '[data-tour-id="home-filters"]';
    }

    if (selector) {
      const element = document.querySelector(selector);
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [tourContext]);

  useEffect(() => {
    let isActive = true;

    const loadMap = async () => {
      try {
        const response = await fetch(worldMapUrl);
        if (!response.ok) {
          throw new Error('Chargement de la carte impossible.');
        }
        const markup = await response.text();
        if (isActive) {
          setWorldMapMarkup(markup);
        }
      } catch (error) {
        if (isActive) {
          setWorldMapMarkup('');
        }
      }
    };

    loadMap();

    return () => {
      isActive = false;
    };
  }, [worldMapUrl]);

  const handleRequestProjectDeletion = useCallback((project) => {
    if (!project || !project.id || typeof onDeleteProject !== 'function') {
      return;
    }

    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previouslyFocusedElementRef.current = document.activeElement;
    } else {
      previouslyFocusedElementRef.current = null;
    }

    setDeleteDialogState({
      isOpen: true,
      project
    });
  }, [onDeleteProject]);

  const handleScrollToCountryReview = useCallback(() => {
    if (countryReviewRef.current && typeof countryReviewRef.current.scrollIntoView === 'function') {
      countryReviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleMapSelect = useCallback((event) => {
    const target = event?.target;
    if (!target || target.tagName?.toLowerCase() !== 'path') {
      return;
    }

    const name = target.getAttribute('name') || target.getAttribute('data-name') || '';
    const id = target.getAttribute('id') || '';
    setSelectedCountry({
      id,
      name
    });
  }, []);

  const handleMapKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const target = event?.target;
    if (!target || target.tagName?.toLowerCase() !== 'path') {
      return;
    }

    event.preventDefault();
    handleMapSelect(event);
  }, [handleMapSelect]);

  const handleConfirmDeleteProject = useCallback(() => {
    if (!deleteDialogState.project || typeof onDeleteProject !== 'function') {
      closeDeleteDialog();
      return;
    }

    onDeleteProject(deleteDialogState.project.id);
    closeDeleteDialog();
  }, [closeDeleteDialog, deleteDialogState.project, onDeleteProject]);

  useEffect(() => {
    if (!deleteDialogState.isOpen) {
      if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === 'function'
      ) {
        const shouldRestoreFocus =
          typeof document === 'undefined' ||
          document.contains(previouslyFocusedElementRef.current);

        if (shouldRestoreFocus) {
          previouslyFocusedElementRef.current.focus();
        }

        previouslyFocusedElementRef.current = null;
      }
      return undefined;
    }

    const timeoutId = typeof window !== 'undefined'
      ? window.setTimeout(() => {
        if (deleteCancelButtonRef.current && typeof deleteCancelButtonRef.current.focus === 'function') {
          deleteCancelButtonRef.current.focus();
        }
      }, 0)
      : null;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancelDeleteProject();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = [deleteCancelButtonRef.current, deleteConfirmButtonRef.current].filter(
          (element) => element && typeof element.focus === 'function'
        );

        if (focusableElements.length === 0) {
          return;
        }

        const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
        const currentIndex = focusableElements.indexOf(activeElement);
        let nextIndex = currentIndex;

        if (event.shiftKey) {
          nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1;
        }

        event.preventDefault();
        focusableElements[nextIndex]?.focus();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', handleKeyDown);
      }
      if (timeoutId !== null && typeof window !== 'undefined') {
        window.clearTimeout(timeoutId);
      }
    };
  }, [deleteDialogState.isOpen, handleCancelDeleteProject]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) {
      return;
    }

    const svg = container.querySelector('svg');
    if (!svg) {
      return;
    }

    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Carte mondiale des pays');
    svg.style.width = '100%';
    svg.style.height = 'auto';

    const selectedKey = normalizeCountryName(selectedCountry?.name || '');

    svg.querySelectorAll('path').forEach((path) => {
      const name = path.getAttribute('name') || path.getAttribute('data-name') || '';
      const normalizedName = normalizeCountryName(name);
      const isSelected = selectedKey && normalizedName === selectedKey;
      const isContract = normalizedName && contractCountryKeys.has(normalizedName);

      path.style.fill = isSelected ? '#1d4ed8' : isContract ? '#2563eb' : '#e5e7eb';
      path.style.cursor = 'pointer';
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'button');
      path.setAttribute(
        'aria-label',
        name ? `Voir la fiche ${name}` : 'Voir la fiche pays'
      );
    });
  }, [contractCountryKeys, selectedCountry, worldMapMarkup]);

  useEffect(() => {
    setInspirationFiltersState(prevState => {
      const initialState = buildInitialFiltersState(normalizedInspirationFilters);
      const nextState = { ...prevState };
      let changed = false;

      normalizedInspirationFilters.fields.forEach((field) => {
        if (!field) {
          return;
        }

        if (field.type === 'select') {
          if (!(field.id in prevState)) {
            nextState[field.id] = DEFAULT_SELECT_FILTER_VALUE;
            changed = true;
          }
          if (!field.enabled && nextState[field.id] !== DEFAULT_SELECT_FILTER_VALUE) {
            nextState[field.id] = DEFAULT_SELECT_FILTER_VALUE;
            changed = true;
          }
        } else {
          if (!(field.id in prevState)) {
            nextState[field.id] = DEFAULT_TEXT_FILTER_VALUE;
            changed = true;
          }
          if (!field.enabled && nextState[field.id] !== DEFAULT_TEXT_FILTER_VALUE) {
            nextState[field.id] = DEFAULT_TEXT_FILTER_VALUE;
            changed = true;
          }
        }
      });

      Object.keys(nextState).forEach((key) => {
        const stillExists = normalizedInspirationFilters.fields.some((field) => field && field.id === key);
        if (!stillExists) {
          delete nextState[key];
          changed = true;
        }
      });

      if (!changed) {
        return prevState;
      }

      return nextState;
    });
  }, [normalizedInspirationFilters]);

  const distributorCountryOptions = useMemo(() => {
    const countries = new Set();

    accessibleProjects.forEach((project) => {
      normalizeDistributorCountries(project).forEach((country) => {
        if (country.length > 0) {
          countries.add(country);
        }
      });
    });

    return Array.from(countries).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [accessibleProjects]);

  const contractCountryKeys = useMemo(() => {
    const keys = new Set();
    accessibleProjects.forEach((project) => {
      if (resolveDistributorSituationId(project) !== DISTRIBUTOR_SITUATION_IDS.underContract) {
        return;
      }
      normalizeDistributorCountries(project).forEach((country) => {
        const normalized = normalizeCountryName(country);
        if (normalized) {
          keys.add(normalized);
        }
      });
    });
    return keys;
  }, [accessibleProjects]);

  const selectedCountryProfile = useMemo(() => {
    if (!selectedCountry) {
      return null;
    }

    const isoMatch = selectedCountry.id ? countryProfileLookup.get(selectedCountry.id.toUpperCase()) : null;
    if (isoMatch) {
      return isoMatch;
    }

    const nameKey = normalizeCountryName(selectedCountry.name || '');
    if (!nameKey) {
      return null;
    }

    return countryProfileLookup.get(nameKey) || null;
  }, [countryProfileLookup, selectedCountry]);

  const selectedCountryCorruptionScore = useMemo(() => {
    if (!selectedCountry) {
      return null;
    }
    const nameKey = normalizeCountryName(selectedCountry.name || selectedCountryProfile?.name || '');
    if (!nameKey) {
      return null;
    }
    return cpiLookup.get(nameKey) ?? null;
  }, [cpiLookup, selectedCountry, selectedCountryProfile]);

  const selectedCountryContractProjects = useMemo(() => {
    if (!selectedCountry) {
      return [];
    }

    const nameKey = normalizeCountryName(selectedCountry.name || selectedCountryProfile?.name || '');
    if (!nameKey) {
      return [];
    }

    return accessibleProjects.filter((project) => {
      if (resolveDistributorSituationId(project) !== DISTRIBUTOR_SITUATION_IDS.underContract) {
        return false;
      }
      return normalizeDistributorCountries(project).some(
        (country) => normalizeCountryName(country) === nameKey
      );
    });
  }, [accessibleProjects, selectedCountry, selectedCountryProfile]);

  const inspirationFilterOptions = useMemo(() => {
    const fields = Array.isArray(normalizedInspirationFilters.fields) ? normalizedInspirationFilters.fields : [];
    const map = new Map();

    fields.forEach((field) => {
      if (!field || field.type !== 'select') {
        return;
      }

      const options = new Set();

      if (Array.isArray(field.options)) {
        field.options.forEach((option) => {
          const label = getSafeString(option).trim();
          if (label.length > 0) {
            options.add(label);
          }
        });
      }

      inspirationProjects.forEach((project) => {
        const values = normalizeInspirationFieldValues(project?.[field.id]);
        values.forEach((value) => {
          if (value.length > 0) {
            options.add(value);
          }
        });
      });

      map.set(field.id, Array.from(options).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })));
    });

    return map;
  }, [normalizedInspirationFilters.fields, inspirationProjects]);

  const filteredProjects = useMemo(() => {
    if (!Array.isArray(accessibleProjects)) {
      return [];
    }

    const nameQuery = distributorFiltersState.name.trim().toLowerCase();
    const selectedCountry = distributorFiltersState.country;
    const selectedSituation = distributorFiltersState.situation;

    const selection = accessibleProjects.filter((project) => {
      if (nameQuery.length > 0) {
        const name = getDistributorName(project).toLowerCase();
        if (!name.includes(nameQuery)) {
          return false;
        }
      }

      if (selectedCountry && selectedCountry !== DEFAULT_SELECT_FILTER_VALUE) {
        const countries = normalizeDistributorCountries(project);
        if (!countries.includes(selectedCountry)) {
          return false;
        }
      }

      if (selectedSituation && selectedSituation !== DEFAULT_SELECT_FILTER_VALUE) {
        const situationId = resolveDistributorSituationId(project);
        if (situationId !== selectedSituation) {
          return false;
        }
      }

      return true;
    });

    const direction = distributorFiltersState.sortOrder === 'asc' ? 'asc' : 'desc';

    return selection.slice().sort((a, b) => {
      const timeA = getProjectTimestamp(a);
      const timeB = getProjectTimestamp(b);
      const diff = timeA - timeB;

      return direction === 'asc' ? diff : -diff;
    });
  }, [accessibleProjects, distributorFiltersState]);

  const selectedProjects = useMemo(
    () => accessibleProjects.filter((project) => comparisonSelection.has(project.id)),
    [accessibleProjects, comparisonSelection]
  );

  const selectedProjectsCount = selectedProjects.length;

  const canValidateComparison = selectedProjectsCount >= 2;

  const handleToggleProjectSelection = useCallback((projectId) => {
    if (!projectId) {
      return;
    }

    setComparisonSelection((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const handleSelectAllFilteredProjects = useCallback(() => {
    setComparisonSelection((prev) => {
      const next = new Set(prev);
      filteredProjects.forEach((project) => {
        if (project?.id) {
          next.add(project.id);
        }
      });
      return next;
    });
  }, [filteredProjects]);

  const handleClearComparisonSelection = useCallback(() => {
    setComparisonSelection(new Set());
    setIsComparisonValidated(false);
    setFinalSelectionId('');
  }, []);

  const handleValidateComparisonSelection = useCallback(() => {
    if (!canValidateComparison) {
      return;
    }
    setIsComparisonValidated(true);
    if (!finalSelectionId && selectedProjects[0]?.id) {
      setFinalSelectionId(selectedProjects[0].id);
    }
  }, [canValidateComparison, finalSelectionId, selectedProjects]);

  const handleRationaleChange = useCallback((projectId, value) => {
    setSelectionRationales((prev) => ({
      ...prev,
      [projectId]: value
    }));
  }, []);

  const getCompletionSummary = (project) => {
    const total = Number.isFinite(project?.totalQuestions) ? project.totalQuestions : 0;
    const answered = Number.isFinite(project?.answeredQuestions) ? project.answeredQuestions : 0;

    if (total <= 0) {
      return null;
    }

    const percent = Math.min(100, Math.max(0, (answered / total) * 100));
    return {
      total,
      answered,
      percent
    };
  };

  const filteredInspirationProjects = useMemo(() => {
    if (!Array.isArray(inspirationProjects)) {
      return [];
    }

    const activeFields = Array.isArray(normalizedInspirationFilters.fields)
      ? normalizedInspirationFilters.fields
      : [];

    return inspirationProjects.filter((project) => {
      for (let index = 0; index < activeFields.length; index += 1) {
        const field = activeFields[index];
        if (!field || !field.enabled) {
          continue;
        }

        const value = inspirationFiltersState[field.id];
        const projectValues = normalizeInspirationFieldValues(project?.[field.id]);

        if (field.type === 'select') {
          if (value && value !== DEFAULT_SELECT_FILTER_VALUE) {
            if (!projectValues.includes(value)) {
              return false;
            }
          }
          continue;
        }

        const query = typeof value === 'string' ? value.trim().toLowerCase() : '';
        if (query.length === 0) {
          continue;
        }

        const haystack = projectValues.join(' ').toLowerCase();
        if (haystack.indexOf(query) === -1) {
          return false;
        }
      }

      return true;
    });
  }, [inspirationProjects, normalizedInspirationFilters.fields, inspirationFiltersState]);

  const prospectNameById = useMemo(() => {
    const map = new Map();
    inspirationProjects.forEach((project) => {
      if (project?.id) {
        map.set(project.id, project.partnerName || 'Prospect');
      }
    });
    return map;
  }, [inspirationProjects]);

  const [activeContractProjectId, setActiveContractProjectId] = useState(null);
  const [expandedContractSections, setExpandedContractSections] = useState({});

  useEffect(() => {
    setExpandedContractSections({});
  }, [activeContractProjectId]);

  const activeContractProject = useMemo(
    () => accessibleProjects.find((project) => project.id === activeContractProjectId) || null,
    [accessibleProjects, activeContractProjectId]
  );
  const activeContractSummary = useMemo(
    () => (activeContractProject ? buildContractSummary(activeContractProject) : null),
    [activeContractProject]
  );
  const contractCountries = useMemo(() => {
    if (activeContractSummary?.countries) {
      return activeContractSummary.countries;
    }
    return activeContractProject ? normalizeDistributorCountries(activeContractProject) : [];
  }, [activeContractProject, activeContractSummary]);
  const contractSections = useMemo(() => ([
    {
      id: 'role',
      title: 'Rôle et responsabilité',
      summary: activeContractSummary?.role?.summary,
      clause: activeContractSummary?.role?.clause
    },
    {
      id: 'liability',
      title: 'Limites de responsabilité',
      summary: activeContractSummary?.liability?.summary,
      clause: activeContractSummary?.liability?.clause
    },
    {
      id: 'audit',
      title: 'Audit',
      summary: activeContractSummary?.audit?.summary,
      clause: activeContractSummary?.audit?.clause
    }
  ]), [activeContractSummary]);

  const handleToggleContractSection = useCallback((sectionId) => {
    setExpandedContractSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);
  const projectRows = useMemo(() => {
    const rows = [];
    for (let index = 0; index < filteredProjects.length; index += 2) {
      rows.push(filteredProjects.slice(index, index + 2));
    }
    return rows;
  }, [filteredProjects]);
  const shouldVirtualizeProjects = projectRows.length > 6;

  const hasProjects = accessibleProjects.length > 0;
  const hasFilteredProjects = filteredProjects.length > 0;
  const hasInspirationProjects = inspirationProjects.length > 0;
  const hasFilteredInspirationProjects = filteredInspirationProjects.length > 0;
  const pendingDeletionProjectName = useMemo(() => {
    if (!deleteDialogState.project) {
      return '';
    }

    return getDistributorName(deleteDialogState.project);
  }, [deleteDialogState.project]);

  const hasActiveFilters = useMemo(() => (
    distributorFiltersState.name.trim().length > 0 ||
    distributorFiltersState.country !== DEFAULT_SELECT_FILTER_VALUE ||
    distributorFiltersState.situation !== DEFAULT_SELECT_FILTER_VALUE
  ), [distributorFiltersState]);

  const hasActiveInspirationFilters = useMemo(() => {
    const fields = Array.isArray(normalizedInspirationFilters.fields)
      ? normalizedInspirationFilters.fields
      : [];

    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      if (!field || !field.enabled) {
        continue;
      }

      const value = inspirationFiltersState[field.id];
      if (field.type === 'select') {
        if (value && value !== DEFAULT_SELECT_FILTER_VALUE) {
          return true;
        }
      } else if (typeof value === 'string' && value.trim().length > 0) {
        return true;
      }
    }

    return false;
  }, [normalizedInspirationFilters.fields, inspirationFiltersState]);

  const displayedProjectsCount = filteredProjects.length;
  const totalProjectsCount = accessibleProjects.length;
  const shouldShowFiltersCard = hasProjects;
  const currentSortOrder = distributorFiltersState.sortOrder || 'desc';
  const inspirationFilterFields = Array.isArray(normalizedInspirationFilters.fields)
    ? normalizedInspirationFilters.fields.filter((field) => field && field.enabled)
    : [];
  const shouldShowInspirationFiltersCard = hasInspirationProjects && inspirationFilterFields.length > 0;

  const handleClearProjectFilter = useCallback((target) => {
    setDistributorFiltersState((prev) => ({
      ...prev,
      [target]: target === 'name' ? DEFAULT_TEXT_FILTER_VALUE : DEFAULT_SELECT_FILTER_VALUE
    }));
  }, []);

  const handleClearInspirationFilter = useCallback((target) => {
    setInspirationFiltersState((prev) => {
      const next = { ...prev };

      if (target.type === 'select') {
        next[target.id] = DEFAULT_SELECT_FILTER_VALUE;
      } else {
        next[target.id] = DEFAULT_TEXT_FILTER_VALUE;
      }

      return next;
    });
  }, []);

  const activeProjectFilterChips = useMemo(() => {
    const chips = [];

    if (distributorFiltersState.name.trim().length > 0) {
      chips.push({
        id: 'name',
        label: 'Nom',
        value: distributorFiltersState.name.trim(),
        onClear: () => handleClearProjectFilter('name')
      });
    }

    if (distributorFiltersState.country !== DEFAULT_SELECT_FILTER_VALUE) {
      chips.push({
        id: 'country',
        label: 'Pays',
        value: distributorFiltersState.country,
        onClear: () => handleClearProjectFilter('country')
      });
    }

    if (distributorFiltersState.situation !== DEFAULT_SELECT_FILTER_VALUE) {
      const label = getDistributorSituationLabel(distributorFiltersState.situation);
      chips.push({
        id: 'situation',
        label: 'Situation',
        value: label,
        onClear: () => handleClearProjectFilter('situation')
      });
    }

    return chips;
  }, [distributorFiltersState, handleClearProjectFilter]);

  const activeInspirationFilterChips = useMemo(() => {
    const chips = [];

    inspirationFilterFields.forEach((field) => {
      const rawValue = inspirationFiltersState[field.id];
      if (field.type === 'select') {
        if (rawValue && rawValue !== DEFAULT_SELECT_FILTER_VALUE) {
          chips.push({
            id: field.id,
            label: field.label || 'Filtre',
            value: String(rawValue),
            onClear: () => handleClearInspirationFilter({ id: field.id, type: 'select' })
          });
        }
        return;
      }

      const trimmed = typeof rawValue === 'string' ? rawValue.trim() : '';
      if (trimmed.length > 0) {
        chips.push({
          id: field.id,
          label: field.label || 'Filtre',
          value: trimmed,
          onClear: () => handleClearInspirationFilter({ id: field.id, type: 'text' })
        });
      }
    });

    return chips;
  }, [inspirationFilterFields, inspirationFiltersState, handleClearInspirationFilter]);

  const handleResetFilters = () => {
    setDistributorFiltersState({
      name: DEFAULT_TEXT_FILTER_VALUE,
      country: DEFAULT_SELECT_FILTER_VALUE,
      situation: DEFAULT_SELECT_FILTER_VALUE,
      sortOrder: 'desc'
    });
  };

  const handleResetInspirationFilters = () => {
    setInspirationFiltersState(buildInitialFiltersState(normalizedInspirationFilters));
  };

  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event?.target?.files?.[0];
    if (file && typeof onImportProject === 'function') {
      onImportProject(file);
    }

    if (event?.target) {
      event.target.value = '';
    }
  };

  const renderProjectCard = (project) => {
    const distributorName = getDistributorName(project);
    const situationId = resolveDistributorSituationId(project);
    const situationLabel = getDistributorSituationLabel(situationId);
    const situationStyle = distributorSituationStyles[situationId] || distributorSituationStyles.evaluation;
    const countries = normalizeDistributorCountries(project);
    const linkedProspectId = project?.answers?.linkedProspectId;
    const linkedProspectName = linkedProspectId ? prospectNameById.get(linkedProspectId) : null;
    const contractSummary = buildContractSummary(project);
    const hasContractSummary =
      situationId === DISTRIBUTOR_SITUATION_IDS.underContract && contractSummary;
    const isEvaluation = situationId === DISTRIBUTOR_SITUATION_IDS.evaluation;
    const isContractReview = situationId === DISTRIBUTOR_SITUATION_IDS.contractReview;
    const canDelete = isEvaluation && typeof onDeleteProject === 'function';
    const isSelectedForComparison = comparisonSelection.has(project.id);

    return (
      <article
        key={project.id}
        className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hv-surface ${
          isSelectedForComparison
            ? 'border-blue-300 ring-2 ring-blue-100'
            : 'border-gray-200'
        }`}
        role="listitem"
        aria-label={`Distributeur ${distributorName}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
              <span>{distributorName}</span>
              {project.isDemo && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full">
                  Distributeur démo
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Dernière mise à jour : {formatDate(project.lastUpdated || project.submittedAt)}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${situationStyle.className}`}
              >
                <span className={`h-2 w-2 rounded-full ${situationStyle.dotClassName}`} aria-hidden="true" />
                {situationLabel}
              </span>
              <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  checked={isSelectedForComparison}
                  onChange={() => handleToggleProjectSelection(project.id)}
                  aria-label={`Sélectionner ${distributorName} pour la comparaison`}
                />
                Comparer
              </label>
            </div>
            {canDelete && (
              <button
                type="button"
                onClick={() => handleRequestProjectDeletion(project)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors hv-button hv-focus-ring"
                aria-label={`Supprimer le distributeur ${distributorName}`}
                title="Supprimer le distributeur"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            {countries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {countries.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700"
                  >
                    {country}
                  </span>
                ))}
              </div>
            ) : (
              <span>Pays non renseigné</span>
            )}
          </div>
          {linkedProspectName && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prospect lié</span>
              <span className="font-medium text-gray-700">{linkedProspectName}</span>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {isEvaluation && (
            <>
              <button
                type="button"
                onClick={() => onOpenProject(project.id, { view: 'questionnaire' })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button hv-button-draft text-white"
              >
                <Edit className="w-4 h-4" aria-hidden="true" />
                <span>Questionnaire</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenProject(project.id, { view: 'synthesis' })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button bg-blue-600 text-white hover:bg-blue-700 hv-button-primary"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>Synthèse</span>
              </button>
            </>
          )}
          {isContractReview && (
            <>
              <button
                type="button"
                onClick={() => onOpenProject(project.id, { view: 'questionnaire' })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button bg-blue-600 text-white hover:bg-blue-700 hv-button-primary"
              >
                <Edit className="w-4 h-4" aria-hidden="true" />
                <span>Questionnaire</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenProject(project.id, { view: 'synthesis' })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button bg-white border border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>Synthèse</span>
              </button>
              {onShowProjectShowcase && (
                <button
                  type="button"
                  onClick={() => onShowProjectShowcase(project.id)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all hv-button hv-focus-ring"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Vitrine
                </button>
              )}
            </>
          )}
          {hasContractSummary && (
            <button
              type="button"
              onClick={() => setActiveContractProjectId(project.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span>Fiche contrat</span>
            </button>
          )}
        </div>
      </article>
    );
  };

  const renderInspirationCard = (project) => (
    <article
      key={project.id}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hv-surface"
      role="listitem"
      aria-label={`Prospect ${project.partnerName || 'sans nom'}`}
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{project.partnerName || 'Partenaire non renseigné'}</h3>
          <p className="text-sm text-gray-500">{project.role || 'Rôle non renseigné'}</p>
        </div>
        <dl className="grid grid-cols-1 gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            {normalizeInspirationFieldValues(project.countries).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {normalizeInspirationFieldValues(project.countries).map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700"
                  >
                    {country}
                  </span>
                ))}
              </div>
            ) : (
              <span>Pays non renseigné</span>
            )}
          </div>
          {(() => {
            const situationValue = getSafeString(project.situation).trim();
            const situationConfig = prospectSituationStyles[situationValue] || {
              label: situationValue || 'Situation non renseignée',
              className: 'border-gray-200 bg-gray-50 text-gray-600',
              dotClassName: 'bg-gray-400'
            };
            return (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${situationConfig.className}`}
                >
                  <span className={`h-2 w-2 rounded-full ${situationConfig.dotClassName}`} aria-hidden="true" />
                  {situationConfig.label}
                </span>
              </div>
            );
          })()}
        </dl>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onOpenInspirationProject?.(project.id)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button bg-blue-600 text-white hover:bg-blue-700 hv-button-primary"
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span>Fiche complète</span>
        </button>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8 sm:px-8 hv-background">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="bg-white border border-blue-100 rounded-3xl shadow-xl p-6 sm:p-10 hv-surface" role="banner">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                <Target className="w-4 h-4 mr-2" /> Votre copilote compliance
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {heroHeadline}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                {navigatorLabel} vous guide pas à pas pour qualifier vos distributeurs, suivre les obligations contractuelles et sécuriser vos délais réglementaires.
              </p>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Actions principales">
                {[
                  'Revue des pays',
                  'Évaluation d’un distributeur',
                  'Comparaison et sélection',
                  'Contractualisation / avenant',
                  'Audit et plan d’action'
                ].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={label === 'Revue des pays' ? handleScrollToCountryReview : undefined}
                    className="inline-flex items-center justify-center gap-3 px-5 py-3 text-base font-semibold text-blue-600 bg-white hover:bg-blue-50 rounded-xl border border-blue-200 transition-all hv-button hv-focus-ring"
                  >
                    <span className="leading-tight text-left">{label}</span>
                  </button>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm text-gray-600">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hv-surface" role="listitem">
                <p className="font-semibold text-gray-800 flex items-center">
                  <Rocket className="w-5 h-5 mr-2" /> Démarrez simplement
                </p>
                <p className="mt-2 leading-relaxed">
                  Un questionnaire dynamique pour cadrer le distributeur et qualifier les impacts compliance.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hv-surface" role="listitem">
                <p className="font-semibold text-gray-800 flex items-center">
                  <Compass className="w-5 h-5 mr-2" /> Visualisez la feuille de route
                </p>
                <p className="mt-2 leading-relaxed">
                  Une synthèse claire avec les obligations, les équipes à mobiliser et les délais recommandés.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hv-surface" role="listitem">
                <p className="font-semibold text-gray-800 flex items-center">
                  <Users className="w-5 h-5 mr-2" /> Collaborez efficacement
                </p>
                <p className="mt-2 leading-relaxed">
                  Partagez la synthèse avec les parties prenantes pour sécuriser vos points de passage.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hv-surface" role="listitem">
                <p className="font-semibold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" /> Gardez une trace
                </p>
                <p className="mt-2 leading-relaxed">
                  Retrouvez à tout moment les distributeurs déjà évalués et mettez-les à jour si nécessaire.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section
          ref={countryReviewRef}
          id="country-review"
          aria-labelledby="country-review-heading"
          className="space-y-6"
        >
          <div>
            <h2 id="country-review-heading" className="text-2xl font-bold text-gray-900">
              Revue des pays
            </h2>
            <p className="text-sm text-gray-600">
              Cliquez sur un pays pour consulter les informations clefs et les contrats en cours.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm hv-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <p className="text-sm font-semibold text-gray-700">
                  Carte mondiale des pays
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-600" aria-hidden="true" />
                    Contrat en cours
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-700" aria-hidden="true" />
                    Pays sélectionné
                  </span>
                </div>
              </div>
              {worldMapMarkup ? (
                <div
                  ref={mapContainerRef}
                  onClick={handleMapSelect}
                  onKeyDown={handleMapKeyDown}
                  className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-2"
                  dangerouslySetInnerHTML={{ __html: worldMapMarkup }}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  Chargement de la carte en cours...
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hv-surface space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Informations clés
                </p>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedCountryProfile?.name || selectedCountry?.name || 'Sélectionnez un pays'}
                </h3>
                <p className="text-xs text-gray-500">
                  Ces informations sont gérées dans le backoffice.
                </p>
              </div>

              {!selectedCountry ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  Sélectionnez un pays sur la carte pour afficher la fiche détaillée.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Situation géopolitique
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      {selectedCountryProfile?.geopoliticalSituation || 'Information non renseignée.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Risque de corruption (ICP 2024)
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      {Number.isFinite(selectedCountryCorruptionScore)
                        ? `Indice ICP 2024 : ${selectedCountryCorruptionScore}/100 · ${getCorruptionRiskLabel(
                          selectedCountryCorruptionScore
                        )}`
                        : 'Indice ICP indisponible pour ce pays.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Sanctions économiques
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      {selectedCountryProfile?.economicSanctions || 'Information non renseignée.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Réglementation pharmaceutique clef
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      {selectedCountryProfile?.pharmaRegulation || 'Information non renseignée.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Contrats en cours
                    </p>
                    {selectedCountryContractProjects.length > 0 ? (
                      <ul className="space-y-3">
                        {selectedCountryContractProjects.map((project) => {
                          const endDate = resolveContractEndDate(project);
                          return (
                            <li
                              key={project.id}
                              className="rounded-xl border border-blue-100 bg-white p-3 text-sm text-gray-700"
                            >
                              <p className="font-semibold text-gray-900">
                                {getDistributorName(project)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Fin de contrat : {endDate ? formatDate(endDate) : 'Date inconnue'}
                              </p>
                              {typeof onOpenProject === 'function' && project?.id && (
                                <button
                                  type="button"
                                  onClick={() => onOpenProject(project.id)}
                                  className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-800"
                                >
                                  Voir la fiche du distributeur
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-blue-700">
                        Aucun contrat en cours dans ce pays.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="projects-heading" className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="projects-heading" className="text-2xl font-bold text-gray-900">
                {homeView === 'inspiration' ? 'Prospects' : 'Distributeurs pharmaceutiques'}
              </h2>
              <p className="text-sm text-gray-600">
                {homeView === 'inspiration'
                  ? 'Suivez les distributeurs pharmaceutiques potentiels avec lesquels collaborer.'
                  : 'Pilotez les évaluations, revues contractuelles et suivis sous contrat.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 p-1"
                role="group"
                aria-label="Sélection du bloc distributeur"
              >
                <button
                  type="button"
                  onClick={() => onHomeViewChange?.('platform')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    homeView !== 'inspiration'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Distributeurs
                </button>
                <button
                  type="button"
                  onClick={() => onHomeViewChange?.('inspiration')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    homeView === 'inspiration'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Prospects
                </button>
              </div>
              {homeView === 'inspiration' ? (
                <button
                  type="button"
                  onClick={onStartInspirationProject}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Ajouter un prospect
                </button>
              ) : (
                <span className="inline-flex items-center text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-2" /> {displayedProjectsCount} distributeur{displayedProjectsCount > 1 ? 's' : ''}
                  {hasActiveFilters ? ` sur ${totalProjectsCount}` : ''}
                </span>
              )}
            </div>
          </div>

          {homeView !== 'inspiration' && !hasProjects && (
            <div className="bg-white border border-dashed border-blue-200 rounded-3xl p-8 text-center text-gray-600 hv-surface" role="status" aria-live="polite">
              <p className="text-lg font-medium text-gray-800">Aucun distributeur enregistré pour le moment.</p>
              <p className="mt-2">Lancez-vous dès maintenant pour démarrer une évaluation distributeur.</p>
              <button
                type="button"
                onClick={onStartNewProject}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all hv-button hv-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" /> Créer un distributeur
              </button>
            </div>
          )}

          {homeView !== 'inspiration' && hasProjects && (
            <>
              {shouldShowFiltersCard && (
                <div
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hv-surface space-y-4"
                  role="region"
                  aria-label="Filtres des distributeurs"
                  data-tour-id="home-filters"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Filtres distributeurs
                    </h3>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hv-button ${
                        hasActiveFilters
                          ? 'bg-blue-600 text-white hover:bg-blue-700 hv-button-primary'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!hasActiveFilters}
                    >
                      Effacer tous les filtres
                    </button>
                  </div>
                  {activeProjectFilterChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Filtres actifs
                      </span>
                      {activeProjectFilterChips.map((chip) => (
                        <span
                          key={chip.id}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        >
                          <span className="font-semibold text-blue-800">{chip.label} :</span>
                          <span>{chip.value}</span>
                          <button
                            type="button"
                            onClick={chip.onClear}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-blue-700 transition-colors hover:bg-blue-100"
                            aria-label={`Supprimer le filtre ${chip.label}`}
                          >
                            <Close className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <label htmlFor="distributor-filter-name" className="flex flex-col gap-2 text-sm text-gray-700">
                      <span className="font-semibold text-gray-700">Nom du distributeur</span>
                      <input
                        id="distributor-filter-name"
                        type="text"
                        value={distributorFiltersState.name}
                        onChange={(event) =>
                          setDistributorFiltersState((prev) => ({ ...prev, name: event.target.value }))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Rechercher..."
                      />
                    </label>
                    <div className="flex flex-col gap-2 text-sm text-gray-700">
                      <label htmlFor="distributor-filter-country" className="font-semibold text-gray-700">
                        Pays
                      </label>
                      <select
                        id="distributor-filter-country"
                        value={distributorFiltersState.country}
                        onChange={(event) =>
                          setDistributorFiltersState((prev) => ({ ...prev, country: event.target.value }))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value={DEFAULT_SELECT_FILTER_VALUE}>Tous les pays</option>
                        {distributorCountryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-gray-700">
                      <label htmlFor="distributor-filter-situation" className="font-semibold text-gray-700">
                        Situation
                      </label>
                      <select
                        id="distributor-filter-situation"
                        value={distributorFiltersState.situation}
                        onChange={(event) =>
                          setDistributorFiltersState((prev) => ({ ...prev, situation: event.target.value }))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value={DEFAULT_SELECT_FILTER_VALUE}>Toutes les situations</option>
                        {DISTRIBUTOR_SITUATION_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-gray-700">
                      <label htmlFor="distributor-sort-order" className="font-semibold text-gray-700">
                        Ordre d'affichage
                      </label>
                      <select
                        id="distributor-sort-order"
                        value={currentSortOrder}
                        onChange={(event) =>
                          setDistributorFiltersState((prev) => ({
                            ...prev,
                            sortOrder: event.target.value === 'asc' ? 'asc' : 'desc'
                          }))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="desc">{SORT_LABELS.desc}</option>
                        <option value="asc">{SORT_LABELS.asc}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div
                className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hv-surface space-y-4"
                role="region"
                aria-label="Comparaison et sélection"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Comparaison et sélection</h3>
                    <p className="text-sm text-gray-600">
                      Sélectionnez les distributeurs à comparer, puis validez pour afficher la synthèse
                      comparative des éléments d’évaluation.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFilteredProjects}
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Tout sélectionner
                    </button>
                    <button
                      type="button"
                      onClick={handleClearComparisonSelection}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {selectedProjectsCount} distributeur{selectedProjectsCount > 1 ? 's' : ''} sélectionné{selectedProjectsCount > 1 ? 's' : ''}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleValidateComparisonSelection}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        canValidateComparison
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!canValidateComparison}
                    >
                      Valider la sélection
                    </button>
                    {isComparisonValidated && (
                      <button
                        type="button"
                        onClick={() => setIsComparisonValidated(false)}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Modifier la sélection
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Astuce : utilisez les filtres pour retrouver rapidement vos distributeurs et affiner la liste.
                </p>
              </div>

              {isComparisonValidated && selectedProjects.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {selectedProjects.map((project) => {
                      const distributorName = getDistributorName(project);
                      const situationId = resolveDistributorSituationId(project);
                      const situationLabel = getDistributorSituationLabel(situationId);
                      const situationStyle =
                        distributorSituationStyles[situationId] || distributorSituationStyles.evaluation;
                      const countries = normalizeDistributorCountries(project);
                      const completion = getCompletionSummary(project);
                      const riskScore = project?.analysis?.riskScore;
                      const riskCount = Array.isArray(project?.analysis?.risks)
                        ? project.analysis.risks.length
                        : 0;
                      const complexity = project?.analysis?.complexity || 'Non évaluée';

                      return (
                        <article
                          key={`comparison-${project.id}`}
                          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface"
                        >
                          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900">{distributorName}</h4>
                              <p className="text-sm text-gray-500">
                                Dernière mise à jour : {formatDate(project.lastUpdated || project.submittedAt)}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${situationStyle.className}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${situationStyle.dotClassName}`}
                                aria-hidden="true"
                              />
                              {situationLabel}
                            </span>
                          </header>
                          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Avancement questionnaire
                              </p>
                              <p className="mt-1 text-lg font-semibold text-blue-900">
                                {completion
                                  ? `${completion.answered}/${completion.total} (${formatPercent(completion.percent)})`
                                  : 'Non renseigné'}
                              </p>
                            </div>
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                                Score de risque
                              </p>
                              <p className="mt-1 text-lg font-semibold text-indigo-900">
                                {formatRiskScore(riskScore)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                Complexité compliance
                              </p>
                              <p className="mt-1 text-lg font-semibold text-amber-900">{complexity}</p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                Risques identifiés
                              </p>
                              <p className="mt-1 text-lg font-semibold text-emerald-900">{riskCount}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pays couverts</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {countries.length > 0 ? (
                                countries.map((country) => (
                                  <span
                                    key={`${project.id}-${country}`}
                                    className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700"
                                  >
                                    {country}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-gray-500">Pays non renseigné</span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm hv-surface">
                    <div className="flex flex-col gap-3">
                      <h4 className="text-lg font-semibold text-gray-900">Sélection finale du distributeur</h4>
                      <p className="text-sm text-gray-600">
                        Choisissez le distributeur retenu et documentez le rationnel de votre décision.
                      </p>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                      <div className="space-y-3">
                        {selectedProjects.map((project) => {
                          const distributorName = getDistributorName(project);
                          return (
                            <label
                              key={`final-choice-${project.id}`}
                              className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white p-3 text-sm font-medium text-gray-700"
                            >
                              <input
                                type="radio"
                                name="final-distributor-choice"
                                className="h-4 w-4 text-blue-600"
                                checked={finalSelectionId === project.id}
                                onChange={() => setFinalSelectionId(project.id)}
                              />
                              <span>{distributorName}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="distributor-selection-rationale" className="text-sm font-semibold text-gray-700">
                          Rationnel (texte libre)
                        </label>
                        <textarea
                          id="distributor-selection-rationale"
                          rows={6}
                          value={selectionRationales[finalSelectionId] || ''}
                          onChange={(event) => handleRationaleChange(finalSelectionId, event.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="Expliquez les raisons de votre choix, les éléments différenciants et les conditions éventuelles."
                          disabled={!finalSelectionId}
                        />
                        {!finalSelectionId && (
                          <p className="text-xs text-gray-500">
                            Sélectionnez un distributeur pour saisir votre rationnel.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasFilteredProjects ? (
                shouldVirtualizeProjects ? (
                  <VirtualizedList
                    items={projectRows}
                    itemKey={(_row, index) => `project-row-${index}`}
                    estimatedItemHeight={420}
                    overscan={3}
                    role="list"
                    className="relative"
                    renderItem={(row) => (
                      <div className="pb-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {row.map(project => renderProjectCard(project))}
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
                    {filteredProjects.map(project => renderProjectCard(project))}
                  </div>
                )
              ) : (
                <div
                  className="bg-white border border-dashed border-blue-200 rounded-3xl p-8 text-center text-gray-600 hv-surface"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-lg font-medium text-gray-800">Aucun distributeur ne correspond à vos filtres.</p>
                  <p className="mt-2">Ajustez vos critères ou réinitialisez les filtres pour afficher tous les distributeurs.</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all hv-button hv-button-primary"
                    >
                      Effacer tous les filtres
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {homeView === 'inspiration' && !hasInspirationProjects && (
            <div className="bg-white border border-dashed border-blue-200 rounded-3xl p-8 text-center text-gray-600 hv-surface" role="status" aria-live="polite">
              <p className="text-lg font-medium text-gray-800">Aucun prospect enregistré.</p>
              <p className="mt-2">Ajoutez des prospects pour nourrir vos futures collaborations.</p>
              <button
                type="button"
                onClick={onStartInspirationProject}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all hv-button hv-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" /> Créer un prospect
              </button>
            </div>
          )}

          {homeView === 'inspiration' && hasInspirationProjects && (
            <>
              {shouldShowInspirationFiltersCard && (
                <div
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hv-surface space-y-4"
                  role="region"
                  aria-label="Filtres des prospects"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Filtres prospects
                    </h3>
                    <button
                      type="button"
                      onClick={handleResetInspirationFilters}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hv-button ${
                        hasActiveInspirationFilters
                          ? 'bg-blue-600 text-white hover:bg-blue-700 hv-button-primary'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!hasActiveInspirationFilters}
                    >
                      Effacer tous les filtres
                    </button>
                  </div>
                  {activeInspirationFilterChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Filtres actifs
                      </span>
                      {activeInspirationFilterChips.map((chip) => (
                        <span
                          key={chip.id}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        >
                          <span className="font-semibold text-blue-800">{chip.label} :</span>
                          <span>{chip.value}</span>
                          <button
                            type="button"
                            onClick={chip.onClear}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-blue-700 transition-colors hover:bg-blue-100"
                            aria-label={`Supprimer le filtre ${chip.label}`}
                          >
                            <Close className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {inspirationFilterFields.map((field) => {
                      const fieldId = `inspiration-filter-${field.id}`;

                      if (field.type === 'select') {
                        const value = inspirationFiltersState[field.id] || DEFAULT_SELECT_FILTER_VALUE;
                        const optionLabel = field.emptyOptionLabel || 'Toutes les valeurs';
                        const options = inspirationFilterOptions.get(field.id) || [];
                        return (
                          <div key={field.id} className="flex flex-col gap-2 text-sm text-gray-700">
                            <label htmlFor={fieldId} className="font-semibold text-gray-700">
                              {field.label}
                            </label>
                            <select
                              id={fieldId}
                              value={value}
                              onChange={(event) =>
                                setInspirationFiltersState(prev => ({ ...prev, [field.id]: event.target.value }))
                              }
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              <option value={DEFAULT_SELECT_FILTER_VALUE}>{optionLabel}</option>
                              {options.map(option => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      const value = typeof inspirationFiltersState[field.id] === 'string'
                        ? inspirationFiltersState[field.id]
                        : '';
                      return (
                        <label key={field.id} htmlFor={fieldId} className="flex flex-col gap-2 text-sm text-gray-700">
                          <span className="font-semibold text-gray-700">{field.label}</span>
                          <input
                            id={fieldId}
                            type="text"
                            value={value}
                            onChange={(event) =>
                              setInspirationFiltersState(prev => ({ ...prev, [field.id]: event.target.value }))
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Rechercher..."
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasFilteredInspirationProjects ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
                  {filteredInspirationProjects.map(project => renderInspirationCard(project))}
                </div>
              ) : (
                <div
                  className="bg-white border border-dashed border-blue-200 rounded-3xl p-8 text-center text-gray-600 hv-surface"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-lg font-medium text-gray-800">Aucun prospect ne correspond à vos filtres.</p>
                  <p className="mt-2">Ajustez vos critères ou réinitialisez les filtres.</p>
                  {hasActiveInspirationFilters && (
                    <button
                      type="button"
                      onClick={handleResetInspirationFilters}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all hv-button hv-button-primary"
                    >
                      Effacer tous les filtres
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {activeContractProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-gray-900 bg-opacity-60"
            aria-hidden="true"
            onClick={() => setActiveContractProjectId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contract-summary-title"
            className="relative z-10 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl focus:outline-none hv-surface"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="contract-summary-title" className="text-2xl font-semibold text-gray-900">
                  Fiche contrat · {getDistributorName(activeContractProject)}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Synthèse des clauses clés pour le distributeur sous contrat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveContractProjectId(null)}
                className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Fermer la fiche contrat"
              >
                <Close className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {!activeContractSummary ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                Aucun résumé contractuel n’est encore renseigné pour ce distributeur.
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Pays concernés
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {contractCountries.length > 0 ? (
                      contractCountries.map((country) => (
                        <span
                          key={country}
                          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        >
                          {country}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">Pays non renseigné</span>
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  {contractSections.map((section) => (
                    <div key={section.id} className="rounded-2xl border border-gray-200 p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleContractSection(section.id)}
                        className="flex w-full items-start justify-between gap-3 text-left"
                        aria-expanded={Boolean(expandedContractSections[section.id])}
                      >
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{section.title}</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            {section.summary || 'Résumé en cours de rédaction.'}
                          </p>
                        </div>
                        <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500">
                          {expandedContractSections[section.id] ? '-' : '+'}
                        </span>
                      </button>
                      {expandedContractSections[section.id] && (
                        <div className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                          {section.clause || 'Clause détaillée non renseignée.'}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              </div>
            )}
          </div>
        </div>
      )}
      {deleteDialogState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-gray-900 bg-opacity-60"
            aria-hidden="true"
            onClick={handleCancelDeleteProject}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-dialog-title"
            aria-describedby="delete-project-dialog-description"
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl focus:outline-none hv-surface"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 id="delete-project-dialog-title" className="text-xl font-semibold text-gray-900">
                  Supprimer le distributeur ?
                </h2>
                <p id="delete-project-dialog-description" className="mt-2 text-sm text-gray-600">
                  Vous êtes sur le point de supprimer « {pendingDeletionProjectName || 'Distributeur sans nom'} ». Cette action est
                  définitive et le distributeur ne pourra pas être restauré.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                ref={deleteCancelButtonRef}
                onClick={handleCancelDeleteProject}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors hv-button hv-focus-ring"
              >
                Annuler
              </button>
              <button
                type="button"
                ref={deleteConfirmButtonRef}
                onClick={handleConfirmDeleteProject}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors hv-button hv-button-danger"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
