import React, { useCallback, useEffect, useMemo, useRef, useState } from '../react.js';
import {
  Plus,
  Target,
  Rocket,
  Compass,
  Users,
  Calendar,
  CheckCircle,
  Eye,
  AlertTriangle,
  Edit,
  Save,
  Copy,
  Trash2,
  Close,
  FileText,
  Sparkles,
  Clipboard
} from './icons.js';
import { VirtualizedList } from './VirtualizedList.jsx';
import { normalizeProjectFilterConfig } from '../utils/projectFilters.js';
import { normalizeInspirationFiltersConfig } from '../utils/inspirationConfig.js';
import icpScores from '../data/ICP 2024.json';
import { countryVisionData } from '../data/countryVision.js';

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

const buildProspectLabel = (project) => {
  if (!project) {
    return 'Prospect sans nom';
  }

  const companyName = getSafeString(project.companyName).trim();
  const contactName = getSafeString(project.contactName).trim();
  const email = getSafeString(project.email).trim();
  const labelBase = companyName || contactName || 'Prospect sans nom';
  const labelParts = [labelBase];

  if (contactName && contactName !== labelBase) {
    labelParts.push(contactName);
  }

  if (email) {
    labelParts.push(email);
  }

  return labelParts.join(' · ');
};

const DEFAULT_SELECT_FILTER_VALUE = 'all';
const DEFAULT_TEXT_FILTER_VALUE = '';
const WORLD_MAP_URL = './src/data/world-map.svg';

const ICP_SCORE_KEY = 'CPI 2024 score';

const icpScoreByIso3 = new Map(
  icpScores.map((entry) => [entry.ISO3, Number(entry[ICP_SCORE_KEY])])
);

const getCorruptionRiskLabel = (score) => {
  if (!Number.isFinite(score)) {
    return 'Indice non disponible';
  }

  if (score >= 70) {
    return 'Faible';
  }

  if (score >= 50) {
    return 'Modéré';
  }

  if (score >= 30) {
    return 'Élevé';
  }

  return 'Très élevé';
};

const PROJECT_FILTER_VALUE_EXTRACTORS = {
  projectName: (project) => {
    if (!project) {
      return '';
    }

    const directName = getSafeString(project.projectName);
    if (directName.trim().length > 0) {
      return directName;
    }

    return getSafeString(project.answers?.projectName);
  },
  teamLead: (project) => getSafeString(project?.answers?.teamLead),
  teamLeadTeam: (project) => getSafeString(project?.answers?.teamLeadTeam)
};

const formatAnswerValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => (item == null ? '' : String(item))).filter(Boolean).join(', ');
  }

  if (value == null) {
    return '';
  }

  return String(value);
};

const getProjectFilterValue = (field, project) => {
  if (!field || !project) {
    return '';
  }

  const extractor = PROJECT_FILTER_VALUE_EXTRACTORS[field.id];
  if (typeof extractor === 'function') {
    const extracted = extractor(project);
    if (typeof extracted === 'string' && extracted.trim().length > 0) {
      return extracted;
    }
  }

  const sourceId = typeof field.sourceQuestionId === 'string' && field.sourceQuestionId.trim().length > 0
    ? field.sourceQuestionId
    : field.id;

  const answerValue = project?.answers?.[sourceId];
  if (typeof answerValue === 'string') {
    return answerValue;
  }

  const formattedAnswer = formatAnswerValue(answerValue);
  if (formattedAnswer.trim().length > 0) {
    return formattedAnswer;
  }

  const directValue = project[sourceId];
  if (typeof directValue === 'string') {
    return directValue;
  }

  return formatAnswerValue(directValue);
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

const complexityColors = {
  Faible: 'text-green-600',
  Modérée: 'text-yellow-600',
  Élevée: 'text-red-600'
};

const statusStyles = {
  draft: {
    label: 'Brouillon en cours',
    className: 'bg-yellow-50 border-yellow-200 text-yellow-600'
  },
  submitted: {
    label: 'Synthèse finalisée',
    className: 'bg-emerald-50 border-emerald-200 text-emerald-600'
  }
};

const computeRemainingQuestions = (project) => {
  if (!project || typeof project.totalQuestions !== 'number' || project.totalQuestions <= 0) {
    return null;
  }

  const answeredCountRaw =
    typeof project.answeredQuestions === 'number'
      ? project.answeredQuestions
      : Math.max((project.lastQuestionIndex ?? 0) + 1, 0);

  const answeredCount = Math.min(answeredCountRaw, project.totalQuestions);
  const remainingCount = Math.max(project.totalQuestions - answeredCount, 0);

  return remainingCount;
};

export const HomeScreen = ({
  projects = [],
  projectFilters,
  teamLeadOptions = [],
  inspirationProjects = [],
  inspirationFilters,
  homeView = 'partners',
  onHomeViewChange,
  selectedPartnerIds = [],
  onStartInspirationProject,
  onOpenInspirationProject,
  onStartNewProject,
  onStartNewContract,
  onOpenPartnerComparison,
  onOpenProject,
  onDeleteProject,
  onDuplicateProject,
  isAdminMode = false,
  tourContext = null,
  currentUser = null
}) => {
  const normalizedFilters = useMemo(
    () => normalizeProjectFilterConfig(projectFilters),
    [projectFilters]
  );
  const currentUserEmail = useMemo(
    () => normalizeEmail(currentUser?.mail || currentUser?.userPrincipalName || ''),
    [currentUser]
  );
  const currentUserFirstName = getSafeString(currentUser?.givenName).trim();
  const heroHeadline = currentUserFirstName.length > 0
    ? `${currentUserFirstName}, pilotez votre développement international en quelques étapes`
    : 'Pilotez votre développement international en quelques étapes';
  const [filtersState, setFiltersState] = useState(() => buildInitialFiltersState(normalizedFilters));
  const normalizedInspirationFilters = useMemo(
    () => normalizeInspirationFiltersConfig(inspirationFilters),
    [inspirationFilters]
  );
  const [inspirationFiltersState, setInspirationFiltersState] = useState(() =>
    buildInitialFiltersState(normalizedInspirationFilters)
  );
  const [deleteDialogState, setDeleteDialogState] = useState(() => ({
    isOpen: false,
    project: null
  }));
  const deleteCancelButtonRef = useRef(null);
  const deleteConfirmButtonRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const mapObjectRef = useRef(null);
  const mapClickHandlerRef = useRef(null);
  const mapInteractionRef = useRef({ cleanup: null });
  const mapBaseViewBoxRef = useRef(null);
  const mapViewBoxRef = useRef(null);
  const mapZoomRef = useRef(1);

  const defaultCountry = countryVisionData[0];
  const [selectedCountryId, setSelectedCountryId] = useState(defaultCountry?.id || '');
  const [selectedCountryLabel, setSelectedCountryLabel] = useState(defaultCountry?.name || '');

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

  const selectedCountry = useMemo(
    () => countryVisionData.find((entry) => entry.id === selectedCountryId),
    [selectedCountryId]
  );
  const selectedCountryName = selectedCountry?.name || selectedCountryLabel || 'Pays sélectionné';
  const selectedCpiScore = selectedCountry?.iso3
    ? icpScoreByIso3.get(selectedCountry.iso3)
    : undefined;
  const selectedCorruptionRisk = getCorruptionRiskLabel(selectedCpiScore);
  const contractEntries = useMemo(
    () =>
      countryVisionData
        .filter((entry) => entry?.contract)
        .map((entry) => ({
          countryName: entry.name,
          partnerName: entry.contract.partnerName,
          endDate: entry.contract.endDate,
          partnerUrl: entry.contract.partnerUrl
        })),
    []
  );
  const selectedPartnerLabels = useMemo(() => {
    if (!Array.isArray(selectedPartnerIds) || selectedPartnerIds.length === 0) {
      return new Set();
    }

    const selectedIdSet = new Set(selectedPartnerIds);
    const labels = new Set();

    inspirationProjects.forEach((project) => {
      if (!project || !selectedIdSet.has(project.id)) {
        return;
      }
      labels.add(buildProspectLabel(project));
    });

    return labels;
  }, [inspirationProjects, selectedPartnerIds]);

  const handleCountrySelect = useCallback((countryId, label) => {
    if (!countryId) {
      return;
    }
    setSelectedCountryId(countryId);
    if (label) {
      setSelectedCountryLabel(label);
    }
  }, []);

  const handleMapObjectLoad = useCallback(() => {
    const svgDocument = mapObjectRef.current?.contentDocument;
    if (!svgDocument) {
      return;
    }

    const svgElement = svgDocument.querySelector('svg');
    if (!svgElement) {
      return;
    }

    if (mapInteractionRef.current.cleanup) {
      mapInteractionRef.current.cleanup();
      mapInteractionRef.current.cleanup = null;
    }

    if (mapClickHandlerRef.current) {
      svgElement.removeEventListener('click', mapClickHandlerRef.current);
    }

    const getBaseViewBox = () => {
      const rawViewBox = svgElement.getAttribute('viewBox');
      if (rawViewBox) {
        const parts = rawViewBox.split(/\s+|,/).map(Number).filter(Number.isFinite);
        if (parts.length === 4) {
          return parts;
        }
      }

      const width = Number(svgElement.getAttribute('width'));
      const height = Number(svgElement.getAttribute('height'));

      if (Number.isFinite(width) && Number.isFinite(height)) {
        return [0, 0, width, height];
      }

      try {
        const bbox = svgElement.getBBox();
        return [bbox.x, bbox.y, bbox.width, bbox.height];
      } catch (error) {
        return null;
      }
    };

    const baseViewBox = getBaseViewBox();
    if (!baseViewBox) {
      return;
    }

    const applyViewBox = (nextViewBox) => {
      const serialized = nextViewBox.map(value => value.toFixed(4)).join(' ');
      svgElement.setAttribute('viewBox', serialized);
      mapViewBoxRef.current = nextViewBox;
    };

    mapBaseViewBoxRef.current = baseViewBox;
    mapZoomRef.current = 1;
    applyViewBox(baseViewBox.slice());

    const clickHandler = (event) => {
      const path = event.target?.closest?.('path');
      if (!path) {
        return;
      }
      const countryId = path.getAttribute('id');
      const countryName = path.getAttribute('name');
      handleCountrySelect(countryId, countryName);
    };

    mapClickHandlerRef.current = clickHandler;
    svgElement.addEventListener('click', clickHandler);
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgElement.style.width = '100%';
    svgElement.style.height = '100%';
    svgElement.style.display = 'block';
    svgElement.style.cursor = 'grab';
    svgElement.style.userSelect = 'none';
    svgElement.style.touchAction = 'none';

    const panState = {
      isPanning: false,
      startX: 0,
      startY: 0,
      startViewBox: null
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const handleWheel = (event) => {
      event.preventDefault();
      if (!mapBaseViewBoxRef.current || !mapViewBoxRef.current) {
        return;
      }

      const baseBox = mapBaseViewBoxRef.current;
      const currentBox = mapViewBoxRef.current;
      const rect = svgElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const direction = event.deltaY > 0 ? 1 : -1;
      const zoomStep = direction > 0 ? 1.1 : 0.9;
      const minZoom = 1;
      const maxZoom = 6;
      const nextZoom = clamp(mapZoomRef.current * zoomStep, minZoom, maxZoom);

      const zoomRatio = nextZoom / mapZoomRef.current;
      if (zoomRatio === 1) {
        return;
      }

      const offsetX = (event.clientX - rect.left) / rect.width;
      const offsetY = (event.clientY - rect.top) / rect.height;
      const nextWidth = baseBox[2] / nextZoom;
      const nextHeight = baseBox[3] / nextZoom;
      const focusX = currentBox[0] + currentBox[2] * offsetX;
      const focusY = currentBox[1] + currentBox[3] * offsetY;

      const nextX = focusX - nextWidth * offsetX;
      const nextY = focusY - nextHeight * offsetY;

      mapZoomRef.current = nextZoom;
      applyViewBox([nextX, nextY, nextWidth, nextHeight]);
    };

    const handleMouseDown = (event) => {
      if (event.button !== 0 || !mapViewBoxRef.current) {
        return;
      }
      panState.isPanning = true;
      panState.startX = event.clientX;
      panState.startY = event.clientY;
      panState.startViewBox = mapViewBoxRef.current.slice();
      svgElement.style.cursor = 'grabbing';
    };

    const handleMouseMove = (event) => {
      if (!panState.isPanning || !panState.startViewBox) {
        return;
      }
      const rect = svgElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      const dx = ((event.clientX - panState.startX) / rect.width) * panState.startViewBox[2];
      const dy = ((event.clientY - panState.startY) / rect.height) * panState.startViewBox[3];
      applyViewBox([
        panState.startViewBox[0] - dx,
        panState.startViewBox[1] - dy,
        panState.startViewBox[2],
        panState.startViewBox[3]
      ]);
    };

    const handleMouseUp = () => {
      if (panState.isPanning) {
        panState.isPanning = false;
        panState.startViewBox = null;
        svgElement.style.cursor = 'grab';
      }
    };

    svgElement.addEventListener('wheel', handleWheel, { passive: false });
    svgElement.addEventListener('mousedown', handleMouseDown);
    svgElement.addEventListener('mousemove', handleMouseMove);
    svgElement.addEventListener('mouseup', handleMouseUp);
    svgElement.addEventListener('mouseleave', handleMouseUp);

    svgElement.querySelectorAll('path').forEach((path) => {
      path.style.cursor = 'pointer';
      path.style.transition = 'fill 0.2s ease, stroke 0.2s ease';
    });

    mapInteractionRef.current.cleanup = () => {
      svgElement.removeEventListener('wheel', handleWheel);
      svgElement.removeEventListener('mousedown', handleMouseDown);
      svgElement.removeEventListener('mousemove', handleMouseMove);
      svgElement.removeEventListener('mouseup', handleMouseUp);
      svgElement.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [handleCountrySelect]);

  useEffect(() => {
    const svgDocument = mapObjectRef.current?.contentDocument;
    if (!svgDocument) {
      return;
    }
    svgDocument.querySelectorAll('path').forEach((path) => {
      if (path.getAttribute('id') === selectedCountryId) {
        path.style.fill = '#60a5fa';
        path.style.stroke = '#1d4ed8';
        path.style.strokeWidth = '0.6';
      } else {
        path.style.fill = '';
        path.style.stroke = '';
        path.style.strokeWidth = '';
      }
    });
  }, [selectedCountryId]);

  useEffect(() => () => {
    const svgDocument = mapObjectRef.current?.contentDocument;
    const svgElement = svgDocument?.querySelector('svg');
    if (svgElement && mapClickHandlerRef.current) {
      svgElement.removeEventListener('click', mapClickHandlerRef.current);
    }
    if (mapInteractionRef.current.cleanup) {
      mapInteractionRef.current.cleanup();
      mapInteractionRef.current.cleanup = null;
    }
  }, []);

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
    setFiltersState(prevState => {
      const initialState = buildInitialFiltersState(normalizedFilters);
      const nextState = { ...prevState };
      let changed = false;

      if (typeof prevState.sortOrder === 'undefined') {
        nextState.sortOrder = initialState.sortOrder;
        changed = true;
      }
      if (typeof prevState.sortOrderDefault === 'undefined') {
        nextState.sortOrderDefault = initialState.sortOrderDefault;
        changed = true;
      }

      if (prevState.sortOrder === prevState.sortOrderDefault) {
        if (prevState.sortOrder !== initialState.sortOrder) {
          nextState.sortOrder = initialState.sortOrder;
          changed = true;
        }
      }
      if (prevState.sortOrderDefault !== initialState.sortOrderDefault) {
        nextState.sortOrderDefault = initialState.sortOrderDefault;
        changed = true;
      }

      normalizedFilters.fields.forEach((field) => {
        if (!field || field.id === 'dateOrder') {
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
            nextState[field.id] = '';
            changed = true;
          }
          if (!field.enabled && nextState[field.id] !== '') {
            nextState[field.id] = '';
            changed = true;
          }
        }
      });

      Object.keys(nextState).forEach((key) => {
        if (key === 'sortOrder' || key === 'sortOrderDefault') {
          return;
        }

        const stillExists = normalizedFilters.fields.some((field) => field && field.id === key);
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
  }, [normalizedFilters]);

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

  const selectFilterOptions = useMemo(() => {
    const fields = Array.isArray(normalizedFilters.fields) ? normalizedFilters.fields : [];
    const map = new Map();

    fields.forEach((field) => {
      if (!field || field.type !== 'select') {
        return;
      }

      const options = new Set();

      if (field.id === 'teamLeadTeam' && Array.isArray(teamLeadOptions)) {
        teamLeadOptions.forEach((option) => {
          const label = getSafeString(option).trim();
          if (label.length > 0) {
            options.add(label);
          }
        });
      }

      if (Array.isArray(field.options)) {
        field.options.forEach((option) => {
          const label = getSafeString(option).trim();
          if (label.length > 0) {
            options.add(label);
          }
        });
      }

      accessibleProjects.forEach((project) => {
        const value = getProjectFilterValue(field, project).trim();
        if (value.length > 0) {
          options.add(value);
        }
      });

      map.set(field.id, Array.from(options).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })));
    });

    return map;
  }, [accessibleProjects, normalizedFilters.fields, teamLeadOptions]);

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

    const activeFields = Array.isArray(normalizedFilters.fields) ? normalizedFilters.fields : [];

    const selection = accessibleProjects.filter((project) => {
      for (let index = 0; index < activeFields.length; index += 1) {
        const field = activeFields[index];
        if (!field || !field.enabled || field.id === 'dateOrder') {
          continue;
        }

        const value = filtersState[field.id];

        if (field.type === 'select') {
          if (value && value !== DEFAULT_SELECT_FILTER_VALUE) {
            const projectValue = getProjectFilterValue(field, project);
            if (projectValue !== value) {
              return false;
            }
          }
          continue;
        }

        const query = typeof value === 'string' ? value.trim().toLowerCase() : '';
        if (query.length === 0) {
          continue;
        }

        const projectValue = getProjectFilterValue(field, project);
        if (projectValue.toLowerCase().indexOf(query) === -1) {
          return false;
        }
      }

      return true;
    });

    const sortField = activeFields.find((field) => field && field.id === 'dateOrder');
    const selectedOrder = filtersState.sortOrder || sortField?.defaultValue || 'desc';
    const direction = selectedOrder === 'asc' ? 'asc' : 'desc';

    return selection.slice().sort((a, b) => {
      const statusA = a?.status === 'draft' ? 0 : 1;
      const statusB = b?.status === 'draft' ? 0 : 1;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      const timeA = getProjectTimestamp(a);
      const timeB = getProjectTimestamp(b);
      const diff = timeA - timeB;

      return direction === 'asc' ? diff : -diff;
    });
  }, [accessibleProjects, normalizedFilters, filtersState]);

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
  const hasContracts = contractEntries.length > 0;
  const pendingDeletionProjectName = useMemo(() => {
    if (!deleteDialogState.project) {
      return '';
    }

    const directName = getSafeString(deleteDialogState.project.projectName);
    if (directName.trim().length > 0) {
      return directName;
    }

    const answerName = getSafeString(deleteDialogState.project.answers?.projectName);
    if (answerName.trim().length > 0) {
      return answerName;
    }

    return 'Projet sans nom';
  }, [deleteDialogState.project]);

  const hasActiveFilters = useMemo(() => {
    const fields = Array.isArray(normalizedFilters.fields) ? normalizedFilters.fields : [];

    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      if (!field || !field.enabled) {
        continue;
      }

      if (field.id === 'dateOrder') {
        if (filtersState.sortOrder !== filtersState.sortOrderDefault) {
          return true;
        }
        continue;
      }

      const value = filtersState[field.id];
      if (field.type === 'select') {
        if (value && value !== DEFAULT_SELECT_FILTER_VALUE) {
          return true;
        }
      } else if (typeof value === 'string' && value.trim().length > 0) {
        return true;
      }
    }

    return false;
  }, [normalizedFilters, filtersState]);

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
  const displayedProspectsCount = filteredInspirationProjects.length;
  const totalProspectsCount = inspirationProjects.length;
  const totalContractsCount = contractEntries.length;
  const sortFilterConfig = Array.isArray(normalizedFilters.fields)
    ? normalizedFilters.fields.find(field => field && field.id === 'dateOrder')
    : null;
  const enabledFilterFields = Array.isArray(normalizedFilters.fields)
    ? normalizedFilters.fields.filter(field => field && field.enabled && field.id !== 'dateOrder')
    : [];
  const shouldShowFiltersCard = hasProjects && (enabledFilterFields.length > 0 || (sortFilterConfig && sortFilterConfig.enabled));
  const currentSortOrder = filtersState.sortOrder || sortFilterConfig?.defaultValue || 'desc';
  const inspirationFilterFields = Array.isArray(normalizedInspirationFilters.fields)
    ? normalizedInspirationFilters.fields.filter((field) => field && field.enabled)
    : [];
  const shouldShowInspirationFiltersCard = hasInspirationProjects && inspirationFilterFields.length > 0;

  const handleClearProjectFilter = useCallback((target) => {
    setFiltersState((prev) => {
      const next = { ...prev };

      if (target.type === 'sort') {
        const defaultValue = prev.sortOrderDefault || 'desc';
        if (prev.sortOrder === defaultValue) {
          return prev;
        }
        next.sortOrder = defaultValue;
        return next;
      }

      if (target.type === 'select') {
        next[target.id] = DEFAULT_SELECT_FILTER_VALUE;
      } else {
        next[target.id] = DEFAULT_TEXT_FILTER_VALUE;
      }

      return next;
    });
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

    enabledFilterFields.forEach((field) => {
      const rawValue = filtersState[field.id];
      if (field.type === 'select') {
        if (rawValue && rawValue !== DEFAULT_SELECT_FILTER_VALUE) {
          chips.push({
            id: field.id,
            label: field.label || 'Filtre',
            value: String(rawValue),
            onClear: () => handleClearProjectFilter({ id: field.id, type: 'select' })
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
          onClear: () => handleClearProjectFilter({ id: field.id, type: 'text' })
        });
      }
    });

    if (sortFilterConfig?.enabled && filtersState.sortOrder !== filtersState.sortOrderDefault) {
      chips.push({
        id: 'sortOrder',
        label: sortFilterConfig.label || 'Tri',
        value: SORT_LABELS[filtersState.sortOrder] || filtersState.sortOrder,
        onClear: () => handleClearProjectFilter({ id: 'sortOrder', type: 'sort' })
      });
    }

    return chips;
  }, [
    enabledFilterFields,
    filtersState,
    sortFilterConfig,
    handleClearProjectFilter
  ]);

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
    setFiltersState(buildInitialFiltersState(normalizedFilters));
  };

  const handleResetInspirationFilters = () => {
    setInspirationFiltersState(buildInitialFiltersState(normalizedInspirationFilters));
  };

  const renderProjectCard = (project) => {
    const complexity = project.analysis?.complexity;
    const risksCount = project.analysis?.risks?.length ?? 0;
    const projectStatus = statusStyles[project.status] || statusStyles.submitted;
    const remainingQuestions = computeRemainingQuestions(project);
    const isDraft = project.status === 'draft';
    const adminCanEditSubmitted = isAdminMode && !isDraft;
    const leadName = getSafeString(project?.answers?.teamLead).trim();
    const leadTeam = getSafeString(project?.answers?.teamLeadTeam).trim();
    const leadDisplay = leadName.length > 0
      ? `${leadName}${leadTeam.length > 0 ? ` (${leadTeam})` : ''}`
      : leadTeam.length > 0
        ? `(${leadTeam})`
        : 'Lead du projet non renseigné';
    const projectTypeRaw = project?.answers?.ProjectType;
    const projectType = Array.isArray(projectTypeRaw)
      ? projectTypeRaw
          .map(item => (typeof item === 'string' ? item.trim() : ''))
          .filter(item => item.length > 0)
          .join(', ')
      : getSafeString(projectTypeRaw).trim();
    const projectTypeDisplay = projectType.length > 0
      ? projectType
      : 'Type de projet non renseigné';

    return (
      <article
        key={project.id}
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hv-surface"
        role="listitem"
        aria-label={`Projet ${project.projectName || 'sans nom'}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
              <span>{project.projectName || 'Projet sans nom'}</span>
              {project.isDemo && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full">
                  Projet démo
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Dernière mise à jour : {formatDate(project.lastUpdated || project.submittedAt)}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-end gap-2">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full border hv-badge ${projectStatus.className}`.trim()}
              >
                {projectStatus.label}
              </span>
              {complexity && (
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border hv-badge ${complexityColors[complexity] || 'text-blue-600'}`}>
                  {complexity}
                </span>
              )}
            </div>
            {typeof onDuplicateProject === 'function' && (
              <button
                type="button"
                onClick={() => onDuplicateProject(project.id)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors hv-button hv-focus-ring"
                aria-label={`Dupliquer le projet ${project.projectName || 'sans nom'}`}
                title="Dupliquer le projet"
              >
                <Copy className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            {isDraft && typeof onDeleteProject === 'function' && (
              <button
                type="button"
                onClick={() => handleRequestProjectDeletion(project)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors hv-button hv-focus-ring"
                aria-label={`Supprimer le projet ${project.projectName || 'sans nom'}`}
                title="Supprimer le projet"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="font-medium text-gray-700">{leadDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>{projectTypeDisplay}</span>
          </div>
          {remainingQuestions !== null && (
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>
                {remainingQuestions === 0
                  ? 'Aucune question restante'
                  : `${remainingQuestions} question${remainingQuestions > 1 ? 's' : ''} restante${remainingQuestions > 1 ? 's' : ''}`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{risksCount} risque{risksCount > 1 ? 's' : ''} identifié{risksCount > 1 ? 's' : ''}</span>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (isDraft) {
                onOpenProject(project.id);
                return;
              }

              if (adminCanEditSubmitted) {
                onOpenProject(project.id, { view: 'questionnaire' });
                return;
              }

              onOpenProject(project.id);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button ${
              isDraft || adminCanEditSubmitted
                ? 'hv-button-draft text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 hv-button-primary'
            }`}
          >
            {isDraft ? (
              <>
                <Edit className="w-4 h-4" aria-hidden="true" />
                <span>Continuer l'édition</span>
              </>
            ) : adminCanEditSubmitted ? (
              <>
                <Edit className="w-4 h-4" aria-hidden="true" />
                <span>Modifier le projet</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>Consulter la synthèse</span>
              </>
            )}
          </button>
          {adminCanEditSubmitted && (
            <button
              type="button"
              onClick={() => onOpenProject(project.id, { view: 'synthesis' })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button bg-blue-600 text-white hover:bg-blue-700 hv-button-primary"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span>Consulter la synthèse</span>
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
      aria-label={`Prospect ${project.companyName || project.contactName || 'sans nom'}`}
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {project.companyName || 'Entreprise non renseignée'}
          </h3>
          <p className="text-sm text-gray-500">
            {project.contactName || 'Contact non renseigné'}
          </p>
          <p className="text-sm text-gray-500">{project.role || 'Rôle non renseigné'}</p>
        </div>
        <dl className="grid grid-cols-1 gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span>
              {normalizeInspirationFieldValues(project.countries).join(', ') || 'Pays non renseignés'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{project.situation || 'Situation non renseignée'}</span>
          </div>
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

  const getPartnerCardInfo = (project) => {
    const answers = project?.answers || {};
    return {
      name: getSafeString(project?.projectName || answers.projectName),
      contactName: getSafeString(answers.contactName),
      role: getSafeString(answers.role),
      countries: normalizeInspirationFieldValues(answers.countries),
      situation: getSafeString(answers.situation),
      prospectLabel: getSafeString(answers.partnerProspectId)
    };
  };

  const renderPartnerCard = (project) => {
    const info = getPartnerCardInfo(project);
    const isCompared = info.prospectLabel && selectedPartnerLabels.has(info.prospectLabel);

    return (
      <article
        key={project.id}
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hv-surface"
        role="listitem"
        aria-label={`Partenaire ${info.name || info.contactName || 'sans nom'}`}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {info.name || 'Entreprise non renseignée'}
              </h3>
              <p className="text-sm text-gray-500">
                {info.contactName || 'Contact non renseigné'}
              </p>
              <p className="text-sm text-gray-500">{info.role || 'Rôle non renseigné'}</p>
            </div>
            {isCompared && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Comparatif
              </span>
            )}
          </div>
          <dl className="grid grid-cols-1 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>{info.countries.join(', ') || 'Pays non renseignés'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{info.situation || 'Situation non renseignée'}</span>
            </div>
          </dl>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onOpenProject?.(project.id, { view: 'synthesis' })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button bg-blue-600 text-white hover:bg-blue-700 hv-button-primary"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>Consulter la synthèse</span>
          </button>
        </div>
      </article>
    );
  };

  const handleOpenContractActions = (partnerUrl) => {
    if (!partnerUrl || typeof window === 'undefined') {
      return;
    }
    window.open(`${partnerUrl}#plans-actions`, '_blank', 'noopener,noreferrer');
  };

  const renderContractCard = (contract, index) => (
    <article
      key={`${contract.partnerName}-${index}`}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hv-surface"
      role="listitem"
      aria-label={`Contrat ${contract.partnerName}`}
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {contract.partnerName || 'Partenaire non renseigné'}
          </h3>
          <p className="text-sm text-gray-500">
            {contract.countryName || 'Pays non renseigné'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <span>Fin de contrat : {formatDate(contract.endDate)}</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={contract.partnerUrl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button bg-blue-600 text-white hover:bg-blue-700 hv-button-primary"
          target="_blank"
          rel="noreferrer"
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          <span>Voir le contrat</span>
        </a>
        <button
          type="button"
          onClick={() => handleOpenContractActions(contract.partnerUrl)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hv-button border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <Clipboard className="w-4 h-4" aria-hidden="true" />
          <span>Plans d'action</span>
        </button>
      </div>
    </article>
  );

  const homeViewTitle = homeView === 'prospects'
    ? 'Prospects'
    : homeView === 'contracts'
      ? 'Contrats'
      : 'Partenaires';
  const homeViewDescription = homeView === 'prospects'
    ? 'Retrouvez les partenaires potentiels que vous prospectez pour développer votre activité à l’international.'
    : homeView === 'contracts'
      ? 'Suivez les contrats en cours, leurs échéances et les plans d’actions associés.'
      : 'Accédez aux partenaires qualifiés et à la synthèse de leurs dossiers.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8 sm:px-8 hv-background">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="bg-white border border-blue-100 rounded-3xl shadow-xl p-6 sm:p-10 hv-surface" role="banner">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                <Target className="w-4 h-4 mr-2" /> Votre copilote développement international
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {heroHeadline}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                Distrib Navigator accompagne les Area Managers pour identifier les enjeux pays, sélectionner des
                distributeurs partenaires, accélérer la contractualisation et suivre les plans d'action après audit.
              </p>
              <div className="flex flex-col sm:flex-row gap-3" role="group" aria-label="Actions principales">
                <button
                  type="button"
                  onClick={() => {
                    const section = document.getElementById('vision-pays');
                    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center justify-center gap-3 px-5 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all hv-button hv-button-primary"
                >
                  <Compass className="w-5 h-5" aria-hidden="true" />
                  <span className="flex flex-col leading-tight text-left">
                    <span>Vision</span>
                    <span>pays</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onStartNewProject}
                  className="inline-flex items-center justify-center gap-3 px-5 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all hv-button hv-button-primary"
                  data-tour-id="home-create-project"
                >
                  <Plus className="w-5 h-5" aria-hidden="true" />
                  <span className="flex flex-col leading-tight text-left">
                    <span>Créer un nouveau</span>
                    <span>partenaire</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onOpenPartnerComparison}
                  className="inline-flex items-center justify-center gap-3 px-5 py-3 text-base font-semibold text-blue-600 bg-white hover:bg-blue-50 rounded-xl border border-blue-200 transition-all hv-button hv-focus-ring"
                  data-tour-id="home-import-project"
                >
                  <Users className="w-5 h-5" aria-hidden="true" />
                  <span className="flex flex-col leading-tight text-left">
                    <span>Comparer</span>
                    <span>les partenaires</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onStartNewContract}
                  className="inline-flex items-center justify-center gap-3 px-5 py-3 text-base font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-all hv-button hv-focus-ring"
                >
                  <FileText className="w-5 h-5" aria-hidden="true" />
                  <span className="flex flex-col leading-tight text-left">
                    <span>Nouveau</span>
                    <span>contrat</span>
                  </span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm text-gray-600">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hv-surface" role="listitem">
                <p className="font-semibold text-gray-800 flex items-center">
                  <Rocket className="w-5 h-5 mr-2" /> Cartographiez les enjeux pays
                </p>
                <p className="mt-2 leading-relaxed">
                  Identifiez rapidement les contraintes locales et les priorités pour chaque marché cible.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hv-surface" role="listitem">
                <p className="font-semibold text-gray-800 flex items-center">
                  <Compass className="w-5 h-5 mr-2" /> Sélectionnez les bons partenaires
                </p>
                <p className="mt-2 leading-relaxed">
                  Centralisez les distributeurs potentiels et pilotez leur qualification étape par étape.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hv-surface" role="listitem">
                <p className="font-semibold text-gray-800 flex items-center">
                  <Users className="w-5 h-5 mr-2" /> Facilitez la contractualisation
                </p>
                <p className="mt-2 leading-relaxed">
                  Suivez les échanges internes pour sécuriser les décisions et aligner les parties prenantes.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hv-surface" role="listitem">
                <p className="font-semibold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" /> Pilotez la relation post-audit
                </p>
                <p className="mt-2 leading-relaxed">
                  Gardez un historique des audits et des plans d'action pour maintenir la performance des partenaires.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section
          id="vision-pays"
          aria-labelledby="vision-pays-title"
          className="bg-white border border-blue-100 rounded-3xl shadow-xl p-6 sm:p-10 hv-surface space-y-8"
        >
          <div className="flex flex-col gap-3">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full border border-indigo-200">
              Vision pays
            </span>
            <h2 id="vision-pays-title" className="text-2xl sm:text-3xl font-bold text-gray-900">
              Cartographie mondiale des enjeux pays
            </h2>
            <p className="text-sm text-gray-600 max-w-3xl">
              Cliquez sur un pays pour afficher les informations clés : contexte géopolitique, sanctions économiques,
              réglementation pharmaceutique et risque de corruption basé sur l’indice de perception de la corruption
              (ICP 2024).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-blue-100 bg-white shadow-sm overflow-hidden">
                <object
                  ref={mapObjectRef}
                  data={WORLD_MAP_URL}
                  type="image/svg+xml"
                  className="w-full h-[360px] sm:h-[520px] md:h-[620px]"
                  aria-label="Carte du monde interactive"
                  onLoad={handleMapObjectLoad}
                >
                  Votre navigateur ne prend pas en charge l’affichage de la carte.
                </object>
              </div>
              <div className="flex flex-wrap gap-2">
                {countryVisionData.map((country) => (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => handleCountrySelect(country.id, country.name)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors border ${
                      selectedCountryId === country.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Pays sélectionné
                </p>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{selectedCountryName}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Cliquez sur la carte pour mettre à jour la fiche.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Situation géopolitique
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedCountry?.geopolitical || 'Aucune donnée disponible pour ce pays.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Risque de corruption
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {Number.isFinite(selectedCpiScore)
                      ? `Indice ICP 2024 : ${selectedCpiScore}/100 · Risque ${selectedCorruptionRisk.toLowerCase()}`
                      : selectedCorruptionRisk}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sanctions économiques
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedCountry?.sanctions || 'Aucune donnée disponible pour ce pays.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Réglementation pharmaceutique clef
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedCountry?.pharma || 'Aucune donnée disponible pour ce pays.'}
                  </p>
                </div>
              </div>

              {selectedCountry?.contract && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Contrat en cours
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedCountry.contract.partnerName}
                    </p>
                    <p className="text-sm text-gray-700">
                      Fin de contrat :{' '}
                      {formatDate(selectedCountry.contract.endDate)}
                    </p>
                    <a
                      href={selectedCountry.contract.partnerUrl}
                      className="text-sm font-semibold text-emerald-700 underline hover:text-emerald-800"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir le contrat
                    </a>
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
                {homeViewTitle}
              </h2>
              <p className="text-sm text-gray-600">
                {homeViewDescription}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 p-1"
                role="group"
                aria-label="Sélection du bloc principal"
              >
                <button
                  type="button"
                  onClick={() => onHomeViewChange?.('contracts')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    homeView === 'contracts'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Contrats
                </button>
                <button
                  type="button"
                  onClick={() => onHomeViewChange?.('partners')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    homeView === 'partners'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Partenaires
                </button>
                <button
                  type="button"
                  onClick={() => onHomeViewChange?.('prospects')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    homeView === 'prospects'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Prospects
                </button>
              </div>
              {homeView === 'prospects' ? (
                <button
                  type="button"
                  onClick={onStartInspirationProject}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Ajouter un prospect
                </button>
              ) : homeView === 'contracts' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                    <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                    {totalContractsCount} contrat{totalContractsCount > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={onStartNewContract}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Nouveau contrat
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-2" /> {displayedProjectsCount} partenaire{displayedProjectsCount > 1 ? 's' : ''}
                  {hasActiveFilters ? ` sur ${totalProjectsCount}` : ''}
                </span>
              )}
            </div>
          </div>

          {homeView === 'partners' && !hasProjects && (
            <div className="bg-white border border-dashed border-blue-200 rounded-3xl p-8 text-center text-gray-600 hv-surface" role="status" aria-live="polite">
              <p className="text-lg font-medium text-gray-800">Aucun partenaire enregistré pour le moment.</p>
              <p className="mt-2">Créez un partenaire pour démarrer une synthèse compliance.</p>
              <button
                type="button"
                onClick={onStartNewProject}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all hv-button hv-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" /> Créer un nouveau partenaire
              </button>
            </div>
          )}

          {homeView === 'partners' && hasProjects && (
            <>
              {shouldShowFiltersCard && (
                <div
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hv-surface space-y-4"
                  role="region"
                  aria-label="Filtres des partenaires"
                  data-tour-id="home-filters"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Filtres partenaires
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
                    {enabledFilterFields.map((field) => {
                      const fieldId = `project-filter-${field.id}`;

                      if (field.type === 'select') {
                        const value = filtersState[field.id] || DEFAULT_SELECT_FILTER_VALUE;
                        const optionLabel = field.emptyOptionLabel || 'Toutes les valeurs';
                        const options = selectFilterOptions.get(field.id) || [];
                        return (
                          <div key={field.id} className="flex flex-col gap-2 text-sm text-gray-700">
                            <label htmlFor={fieldId} className="font-semibold text-gray-700">
                              {field.label}
                            </label>
                            <select
                              id={fieldId}
                              value={value}
                              onChange={(event) =>
                                setFiltersState(prev => ({ ...prev, [field.id]: event.target.value }))
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

                      const value = typeof filtersState[field.id] === 'string' ? filtersState[field.id] : '';
                      return (
                        <label key={field.id} htmlFor={fieldId} className="flex flex-col gap-2 text-sm text-gray-700">
                          <span className="font-semibold text-gray-700">{field.label}</span>
                          <input
                            id={fieldId}
                            type="text"
                            value={value}
                            onChange={(event) =>
                              setFiltersState(prev => ({ ...prev, [field.id]: event.target.value }))
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Rechercher..."
                          />
                        </label>
                      );
                    })}
                    {sortFilterConfig && sortFilterConfig.enabled && (
                      <div className="flex flex-col gap-2 text-sm text-gray-700">
                        <label htmlFor="project-sort-order" className="font-semibold text-gray-700">
                          {sortFilterConfig.label}
                        </label>
                        <select
                          id="project-sort-order"
                          value={currentSortOrder}
                          onChange={(event) =>
                            setFiltersState(prev => ({
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
                    )}
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
                          {row.map(project => renderPartnerCard(project))}
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
                    {filteredProjects.map(project => renderPartnerCard(project))}
                  </div>
                )
              ) : (
                <div
                  className="bg-white border border-dashed border-blue-200 rounded-3xl p-8 text-center text-gray-600 hv-surface"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-lg font-medium text-gray-800">Aucun partenaire ne correspond à vos filtres.</p>
                  <p className="mt-2">Ajustez vos critères ou réinitialisez les filtres pour afficher tous les partenaires.</p>
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

          {homeView === 'prospects' && !hasInspirationProjects && (
            <div className="bg-white border border-dashed border-blue-200 rounded-3xl p-8 text-center text-gray-600 hv-surface" role="status" aria-live="polite">
              <p className="text-lg font-medium text-gray-800">Aucun prospect enregistré.</p>
              <p className="mt-2">Ajoutez des partenaires potentiels pour structurer votre prospection.</p>
              <button
                type="button"
                onClick={onStartInspirationProject}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all hv-button hv-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" /> Créer un prospect
              </button>
            </div>
          )}

          {homeView === 'prospects' && hasInspirationProjects && (
            <>
              {shouldShowInspirationFiltersCard && (
                <div
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hv-surface space-y-4"
                  role="region"
                  aria-label="Filtres des prospects"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Filtres Prospects
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

          {homeView === 'contracts' && !hasContracts && (
            <div className="bg-white border border-dashed border-emerald-200 rounded-3xl p-8 text-center text-gray-600 hv-surface" role="status" aria-live="polite">
              <p className="text-lg font-medium text-gray-800">Aucun contrat enregistré.</p>
              <p className="mt-2">Lancez un nouveau contrat pour suivre les échéances et les plans d'action.</p>
              <button
                type="button"
                onClick={onStartNewContract}
                className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-all hv-button hv-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" /> Créer un contrat
              </button>
            </div>
          )}

          {homeView === 'contracts' && hasContracts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
              {contractEntries.map((contract, index) => renderContractCard(contract, index))}
            </div>
          )}
        </section>
      </div>
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
                  Supprimer le projet ?
                </h2>
                <p id="delete-project-dialog-description" className="mt-2 text-sm text-gray-600">
                  Vous êtes sur le point de supprimer « {pendingDeletionProjectName || 'Projet sans nom'} ». Cette action est
                  définitive et le projet ne pourra pas être restauré.
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
