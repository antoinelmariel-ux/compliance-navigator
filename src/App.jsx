import React, { useCallback, useEffect, useMemo, useRef, useState } from './react.js';
import { QuestionnaireScreen } from './components/QuestionnaireScreen.jsx';
import { SynthesisReport } from './components/SynthesisReport.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { BackOffice } from './components/BackOffice.jsx';
import { ProjectShowcase } from './components/ProjectShowcase.jsx';
import { CheckCircle, Settings, Sparkles } from './components/icons.js';
import { MandatoryQuestionsSummary } from './components/MandatoryQuestionsSummary.jsx';
import { initialQuestions } from './data/questions.js';
import { initialRules } from './data/rules.js';
import { initialRiskLevelRules } from './data/riskLevelRules.js';
import { initialRiskWeights } from './data/riskWeights.js';
import { initialTeams } from './data/teams.js';
import { loadPersistedState, persistState } from './utils/storage.js';
import { shouldShowQuestion } from './utils/questions.js';
import { analyzeAnswers } from './utils/rules.js';
import { extractProjectName } from './utils/projects.js';
import { createDemoProject } from './data/demoProject.js';
import { exportProjectToFile } from './utils/projectExport.js';
import { normalizeRiskWeighting } from './utils/risk.js';
import { normalizeProjectEntry, normalizeProjectsCollection } from './utils/projectNormalization.js';
import { loadSubmittedProjectsFromDirectory } from './utils/externalProjectsLoader.js';
import {
  createDefaultProjectFiltersConfig,
  normalizeProjectFilterConfig
} from './utils/projectFilters.js';

const APP_VERSION = 'v1.0.134';

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

  const [questions, setQuestions] = useState(() => restoreShowcaseQuestions(initialQuestions));
  const [rules, setRules] = useState(initialRules);
  const [riskLevelRules, setRiskLevelRules] = useState(initialRiskLevelRules);
  const [riskWeights, setRiskWeights] = useState(() => normalizeRiskWeighting(initialRiskWeights));
  const [teams, setTeams] = useState(initialTeams);
  const [projectFilters, setProjectFiltersState] = useState(() => createDefaultProjectFiltersConfig());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBackOfficeUnlocked, setIsBackOfficeUnlocked] = useState(false);
  const [backOfficeAuthError, setBackOfficeAuthError] = useState(null);
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

  const updateProjectFilters = useCallback((updater) => {
    setProjectFiltersState(prevConfig => {
      const currentConfig = normalizeProjectFilterConfig(prevConfig);
      const nextConfig = typeof updater === 'function' ? updater(currentConfig) : updater;
      return normalizeProjectFilterConfig(nextConfig);
    });
  }, []);

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
    if (savedState && typeof savedState.projectFilters === 'object') {
      setProjectFiltersState(normalizeProjectFilterConfig(savedState.projectFilters));
    }

    setIsHydrated(true);
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
    if (!isHydrated) return undefined;

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
    projects,
    activeProjectId,
    projectFilters,
    isHydrated
  ]);

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

  const isActiveProjectDraft = activeProject ? activeProject.status === 'draft' : true;

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

    if (activeProjectId && isActiveProjectDraft) {
      setProjects(prevProjects => {
        const projectIndex = prevProjects.findIndex(project => project.id === activeProjectId);
        if (projectIndex === -1) {
          return prevProjects;
        }

        const project = prevProjects[projectIndex];
        if (!project || project.status !== 'draft') {
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
    isActiveProjectDraft,
    questions,
    riskLevelRules,
    riskWeights,
    rules,
    setHasUnsavedChanges,
    shouldShowQuestion
  ]);

  const handleUpdateAnswers = useCallback((updates) => {
    if (!isActiveProjectDraft) {
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
          if (!project || project.status !== 'draft') {
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
    isActiveProjectDraft,
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
  }, [setHasUnsavedChanges]);

  const handleBackOfficeClick = useCallback(async () => {
    if (mode === 'admin') {
      return;
    }

    if (isBackOfficeUnlocked) {
      setBackOfficeAuthError(null);
      setMode('admin');
      return;
    }

    if (typeof window === 'undefined' || typeof window.prompt !== 'function') {
      setBackOfficeAuthError('La saisie du mot de passe est indisponible dans cet environnement.');
      return;
    }

    const userInput = window.prompt('Veuillez saisir le mot de passe du back-office :');

    if (userInput === null) {
      setBackOfficeAuthError(null);
      return;
    }

    const isValid = await verifyBackOfficePassword(userInput);

    if (isValid) {
      setIsBackOfficeUnlocked(true);
      setBackOfficeAuthError(null);
      setMode('admin');
    } else {
      setIsBackOfficeUnlocked(false);
      setBackOfficeAuthError('Mot de passe incorrect. Veuillez réessayer.');
    }
  }, [
    isBackOfficeUnlocked,
    mode,
    setMode,
    setBackOfficeAuthError,
    setIsBackOfficeUnlocked
  ]);

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
        setScreen(hasPendingMandatory ? 'mandatory-summary' : 'synthesis');
        setSaveFeedback({
          status: 'success',
          message: hasPendingMandatory
            ? 'Projet importé. Complétez les questions obligatoires avant de consulter la synthèse.'
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

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setValidationError(null);
      return;
    }

    const firstMissingId = unansweredMandatoryQuestions[0]?.id;
    if (firstMissingId) {
      const targetIndex = activeQuestions.findIndex(question => question.id === firstMissingId);
      if (targetIndex >= 0) {
        setCurrentQuestionIndex(targetIndex);
      }
      setValidationError(null);
      setScreen('mandatory-summary');
      return;
    }

    const result = analyzeAnswers(answers, rules, riskLevelRules, riskWeights);
    setAnalysis(result);
    setValidationError(null);
    setScreen('synthesis');
  }, [
    activeQuestions,
    analyzeAnswers,
    answers,
    currentQuestionIndex,
    riskLevelRules,
    riskWeights,
    rules,
    unansweredMandatoryQuestions
  ]);

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
      if (project.status === 'draft') {
        targetScreen = 'questionnaire';
      } else if (missingMandatory.length > 0) {
        targetScreen = 'mandatory-summary';
      } else {
        targetScreen = 'synthesis';
      }
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
      timelineDetails: timelineDetailsList
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
      showcaseProjectContext.status !== 'draft'
    ) {
      return;
    }

    const projectId = showcaseProjectContext.projectId;
    let contextPatch = null;
    let hasProjectChanges = false;

    setProjects(prevProjects => {
      const project = prevProjects.find(entry => entry.id === projectId);
      if (!project || project.status !== 'draft') {
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
    const entry = handleSaveProject({ ...payload, status: 'submitted' });
    if (entry) {
      setValidationError(null);
      setScreen('home');
    }
  }, [handleSaveProject]);

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

  const handleProceedToSynthesis = useCallback(() => {
    if (unansweredMandatoryQuestions.length > 0) {
      setScreen('mandatory-summary');
      return;
    }

    const result = analyzeAnswers(answers, rules, riskLevelRules, riskWeights);
    setAnalysis(result);
    setValidationError(null);
    setScreen('synthesis');
  }, [analyzeAnswers, answers, riskLevelRules, riskWeights, rules, unansweredMandatoryQuestions]);

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b border-gray-200 hv-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800 sm:text-xl">Compliance Navigator</h1>
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
                >
                  Rapport compliance
                </button>
              )}
              {mode === 'user' && (
                <>
                  <button
                    type="button"
                    onClick={() => setScreen('home')}
                    className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button ${
                      screen === 'home'
                        ? 'bg-blue-600 text-white hv-button-primary'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-pressed={screen === 'home'}
                    aria-label="Retourner à l'accueil des projets"
                  >
                    Accueil projets
                  </button>
                  <a
                    href="https://forms.gle/EtUZAPanXWpig9A38"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button text-white bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 focus-visible:ring-pink-400 hv-focus-ring"
                    aria-label="Partagez votre avis sur Compliance Navigator (nouvelle fenêtre)"
                  >
                    <Sparkles className="text-lg sm:text-xl" aria-hidden="true" />
                    <span>Partagez votre avis</span>
                  </a>
                </>
              )}
              {mode === 'admin' && (
                <button
                  type="button"
                  onClick={() => setMode('user')}
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
              <button
                type="button"
                onClick={handleBackOfficeClick}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button flex items-center justify-center ${
                  mode === 'admin'
                    ? 'bg-blue-600 text-white hv-button-primary'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={mode === 'admin'}
                aria-label="Accéder au back-office"
                title="Accéder au back-office"
              >
                <Settings className="text-lg sm:text-xl" />
                <span className="sr-only">Back-office</span>
              </button>
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
        {mode === 'user' ? (
          screen === 'home' ? (
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
              onSaveDraft={handleSaveDraft}
              saveFeedback={saveFeedback}
              onDismissSaveFeedback={handleDismissSaveFeedback}
              validationError={validationError}
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
              isProjectEditable={isActiveProjectDraft}
              onRestart={handleRestart}
              onBack={isActiveProjectDraft ? handleBackToQuestionnaire : undefined}
              onUpdateAnswers={isActiveProjectDraft ? handleUpdateAnswers : undefined}
              onSubmitProject={handleSubmitProject}
              isExistingProject={Boolean(activeProjectId)}
              onSaveDraft={isActiveProjectDraft ? handleSaveDraft : undefined}
              saveFeedback={saveFeedback}
              onDismissSaveFeedback={handleDismissSaveFeedback}
            />
          ) : screen === 'showcase' ? (
            showcaseProjectContext ? (
              <div className="space-y-4">
                {showcaseProjectContext.status !== 'draft' && (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 hv-surface">
                    Ce projet n'est pas en mode brouillon. La vitrine est consultable en lecture seule.
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
                  onUpdateAnswers={
                    showcaseProjectContext.status === 'draft'
                      ? handleUpdateProjectShowcaseAnswers
                      : undefined
                  }
                />
              </div>
            ) : null
          ) : null
        ) : (
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
            projectFilters={projectFilters}
            setProjectFilters={updateProjectFilters}
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-10" aria-label="Pied de page">
        <p className="text-xs text-gray-400 text-center py-4">
          Compliance Navigator · Version {APP_VERSION} ·{' '}
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


