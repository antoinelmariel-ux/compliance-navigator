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
  Upload,
  Copy,
  Trash2,
  Close,
  Sparkles
} from './icons.js';
import { VirtualizedList } from './VirtualizedList.jsx';
import { normalizeProjectFilterConfig } from '../utils/projectFilters.js';
import { normalizeInspirationFiltersConfig } from '../utils/inspirationConfig.js';

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

const DEFAULT_SELECT_FILTER_VALUE = 'all';
const DEFAULT_TEXT_FILTER_VALUE = '';

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

  if (value && typeof value === 'object') {
    if (Array.isArray(value.values)) {
      return value.values.map((item) => (item == null ? '' : String(item))).filter(Boolean).join(', ');
    }
    if (typeof value.value !== 'undefined') {
      return String(value.value);
    }
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
  homeView = 'platform',
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
    ? `${currentUserFirstName}, anticipez les besoins compliance de vos projets en quelques minutes`
    : 'Anticipez les besoins compliance de vos projets en quelques minutes';
  const [filtersState, setFiltersState] = useState(() => buildInitialFiltersState(normalizedFilters));
  const normalizedInspirationFilters = useMemo(
    () => normalizeInspirationFiltersConfig(inspirationFilters),
    [inspirationFilters]
  );
  const [inspirationFiltersState, setInspirationFiltersState] = useState(() =>
    buildInitialFiltersState(normalizedInspirationFilters)
  );
  const fileInputRef = useRef(null);
  const [deleteDialogState, setDeleteDialogState] = useState(() => ({
    isOpen: false,
    project: null
  }));
  const deleteCancelButtonRef = useRef(null);
  const deleteConfirmButtonRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

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
          {onShowProjectShowcase && (
            <button
              type="button"
              onClick={() => onShowProjectShowcase(project.id)}
              className="inline-flex items-center px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all hv-button hv-focus-ring"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Vitrine du projet
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
      aria-label={`Projet inspirant ${project.title || 'sans titre'}`}
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{project.title || 'Projet sans titre'}</h3>
          <p className="text-sm text-gray-500">{project.labName || 'Laboratoire non renseigné'}</p>
        </div>
        <dl className="grid grid-cols-1 gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span>{project.country || 'Pays non renseigné'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>{project.target || 'Cible non renseignée'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{project.therapeuticArea || 'Aire thérapeutique non renseignée'}</span>
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
                Project Navigator vous guide pas à pas pour qualifier votre initiative, identifier les interlocuteurs à mobiliser et sécuriser vos délais réglementaires.
              </p>
              <div className="flex flex-col sm:flex-row gap-3" role="group" aria-label="Actions principales">
                <button
                  type="button"
                  onClick={onStartNewProject}
                  className="inline-flex items-center justify-center gap-3 px-5 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all hv-button hv-button-primary"
                  data-tour-id="home-create-project"
                >
                  <Plus className="w-5 h-5" aria-hidden="true" />
                  <span className="flex flex-col leading-tight text-left">
                    <span>Créer un nouveau</span>
                    <span>projet</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleTriggerImport}
                  className="inline-flex items-center justify-center gap-3 px-5 py-3 text-base font-semibold text-blue-600 bg-white hover:bg-blue-50 rounded-xl border border-blue-200 transition-all hv-button hv-focus-ring"
                  data-tour-id="home-import-project"
                >
                  <Upload className="w-5 h-5" aria-hidden="true" />
                  <span className="flex flex-col leading-tight text-left">
                    <span>Charger</span>
                    <span>un projet</span>
                  </span>
                </button>
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
                  Un questionnaire dynamique pour cadrer votre projet et qualifier les impacts compliance.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 hv-surface" role="listitem">
                <p className="font-semibold text-gray-800 flex items-center">
                  <Compass className="w-5 h-5 mr-2" /> Visualisez la feuille de route
                </p>
                <p className="mt-2 leading-relaxed">
                  Une synthèse claire avec le niveau de complexité, les équipes à mobiliser et les délais recommandés.
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
                  Retrouvez à tout moment les projets déjà soumis et mettez-les à jour si nécessaire.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="projects-heading" className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="projects-heading" className="text-2xl font-bold text-gray-900">
                {homeView === 'inspiration' ? 'Projets inspirants' : 'Vos projets enregistrés'}
              </h2>
              <p className="text-sm text-gray-600">
                {homeView === 'inspiration'
                  ? 'Découvrez les initiatives d’autres laboratoires et gérez vos projets inspirants.'
                  : 'Accédez aux brouillons et aux synthèses finalisées pour les reprendre à tout moment.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 p-1"
                role="group"
                aria-label="Sélection du bloc projet"
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
                  Projets LFB
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
                  Inspiration
                </button>
              </div>
              {homeView === 'inspiration' ? (
                <button
                  type="button"
                  onClick={onStartInspirationProject}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Ajouter un projet inspirant
                </button>
              ) : (
                <span className="inline-flex items-center text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-2" /> {displayedProjectsCount} projet{displayedProjectsCount > 1 ? 's' : ''}
                  {hasActiveFilters ? ` sur ${totalProjectsCount}` : ''}
                </span>
              )}
            </div>
          </div>

          {homeView !== 'inspiration' && !hasProjects && (
            <div className="bg-white border border-dashed border-blue-200 rounded-3xl p-8 text-center text-gray-600 hv-surface" role="status" aria-live="polite">
              <p className="text-lg font-medium text-gray-800">Aucun projet enregistré pour le moment.</p>
              <p className="mt-2">Lancez-vous dès maintenant pour préparer votre première synthèse compliance.</p>
              <button
                type="button"
                onClick={onStartNewProject}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all hv-button hv-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" /> Créer un projet
              </button>
            </div>
          )}

          {homeView !== 'inspiration' && hasProjects && (
            <>
              {shouldShowFiltersCard && (
                <div
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hv-surface space-y-4"
                  role="region"
                  aria-label="Filtres des projets"
                  data-tour-id="home-filters"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Filtres disponibles
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
                  <p className="text-lg font-medium text-gray-800">Aucun projet ne correspond à vos filtres.</p>
                  <p className="mt-2">Ajustez vos critères ou réinitialisez les filtres pour afficher tous les projets.</p>
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
              <p className="text-lg font-medium text-gray-800">Aucun projet inspirant enregistré.</p>
              <p className="mt-2">Ajoutez des exemples pour nourrir vos réflexions.</p>
              <button
                type="button"
                onClick={onStartInspirationProject}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all hv-button hv-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" /> Créer un projet inspirant
              </button>
            </div>
          )}

          {homeView === 'inspiration' && hasInspirationProjects && (
            <>
              {shouldShowInspirationFiltersCard && (
                <div
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hv-surface space-y-4"
                  role="region"
                  aria-label="Filtres des projets inspirants"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Filtres Inspiration
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
                  <p className="text-lg font-medium text-gray-800">Aucun projet ne correspond à vos filtres.</p>
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
