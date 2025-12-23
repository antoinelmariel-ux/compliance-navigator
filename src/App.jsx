import React, { useCallback, useEffect, useMemo, useRef, useState } from './react.js';
import { QuestionnaireScreen } from './components/QuestionnaireScreen.jsx';
import { SynthesisReport } from './components/SynthesisReport.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { BackOffice } from './components/BackOffice.jsx';
import { ProjectShowcase } from './components/ProjectShowcase.jsx';
import { CheckCircle, Lock, Settings, Sparkles } from './components/icons.js';
import { MandatoryQuestionsSummary } from './components/MandatoryQuestionsSummary.jsx';
import { initialQuestions } from './data/questions.js';
import { initialRules } from './data/rules.js';
import { initialRiskLevelRules } from './data/riskLevelRules.js';
import { initialRiskWeights } from './data/riskWeights.js';
import { initialTeams } from './data/teams.js';
import { initialShowcaseThemes } from './data/showcaseThemes.js';
import { loadPersistedState, persistState } from './utils/storage.js';
import { shouldShowQuestion } from './utils/questions.js';
import { analyzeAnswers } from './utils/rules.js';
import { extractProjectName } from './utils/projects.js';
import { createDemoProject, demoProjectAnswersSnapshot } from './data/demoProject.js';
import { exportProjectToFile } from './utils/projectExport.js';
import { normalizeRiskWeighting } from './utils/risk.js';
import { normalizeProjectEntry, normalizeProjectsCollection } from './utils/projectNormalization.js';
import { loadSubmittedProjectsFromDirectory } from './utils/externalProjectsLoader.js';
import {
  createDefaultProjectFiltersConfig,
  normalizeProjectFilterConfig
} from './utils/projectFilters.js';

const APP_VERSION = 'v1.0.179';

const BACK_OFFICE_PASSWORD_HASH = '3c5b8c6aaa89db61910cdfe32f1bdb193d1923146dbd6a7b0634a32ab73ac1af';
const BACK_OFFICE_PASSWORD_FALLBACK_DIGEST = '86ceec83';

const computeBackOfficePasswordDigest = async (value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return '';
  }

  const globalCrypto =
    typeof globalThis !== 'undefined' && typeof globalThis.crypto !== 'undefined'
      ? globalThis.crypto
      : undefined;

  const hasSubtleCrypto =
    !!globalCrypto?.subtle && typeof TextEncoder !== 'undefined';

  if (hasSubtleCrypto) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(value);
      const digest = await globalCrypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      // Fallback defined below
    }
  }

  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
};

const verifyBackOfficePassword = async (value) => {
  const digest = await computeBackOfficePasswordDigest(value);

  if (!digest) {
    return false;
  }

  if (digest.length === BACK_OFFICE_PASSWORD_HASH.length) {
    return digest === BACK_OFFICE_PASSWORD_HASH;
  }

  return digest === BACK_OFFICE_PASSWORD_FALLBACK_DIGEST;
};

const cloneDeep = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch (error) {
      // Fallback to JSON strategy below
    }
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
};

const restoreShowcaseQuestions = (currentQuestions, referenceQuestions = initialQuestions) => {
  if (!Array.isArray(currentQuestions)) {
    return referenceQuestions;
  }

  const nextQuestions = currentQuestions.slice();
  let changed = false;

  referenceQuestions.forEach((referenceQuestion, referenceIndex) => {
    if (!referenceQuestion || !referenceQuestion.showcase) {
      return;
    }

    const existingIndex = nextQuestions.findIndex((item) => item && item.id === referenceQuestion.id);

    if (existingIndex === -1) {
      const clonedQuestion = JSON.parse(JSON.stringify(referenceQuestion));
      const insertionIndex = Math.min(referenceIndex, nextQuestions.length);
      nextQuestions.splice(insertionIndex, 0, clonedQuestion);
      changed = true;
      return;
    }

    const existingQuestion = nextQuestions[existingIndex];
    const existingShowcaseMeta = existingQuestion && existingQuestion.showcase;
    const referenceShowcaseMeta = referenceQuestion.showcase;

    const showcaseMetaDiffers =
      !existingShowcaseMeta ||
      JSON.stringify(existingShowcaseMeta) !== JSON.stringify(referenceShowcaseMeta);

    if (showcaseMetaDiffers) {
      nextQuestions[existingIndex] = {
        ...existingQuestion,
        showcase: JSON.parse(JSON.stringify(referenceShowcaseMeta))
      };
      changed = true;
    }
  });

  return changed ? nextQuestions : currentQuestions;
};


const isAnswerProvided = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
};

const areAnswersEqual = (previousValue, nextValue) => {
  if (previousValue === nextValue) {
    return true;
  }

  if (Array.isArray(previousValue) && Array.isArray(nextValue)) {
    try {
      return JSON.stringify(previousValue) === JSON.stringify(nextValue);
    } catch (error) {
      if (previousValue.length !== nextValue.length) {
        return false;
      }
      return previousValue.every((entry, index) => entry === nextValue[index]);
    }
  }

  if (
    previousValue &&
    nextValue &&
    typeof previousValue === 'object' &&
    typeof nextValue === 'object'
  ) {
    try {
      return JSON.stringify(previousValue) === JSON.stringify(nextValue);
    } catch (error) {
      return false;
    }
  }

  return false;
};

const findQuestionById = (questions, id) => {
  if (!Array.isArray(questions)) {
    return null;
  }

  return questions.find(question => question?.id === id) || null;
};

const normalizeMilestoneListValue = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => ({
      date: typeof item?.date === 'string' ? item.date.trim() : '',
      description: typeof item?.description === 'string' ? item.description.trim() : ''
    }))
    .filter(entry => entry.date.length > 0 || entry.description.length > 0)
    .map(entry => ({
      date: entry.date,
      description: entry.description
    }));
};

const areMilestoneListsEqual = (previousValue, nextValue) => {
  if (previousValue.length !== nextValue.length) {
    return false;
  }

  return previousValue.every((entry, index) => {
    const nextEntry = nextValue[index];
    if (!nextEntry) {
      return false;
    }

    return entry.date === nextEntry.date && entry.description === nextEntry.description;
  });
};

const applyAnswerUpdates = (
  prevAnswers = {},
  updates,
  questions,
  predicate,
  options = {}
) => {
  if (!updates || typeof updates !== 'object') {
    return { nextAnswers: prevAnswers, changed: false };
  }

  const entries = Object.entries(updates);
  if (entries.length === 0) {
    return { nextAnswers: prevAnswers, changed: false };
  }

  const nextAnswers = { ...prevAnswers };
  let changed = false;

  entries.forEach(([questionId, value]) => {
    if (!questionId) {
      return;
    }

    const question = findQuestionById(questions, questionId);
    const questionType = question?.type;

    if (questionType === 'milestone_list') {
      const normalizedValue = normalizeMilestoneListValue(value);
      const previousRawValue = nextAnswers[questionId];
      const previousValue = Array.isArray(previousRawValue)
        ? normalizeMilestoneListValue(previousRawValue)
        : [];
      const previousRawJson = JSON.stringify(Array.isArray(previousRawValue) ? previousRawValue : []);
      const normalizedJson = JSON.stringify(normalizedValue);

      if (normalizedValue.length > 0) {
        if (!areMilestoneListsEqual(previousValue, normalizedValue) || previousRawJson !== normalizedJson) {
          changed = true;
          nextAnswers[questionId] = normalizedValue;
        }
      } else if (questionId in nextAnswers) {
        changed = true;
        delete nextAnswers[questionId];
      }

      return;
    }

    if (Array.isArray(value)) {
      const filtered = value
        .map(item => (typeof item === 'string' ? item.trim() : item))
        .filter(item => {
          if (typeof item === 'string') {
            return item.length > 0;
          }
          return item !== null && item !== undefined;
        });

      const previousValue = nextAnswers[questionId];
      const arraysAreEqual = Array.isArray(previousValue)
        && previousValue.length === filtered.length
        && previousValue.every((item, index) => item === filtered[index]);

      if (filtered.length > 0) {
        if (!arraysAreEqual) {
          changed = true;
        }
        nextAnswers[questionId] = filtered;
      } else if (questionId in nextAnswers) {
        changed = true;
        delete nextAnswers[questionId];
      }

      return;
    }

    if (value === null || value === undefined) {
      if (questionId in nextAnswers) {
        changed = true;
        delete nextAnswers[questionId];
      }
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        if (nextAnswers[questionId] !== value) {
          changed = true;
          nextAnswers[questionId] = value;
        }
      } else if (questionId in nextAnswers) {
        changed = true;
        delete nextAnswers[questionId];
      }
      return;
    }

    if (nextAnswers[questionId] !== value) {
      changed = true;
      nextAnswers[questionId] = value;
    }
  });

  if (!changed) {
    return { nextAnswers: prevAnswers, changed: false };
  }

  const canEvaluatePredicate = typeof predicate === 'function';
  const shouldPreserveQuestion = typeof options.shouldPreserveQuestion === 'function'
    ? options.shouldPreserveQuestion
    : null;
  const questionsToRemove = Array.isArray(questions) && canEvaluatePredicate
    ? questions
        .filter(question => {
          if (!question || !question.id) {
            return false;
          }

          const wasVisible = predicate(question, prevAnswers);
          const isVisible = predicate(question, nextAnswers);

          if (isVisible) {
            return false;
          }

          if (shouldPreserveQuestion && shouldPreserveQuestion(question, {
            prevAnswers,
            nextAnswers
          })) {
            return false;
          }

          if (wasVisible) {
            return true;
          }

          return isAnswerProvided(nextAnswers[question.id]) || isAnswerProvided(prevAnswers[question.id]);
        })
        .map(question => question.id)
    : [];

  if (questionsToRemove.length > 0) {
    questionsToRemove.forEach(questionId => {
      if (questionId in nextAnswers) {
        changed = true;
        delete nextAnswers[questionId];
      }
    });
  }

  return { nextAnswers, changed };
};

const resolveFallbackQuestionsLength = (savedState, currentQuestionsLength = initialQuestions.length) => {
  if (savedState && Array.isArray(savedState.questions) && savedState.questions.length > 0) {
    return savedState.questions.length;
  }

  return currentQuestionsLength;
};

const buildInitialProjectsState = () => {
  const savedState = loadPersistedState();

  if (!savedState) {
    return [createDemoProject()];
  }

  const fallbackQuestions = Array.isArray(savedState.questions) ? savedState.questions : initialQuestions;
  const fallbackRules = Array.isArray(savedState.rules) ? savedState.rules : initialRules;
  const fallbackRiskLevelRules = Array.isArray(savedState.riskLevelRules)
    ? savedState.riskLevelRules
    : initialRiskLevelRules;
  const fallbackRiskWeights = savedState && typeof savedState.riskWeights === 'object'
    ? normalizeRiskWeighting(savedState.riskWeights)
    : initialRiskWeights;
  const fallbackQuestionsLength = resolveFallbackQuestionsLength(savedState, fallbackQuestions.length);

  const normalizedProjects = normalizeProjectsCollection(savedState.projects, fallbackQuestionsLength)
    || normalizeProjectsCollection(savedState.submittedProjects, fallbackQuestionsLength);

  if (normalizedProjects && normalizedProjects.length > 0) {
    return normalizedProjects;
  }

  return [createDemoProject({
    questions: fallbackQuestions,
    rules: fallbackRules,
    riskLevelRules: fallbackRiskLevelRules,
    riskWeights: fallbackRiskWeights
  })];
};

const isOnboardingProject = (project) => {
  if (!project || typeof project !== 'object') {
    return false;
  }

  const { id } = project;
  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }

  return id === 'onboarding-demo' || id.startsWith('tour-');
};

const sanitizeRestoredProjects = (projects) => {
  if (!Array.isArray(projects)) {
    return [];
  }

  const restored = projects.filter(project => !isOnboardingProject(project));

  if (restored.length === 0) {
    return [];
  }

  return cloneDeep(restored);
};

export const App = () => {
  const [mode, setMode] = useState('user');
  const [screen, setScreen] = useState('home');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [projects, setProjects] = useState(buildInitialProjectsState);
  const projectsRef = useRef(projects);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [showcaseProjectContext, setShowcaseProjectContext] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [returnToSynthesisAfterEdit, setReturnToSynthesisAfterEdit] = useState(false);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [onboardingStepId, setOnboardingStepId] = useState(null);
  const [isTourGuideReady, setIsTourGuideReady] = useState(false);
  const tourInstanceRef = useRef(null);
  const onboardingStateRef = useRef(null);
  const onboardingDemoDataRef = useRef(null);
  const isOnboardingActiveRef = useRef(false);

  const [questions, setQuestions] = useState(() => restoreShowcaseQuestions(initialQuestions));
  const [rules, setRules] = useState(initialRules);
  const [riskLevelRules, setRiskLevelRules] = useState(initialRiskLevelRules);
  const [riskWeights, setRiskWeights] = useState(() => normalizeRiskWeighting(initialRiskWeights));
  const [teams, setTeams] = useState(initialTeams);
  const [showcaseThemes, setShowcaseThemes] = useState(initialShowcaseThemes);
  const [projectFilters, setProjectFiltersState] = useState(() => createDefaultProjectFiltersConfig());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBackOfficeUnlocked, setIsBackOfficeUnlocked] = useState(false);
  const [backOfficeAuthError, setBackOfficeAuthError] = useState(null);
  const [adminView, setAdminView] = useState('home');
  const persistTimeoutRef = useRef(null);
  const previousScreenRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) {
        return undefined;
      }

      const message = 'Avez-vous bien sauvegardé votre projet avant de quitter ?';
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    isOnboardingActiveRef.current = isOnboardingActive;
  }, [isOnboardingActive]);

  useEffect(() => {
    if (isOnboardingActive) {
      return;
    }

    setProjects(prevProjects => {
      if (!Array.isArray(prevProjects) || prevProjects.length === 0) {
        return prevProjects;
      }

      const containsOnboardingProjects = prevProjects.some(isOnboardingProject);
      if (!containsOnboardingProjects) {
        return prevProjects;
      }

      const sanitizedProjects = prevProjects.filter(project => !isOnboardingProject(project));

      if (sanitizedProjects.length === 0) {
        return buildInitialProjectsState();
      }

      return cloneDeep(sanitizedProjects);
    });
  }, [isOnboardingActive, setProjects]);

  useEffect(() => {
    if (mode !== 'admin') {
      setAdminView('home');
    }
  }, [mode]);

  const updateProjectFilters = useCallback((updater) => {
    setProjectFiltersState(prevConfig => {
      const currentConfig = normalizeProjectFilterConfig(prevConfig);
      const nextConfig = typeof updater === 'function' ? updater(currentConfig) : updater;
      return normalizeProjectFilterConfig(nextConfig);
    });
  }, []);

  useEffect(() => {
    if (!Array.isArray(showcaseThemes) || showcaseThemes.length === 0) {
      return;
    }

    setQuestions((previousQuestions) => {
      const nextQuestions = Array.isArray(previousQuestions)
        ? previousQuestions.slice()
        : [];
      const themeQuestionIndex = nextQuestions.findIndex(question => question?.id === 'showcaseTheme');

      if (themeQuestionIndex === -1) {
        return previousQuestions;
      }

      const themeOptions = showcaseThemes
        .map(theme => (typeof theme?.label === 'string' && theme.label.trim().length > 0
          ? theme.label.trim()
          : typeof theme?.id === 'string'
            ? theme.id
            : ''))
        .filter(option => option.length > 0);

      const existingOptions = Array.isArray(nextQuestions[themeQuestionIndex]?.options)
        ? nextQuestions[themeQuestionIndex].options
        : [];

      if (
        themeOptions.length === existingOptions.length &&
        themeOptions.every((option, index) => option === existingOptions[index])
      ) {
        return previousQuestions;
      }

      const existingThemeQuestion = nextQuestions[themeQuestionIndex] || {};

      nextQuestions[themeQuestionIndex] = {
        ...existingThemeQuestion,
        options: themeOptions
      };

      return nextQuestions;
    });
  }, [setQuestions, showcaseThemes]);

  const synchronizeExternalProjects = useCallback(async () => {
    const existingProjects = Array.isArray(projectsRef.current) ? projectsRef.current : [];

    const fallbackQuestionsLength = questions.length;

    const externalProjects = await loadSubmittedProjectsFromDirectory({
      questions,
      rules,
      riskLevelRules,
      riskWeights,
      fallbackQuestionsLength,
      existingProjects
    });

    const externalSources = new Set(externalProjects.map(entry => entry.sourceId));

    setProjects(prevProjects => {
      const baseProjects = Array.isArray(prevProjects) ? prevProjects : [];
      const preserved = baseProjects.filter(project => (
        !project?.externalSourceId || externalSources.has(project.externalSourceId)
      ));

      const bySource = new Map();
      preserved.forEach(project => {
        if (project && project.externalSourceId) {
          bySource.set(project.externalSourceId, project);
        }
      });

      let changed = preserved.length !== baseProjects.length;
      const nextProjects = preserved.slice();

      externalProjects.forEach(entry => {
        const { project, sourceId, checksum } = entry;
        if (!project || !sourceId) {
          return;
        }

        const existing = bySource.get(sourceId);
        if (!existing) {
          nextProjects.push(project);
          changed = true;
          return;
        }

        const existingChecksum = existing.externalSourceChecksum;
        if (existingChecksum && existingChecksum === checksum) {
          return;
        }

        const index = nextProjects.findIndex(item => item?.externalSourceId === sourceId);
        if (index !== -1) {
          nextProjects[index] = project;
        } else {
          nextProjects.push(project);
        }
        changed = true;
      });

      return changed ? nextProjects : baseProjects;
    });
  }, [questions, riskLevelRules, riskWeights, rules]);

  useEffect(() => {
    const loadExternal = async () => {
      try {
        await synchronizeExternalProjects();
      } catch (error) {
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('Impossible de synchroniser les projets externes :', error);
        }
      }
    };

    loadExternal();
  }, [synchronizeExternalProjects]);

  useEffect(() => {
    const savedState = loadPersistedState();
    if (!savedState) {
      setIsHydrated(true);
      return;
    }

    const fallbackQuestions = Array.isArray(savedState.questions) ? savedState.questions : questions;
    const fallbackRules = Array.isArray(savedState.rules) ? savedState.rules : rules;
    const fallbackRiskLevelRules = Array.isArray(savedState.riskLevelRules)
      ? savedState.riskLevelRules
      : riskLevelRules;
    const fallbackRiskWeights = savedState && typeof savedState.riskWeights === 'object'
      ? normalizeRiskWeighting(savedState.riskWeights)
      : riskWeights;
    const fallbackQuestionsLength = resolveFallbackQuestionsLength(savedState, fallbackQuestions.length);

    if (savedState.mode === 'admin') {
      setMode('user');
    } else if (savedState.mode) {
      setMode(savedState.mode);
    }
    if (savedState.screen) setScreen(savedState.screen);
    if (typeof savedState.currentQuestionIndex === 'number' && savedState.currentQuestionIndex >= 0) {
      setCurrentQuestionIndex(savedState.currentQuestionIndex);
    }
    if (savedState.answers && typeof savedState.answers === 'object') setAnswers(savedState.answers);
    if (typeof savedState.analysis !== 'undefined') setAnalysis(savedState.analysis);
    if (Array.isArray(savedState.projects)) {
      const normalized = normalizeProjectsCollection(savedState.projects, fallbackQuestionsLength);
      if (normalized && normalized.length > 0) {
        setProjects(normalized);
      } else {
        setProjects([createDemoProject({
          questions: fallbackQuestions,
          rules: fallbackRules,
          riskLevelRules: fallbackRiskLevelRules,
          riskWeights: fallbackRiskWeights
        })]);
      }
    } else if (Array.isArray(savedState.submittedProjects)) {
      const normalized = normalizeProjectsCollection(savedState.submittedProjects, fallbackQuestionsLength);
      if (normalized && normalized.length > 0) {
        setProjects(normalized);
      } else {
        setProjects([createDemoProject({
          questions: fallbackQuestions,
          rules: fallbackRules,
          riskLevelRules: fallbackRiskLevelRules,
          riskWeights: fallbackRiskWeights
        })]);
      }
    }
    if (typeof savedState.activeProjectId === 'string') setActiveProjectId(savedState.activeProjectId);
    if (Array.isArray(savedState.questions)) {
      setQuestions(restoreShowcaseQuestions(savedState.questions));
    }
    if (Array.isArray(savedState.rules)) setRules(savedState.rules);
    if (Array.isArray(savedState.riskLevelRules)) setRiskLevelRules(savedState.riskLevelRules);
    if (savedState && typeof savedState.riskWeights === 'object') {
      setRiskWeights(normalizeRiskWeighting(savedState.riskWeights));
    }
    if (Array.isArray(savedState.teams)) setTeams(savedState.teams);
    if (Array.isArray(savedState.showcaseThemes)) setShowcaseThemes(savedState.showcaseThemes);
    if (savedState && typeof savedState.projectFilters === 'object') {
      setProjectFiltersState(normalizeProjectFilterConfig(savedState.projectFilters));
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let disposed = false;

    const updateStatus = () => {
      if (disposed) {
        return;
      }
      setIsTourGuideReady(Boolean(window.TourGuideClient));
    };

    updateStatus();

    if (window.TourGuideClient) {
      return () => {
        disposed = true;
      };
    }

    const intervalId = window.setInterval(() => {
      if (window.TourGuideClient) {
        updateStatus();
        window.clearInterval(intervalId);
      }
    }, 500);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const noop = useCallback(() => {}, []);

  const computeDemoData = useCallback(() => {
    const answers = cloneDeep(demoProjectAnswersSnapshot) || {};
    const visibleQuestions = questions.filter(question => shouldShowQuestion(question, answers));
    const analysisResult = analyzeAnswers(answers, rules, riskLevelRules, riskWeights);
    const relevantTeamsList = Array.isArray(teams)
      ? teams.filter(team => (analysisResult?.teams || []).includes(team.id))
      : [];
    const timelineDetails = analysisResult?.timeline?.details || [];
    const projectName = typeof answers.projectName === 'string' && answers.projectName.trim().length > 0
      ? answers.projectName.trim()
      : 'Projet de démonstration';

    return {
      answers,
      analysis: analysisResult,
      questions: visibleQuestions.length > 0 ? visibleQuestions : questions,
      projectName,
      relevantTeams: relevantTeamsList,
      timelineDetails
    };
  }, [questions, riskLevelRules, riskWeights, rules, shouldShowQuestion, teams]);

  const getDemoData = useCallback(() => {
    if (!onboardingDemoDataRef.current) {
      onboardingDemoDataRef.current = computeDemoData();
    }

    return onboardingDemoDataRef.current;
  }, [computeDemoData]);

  const buildOnboardingProjects = useCallback((demoData) => {
    const baseAnswers = cloneDeep(demoData?.answers || demoProjectAnswersSnapshot || {});
    const now = Date.now();

    const createEntry = (config) => {
      const offsetMs = typeof config.offsetMs === 'number' ? config.offsetMs : 0;
      const timestamp = config.timestamp || new Date(now - offsetMs).toISOString();
      const answersPatch = config.answers || {};
      const answers = cloneDeep({ ...baseAnswers, ...answersPatch });
      if (config.projectName) {
        answers.projectName = config.projectName;
      }

      const projectName = typeof answers.projectName === 'string' && answers.projectName.trim().length > 0
        ? answers.projectName.trim()
        : 'Projet sans nom';

      const analysisResult = analyzeAnswers(answers, rules, riskLevelRules, riskWeights);
      const visibleQuestions = questions.filter(question => shouldShowQuestion(question, answers));
      const totalQuestions = visibleQuestions.length > 0 ? visibleQuestions.length : questions.length;
      const answeredQuestions = visibleQuestions.filter(question => isAnswerProvided(answers[question.id])).length;
      const status = config.status || 'draft';

      return {
        id: config.id,
        projectName,
        answers,
        analysis: analysisResult,
        status,
        lastUpdated: config.lastUpdated || timestamp,
        generatedAt: config.generatedAt || timestamp,
        submittedAt: status === 'submitted' ? (config.submittedAt || timestamp) : undefined,
        totalQuestions,
        answeredQuestions: Math.min(answeredQuestions, totalQuestions || answeredQuestions),
        lastQuestionIndex:
          typeof config.lastQuestionIndex === 'number'
            ? config.lastQuestionIndex
            : (status === 'submitted' && totalQuestions > 0
              ? totalQuestions - 1
              : Math.max(totalQuestions - 2, 0)),
        isDemo: true
      };
    };

    return [
      createEntry({
        id: 'tour-draft-1',
        projectName: 'Atlas Connect',
        status: 'draft',
        offsetMs: 86400000,
        answers: {
          teamLead: 'Léa Martin',
          teamLeadTeam: 'Digital'
        }
      }),
      createEntry({
        id: 'tour-submitted',
        projectName: 'Pulse Live',
        status: 'submitted',
        offsetMs: 432000000,
        answers: {
          teamLead: 'Noah Carpentier',
          teamLeadTeam: 'Marketing'
        }
      }),
      createEntry({
        id: 'tour-draft-demo',
        projectName: demoData?.projectName || 'Plasma 360',
        status: 'draft',
        offsetMs: 172800000,
        answers: {}
      })
    ];
  }, [analyzeAnswers, questions, riskLevelRules, riskWeights, rules, shouldShowQuestion]);

  const restoreOnboardingSnapshot = useCallback(() => {
    const snapshot = onboardingStateRef.current;
    onboardingStateRef.current = null;
    onboardingDemoDataRef.current = null;

    if (!snapshot) {
      setMode('user');
      setAdminView('home');
      setScreen('home');
      setAnswers({});
      setAnalysis(null);
      setProjects(buildInitialProjectsState());
      setProjectFiltersState(createDefaultProjectFiltersConfig());
      setCurrentQuestionIndex(0);
      setValidationError(null);
      setSaveFeedback(null);
      setActiveProjectId(null);
      setShowcaseProjectContext(null);
      setHasUnsavedChanges(false);
      setBackOfficeAuthError(null);
      setIsBackOfficeUnlocked(false);
      return;
    }

    setMode(snapshot.mode || 'user');
    setAdminView(snapshot.adminView || 'home');
    setScreen(snapshot.screen || 'home');
    setAnswers(snapshot.answers || {});
    setAnalysis(typeof snapshot.analysis !== 'undefined' ? snapshot.analysis : null);
    const restoredProjects = sanitizeRestoredProjects(snapshot.projects);
    setProjects(
      restoredProjects.length > 0
        ? restoredProjects
        : buildInitialProjectsState()
    );
    setProjectFiltersState(
      snapshot.projectFilters
        ? normalizeProjectFilterConfig(snapshot.projectFilters)
        : createDefaultProjectFiltersConfig()
    );
    setCurrentQuestionIndex(
      typeof snapshot.currentQuestionIndex === 'number' && snapshot.currentQuestionIndex >= 0
        ? snapshot.currentQuestionIndex
        : 0
    );
    setValidationError(snapshot.validationError || null);
    setSaveFeedback(snapshot.saveFeedback || null);
    setActiveProjectId(typeof snapshot.activeProjectId === 'string' ? snapshot.activeProjectId : null);
    setShowcaseProjectContext(snapshot.showcaseProjectContext || null);
    setHasUnsavedChanges(Boolean(snapshot.hasUnsavedChanges));
    setBackOfficeAuthError(snapshot.backOfficeAuthError || null);
    setIsBackOfficeUnlocked(Boolean(snapshot.isBackOfficeUnlocked));
  }, [
    setActiveProjectId,
    setAdminView,
    setAnalysis,
    setAnswers,
    setBackOfficeAuthError,
    setCurrentQuestionIndex,
    setHasUnsavedChanges,
    setIsBackOfficeUnlocked,
    setMode,
    setProjectFiltersState,
    setProjects,
    setSaveFeedback,
    setScreen,
    setShowcaseProjectContext,
    setValidationError
  ]);

  const finishOnboarding = useCallback((options = {}) => {
    const { shouldLoadIndex = false } = options || {};
    const snapshotExists = Boolean(onboardingStateRef.current);
    const wasOnboardingActive = isOnboardingActiveRef.current;

    if (!wasOnboardingActive && !snapshotExists) {
      return;
    }

    isOnboardingActiveRef.current = false;
    setIsOnboardingActive(false);
    setOnboardingStepId(null);

    const tourInstance = tourInstanceRef.current;
    tourInstanceRef.current = null;

    if (tourInstance && typeof tourInstance.stop === 'function') {
      try {
        tourInstance.stop();
      } catch (error) {
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('[Onboarding] Impossible de stopper le guide :', error);
        }
      }
    }

    if (snapshotExists) {
      restoreOnboardingSnapshot();
    }

    if (shouldLoadIndex && typeof window !== 'undefined') {
      const redirect = () => {
        try {
          if (window.location) {
            if (typeof window.location.assign === 'function') {
              window.location.assign('./index.html');
            } else {
              window.location.href = './index.html';
            }
          }
        } catch (error) {
          if (typeof console !== 'undefined' && typeof console.warn === 'function') {
            console.warn('[Onboarding] Impossible de charger la page d\'accueil :', error);
          }
        }
      };

      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => redirect());
      } else if (typeof window.setTimeout === 'function') {
        window.setTimeout(() => redirect(), 0);
      }
    }
  }, [restoreOnboardingSnapshot]);

  const handleOnboardingStepEnter = useCallback((stepId) => {
    if (!stepId) {
      return;
    }

    const demoData = getDemoData();

    const openDemoShowcase = () => {
      openProjectShowcase({
        projectId: null,
        projectName: demoData.projectName,
        answers: cloneDeep(demoData.answers),
        analysis: demoData.analysis,
        relevantTeams: demoData.relevantTeams,
        questions: demoData.questions,
        timelineDetails: demoData.timelineDetails,
        status: 'draft'
      });
      setHasUnsavedChanges(false);
    };

    const ensureShowcaseTopVisible = () => {
      if (typeof window === 'undefined') {
        return;
      }

      const scrollToTop = () => {
        try {
          if (typeof document !== 'undefined') {
            const topSection = document.querySelector('[data-tour-id="showcase-preview"]');
            if (topSection && typeof topSection.scrollIntoView === 'function') {
              topSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
              return;
            }
          }

          if (typeof window.scrollTo === 'function') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (error) {
          if (typeof window.scrollTo === 'function') {
            window.scrollTo({ top: 0 });
          }
        }
      };

      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          if (typeof window.setTimeout === 'function') {
            window.setTimeout(scrollToTop, 0);
          } else {
            scrollToTop();
          }
        });
        return;
      }

      if (typeof window.setTimeout === 'function') {
        window.setTimeout(scrollToTop, 0);
        return;
      }

      scrollToTop();
    };

    switch (stepId) {
      case 'welcome':
      case 'create-project': {
        setScreen('home');
        setShowcaseProjectContext(null);
        setActiveProjectId(null);
        setValidationError(null);
        setSaveFeedback(null);
        setHasUnsavedChanges(false);
        break;
      }
      case 'question-overview':
      case 'question-guidance':
      case 'project-save-anytime': {
        setShowcaseProjectContext(null);
        setScreen('questionnaire');
        setActiveProjectId('onboarding-demo');
        setAnswers(cloneDeep(demoData.answers));
        setCurrentQuestionIndex(0);
        setAnalysis(null);
        setValidationError(null);
        setSaveFeedback(null);
        setHasUnsavedChanges(false);
        break;
      }
      case 'questionnaire-finish': {
        setShowcaseProjectContext(null);
        setScreen('questionnaire');
        setActiveProjectId('onboarding-demo');
        setAnswers(cloneDeep(demoData.answers));
        setAnalysis(null);
        setValidationError(null);
        setSaveFeedback(null);
        setHasUnsavedChanges(false);
        const totalQuestionsCount = Array.isArray(demoData.questions) && demoData.questions.length > 0
          ? demoData.questions.length
          : questions.length;
        const lastIndex = totalQuestionsCount > 0 ? totalQuestionsCount - 1 : 0;
        setCurrentQuestionIndex(lastIndex);
        break;
      }
      case 'compliance-report-top':
      case 'compliance-teams':
      case 'compliance-risks':
      case 'compliance-submit':
      case 'compliance-save':
      case 'compliance-showcase-button': {
        setAnswers(cloneDeep(demoData.answers));
        setAnalysis(demoData.analysis);
        setCurrentQuestionIndex(0);
        setValidationError(null);
        setScreen('synthesis');
        setSaveFeedback(null);
        setHasUnsavedChanges(false);
        break;
      }
      case 'showcase-top': {
        openDemoShowcase();
        ensureShowcaseTopVisible();
        break;
      }
      case 'showcase-bottom':
      case 'showcase-edit-trigger':
      case 'showcase-edit':
      case 'showcase-save-edits':
      case 'showcase-back-to-report': {
        openDemoShowcase();
        break;
      }
      case 'project-import':
      case 'project-filters': {
        setShowcaseProjectContext(null);
        setScreen('home');
        setActiveProjectId(null);
        setValidationError(null);
        setSaveFeedback(null);
        setHasUnsavedChanges(false);
        break;
      }
      default:
        break;
    }
  }, [
    getDemoData,
    openProjectShowcase,
    screen,
    questions,
    setActiveProjectId,
    setAnalysis,
    setAnswers,
    setCurrentQuestionIndex,
    setHasUnsavedChanges,
    setSaveFeedback,
    setScreen,
    setShowcaseProjectContext,
    setValidationError
  ]);

  const handleStartOnboarding = useCallback(() => {
    if (isOnboardingActive) {
      return;
    }

    if (typeof window === 'undefined' || typeof window.TourGuideClient !== 'function') {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('Le guide interactif est momentanément indisponible.');
      }
      return;
    }

    onboardingStateRef.current = {
      mode,
      screen,
      adminView,
      answers: cloneDeep(answers),
      analysis: cloneDeep(analysis),
      projects: cloneDeep(projects),
      projectFilters: cloneDeep(projectFilters),
      currentQuestionIndex,
      validationError: cloneDeep(validationError),
      saveFeedback: cloneDeep(saveFeedback),
      activeProjectId,
      showcaseProjectContext: cloneDeep(showcaseProjectContext),
      hasUnsavedChanges,
      backOfficeAuthError,
      isBackOfficeUnlocked
    };

    const demoData = getDemoData();
    onboardingDemoDataRef.current = demoData;
    const onboardingProjects = buildOnboardingProjects(demoData);

    isOnboardingActiveRef.current = true;
    setIsOnboardingActive(true);
    setOnboardingStepId(null);
    setMode('user');
    setAdminView('home');
    setScreen('home');
    setShowcaseProjectContext(null);
    setActiveProjectId(null);
    setAnswers({});
    setAnalysis(null);
    setValidationError(null);
    setSaveFeedback(null);
    setHasUnsavedChanges(false);
    setBackOfficeAuthError(null);
    setIsBackOfficeUnlocked(false);
    setProjects(onboardingProjects);
    setProjectFiltersState(createDefaultProjectFiltersConfig());

    const steps = [
      {
        id: 'welcome',
        target: '#tour-onboarding-anchor',
        title: 'Bienvenue sur Project Navigator',
        content: 'Découvrons ensemble comment cadrer votre projet pas à pas.'
      },
      {
        id: 'create-project',
        target: '[data-tour-id="home-create-project"]',
        title: 'Lancer un nouveau projet',
        content: 'Cliquez ici pour démarrer. Nous allons utiliser un projet de démonstration pour l’exemple.',
        placement: 'bottom'
      },
      {
        id: 'question-overview',
        target: '[data-tour-id="question-main-content"]',
        title: 'Répondre aux questions',
        content: 'Renseignez les informations demandées étape par étape pour qualifier votre initiative.'
      },
      {
        id: 'question-guidance',
        target: '[data-tour-id="question-guidance-toggle"]',
        title: 'Comprendre chaque question',
        content: 'Chaque étape propose des conseils contextualisés pour répondre sereinement.'
      },
      {
        id: 'project-save-anytime',
        target: '[data-tour-id="question-save-draft"]',
        title: 'Sauvegarder à tout moment',
        content: "Téléchargez un brouillon de votre projet quand vous le souhaitez et rechargez-le depuis l’accueil. Attention, il n'y a pas de sauvegarde automatique."
      },
      {
        id: 'questionnaire-finish',
        target: '[data-tour-id="questionnaire-finish"]',
        title: 'Fin du formulaire',
        content: 'Sur la dernière question, cliquez sur “Voir la synthèse” pour accéder au rapport complet.'
      },
      {
        id: 'compliance-report-top',
        target: '[data-tour-id="synthesis-summary"]',
        title: 'Lire le rapport de compliance',
        content: "Retrouvez ici le résumé du projet avec l'ensemble des informations que vous avez remplies. Vous pouvez revenir en arrière pour les modifier.",
        scrollIntoViewOptions: {
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        }
      },
      {
        id: 'compliance-teams',
        target: '[data-tour-id="synthesis-teams"]',
        title: 'Identifier les équipes compliance',
        content: 'Visualisez les interlocuteurs clés, leurs priorités et les questions à anticiper pour préparer vos échanges.'
      },
      {
        id: 'compliance-risks',
        target: '[data-tour-id="synthesis-risks"]',
        title: 'Risques et points de vigilance',
        content: 'Analysez les risques identifiés et les points de vigilance compliance à adresser en priorité.'
      },
      {
        id: 'compliance-submit',
        target: '[data-tour-id="synthesis-submit"]',
        title: 'Soumettre le projet',
        content: 'Envoyez votre rapport directement par e-mail aux équipes concernées.'
      },
      {
        id: 'compliance-save',
        target: '[data-tour-id="synthesis-save"]',
        title: 'Sauvegarder depuis la synthèse',
        content: 'Téléchargez le fichier du projet pour le partager ou le reprendre ultérieurement.'
      },
      {
        id: 'compliance-showcase-button',
        target: '[data-tour-id="synthesis-showcase"]',
        title: 'Ouvrir la vitrine projet',
        content: 'Accédez à la vitrine marketing générée automatiquement pour présenter votre initiative.'
      },
      {
        id: 'showcase-top',
        target: '[data-tour-id="showcase-hero"]',
        title: 'Présenter votre projet',
        content:
          'Parcourez la vitrine présentant votre projet avec une mise en page le mettant en valeur. Parfait pour une présentation à votre manager !',
         scrollIntoViewOptions: {
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        },
        scrollDuration: 5200
      },
      {
        id: 'showcase-bottom',
        target: '[data-tour-id="showcase-preview-bottom"]',
        title: 'Explorer la suite de la vitrine',
        content: 'Vous retrouvez sur la vitrine les jalons de votre projet mais également les alertes liées à des problématiques de respect de certains délais.',
        scrollIntoViewOptions: {
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        },
        scrollDuration: 3200
      },
      {
        id: 'showcase-edit-trigger',
        target: '[data-tour-id="showcase-edit-trigger"]',
        title: 'Modifier la vitrine',
        content: 'Activez le mode édition pour ajuster les contenus avant diffusion.'
      },
      {
        id: 'showcase-edit',
        target: '[data-tour-id="showcase-edit-panel"]',
        title: 'Personnaliser la vitrine',
        content: 'Adaptez textes, messages clés et jalons pour refléter fidèlement votre projet. Ses informations sont automatiquement mise à jour dans le rapport de compliance.'
      },
      {
        id: 'showcase-save-edits',
        target: '[data-tour-id="showcase-save-edits"]',
        title: 'Enregistrer les modifications',
        content: 'Validez vos ajustements pour mettre à jour immédiatement la vitrine.'
      },
      {
        id: 'showcase-back-to-report',
        target: '[data-tour-id="showcase-back-to-report"]',
        title: 'Retourner au rapport compliance',
        content: 'Revenez au rapport de synthèse pour poursuivre votre préparation et éventuellement enregistrer la dernière version de votre projet.'
      },
      {
        id: 'project-import',
        target: '[data-tour-id="home-import-project"]',
        title: 'Charger un projet existant',
        content: 'Vous pouvez importer un projet enregistrer pour reprendre son édition avant soumission à la compliance.'
      },
      {
        id: 'project-filters',
        target: '[data-tour-id="home-filters"]',
        title: 'Découvrir les projets',
        content: 'Filtrez les initiatives par nom, équipe ou date et laissez vous inspirer.'
      }
    ];

    const tour = new window.TourGuideClient({
      steps,
      labels: {
        next: 'Suivant',
        prev: 'Précédent',
        close: 'Fermer',
        finish: 'Terminer'
      }
    });

    tour.on('stepChange', ({ step }) => {
      const stepId = step?.id || null;
      handleOnboardingStepEnter(stepId);
      setOnboardingStepId(stepId);
    });

    tour.on('close', () => {
      finishOnboarding({ shouldLoadIndex: true });
    });

    tour.on('finish', () => {
      finishOnboarding({ shouldLoadIndex: true });
    });

    tour.start();
    tourInstanceRef.current = tour;
  }, [
    isOnboardingActive,
    mode,
    screen,
    adminView,
    answers,
    analysis,
    projects,
    projectFilters,
    currentQuestionIndex,
    validationError,
    saveFeedback,
    activeProjectId,
    showcaseProjectContext,
    hasUnsavedChanges,
    backOfficeAuthError,
    isBackOfficeUnlocked,
    getDemoData,
    buildOnboardingProjects,
    handleOnboardingStepEnter,
    finishOnboarding,
    setMode,
    setAdminView,
    setScreen,
    setShowcaseProjectContext,
    setActiveProjectId,
    setAnswers,
    setAnalysis,
    setValidationError,
    setSaveFeedback,
    setHasUnsavedChanges,
    setBackOfficeAuthError,
    setIsBackOfficeUnlocked,
    setProjects,
    setProjectFiltersState
  ]);

  useEffect(() => () => {
    if (tourInstanceRef.current && typeof tourInstanceRef.current.stop === 'function') {
      try {
        tourInstanceRef.current.stop();
      } catch (error) {
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('[Onboarding] Nettoyage du guide impossible :', error);
        }
      }
    }
    tourInstanceRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || isOnboardingActive) return undefined;

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(() => {
      const modeToPersist = mode === 'admin' ? 'user' : mode;

      persistState({
        mode: modeToPersist,
        screen,
        currentQuestionIndex,
        answers,
        analysis,
        questions,
        rules,
        riskLevelRules,
        riskWeights,
        teams,
        showcaseThemes,
        projects,
        activeProjectId,
        projectFilters: normalizeProjectFilterConfig(projectFilters)
      });
      persistTimeoutRef.current = null;
    }, 200);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
    };
  }, [
    mode,
    screen,
    currentQuestionIndex,
    answers,
    analysis,
    questions,
    rules,
    riskLevelRules,
    riskWeights,
    teams,
    showcaseThemes,
    projects,
    activeProjectId,
    projectFilters,
    isHydrated,
    isOnboardingActive
  ]);

  const tourContext = useMemo(
    () => (isOnboardingActive ? { isActive: true, activeStep: onboardingStepId } : null),
    [isOnboardingActive, onboardingStepId]
  );

  const activeQuestions = useMemo(
    () => questions.filter(q => shouldShowQuestion(q, answers)),
    [questions, answers]
  );

  const unansweredMandatoryQuestions = useMemo(
    () =>
      activeQuestions.filter(question => question.required && !isAnswerProvided(answers[question.id])),
    [activeQuestions, answers]
  );

  const pendingMandatoryQuestions = useMemo(
    () =>
      unansweredMandatoryQuestions.map(question => ({
        question,
        position: activeQuestions.findIndex(item => item.id === question.id) + 1
      })),
    [unansweredMandatoryQuestions, activeQuestions]
  );

  const hasIncompleteAnswers = useMemo(
    () => activeQuestions.some(question => !isAnswerProvided(answers[question.id])),
    [activeQuestions, answers]
  );

  const teamLeadTeamOptions = useMemo(() => {
    const leadTeamQuestion = questions.find(question => question?.id === 'teamLeadTeam');
    if (!leadTeamQuestion || !Array.isArray(leadTeamQuestion.options)) {
      return [];
    }

    const sanitized = leadTeamQuestion.options
      .map(option => (typeof option === 'string' ? option.trim() : ''))
      .filter(option => option.length > 0);

    return Array.from(new Set(sanitized));
  }, [questions]);

  useEffect(() => {
    if (!isHydrated) return;
    if (activeQuestions.length === 0) return;
    if (currentQuestionIndex >= activeQuestions.length) {
      setCurrentQuestionIndex(activeQuestions.length - 1);
    }
  }, [activeQuestions.length, currentQuestionIndex, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (screen !== 'synthesis') return;
    if (unansweredMandatoryQuestions.length === 0) return;

    const firstMissingId = unansweredMandatoryQuestions[0].id;
    const targetIndex = activeQuestions.findIndex(question => question.id === firstMissingId);
    if (targetIndex >= 0) {
      setCurrentQuestionIndex(targetIndex);
    }
    setValidationError(null);
    setScreen('mandatory-summary');
  }, [
    screen,
    unansweredMandatoryQuestions,
    activeQuestions,
    isHydrated
  ]);

  useEffect(() => {
    if (screen !== 'questionnaire' && screen !== 'synthesis') {
      setSaveFeedback(null);
    }
  }, [screen]);

  const activeProject = useMemo(
    () => projects.find(project => project.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  const activeProjectName = useMemo(() => {
    if (typeof activeProject?.projectName === 'string' && activeProject.projectName.trim().length > 0) {
      return activeProject.projectName.trim();
    }

    return extractProjectName(answers, questions);
  }, [activeProject, answers, questions]);

  const isAdminMode = mode === 'admin';
  const isAdminHomeView = isAdminMode && adminView === 'home';
  const isAdminBackOfficeView = isAdminMode && adminView === 'back-office';
  const isActiveProjectEditable = isAdminMode || !activeProject || activeProject.status === 'draft';

  const handleAnswer = useCallback((questionId, answer) => {
    let answerChanged = false;
    let nextAnswersSnapshot = null;

    setAnswers(prevAnswers => {
      const previousValue = prevAnswers[questionId];
      if (!areAnswersEqual(previousValue, answer)) {
        answerChanged = true;
      }

      const nextAnswers = { ...prevAnswers, [questionId]: answer };

      const questionsToRemove = questions
        .filter(q => !shouldShowQuestion(q, nextAnswers))
        .map(q => q.id);

      if (questionsToRemove.length === 0) {
        if (answerChanged) {
          nextAnswersSnapshot = nextAnswers;
        }
        return answerChanged ? nextAnswers : prevAnswers;
      }

      const sanitizedAnswers = { ...nextAnswers };
      let removedExistingAnswer = false;
      questionsToRemove.forEach(qId => {
        if (Object.prototype.hasOwnProperty.call(sanitizedAnswers, qId)) {
          if (Object.prototype.hasOwnProperty.call(prevAnswers, qId)) {
            removedExistingAnswer = true;
          }
          delete sanitizedAnswers[qId];
        }
      });

      if (!answerChanged) {
        if (removedExistingAnswer) {
          answerChanged = true;
        } else {
          const prevKeys = Object.keys(prevAnswers);
          const nextKeys = Object.keys(sanitizedAnswers);
          if (prevKeys.length !== nextKeys.length) {
            answerChanged = true;
          } else if (nextKeys.some(key => !areAnswersEqual(prevAnswers[key], sanitizedAnswers[key]))) {
            answerChanged = true;
          }
        }
      }

      if (answerChanged) {
        nextAnswersSnapshot = sanitizedAnswers;
      }

      return answerChanged ? sanitizedAnswers : prevAnswers;
    });

    if (!answerChanged || !nextAnswersSnapshot) {
      setValidationError(prev => {
        if (!prev) return null;
        return prev.questionId === questionId ? null : prev;
      });
      return;
    }

    setHasUnsavedChanges(true);

    const updatedAnalysis = Object.keys(nextAnswersSnapshot).length > 0
      ? analyzeAnswers(nextAnswersSnapshot, rules, riskLevelRules, riskWeights)
      : null;

    setAnalysis(updatedAnalysis);

    const relevantQuestions = questions.filter(question => shouldShowQuestion(question, nextAnswersSnapshot));
    const answeredQuestionsCount = relevantQuestions.length > 0
      ? relevantQuestions.filter(question => isAnswerProvided(nextAnswersSnapshot[question.id])).length
      : Object.keys(nextAnswersSnapshot).length;
    const inferredName = extractProjectName(nextAnswersSnapshot, questions);
    const normalizedInferredName = typeof inferredName === 'string' ? inferredName.trim() : '';

    if (activeProjectId && isActiveProjectEditable) {
      setProjects(prevProjects => {
        const projectIndex = prevProjects.findIndex(project => project.id === activeProjectId);
        if (projectIndex === -1) {
          return prevProjects;
        }

        const project = prevProjects[projectIndex];
        if (!project) {
          return prevProjects;
        }

        const canUpdateProject = project.status === 'draft' || isAdminMode;
        if (!canUpdateProject) {
          return prevProjects;
        }

        const totalQuestions = relevantQuestions.length > 0
          ? relevantQuestions.length
          : project.totalQuestions || questions.length || 0;
        const sanitizedName = normalizedInferredName.length > 0
          ? normalizedInferredName
          : project.projectName;
        const lastQuestionIndex = totalQuestions > 0
          ? Math.min(Math.max(project.lastQuestionIndex ?? totalQuestions - 1, 0), totalQuestions - 1)
          : project.lastQuestionIndex ?? 0;

        const updatedProject = {
          ...project,
          answers: nextAnswersSnapshot,
          analysis: updatedAnalysis,
          projectName: sanitizedName,
          totalQuestions,
          answeredQuestions: Math.min(answeredQuestionsCount, totalQuestions || answeredQuestionsCount),
          lastQuestionIndex,
          lastUpdated: new Date().toISOString()
        };

        const nextProjects = prevProjects.slice();
        nextProjects[projectIndex] = updatedProject;
        return nextProjects;
      });
    }

    setValidationError(prev => {
      if (!prev) return null;
      return prev.questionId === questionId ? null : prev;
    });
  }, [
    activeProjectId,
    analyzeAnswers,
    extractProjectName,
    isActiveProjectEditable,
    isAdminMode,
    questions,
    riskLevelRules,
    riskWeights,
    rules,
    setHasUnsavedChanges,
    shouldShowQuestion
  ]);

  const handleUpdateAnswers = useCallback((updates) => {
    if (!isActiveProjectEditable) {
      return;
    }

    let sanitizedResult = null;

    setAnswers(prevAnswers => {
      const { nextAnswers, changed } = applyAnswerUpdates(prevAnswers, updates, questions, shouldShowQuestion);
      if (!changed) {
        return prevAnswers;
      }
      sanitizedResult = nextAnswers;
      return nextAnswers;
    });

    if (sanitizedResult) {
      const updatedAnalysis = analyzeAnswers(sanitizedResult, rules, riskLevelRules, riskWeights);
      setAnalysis(updatedAnalysis);
      setValidationError(null);
      setHasUnsavedChanges(true);

      if (activeProjectId) {
        setProjects(prevProjects => {
          const projectIndex = prevProjects.findIndex(project => project.id === activeProjectId);
          if (projectIndex === -1) {
            return prevProjects;
          }

          const project = prevProjects[projectIndex];
          if (!project) {
            return prevProjects;
          }

          const canUpdateProject = project.status === 'draft' || isAdminMode;
          if (!canUpdateProject) {
            return prevProjects;
          }

          const relevantQuestions = questions.filter(question => shouldShowQuestion(question, sanitizedResult));
          const totalQuestions = relevantQuestions.length > 0
            ? relevantQuestions.length
            : project.totalQuestions || questions.length || 0;
          const answeredQuestionsCount = relevantQuestions.length > 0
            ? relevantQuestions.filter(question => isAnswerProvided(sanitizedResult[question.id])).length
            : Object.keys(sanitizedResult).length;
          const inferredName = extractProjectName(sanitizedResult, questions);
          const sanitizedName = inferredName && inferredName.trim().length > 0
            ? inferredName.trim()
            : project.projectName;
          const lastQuestionIndex = totalQuestions > 0
            ? Math.min(Math.max(project.lastQuestionIndex ?? totalQuestions - 1, 0), totalQuestions - 1)
            : project.lastQuestionIndex ?? 0;

          const updatedProject = {
            ...project,
            answers: sanitizedResult,
            analysis: updatedAnalysis,
            projectName: sanitizedName,
            totalQuestions,
            answeredQuestions: Math.min(answeredQuestionsCount, totalQuestions || answeredQuestionsCount),
            lastQuestionIndex,
            lastUpdated: new Date().toISOString()
          };

          const nextProjects = prevProjects.slice();
          nextProjects[projectIndex] = updatedProject;
          return nextProjects;
        });
      }
    }
  }, [
    activeProjectId,
    analyzeAnswers,
    extractProjectName,
    isActiveProjectEditable,
    isAdminMode,
    setHasUnsavedChanges,
    questions,
    riskLevelRules,
    riskWeights,
    rules,
    shouldShowQuestion
  ]);

  const resetProjectState = useCallback(() => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setAnalysis(null);
    setValidationError(null);
    setActiveProjectId(null);
    setHasUnsavedChanges(false);
    setReturnToSynthesisAfterEdit(false);
  }, [setHasUnsavedChanges]);

  const requestAdminAccess = useCallback(async () => {
    if (isAdminMode) {
      setIsBackOfficeUnlocked(true);
      setBackOfficeAuthError(null);
      return true;
    }

    if (isBackOfficeUnlocked) {
      setBackOfficeAuthError(null);
      return true;
    }

    if (typeof window === 'undefined' || typeof window.prompt !== 'function') {
      setBackOfficeAuthError('La saisie du mot de passe est indisponible dans cet environnement.');
      return false;
    }

    const userInput = window.prompt('Veuillez saisir le mot de passe du back-office :');

    if (userInput === null) {
      setBackOfficeAuthError(null);
      return false;
    }

    const isValid = await verifyBackOfficePassword(userInput);

    if (isValid) {
      setIsBackOfficeUnlocked(true);
      setBackOfficeAuthError(null);
      return true;
    }

    setIsBackOfficeUnlocked(false);
    setBackOfficeAuthError('Mot de passe incorrect. Veuillez réessayer.');
    return false;
  }, [
    isAdminMode,
    isBackOfficeUnlocked,
    setBackOfficeAuthError,
    setIsBackOfficeUnlocked
  ]);

  const handleBackOfficeClick = useCallback(async () => {
    const hasAccess = await requestAdminAccess();
    if (!hasAccess) {
      return;
    }

    setMode('admin');
    setAdminView('back-office');
  }, [requestAdminAccess, setMode]);

  const handleActivateAdminOnHome = useCallback(async () => {
    const hasAccess = await requestAdminAccess();
    if (!hasAccess) {
      return;
    }

    setMode('admin');
    setAdminView('home');
    setScreen('home');
  }, [requestAdminAccess, setMode, setScreen]);

  const handleReturnToProjectMode = useCallback(() => {
    setMode('user');
    setAdminView('home');
    setBackOfficeAuthError(null);
  }, [setBackOfficeAuthError, setMode]);

  const handleCreateNewProject = useCallback(() => {
    resetProjectState();
    setScreen('questionnaire');
  }, [resetProjectState]);

  const handleImportProject = useCallback((file) => {
    if (!file) {
      return;
    }

    if (typeof FileReader === 'undefined') {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('[projectImport] FileReader API indisponible dans cet environnement.');
      }
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('Votre navigateur ne permet pas d\'importer un projet depuis un fichier.');
      }
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = typeof event?.target?.result === 'string' ? event.target.result : '';

        if (!content) {
          throw new Error('EMPTY_FILE');
        }

        const parsed = JSON.parse(content);
        const projectData = parsed?.project && typeof parsed.project === 'object' ? parsed.project : parsed;

        if (!projectData || typeof projectData !== 'object') {
          throw new Error('INVALID_PROJECT');
        }

        const importedAnswers = projectData.answers && typeof projectData.answers === 'object'
          ? projectData.answers
          : {};
        const importedAnalysis = projectData.analysis && typeof projectData.analysis === 'object'
          ? projectData.analysis
          : null;
        const importedName = typeof projectData.name === 'string' ? projectData.name.trim() : '';
        const projectName = importedName.length > 0 ? importedName : 'Projet importé';
        const importedTotalQuestions = Array.isArray(projectData?.questionnaire?.questionIds)
          ? projectData.questionnaire.questionIds.length
          : undefined;

        const entry = handleSaveProject({
          id: `project-${Date.now()}`,
          projectName,
          answers: importedAnswers,
          analysis: importedAnalysis,
          status: 'draft',
          totalQuestions: importedTotalQuestions,
          lastQuestionIndex: 0
        });

        if (!entry) {
          throw new Error('SAVE_FAILED');
        }

        const relevantQuestions = questions.filter(question => shouldShowQuestion(question, importedAnswers));
        const missingMandatory = relevantQuestions.filter(question => question.required && !isAnswerProvided(importedAnswers[question.id]));
        const firstMissingId = missingMandatory[0]?.id;
        const derivedAnalysis = entry.analysis
          || (Object.keys(importedAnswers).length > 0 ? analyzeAnswers(importedAnswers, rules, riskLevelRules, riskWeights) : null);

        const nextIndex = firstMissingId
          ? Math.max(relevantQuestions.findIndex(question => question.id === firstMissingId), 0)
          : relevantQuestions.length > 0
            ? Math.min(entry.lastQuestionIndex ?? 0, relevantQuestions.length - 1)
            : 0;
        const hasPendingMandatory = missingMandatory.length > 0;

        setAnswers(importedAnswers);
        setAnalysis(derivedAnalysis);
        setCurrentQuestionIndex(nextIndex);
        setValidationError(null);
        setActiveProjectId(entry.id);
        setScreen('synthesis');
        setSaveFeedback({
          status: 'success',
          message: hasPendingMandatory
            ? 'Projet importé. Le rapport compliance est disponible. Complétez les questions obligatoires avant de soumettre.'
            : 'Projet importé. Le rapport compliance est disponible.'
        });
        setHasUnsavedChanges(false);
      } catch (error) {
        if (typeof console !== 'undefined' && typeof console.error === 'function') {
          console.error('[projectImport] Impossible de charger le projet :', error);
        }
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('Le fichier sélectionné est invalide. Veuillez vérifier le JSON exporté.');
        }
      }
    };

    reader.onerror = () => {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('[projectImport] Échec de la lecture du fichier :', reader.error);
      }
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('Impossible de lire le fichier sélectionné. Veuillez réessayer.');
      }
    };

    try {
      reader.readAsText(file, 'utf-8');
    } catch (error) {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('[projectImport] Erreur inattendue lors de la lecture du fichier :', error);
      }
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('Une erreur est survenue lors de l\'import du projet.');
      }
    }
  }, [
    handleSaveProject,
    setHasUnsavedChanges,
    questions,
    rules,
    riskLevelRules,
    riskWeights,
    shouldShowQuestion,
    analyzeAnswers
  ]);

  const navigateToSynthesis = useCallback(() => {
    const result = analyzeAnswers(answers, rules, riskLevelRules, riskWeights);
    setAnalysis(result);
    setValidationError(null);
    setReturnToSynthesisAfterEdit(false);
    setScreen('synthesis');
  }, [analyzeAnswers, answers, riskLevelRules, riskWeights, rules]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setValidationError(null);
      return;
    }

    navigateToSynthesis();
  }, [activeQuestions, currentQuestionIndex, navigateToSynthesis]);

  const handleBack = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
    setValidationError(null);
  }, [currentQuestionIndex]);

  const handleRestart = useCallback(() => {
    resetProjectState();
    setScreen('questionnaire');
  }, [resetProjectState]);

  const handleOpenProject = useCallback((projectId, options = {}) => {
    if (!projectId) {
      return;
    }

    const project = projects.find(item => item.id === projectId);
    if (!project) {
      return;
    }

    const projectAnswers = project.answers || {};
    const derivedQuestions = questions.filter(q => shouldShowQuestion(q, projectAnswers));
    const derivedAnalysis = Object.keys(projectAnswers).length > 0
      ? analyzeAnswers(projectAnswers, rules, riskLevelRules, riskWeights)
      : null;
    const answeredQuestionsCount = derivedQuestions.length > 0
      ? derivedQuestions.filter(question => isAnswerProvided(projectAnswers[question.id])).length
      : Object.keys(projectAnswers).length;
    const missingMandatory = derivedQuestions.filter(question => question.required && !isAnswerProvided(projectAnswers[question.id]));
    const totalQuestions = derivedQuestions.length;
    const rawIndex = typeof project.lastQuestionIndex === 'number' ? project.lastQuestionIndex : 0;
    const sanitizedIndex = totalQuestions > 0 ? Math.min(Math.max(rawIndex, 0), totalQuestions - 1) : 0;
    const firstMissingId = missingMandatory[0]?.id;
    const missingIndex = firstMissingId
      ? derivedQuestions.findIndex(question => question.id === firstMissingId)
      : -1;
    const startingIndex = missingIndex >= 0 ? missingIndex : project.status === 'draft' ? sanitizedIndex : 0;

    setAnswers(projectAnswers);
    setAnalysis(derivedAnalysis);
    setCurrentQuestionIndex(startingIndex);
    setValidationError(null);
    setActiveProjectId(project.id);

    setProjects(prevProjects => prevProjects.map(entry => {
      if (entry.id !== project.id) {
        return entry;
      }

      return {
        ...entry,
        analysis: derivedAnalysis,
        totalQuestions,
        answeredQuestions: Math.min(
          answeredQuestionsCount,
          totalQuestions || answeredQuestionsCount
        ),
        lastQuestionIndex: sanitizedIndex
      };
    }));

    const forcedView = typeof options?.view === 'string' ? options.view : null;

    let targetScreen = null;
    if (forcedView === 'synthesis' || forcedView === 'questionnaire' || forcedView === 'mandatory-summary') {
      targetScreen = forcedView;
    }

    if (!targetScreen) {
      targetScreen = project.status === 'draft' ? 'questionnaire' : 'synthesis';
    }

    setScreen(targetScreen);
    setHasUnsavedChanges(false);
  }, [
    analyzeAnswers,
    projects,
    questions,
    setHasUnsavedChanges,
    riskLevelRules,
    riskWeights,
    rules,
    shouldShowQuestion
  ]);

  const handleDeleteProject = useCallback((projectId) => {
    if (!projectId) {
      return;
    }

    setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
    setActiveProjectId(prev => (prev === projectId ? null : prev));
  }, []);

  const handleDuplicateProject = useCallback((projectId) => {
    if (!projectId) {
      return;
    }

    setProjects(prevProjects => {
      const sourceProject = prevProjects.find(project => project.id === projectId);
      if (!sourceProject) {
        return prevProjects;
      }

      const answersClone = sourceProject.answers && typeof sourceProject.answers === 'object'
        ? JSON.parse(JSON.stringify(sourceProject.answers))
        : {};

      const relevantQuestions = questions.filter(question => shouldShowQuestion(question, answersClone));
      const totalQuestions = relevantQuestions.length > 0
        ? relevantQuestions.length
        : typeof sourceProject.totalQuestions === 'number' && sourceProject.totalQuestions > 0
          ? sourceProject.totalQuestions
          : questions.length;

      const answeredQuestionsCount = relevantQuestions.length > 0
        ? relevantQuestions.filter(question => isAnswerProvided(answersClone[question.id])).length
        : typeof sourceProject.answeredQuestions === 'number'
          ? Math.min(sourceProject.answeredQuestions, totalQuestions || sourceProject.answeredQuestions)
          : Object.keys(answersClone).length;

      const computedAnalysis = Object.keys(answersClone).length > 0
        ? analyzeAnswers(answersClone, rules, riskLevelRules, riskWeights)
        : null;

      const baseName = typeof sourceProject.projectName === 'string' && sourceProject.projectName.trim().length > 0
        ? sourceProject.projectName.trim()
        : 'Projet sans nom';
      const nameWithoutCopyPrefix = baseName.replace(/^\[Copie\]\s*/i, '').trim();
      const duplicateBaseName = nameWithoutCopyPrefix.length > 0 ? nameWithoutCopyPrefix : baseName;

      const duplicateEntry = {
        id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        projectName: `[Copie] ${duplicateBaseName}`,
        answers: answersClone,
        analysis: computedAnalysis,
        status: 'draft',
        lastUpdated: new Date().toISOString(),
        lastQuestionIndex: 0,
        totalQuestions,
        answeredQuestions: Math.min(answeredQuestionsCount, totalQuestions || answeredQuestionsCount)
      };

      return [duplicateEntry, ...prevProjects];
    });
  }, [analyzeAnswers, questions, riskLevelRules, riskWeights, rules, shouldShowQuestion]);

  const openProjectShowcase = useCallback((context = {}) => {
    const {
      projectId = null,
      projectName: providedProjectName,
      status: providedStatus,
      answers: providedAnswers,
      analysis: providedAnalysis,
      relevantTeams: providedRelevantTeams,
      questions: providedQuestions,
      timelineDetails: providedTimelineDetails
    } = context || {};

    const project = projectId ? projects.find(item => item.id === projectId) : null;
    const answersSource = providedAnswers || project?.answers || {};
    const visibleQuestions = Array.isArray(providedQuestions) && providedQuestions.length > 0
      ? providedQuestions
      : questions.filter(question => shouldShowQuestion(question, answersSource));
    const computedAnalysis = providedAnalysis
      || (Object.keys(answersSource).length > 0
        ? analyzeAnswers(answersSource, rules, riskLevelRules, riskWeights)
        : null);
    const relevantTeamsList = Array.isArray(providedRelevantTeams) && providedRelevantTeams.length > 0
      ? providedRelevantTeams
      : teams.filter(team => (computedAnalysis?.teams || []).includes(team.id));
    const timelineDetailsList = Array.isArray(providedTimelineDetails)
      ? providedTimelineDetails
      : computedAnalysis?.timeline?.details || [];

    const normalizedProjectName = typeof providedProjectName === 'string' && providedProjectName.trim().length > 0
      ? providedProjectName.trim()
      : (typeof project?.projectName === 'string' && project.projectName.trim().length > 0
        ? project.projectName.trim()
        : extractProjectName(answersSource, questions));

    const resolvedProjectName = normalizedProjectName && normalizedProjectName.length > 0
      ? normalizedProjectName
      : 'Projet sans nom';
    const resolvedStatus = providedStatus || project?.status || 'draft';

    const answeredQuestionsCount = visibleQuestions.length > 0
      ? visibleQuestions.filter(question => isAnswerProvided(answersSource[question.id])).length
      : Object.keys(answersSource).length;

    const hasShowcaseIncompleteAnswers = visibleQuestions.length > 0
      ? visibleQuestions.some(question => !isAnswerProvided(answersSource[question.id]))
      : Object.keys(answersSource).length === 0;

    const totalQuestions = visibleQuestions.length > 0
      ? visibleQuestions.length
      : project?.totalQuestions || questions.length || 0;

    if (projectId) {
      setProjects(prevProjects => prevProjects.map(entry => {
        if (entry.id !== projectId) {
          return entry;
        }

        return {
          ...entry,
          analysis: computedAnalysis,
          totalQuestions,
          answeredQuestions: Math.min(
            answeredQuestionsCount,
            totalQuestions || answeredQuestionsCount
          )
        };
      }));
    }

    setShowcaseProjectContext({
      projectId: projectId || null,
      projectName: resolvedProjectName,
      status: resolvedStatus,
      answers: answersSource,
      analysis: computedAnalysis,
      relevantTeams: relevantTeamsList,
      questions: visibleQuestions.length > 0 ? visibleQuestions : questions,
      timelineDetails: timelineDetailsList,
      hasIncompleteAnswers: hasShowcaseIncompleteAnswers
    });
    previousScreenRef.current = screen;
    setScreen('showcase');
  }, [
    analyzeAnswers,
    projects,
    questions,
    riskLevelRules,
    riskWeights,
    rules,
    screen,
    shouldShowQuestion,
    teams
  ]);

  const handleShowProjectShowcase = useCallback((projectId) => {
    if (!projectId) {
      return;
    }

    openProjectShowcase({ projectId });
  }, [openProjectShowcase]);

  const handleOpenActiveProjectShowcase = useCallback((payload = {}) => {
    const projectId = payload?.projectId || activeProjectId || null;

    openProjectShowcase({
      ...payload,
      projectId
    });
  }, [activeProjectId, openProjectShowcase]);

  const handleCloseProjectShowcase = useCallback(() => {
    setShowcaseProjectContext(null);
    if (previousScreenRef.current) {
      setScreen(previousScreenRef.current);
    } else {
      setScreen('home');
    }
    previousScreenRef.current = null;
  }, []);

  const handleReturnToComplianceReport = useCallback(() => {
    if (showcaseProjectContext?.projectId) {
      const { projectId } = showcaseProjectContext;
      setShowcaseProjectContext(null);
      previousScreenRef.current = null;
      handleOpenProject(projectId, { view: 'synthesis' });
      return;
    }

    setShowcaseProjectContext(null);

    if (previousScreenRef.current) {
      setScreen(previousScreenRef.current);
    } else {
      setScreen('synthesis');
    }

    previousScreenRef.current = null;
  }, [handleOpenProject, showcaseProjectContext, setScreen]);

  const handleUpdateProjectShowcaseAnswers = useCallback((updates) => {
    if (
      !showcaseProjectContext ||
      !showcaseProjectContext.projectId ||
      (showcaseProjectContext.status !== 'draft' && !isAdminMode)
    ) {
      return;
    }

    const projectId = showcaseProjectContext.projectId;
    let contextPatch = null;
    let hasProjectChanges = false;

    setProjects(prevProjects => {
      const project = prevProjects.find(entry => entry.id === projectId);
      if (!project || (project.status !== 'draft' && !isAdminMode)) {
        return prevProjects;
      }

      const { nextAnswers, changed } = applyAnswerUpdates(
        project.answers || {},
        updates,
        questions,
        shouldShowQuestion,
        {
          shouldPreserveQuestion: (question) => !question?.showcase
        }
      );
      if (!changed) {
        return prevProjects;
      }

      hasProjectChanges = true;

      const relevantQuestions = questions.filter(question => shouldShowQuestion(question, nextAnswers));
      const totalQuestions = relevantQuestions.length > 0
        ? relevantQuestions.length
        : project.totalQuestions || questions.length || 0;
      const answeredQuestions = relevantQuestions.length > 0
        ? relevantQuestions.filter(question => isAnswerProvided(nextAnswers[question.id])).length
        : Object.keys(nextAnswers).length;

      const updatedAnalysis = analyzeAnswers(nextAnswers, rules, riskLevelRules, riskWeights);
      const timelineDetails = updatedAnalysis?.timeline?.details || [];
      const relevantTeamsIds = Array.isArray(updatedAnalysis?.teams) ? updatedAnalysis.teams : [];
      const relevantTeams = teams.filter(team => relevantTeamsIds.includes(team.id));
      const inferredName = extractProjectName(nextAnswers, questions);
      const sanitizedName = inferredName && inferredName.trim().length > 0
        ? inferredName.trim()
        : project.projectName;

      const lastQuestionIndex = totalQuestions > 0
        ? Math.min(Math.max(project.lastQuestionIndex ?? totalQuestions - 1, 0), totalQuestions - 1)
        : project.lastQuestionIndex ?? 0;

      contextPatch = {
        projectName: sanitizedName,
        answers: nextAnswers,
        analysis: updatedAnalysis,
        relevantTeams,
        timelineDetails,
        questions: relevantQuestions.length > 0 ? relevantQuestions : null
      };

      const now = new Date().toISOString();

      const updatedProject = {
        ...project,
        answers: nextAnswers,
        analysis: updatedAnalysis,
        projectName: sanitizedName,
        totalQuestions,
        answeredQuestions: Math.min(answeredQuestions, totalQuestions || answeredQuestions),
        lastQuestionIndex,
        lastUpdated: now
      };

      return [updatedProject, ...prevProjects.filter(entry => entry.id !== projectId)];
    });

    if (contextPatch) {
      setShowcaseProjectContext(prev => {
        if (!prev || prev.projectId !== projectId) {
          return prev;
        }

        return {
          ...prev,
          ...contextPatch,
          questions: contextPatch.questions ? contextPatch.questions : prev.questions
        };
      });
    }

    if (hasProjectChanges) {
      setHasUnsavedChanges(true);
    }
  }, [
    analyzeAnswers,
    extractProjectName,
    isAdminMode,
    setHasUnsavedChanges,
    questions,
    riskLevelRules,
    riskWeights,
    rules,
    showcaseProjectContext,
    shouldShowQuestion,
    teams
  ]);

  const upsertProject = useCallback((entry) => {
    return prevProjects => {
      if (!entry || !entry.id) {
        return prevProjects;
      }

      const filtered = prevProjects.filter(project => project.id !== entry.id);
      return [entry, ...filtered];
    };
  }, []);

  const handleSaveProject = useCallback((payload = {}) => {
    const baseAnswers = payload.answers && typeof payload.answers === 'object' ? payload.answers : answers;
    const sanitizedAnswers = baseAnswers || {};
    const status = payload.status === 'submitted' ? 'submitted' : 'draft';
    const projectId = activeProjectId || payload.id || `project-${Date.now()}`;
    const relevantQuestions = questions.filter(question => shouldShowQuestion(question, sanitizedAnswers));
    const computedTotalQuestions = payload.totalQuestions
      || (relevantQuestions.length > 0 ? relevantQuestions.length : activeQuestions.length);
    const totalQuestions = computedTotalQuestions > 0 ? computedTotalQuestions : activeQuestions.length;
    const answeredQuestionsCount = relevantQuestions.length > 0
      ? relevantQuestions.filter(question => {
        const value = sanitizedAnswers[question.id];
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        return value !== null && value !== undefined;
      }).length
      : Object.keys(sanitizedAnswers).length;
    const now = new Date().toISOString();

    let computedAnalysis = null;
    if (payload.analysis && typeof payload.analysis === 'object') {
      computedAnalysis = payload.analysis;
    } else if (Object.keys(sanitizedAnswers).length > 0) {
      computedAnalysis = analyzeAnswers(sanitizedAnswers, rules, riskLevelRules, riskWeights);
    }

    if (status === 'submitted' && !computedAnalysis) {
      return null;
    }

    const inferredName = extractProjectName(sanitizedAnswers, questions);
    const projectNameRaw = typeof payload.projectName === 'string' ? payload.projectName : inferredName;
    const sanitizedName =
      projectNameRaw && projectNameRaw.trim().length > 0 ? projectNameRaw.trim() : 'Projet sans nom';

    let lastQuestionIndex =
      typeof payload.lastQuestionIndex === 'number' ? payload.lastQuestionIndex : currentQuestionIndex;
    if (status === 'submitted' && totalQuestions > 0) {
      lastQuestionIndex = totalQuestions - 1;
    }

    const clampedLastIndex = totalQuestions > 0
      ? Math.min(Math.max(lastQuestionIndex, 0), totalQuestions - 1)
      : 0;

    const entry = {
      id: projectId,
      projectName: sanitizedName,
      answers: sanitizedAnswers,
      analysis: computedAnalysis,
      status,
      lastUpdated: now,
      lastQuestionIndex: clampedLastIndex,
      totalQuestions,
      answeredQuestions: Math.min(answeredQuestionsCount, totalQuestions || answeredQuestionsCount)
    };

    if (status === 'submitted') {
      entry.submittedAt = now;
    }

    setProjects(upsertProject(entry));
    setActiveProjectId(projectId);

    if (computedAnalysis) {
      setAnalysis(computedAnalysis);
    }

    setHasUnsavedChanges(false);

    return entry;
  }, [
    activeProjectId,
    activeQuestions.length,
    analyzeAnswers,
    answers,
    currentQuestionIndex,
    extractProjectName,
    questions,
    riskLevelRules,
    riskWeights,
    rules,
    setHasUnsavedChanges,
    shouldShowQuestion,
    upsertProject
  ]);

  const handleSubmitProject = useCallback((payload = {}) => {
    if (unansweredMandatoryQuestions.length > 0) {
      setSaveFeedback({
        status: 'error',
        message: 'Impossible de soumettre : complétez les questions obligatoires avant l’envoi.'
      });
      setScreen('synthesis');
      return null;
    }

    const entry = handleSaveProject({ ...payload, status: 'submitted' });
    if (entry) {
      setValidationError(null);
      setScreen('home');
    }
  }, [handleSaveProject, unansweredMandatoryQuestions]);

  const handleSaveDraft = useCallback((payload = {}) => {
    const { lastQuestionIndex: payloadLastQuestionIndex, ...otherPayload } = payload || {};

    const entry = handleSaveProject({
      ...otherPayload,
      lastQuestionIndex:
        typeof payloadLastQuestionIndex === 'number'
          ? payloadLastQuestionIndex
          : currentQuestionIndex,
      status: 'draft'
    });

    if (entry) {
      setValidationError(null);

      const exported = exportProjectToFile({
        projectName: entry.projectName,
        answers: entry.answers
      });

      setSaveFeedback(
        exported
          ? {
              status: 'success',
              message: 'Votre projet a bien été enregistré dans vos téléchargements'
            }
          : {
              status: 'error',
              message: 'Projet enregistré mais le téléchargement a échoué. Veuillez réessayer.'
            }
      );
    }
  }, [currentQuestionIndex, handleSaveProject]);

  const handleDismissSaveFeedback = useCallback(() => {
    setSaveFeedback(null);
  }, []);

  const handleBackToQuestionnaire = useCallback(() => {
    if (unansweredMandatoryQuestions.length > 0) {
      const firstMissingId = unansweredMandatoryQuestions[0].id;
      const targetIndex = activeQuestions.findIndex(question => question.id === firstMissingId);
      if (targetIndex >= 0) {
        setCurrentQuestionIndex(targetIndex);
      }
    } else if (activeQuestions.length > 0) {
      const lastIndex = activeQuestions.length - 1;
      setCurrentQuestionIndex(prevIndex => {
        if (prevIndex > lastIndex) {
          return lastIndex;
        }
        return prevIndex;
      });
    }
    setValidationError(null);
    setScreen('questionnaire');
  }, [activeQuestions, unansweredMandatoryQuestions]);

  const handleNavigateToQuestion = useCallback((questionId) => {
    const targetIndex = activeQuestions.findIndex(question => question.id === questionId);
    if (targetIndex >= 0) {
      setCurrentQuestionIndex(targetIndex);
    }
    setValidationError(null);
    setScreen('questionnaire');
  }, [activeQuestions]);

  const handleNavigateToQuestionFromReport = useCallback((questionId) => {
    setReturnToSynthesisAfterEdit(true);
    handleNavigateToQuestion(questionId);
  }, [handleNavigateToQuestion]);

  const handleReturnToSynthesisFromQuestionnaire = useCallback(() => {
    navigateToSynthesis();
  }, [navigateToSynthesis]);

  const handleProceedToSynthesis = useCallback(() => {
    navigateToSynthesis();
  }, [navigateToSynthesis]);

  return (
    <div className="min-h-screen">
      <div id="tour-onboarding-anchor" className="sr-only" aria-hidden="true">
        Guide interactif
      </div>
      <nav className="bg-white shadow-sm border-b border-gray-200 hv-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800 sm:text-xl">Project Navigator</h1>
                <p className="text-xs text-gray-500">Outil d'aide à la décision</p>
              </div>
            </div>

            <div
              className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 lg:justify-end"
              role="group"
              aria-label="Sélection du mode d'utilisation"
            >
              {mode === 'user' && screen === 'showcase' && showcaseProjectContext && (
                <button
                  type="button"
                  onClick={handleReturnToComplianceReport}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button bg-blue-600 text-white hv-button-primary"
                  aria-label="Revenir au rapport compliance du projet"
                  title="Revenir au rapport compliance du projet"
                  data-tour-id="showcase-back-to-report"
                >
                  Rapport compliance
                </button>
              )}
              {mode === 'user' && (
                <>
                  <button
                    type="button"
                    onClick={handleStartOnboarding}
                    className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button flex items-center justify-center gap-2 ${
                      isOnboardingActive
                        ? 'bg-blue-600 text-white hv-button-primary'
                        : isTourGuideReady
                          ? 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hv-focus-ring'
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                    disabled={!isTourGuideReady || isOnboardingActive}
                    data-tour-id="nav-onboarding-trigger"
                    aria-label="Lancer le guide interactif"
                  >
                    <Sparkles className="text-lg sm:text-xl" aria-hidden="true" />
                    <span>Guide interactif</span>
                  </button>
                  {screen !== 'home' && (
                    <button
                      type="button"
                      onClick={() => setScreen('home')}
                      className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button bg-gray-100 text-gray-700 hover:bg-gray-200`}
                      aria-pressed={false}
                      aria-label="Retourner à l'accueil des projets"
                    >
                      Accueil projets
                    </button>
                  )}
                  <a
                    href="https://forms.office.com/e/p6PYB1gbpM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button text-white bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 focus-visible:ring-pink-400 hv-focus-ring"
                    aria-label="Partagez votre avis sur Project Navigator (nouvelle fenêtre)"
                  >
                    <Sparkles className="text-lg sm:text-xl" aria-hidden="true" />
                    <span>Partagez votre avis</span>
                  </a>
                </>
              )}
              {mode === 'admin' && (
                <button
                  type="button"
                  onClick={handleReturnToProjectMode}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button ${
                    mode === 'user'
                      ? 'bg-blue-600 text-white hv-button-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={mode === 'user'}
                  aria-label="Basculer vers le mode chef de projet"
                >
                  Mode Chef de Projet
                </button>
              )}
              {!isAdminMode && (
                <button
                  type="button"
                  onClick={handleActivateAdminOnHome}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button flex items-center justify-center ${
                    isAdminHomeView
                      ? 'bg-blue-600 text-white hv-button-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={isAdminHomeView}
                  aria-label="Activer le mode administrateur sur la page d'accueil"
                  title="Activer le mode administrateur sur l'accueil"
                >
                  <Lock className="text-lg sm:text-xl" />
                  <span className="sr-only">Mode Administrateur (Accueil)</span>
                </button>
              )}
              {isAdminMode && (
                <button
                  type="button"
                  onClick={handleBackOfficeClick}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button flex items-center justify-center gap-3 ${
                    isAdminBackOfficeView
                      ? 'bg-blue-600 text-white hv-button-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={isAdminBackOfficeView}
                  aria-label="Accéder au back-office"
                  title="Accéder au back-office"
                >
                  <span>Accéder au back-office</span>
                  <Settings className="text-lg sm:text-xl" aria-hidden="true" />
                </button>
              )}
              {backOfficeAuthError && (
                <p className="w-full text-sm text-red-600 sm:w-auto" role="alert">
                  {backOfficeAuthError}
                </p>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" tabIndex="-1" className="focus:outline-none hv-background">
        {isAdminBackOfficeView ? (
          <BackOffice
            projects={projects}
            questions={questions}
            setQuestions={setQuestions}
            rules={rules}
            setRules={setRules}
            riskLevelRules={riskLevelRules}
            setRiskLevelRules={setRiskLevelRules}
            riskWeights={riskWeights}
            setRiskWeights={setRiskWeights}
            teams={teams}
            setTeams={setTeams}
            showcaseThemes={showcaseThemes}
            setShowcaseThemes={setShowcaseThemes}
            projectFilters={projectFilters}
            setProjectFilters={updateProjectFilters}
          />
        ) : screen === 'home' ? (
          <HomeScreen
            projects={projects}
            projectFilters={projectFilters}
            teamLeadOptions={teamLeadTeamOptions}
            onStartNewProject={handleCreateNewProject}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onShowProjectShowcase={handleShowProjectShowcase}
            onImportProject={handleImportProject}
            onDuplicateProject={handleDuplicateProject}
            isAdminMode={isAdminMode}
            tourContext={tourContext}
          />
        ) : screen === 'questionnaire' ? (
          <QuestionnaireScreen
            questions={activeQuestions}
            currentIndex={currentQuestionIndex}
            answers={answers}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onBack={handleBack}
            allQuestions={questions}
            onSaveDraft={isOnboardingActive ? noop : handleSaveDraft}
            saveFeedback={saveFeedback}
            onDismissSaveFeedback={handleDismissSaveFeedback}
            validationError={validationError}
            onReturnToSynthesis={
              returnToSynthesisAfterEdit ? handleReturnToSynthesisFromQuestionnaire : undefined
            }
            isReturnToSynthesisRequested={returnToSynthesisAfterEdit}
            tourContext={tourContext}
          />
        ) : screen === 'mandatory-summary' ? (
          <MandatoryQuestionsSummary
            pendingQuestions={pendingMandatoryQuestions}
            totalQuestions={activeQuestions.length}
            onBackToQuestionnaire={handleBackToQuestionnaire}
            onNavigateToQuestion={handleNavigateToQuestion}
            onProceedToSynthesis={handleProceedToSynthesis}
          />
        ) : screen === 'synthesis' ? (
          <SynthesisReport
            answers={answers}
            analysis={analysis}
            teams={teams}
            questions={activeQuestions}
            projectStatus={activeProject?.status || null}
            projectId={activeProjectId}
            projectName={activeProjectName}
            onOpenProjectShowcase={handleOpenActiveProjectShowcase}
            isProjectEditable={isActiveProjectEditable}
            onRestart={handleRestart}
            onBack={isActiveProjectEditable ? handleBackToQuestionnaire : undefined}
            onUpdateAnswers={isActiveProjectEditable ? handleUpdateAnswers : undefined}
            onSubmitProject={handleSubmitProject}
            onNavigateToQuestion={handleNavigateToQuestionFromReport}
            isExistingProject={Boolean(activeProjectId)}
            onSaveDraft={
              isOnboardingActive
                ? noop
                : isActiveProjectEditable
                  ? handleSaveDraft
                  : undefined
            }
            saveFeedback={saveFeedback}
            onDismissSaveFeedback={handleDismissSaveFeedback}
            isAdminMode={isAdminMode}
            hasIncompleteAnswers={hasIncompleteAnswers}
            tourContext={tourContext}
          />
        ) : screen === 'showcase' ? (
          showcaseProjectContext ? (
            <div className="space-y-4">
              {showcaseProjectContext.status !== 'draft' && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 hv-surface">
                  {isAdminMode
                    ? 'Ce projet a été soumis. Vous pouvez le modifier car vous êtes en mode administrateur.'
                    : 'Ce projet a été soumis. La vitrine est consultable en lecture seule.'}
                </div>
              )}
              <ProjectShowcase
                projectName={showcaseProjectContext.projectName}
                onClose={handleCloseProjectShowcase}
                analysis={showcaseProjectContext.analysis}
                relevantTeams={showcaseProjectContext.relevantTeams}
                questions={showcaseProjectContext.questions}
                answers={showcaseProjectContext.answers}
                timelineDetails={showcaseProjectContext.timelineDetails}
                showcaseThemes={showcaseThemes}
                hasIncompleteAnswers={Boolean(showcaseProjectContext.hasIncompleteAnswers)}
                onUpdateAnswers={
                  isOnboardingActive
                    ? noop
                    : showcaseProjectContext.status === 'draft' || isAdminMode
                      ? handleUpdateProjectShowcaseAnswers
                      : undefined
                }
                tourContext={tourContext}
              />
            </div>
          ) : null
        ) : null}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-10" aria-label="Pied de page">
        <p className="text-xs text-gray-400 text-center py-4">
          Project Navigator · Version {APP_VERSION} ·{' '}
          <a
            href="./mentions-legales.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-500"
          >
            Mentions légales
          </a>
        </p>
      </footer>
    </div>
  );
};


