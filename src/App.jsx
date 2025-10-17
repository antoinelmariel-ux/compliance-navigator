import React, { useCallback, useEffect, useMemo, useRef, useState } from './react.js';
import { QuestionnaireScreen } from './components/QuestionnaireScreen.jsx';
import { SynthesisReport } from './components/SynthesisReport.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { BackOffice } from './components/BackOffice.jsx';
import { ProjectShowcase } from './components/ProjectShowcase.jsx';
import { CheckCircle } from './components/icons.js';
import { MandatoryQuestionsSummary } from './components/MandatoryQuestionsSummary.jsx';
import { initialQuestions } from './data/questions.js';
import { initialRules } from './data/rules.js';
import { initialTeams } from './data/teams.js';
import { loadPersistedState, persistState } from './utils/storage.js';
import { shouldShowQuestion } from './utils/questions.js';
import { analyzeAnswers } from './utils/rules.js';
import { extractProjectName } from './utils/projects.js';
import { createDemoProject } from './data/demoProject.js';
import { exportProjectToFile } from './utils/projectExport.js';

const APP_VERSION = 'v1.0.18';


const isAnswerProvided = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
};

const normalizeProjectEntry = (project = {}, fallbackQuestionsLength = initialQuestions.length) => {
  const answers = typeof project.answers === 'object' && project.answers !== null ? project.answers : {};
  const computedTotalQuestions =
    typeof project.totalQuestions === 'number' && project.totalQuestions > 0
      ? project.totalQuestions
      : fallbackQuestionsLength > 0
        ? fallbackQuestionsLength
        : Object.keys(answers).length;

  const answeredQuestionsCount =
    typeof project.answeredQuestions === 'number'
      ? project.answeredQuestions
      : Object.keys(answers).length;

  let lastQuestionIndex =
    typeof project.lastQuestionIndex === 'number'
      ? project.lastQuestionIndex
      : computedTotalQuestions > 0
        ? computedTotalQuestions - 1
        : 0;

  if (computedTotalQuestions > 0) {
    lastQuestionIndex = Math.min(Math.max(lastQuestionIndex, 0), computedTotalQuestions - 1);
  }

  const lastUpdated = project.lastUpdated || project.submittedAt || null;
  const submittedAt = project.submittedAt || project.lastUpdated || null;

  return {
    status: 'submitted',
    ...project,
    status: project.status || 'submitted',
    lastUpdated,
    submittedAt,
    totalQuestions: computedTotalQuestions,
    answeredQuestions: Math.min(answeredQuestionsCount, computedTotalQuestions || answeredQuestionsCount),
    lastQuestionIndex
  };
};

const normalizeProjectsCollection = (projects, fallbackQuestionsLength = initialQuestions.length) => {
  if (!Array.isArray(projects)) {
    return null;
  }

  return projects.map(project => normalizeProjectEntry(project, fallbackQuestionsLength));
};

const applyAnswerUpdates = (prevAnswers = {}, updates, questions, predicate) => {
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

  const questionsToRemove = Array.isArray(questions)
    ? questions.filter(question => !predicate(question, nextAnswers)).map(question => question.id)
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
  const fallbackQuestionsLength = resolveFallbackQuestionsLength(savedState, fallbackQuestions.length);

  const normalizedProjects = normalizeProjectsCollection(savedState.projects, fallbackQuestionsLength)
    || normalizeProjectsCollection(savedState.submittedProjects, fallbackQuestionsLength);

  if (normalizedProjects && normalizedProjects.length > 0) {
    return normalizedProjects;
  }

  return [createDemoProject({ questions: fallbackQuestions, rules: fallbackRules })];
};

export const App = () => {
  const [mode, setMode] = useState('user');
  const [screen, setScreen] = useState('home');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [projects, setProjects] = useState(buildInitialProjectsState);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [showcaseProjectContext, setShowcaseProjectContext] = useState(null);

  const [questions, setQuestions] = useState(initialQuestions);
  const [rules, setRules] = useState(initialRules);
  const [teams, setTeams] = useState(initialTeams);
  const [isHydrated, setIsHydrated] = useState(false);
  const persistTimeoutRef = useRef(null);
  const previousScreenRef = useRef(null);

  useEffect(() => {
    const savedState = loadPersistedState();
    if (!savedState) {
      setIsHydrated(true);
      return;
    }

    const fallbackQuestions = Array.isArray(savedState.questions) ? savedState.questions : questions;
    const fallbackRules = Array.isArray(savedState.rules) ? savedState.rules : rules;
    const fallbackQuestionsLength = resolveFallbackQuestionsLength(savedState, fallbackQuestions.length);

    if (savedState.mode) setMode(savedState.mode);
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
        setProjects([createDemoProject({ questions: fallbackQuestions, rules: fallbackRules })]);
      }
    } else if (Array.isArray(savedState.submittedProjects)) {
      const normalized = normalizeProjectsCollection(savedState.submittedProjects, fallbackQuestionsLength);
      if (normalized && normalized.length > 0) {
        setProjects(normalized);
      } else {
        setProjects([createDemoProject({ questions: fallbackQuestions, rules: fallbackRules })]);
      }
    }
    if (typeof savedState.activeProjectId === 'string') setActiveProjectId(savedState.activeProjectId);
    if (Array.isArray(savedState.questions)) setQuestions(savedState.questions);
    if (Array.isArray(savedState.rules)) setRules(savedState.rules);
    if (Array.isArray(savedState.teams)) setTeams(savedState.teams);

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
      persistState({
        mode,
        screen,
        currentQuestionIndex,
        answers,
        analysis,
        questions,
        rules,
        teams,
        projects,
        activeProjectId
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
    teams,
    projects,
    activeProjectId,
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

  const handleAnswer = useCallback((questionId, answer) => {
    setAnswers(prevAnswers => {
      const nextAnswers = { ...prevAnswers, [questionId]: answer };

      const questionsToRemove = questions
        .filter(q => !shouldShowQuestion(q, nextAnswers))
        .map(q => q.id);

      if (questionsToRemove.length === 0) {
        return nextAnswers;
      }

      const sanitizedAnswers = { ...nextAnswers };
      questionsToRemove.forEach(qId => {
        delete sanitizedAnswers[qId];
      });

      return sanitizedAnswers;
    });

    setValidationError(prev => {
      if (!prev) return null;
      return prev.questionId === questionId ? null : prev;
    });
  }, [questions]);

  const handleUpdateAnswers = useCallback((updates) => {
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
      setAnalysis(analyzeAnswers(sanitizedResult, rules));
      setValidationError(null);
    }
  }, [questions, rules, shouldShowQuestion]);

  const resetProjectState = useCallback(() => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setAnalysis(null);
    setValidationError(null);
    setActiveProjectId(null);
  }, []);

  const handleCreateNewProject = useCallback(() => {
    resetProjectState();
    setScreen('questionnaire');
  }, [resetProjectState]);

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

    const result = analyzeAnswers(answers, rules);
    setAnalysis(result);
    setValidationError(null);
    setScreen('synthesis');
  }, [
    activeQuestions,
    currentQuestionIndex,
    unansweredMandatoryQuestions,
    answers,
    rules
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

  const handleOpenProject = useCallback((projectId) => {
    if (!projectId) {
      return;
    }

    const project = projects.find(item => item.id === projectId);
    if (!project) {
      return;
    }

    const projectAnswers = project.answers || {};
    const derivedQuestions = questions.filter(q => shouldShowQuestion(q, projectAnswers));
    const derivedAnalysis = project.analysis
      || (Object.keys(projectAnswers).length > 0 ? analyzeAnswers(projectAnswers, rules) : null);
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

    if (project.status === 'draft') {
      setScreen('questionnaire');
      return;
    }

    if (missingMandatory.length > 0) {
      setScreen('mandatory-summary');
    } else {
      setScreen('synthesis');
    }
  }, [projects, questions, rules]);

  const handleDeleteProject = useCallback((projectId) => {
    if (!projectId) {
      return;
    }

    setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
    setActiveProjectId(prev => (prev === projectId ? null : prev));
  }, []);

  const handleShowProjectShowcase = useCallback((projectId) => {
    if (!projectId) {
      return;
    }

    const project = projects.find(item => item.id === projectId);
    if (!project) {
      return;
    }

    const projectAnswers = project.answers || {};
    const visibleQuestions = questions.filter(question => shouldShowQuestion(question, projectAnswers));
    const projectAnalysis = project.analysis
      || (Object.keys(projectAnswers).length > 0 ? analyzeAnswers(projectAnswers, rules) : null);
    const relevantTeams = teams.filter(team => (projectAnalysis?.teams || []).includes(team.id));
    const timelineDetails = projectAnalysis?.timeline?.details || [];
    const derivedProjectName = project.projectName || extractProjectName(projectAnswers, questions);

    setShowcaseProjectContext({
      projectId: project.id,
      projectName: derivedProjectName,
      answers: projectAnswers,
      analysis: projectAnalysis,
      relevantTeams,
      questions: visibleQuestions.length > 0 ? visibleQuestions : questions,
      timelineDetails
    });
    previousScreenRef.current = screen;
    setScreen('showcase');
  }, [projects, questions, rules, teams, screen, shouldShowQuestion]);

  const handleCloseProjectShowcase = useCallback(() => {
    setShowcaseProjectContext(null);
    if (previousScreenRef.current) {
      setScreen(previousScreenRef.current);
    } else {
      setScreen('home');
    }
    previousScreenRef.current = null;
  }, []);

  const handleUpdateProjectShowcaseAnswers = useCallback((updates) => {
    if (!showcaseProjectContext || !showcaseProjectContext.projectId) {
      return;
    }

    const projectId = showcaseProjectContext.projectId;
    let contextPatch = null;

    setProjects(prevProjects => {
      const project = prevProjects.find(entry => entry.id === projectId);
      if (!project) {
        return prevProjects;
      }

      const { nextAnswers, changed } = applyAnswerUpdates(project.answers || {}, updates, questions, shouldShowQuestion);
      if (!changed) {
        return prevProjects;
      }

      const relevantQuestions = questions.filter(question => shouldShowQuestion(question, nextAnswers));
      const totalQuestions = relevantQuestions.length > 0
        ? relevantQuestions.length
        : project.totalQuestions || questions.length || 0;
      const answeredQuestions = relevantQuestions.length > 0
        ? relevantQuestions.filter(question => isAnswerProvided(nextAnswers[question.id])).length
        : Object.keys(nextAnswers).length;

      const updatedAnalysis = analyzeAnswers(nextAnswers, rules);
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
  }, [analyzeAnswers, extractProjectName, questions, rules, showcaseProjectContext, shouldShowQuestion, teams]);

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
      computedAnalysis = analyzeAnswers(sanitizedAnswers, rules);
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

    return entry;
  }, [activeProjectId, activeQuestions.length, answers, currentQuestionIndex, questions, rules, shouldShowQuestion, upsertProject]);

  const handleSubmitProject = useCallback((payload = {}) => {
    const entry = handleSaveProject({ ...payload, status: 'submitted' });
    if (entry) {
      setValidationError(null);
      setScreen('home');
    }
  }, [handleSaveProject]);

  const handleSaveDraft = useCallback((payload = {}) => {
    const {
      questions: questionsOverride,
      lastQuestionIndex: payloadLastQuestionIndex,
      ...otherPayload
    } = payload || {};

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

      const relevantTeamIds = Array.isArray(entry.analysis?.teams) ? entry.analysis.teams : [];
      const relevantTeams = teams.filter(team => relevantTeamIds.includes(team.id));
      const timelineByTeam = entry.analysis?.timeline?.byTeam || {};
      const timelineDetails = entry.analysis?.timeline?.details || [];
      const exportQuestions = Array.isArray(questionsOverride) ? questionsOverride : activeQuestions;

      const exported = exportProjectToFile({
        projectName: entry.projectName,
        answers: entry.answers,
        analysis: entry.analysis,
        relevantTeams,
        timelineByTeam,
        timelineDetails,
        questions: exportQuestions
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
  }, [activeQuestions, currentQuestionIndex, handleSaveProject, teams]);

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

    const result = analyzeAnswers(answers, rules);
    setAnalysis(result);
    setValidationError(null);
    setScreen('synthesis');
  }, [answers, rules, unansweredMandatoryQuestions]);

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b border-gray-200 hv-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800 sm:text-xl">Compliance Advisor</h1>
                <p className="text-xs text-gray-500">Outil d'aide à la décision</p>
              </div>
            </div>

            <div
              className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 lg:justify-end"
              role="group"
              aria-label="Sélection du mode d'utilisation"
            >
              {mode === 'user' && (
                <button
                  type="button"
                  onClick={() => setScreen('home')}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button ${
                    screen === 'home'
                      ? 'bg-indigo-600 text-white hv-button-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={screen === 'home'}
                  aria-label="Retourner à l'accueil des projets"
                >
                  Accueil projets
                </button>
              )}
              {mode === 'admin' && (
                <button
                  type="button"
                  onClick={() => setMode('user')}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button ${
                    mode === 'user'
                      ? 'bg-indigo-600 text-white hv-button-primary'
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
                onClick={() => setMode('admin')}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button ${
                  mode === 'admin'
                    ? 'bg-indigo-600 text-white hv-button-primary'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={mode === 'admin'}
                aria-label="Basculer vers le mode back-office"
              >
                Back-Office
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" tabIndex="-1" className="focus:outline-none hv-background">
        {mode === 'user' ? (
          screen === 'home' ? (
            <HomeScreen
              projects={projects}
              onStartNewProject={handleCreateNewProject}
              onOpenProject={handleOpenProject}
              onDeleteProject={handleDeleteProject}
              onShowProjectShowcase={handleShowProjectShowcase}
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
              onRestart={handleRestart}
              onBack={handleBackToQuestionnaire}
              onUpdateAnswers={handleUpdateAnswers}
              onSubmitProject={handleSubmitProject}
              isExistingProject={Boolean(activeProjectId)}
              onSaveDraft={handleSaveDraft}
              saveFeedback={saveFeedback}
              onDismissSaveFeedback={handleDismissSaveFeedback}
            />
          ) : screen === 'showcase' ? (
            showcaseProjectContext ? (
              <ProjectShowcase
                projectName={showcaseProjectContext.projectName}
                onClose={handleCloseProjectShowcase}
                analysis={showcaseProjectContext.analysis}
                relevantTeams={showcaseProjectContext.relevantTeams}
                questions={showcaseProjectContext.questions}
                answers={showcaseProjectContext.answers}
                timelineDetails={showcaseProjectContext.timelineDetails}
                onUpdateAnswers={handleUpdateProjectShowcaseAnswers}
              />
            ) : null
          ) : null
        ) : (
          <BackOffice
            questions={questions}
            setQuestions={setQuestions}
            rules={rules}
            setRules={setRules}
            teams={teams}
            setTeams={setTeams}
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-10" aria-label="Pied de page">
        <p className="text-xs text-gray-400 text-center py-4">
          Compliance Advisor · Version {APP_VERSION}
        </p>
      </footer>
    </div>
  );
};


