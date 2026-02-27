import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from './react.js';
import { QuestionnaireScreen } from './components/QuestionnaireScreen.jsx';
import { SynthesisReport } from './components/SynthesisReport.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { InspirationForm } from './components/InspirationForm.jsx';
import { InspirationDetail } from './components/InspirationDetail.jsx';
import { AnnotationLayer } from './components/AnnotationLayer.jsx';
import { CheckCircle, Link, Lock, MessageSquare, Settings, Sparkles } from './components/icons.js';
import { MandatoryQuestionsSummary } from './components/MandatoryQuestionsSummary.jsx';
import { initialQuestions } from './data/questions.js';
import { initialRules } from './data/rules.js';
import { initialRiskLevelRules } from './data/riskLevelRules.js';
import { initialRiskWeights } from './data/riskWeights.js';
import { initialTeams } from './data/teams.js';
import { initialShowcaseThemes } from './data/showcaseThemes.js';
import { initialOnboardingTourConfig } from './data/onboardingTour.js';
import { initialValidationCommitteeConfig } from './data/validationCommitteeConfig.js';
import { initialAdminEmails } from './data/adminEmails.js';
import { loadPersistedState } from './utils/storage.js';
import { shouldShowQuestion } from './utils/questions.js';
import { analyzeAnswers } from './utils/rules.js';
import { extractProjectName } from './utils/projects.js';
import { createDemoProject, demoProjectAnswersSnapshot } from './data/demoProject.js';
import { exportProjectToFile } from './utils/projectExport.js';
import { normalizeRiskWeighting } from './utils/risk.js';
import { normalizeProjectEntry, normalizeProjectsCollection } from './utils/projectNormalization.js';
import {
  createDefaultProjectFiltersConfig,
  normalizeProjectFilterConfig
} from './utils/projectFilters.js';
import { normalizeOnboardingConfig } from './utils/onboarding.js';
import {
  createDefaultInspirationFiltersConfig,
  createDefaultInspirationFormConfig,
  normalizeInspirationFiltersConfig,
  normalizeInspirationFormConfig
} from './utils/inspirationConfig.js';
import { exportInspirationToFile } from './utils/inspirationExport.js';
import { normalizeValidationCommitteeConfig } from './utils/validationCommittee.js';
import { isShowcaseAccessBlockedByProjectType } from './utils/showcase.js';
import currentUser from './data/graph-current-user.json';
import { dataProvider } from './utils/dataProvider.js';
import { inspirationDataProvider } from './utils/inspirationDataProvider.js';
import { createAutosaveQueue } from './utils/autosaveQueue.js';

const APP_VERSION = 'v1.0.338';

class AdminBackOfficeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error('Erreur lors du chargement du back-office :', error);
    }
  }

  handleRecovery = () => {
    this.setState({ hasError: false });
    if (typeof this.props.onRecover === 'function') {
      this.props.onRecover();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm hv-surface">
          <h2 className="text-lg font-semibold text-red-700">Impossible d’afficher le back-office.</h2>
          <p className="mt-2 text-sm text-gray-600">
            Une erreur est survenue pendant le chargement. Revenez à l’accueil puis réessayez.
          </p>
          <button
            type="button"
            onClick={this.handleRecovery}
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retour à l’accueil
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const resolveShowcaseDisplayMode = (value) => {
  if (value === 'light') {
    return 'light';
  }
  if (value === 'full') {
    return 'full';
  }
  return null;
};

const loadModule = (modulePath) => {
  if (typeof window === 'undefined') {
    throw new Error('ModuleLoader indisponible.');
  }

  if (!window.ModuleLoader || typeof window.ModuleLoader.import !== 'function') {
    throw new Error('ModuleLoader indisponible.');
  }

  return window.ModuleLoader.import(modulePath);
};

const LazyBackOffice = lazy(() =>
  Promise.resolve().then(() => ({
    default: loadModule('./src/components/BackOffice.jsx').BackOffice
  }))
);

const LazyProjectShowcase = lazy(() =>
  Promise.resolve().then(() => ({
    default: loadModule('./src/components/ProjectShowcase.jsx').ProjectShowcase
  }))
);

const LoadingFallback = ({ label, hint }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
    {hint && <p className="mt-2 text-xs text-gray-400">{hint}</p>}
  </div>
);

const ANNOTATION_COLORS = [
  '#2563eb',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#0ea5e9',
  '#14b8a6',
  '#ef4444',
  '#ea580c'
];

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

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

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

const clamp01 = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
};

const createAnnotationId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.round(Math.random() * 100000)}`;
};


const formatSyncStatusLabel = (syncStatus) => {
  const state = syncStatus?.state;
  if (state === 'syncing') return 'Synchronisation…';
  if (state === 'offline') return 'Hors ligne';
  if (state === 'conflict') return 'Conflit';
  return 'Synchronisé';
};

const formatSyncMeta = (syncStatus) => {
  if (!syncStatus?.updatedAt) return '';

  const date = new Date(syncStatus.updatedAt);
  const time = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (!time) return '';
  if (syncStatus.updatedBy) {
    return `Dernière modification par ${syncStatus.updatedBy} à ${time}`;
  }
  return `Dernière modification à ${time}`;
};

const createInspirationId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `inspiration-${Date.now()}-${Math.round(Math.random() * 100000)}`;
};

const buildAnnotationContextKey = ({ screen, projectId, scope }) => {
  const base = screen === 'showcase' ? `showcase:${projectId || 'unknown'}` : screen;

  if (screen === 'showcase' && scope) {
    return `${base}:${scope}`;
  }

  return base || 'global';
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

const computeMandatoryProgress = (questions = [], answers = {}) => {
  const mandatoryQuestions = Array.isArray(questions)
    ? questions.filter(question => question?.required)
    : [];

  const totalMandatoryQuestions = mandatoryQuestions.length;
  const answeredMandatoryQuestions = mandatoryQuestions.filter(
    question => question?.id && isAnswerProvided(answers[question.id])
  ).length;

  return {
    totalMandatoryQuestions,
    answeredMandatoryQuestions
  };
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

  const providerProjects = typeof dataProvider?.listProjectsSync === 'function'
    ? normalizeProjectsCollection(dataProvider.listProjectsSync(), initialQuestions.length)
    : [];

  if (!savedState) {
    if (Array.isArray(providerProjects) && providerProjects.length > 0) {
      return providerProjects;
    }

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

  if (Array.isArray(providerProjects) && providerProjects.length > 0) {
    return providerProjects;
  }

  return [createDemoProject({
    questions: fallbackQuestions,
    rules: fallbackRules,
    riskLevelRules: fallbackRiskLevelRules,
    riskWeights: fallbackRiskWeights
  })];
};

const buildInitialInspirationProjectsState = () => {
  const savedState = loadPersistedState();
  if (savedState && Array.isArray(savedState.inspirationProjects)) {
    return cloneDeep(savedState.inspirationProjects);
  }

  return cloneDeep(inspirationDataProvider.listInspirationsSync());
};

const buildInitialOnboardingConfig = () => {
  const savedState = loadPersistedState();
  if (savedState && savedState.onboardingTourConfig) {
    return normalizeOnboardingConfig(savedState.onboardingTourConfig);
  }

  return cloneDeep(initialOnboardingTourConfig);
};

const buildInitialValidationCommitteeConfig = () => {
  const savedState = loadPersistedState();
  if (savedState && savedState.validationCommitteeConfig) {
    return normalizeValidationCommitteeConfig(savedState.validationCommitteeConfig);
  }

  return normalizeValidationCommitteeConfig(initialValidationCommitteeConfig);
};

const buildInitialAdminEmailsState = () => {
  const savedState = loadPersistedState();
  if (savedState && Array.isArray(savedState.adminEmails)) {
    return savedState.adminEmails;
  }

  return cloneDeep(initialAdminEmails);
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
  const [inspirationProjects, setInspirationProjects] = useState(buildInitialInspirationProjectsState);
  const [onboardingTourConfig, setOnboardingTourConfig] = useState(buildInitialOnboardingConfig);
  const [activeInspirationId, setActiveInspirationId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [showcaseProjectContext, setShowcaseProjectContext] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ state: 'synced', updatedAt: null, updatedBy: '' });
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
  const [inspirationFilters, setInspirationFilters] = useState(() => createDefaultInspirationFiltersConfig());
  const [inspirationFormFields, setInspirationFormFields] = useState(() => createDefaultInspirationFormConfig());
  const [homeView, setHomeView] = useState('platform');
  const [isHydrated, setIsHydrated] = useState(false);
  const [validationCommitteeConfig, setValidationCommitteeConfig] = useState(buildInitialValidationCommitteeConfig);
  const [adminEmails, setAdminEmails] = useState(buildInitialAdminEmailsState);
  const [isBackOfficeUnlocked, setIsBackOfficeUnlocked] = useState(false);
  const [backOfficeAuthError, setBackOfficeAuthError] = useState(null);
  const [isBackOfficePromptOpen, setIsBackOfficePromptOpen] = useState(false);
  const [backOfficePromptValue, setBackOfficePromptValue] = useState('');
  const [backOfficePromptError, setBackOfficePromptError] = useState('');

  const normalizedOnboardingConfig = useMemo(
    () => normalizeOnboardingConfig(onboardingTourConfig),
    [onboardingTourConfig]
  );
  const normalizedAdminEmails = useMemo(
    () => (Array.isArray(adminEmails) ? adminEmails.map(normalizeEmail).filter(Boolean) : []),
    [adminEmails]
  );
  const currentUserEmail = useMemo(
    () => normalizeEmail(currentUser?.mail || currentUser?.userPrincipalName || ''),
    []
  );
  const currentUserDisplayName = useMemo(() => {
    const firstName = typeof currentUser?.givenName === 'string' ? currentUser.givenName.trim() : '';
    const lastName = typeof currentUser?.surname === 'string' ? currentUser.surname.trim() : '';
    const combined = `${firstName} ${lastName}`.trim();
    if (combined) {
      return combined;
    }
    const displayName = typeof currentUser?.displayName === 'string' ? currentUser.displayName.trim() : '';
    if (displayName) {
      return displayName;
    }
    return currentUserEmail;
  }, [currentUser, currentUserEmail]);
  const isCurrentUserAdmin = useMemo(
    () => !!currentUserEmail && normalizedAdminEmails.includes(currentUserEmail),
    [currentUserEmail, normalizedAdminEmails]
  );
  const backOfficePromptResolverRef = useRef(null);
  const [adminView, setAdminView] = useState('home');
  const showcaseShareInputRef = useRef(null);
  const [showcaseDisplayMode, setShowcaseDisplayMode] = useState('full');
  const [showcaseDisplayModeLock, setShowcaseDisplayModeLock] = useState(null);
  const [showcaseShareMode, setShowcaseShareMode] = useState('full');
  const [showcaseShareCommentsEnabled, setShowcaseShareCommentsEnabled] = useState(false);
  const [showcaseShareAnnotationVisibility, setShowcaseShareAnnotationVisibility] = useState('all');
  const [isShowcaseSharedView, setIsShowcaseSharedView] = useState(false);
  const [showcaseCommentsEnabled, setShowcaseCommentsEnabled] = useState(false);
  const [showcaseAnnotationVisibilityMode, setShowcaseAnnotationVisibilityMode] = useState('all');
  const previousScreenRef = useRef(null);
  const pendingShowcaseDisplayModeRef = useRef(null);
  const [isAnnotationModeEnabled, setIsAnnotationModeEnabled] = useState(false);
  const [isAnnotationPaused, setIsAnnotationPaused] = useState(false);
  const [annotationNotes, setAnnotationNotes] = useState([]);
  const [annotationSources, setAnnotationSources] = useState({ session: ANNOTATION_COLORS[0] });
  const [showcaseAnnotationScope, setShowcaseAnnotationScope] = useState('display-full');
  const [autoFocusAnnotationId, setAutoFocusAnnotationId] = useState(null);
  const [isShowcaseEditing, setIsShowcaseEditing] = useState(false);
  const [isShowcaseShareOpen, setIsShowcaseShareOpen] = useState(false);
  const [showcaseShareFeedback, setShowcaseShareFeedback] = useState('');
  const annotationNotesRef = useRef(annotationNotes);
  const annotationFileInputRef = useRef(null);
  const showcaseProjectNameRef = useRef('');
  const loadedStylesRef = useRef(new Set());
  const pendingShowcaseProjectIdRef = useRef(null);
  const pendingShowcaseSharedRef = useRef(false);
  const pendingShowcaseCommentsRef = useRef(false);
  const pendingShowcaseAnnotationVisibilityRef = useRef('all');
  const autosaveQueueRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);

  const ensureStylesheetLoaded = useCallback((href) => {
    if (typeof document === 'undefined' || !href) {
      return;
    }

    if (loadedStylesRef.current.has(href)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.dynamic = 'true';
    document.head.appendChild(link);
    loadedStylesRef.current.add(href);
  }, []);

  const isAnnotationUiInteraction = useCallback((event) => {
    const path = typeof event?.composedPath === 'function' ? event.composedPath() : [];
    if (Array.isArray(path) && path.length > 0) {
      return path.some(node => node instanceof Element && node.dataset?.annotationUi === 'true');
    }

    const target = event?.target;
    const element = target instanceof Element ? target : target?.parentElement;
    if (element?.closest) {
      return Boolean(element.closest('[data-annotation-ui="true"]'));
    }

    return false;
  }, []);

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
    if (typeof window === 'undefined') {
      return;
    }

    const { search, hash } = window.location;
    const params = new URLSearchParams(search || '');
    let projectId = params.get('projectId') || params.get('showcase');
    const rawShowcaseMode = params.get('showcaseMode');
    const resolvedShowcaseMode = resolveShowcaseDisplayMode(rawShowcaseMode);
    const rawShowcaseShared = params.get('showcaseShared');
    const rawShowcaseComments = params.get('showcaseComments');
    const rawShowcaseAnnotationVisibility = params.get('showcaseAnnotationVisibility');
    const isSharedView = rawShowcaseShared === '1' || rawShowcaseShared === 'true';
    const hasCommentsEnabled = rawShowcaseComments === '1' || rawShowcaseComments === 'true';
    const hasMineOnlyAnnotationVisibility = rawShowcaseAnnotationVisibility === 'mine';

    if (!projectId && typeof hash === 'string' && hash.length > 1) {
      const normalizedHash = hash.slice(1);
      if (normalizedHash.startsWith('showcase=')) {
        projectId = normalizedHash.replace(/^showcase=/, '');
      } else if (normalizedHash.startsWith('showcase:')) {
        projectId = normalizedHash.replace(/^showcase:/, '');
      }
    }

    if (projectId) {
      pendingShowcaseProjectIdRef.current = projectId;
    }

    if (resolvedShowcaseMode) {
      pendingShowcaseDisplayModeRef.current = resolvedShowcaseMode;
    }

    if (isSharedView) {
      pendingShowcaseSharedRef.current = true;
    }

    if (hasCommentsEnabled) {
      pendingShowcaseCommentsRef.current = true;
    }

    if (hasMineOnlyAnnotationVisibility) {
      pendingShowcaseAnnotationVisibilityRef.current = 'mine';
    }
  }, []);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    if (!showcaseProjectContext) {
      return;
    }

    ensureStylesheetLoaded('./src/styles/project-showcase.css');
    ensureStylesheetLoaded('./src/styles/project-showcase-theme-aurora.css');
    ensureStylesheetLoaded('./src/styles/project-showcase-theme-mirage.css');
    ensureStylesheetLoaded('./src/styles/project-showcase-theme-deezer.css');
    ensureStylesheetLoaded('./src/styles/project-showcase-theme-editorial.css');
    ensureStylesheetLoaded('./src/styles/project-showcase-theme-fibclot.css');
  }, [ensureStylesheetLoaded, showcaseProjectContext]);

  useEffect(() => {
    annotationNotesRef.current = annotationNotes;
  }, [annotationNotes]);

  useEffect(() => {
    if (showcaseProjectContext?.projectId) {
      showcaseProjectNameRef.current = showcaseProjectContext.projectName || '';
    }
  }, [showcaseProjectContext?.projectId, showcaseProjectContext?.projectName]);

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

  const updateInspirationFilters = useCallback((updater) => {
    setInspirationFilters(prevConfig => {
      const currentConfig = normalizeInspirationFiltersConfig(prevConfig);
      const nextConfig = typeof updater === 'function' ? updater(currentConfig) : updater;
      return normalizeInspirationFiltersConfig(nextConfig);
    });
  }, []);

  const updateInspirationFormFields = useCallback((updater) => {
    setInspirationFormFields(prevConfig => {
      const currentConfig = normalizeInspirationFormConfig(prevConfig);
      const nextConfig = typeof updater === 'function' ? updater(currentConfig) : updater;
      return normalizeInspirationFormConfig(nextConfig);
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

      const existingHasStructuredOptions = existingOptions.some((option) => {
        if (!option || typeof option !== 'object' || Array.isArray(option)) {
          return false;
        }

        const hasSubOptions = Array.isArray(option.subOptions) && option.subOptions.length > 0;
        const hasDefinedSubType = option.subType === 'choice' || option.subType === 'multi_choice';

        return hasSubOptions || hasDefinedSubType;
      });

      if (existingHasStructuredOptions) {
        return previousQuestions;
      }

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

  useEffect(() => {
    try {
      const savedState = loadPersistedState();
      if (!savedState) {
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
      if (typeof savedState.activeInspirationId === 'string') setActiveInspirationId(savedState.activeInspirationId);
      if (typeof savedState.homeView === 'string') setHomeView(savedState.homeView);
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
      if (Array.isArray(savedState.inspirationProjects)) {
        setInspirationProjects(cloneDeep(savedState.inspirationProjects));
      }
      if (savedState && typeof savedState.inspirationFilters === 'object') {
        setInspirationFilters(normalizeInspirationFiltersConfig(savedState.inspirationFilters));
      }
      if (savedState && typeof savedState.inspirationFormFields === 'object') {
        setInspirationFormFields(normalizeInspirationFormConfig(savedState.inspirationFormFields));
      }
      if (savedState && savedState.onboardingTourConfig) {
        setOnboardingTourConfig(normalizeOnboardingConfig(savedState.onboardingTourConfig));
      }
    } catch (error) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('[Hydration] Échec du chargement de l’état local :', error);
      }
    } finally {
      setIsHydrated(true);
    }
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

  const buildOnboardingAnnotationNotes = useCallback((projectContext) => {
    if (!projectContext) {
      return [];
    }

    const projectId = projectContext.projectId || 'unknown';
    const contextId = buildAnnotationContextKey({
      screen: 'showcase',
      projectId,
      scope: showcaseAnnotationScope
    });
    const sourceId = 'onboarding-demo';
    const color = registerAnnotationSource(sourceId, ANNOTATION_COLORS[3]);

    return [
      {
        id: createAnnotationId(),
        x: 0.22,
        y: 0.25,
        sectionId: 'hero',
        sectionX: 0.25,
        sectionY: 0.2,
        text: '💡 À montrer en mode Light pour aller droit au message.',
        status: 'open',
        replies: [],
        attachments: [],
        color,
        contextId,
        projectId,
        projectName: projectContext.projectName || '',
        sourceId
      },
      {
        id: createAnnotationId(),
        x: 0.68,
        y: 0.42,
        sectionId: 'solution',
        sectionX: 0.65,
        sectionY: 0.4,
        text: 'Ajouter une capture ici pour illustrer la solution.',
        status: 'open',
        replies: [],
        attachments: [],
        color,
        contextId,
        projectId,
        projectName: projectContext.projectName || '',
        sourceId
      },
      {
        id: createAnnotationId(),
        x: 0.3,
        y: 0.75,
        sectionId: 'timeline',
        sectionX: 0.35,
        sectionY: 0.2,
        text: 'Timeline OK, prévoir une date de revue en plus.',
        status: 'open',
        replies: [],
        attachments: [],
        color,
        contextId,
        projectId,
        projectName: projectContext.projectName || '',
        sourceId
      }
    ];
  }, [registerAnnotationSource, showcaseAnnotationScope]);

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
      const {
        totalMandatoryQuestions: totalQuestions,
        answeredMandatoryQuestions: answeredQuestions
      } = computeMandatoryProgress(visibleQuestions, answers);
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
  }, [analyzeAnswers, currentUserEmail, questions, riskLevelRules, riskWeights, rules, shouldShowQuestion]);

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
      setAnnotationNotes([]);
      setAnnotationSources({ session: ANNOTATION_COLORS[0] });
      setIsAnnotationModeEnabled(false);
      setIsAnnotationPaused(false);
      setShowcaseAnnotationScope('display-full');
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
    setAnnotationNotes(Array.isArray(snapshot.annotationNotes) ? snapshot.annotationNotes : []);
    setAnnotationSources(snapshot.annotationSources || { session: ANNOTATION_COLORS[0] });
    setIsAnnotationModeEnabled(Boolean(snapshot.isAnnotationModeEnabled));
    setIsAnnotationPaused(Boolean(snapshot.isAnnotationPaused));
    setShowcaseAnnotationScope(snapshot.showcaseAnnotationScope || 'display-full');
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
    setValidationError,
    setAnnotationNotes,
    setAnnotationSources,
    setIsAnnotationModeEnabled,
    setIsAnnotationPaused,
    setShowcaseAnnotationScope
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

    const shouldOpenShareModal = stepId === 'showcase-display-modes';

    if (!shouldOpenShareModal && isShowcaseShareOpen) {
      setIsShowcaseShareOpen(false);
      setShowcaseShareFeedback('');
    }

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
      case 'showcase-custom-sections':
      case 'showcase-save-edits':
      case 'showcase-back-to-report': {
        openDemoShowcase();
        break;
      }
      case 'showcase-display-modes': {
        openDemoShowcase();
        setShowcaseShareMode(showcaseDisplayMode === 'light' ? 'light' : 'full');
        setShowcaseShareCommentsEnabled(false);
        setShowcaseShareAnnotationVisibility('all');
        setIsShowcaseShareOpen(true);
        setShowcaseShareFeedback('');
        setIsAnnotationModeEnabled(false);
        setIsAnnotationPaused(false);
        break;
      }
      case 'showcase-comments': {
        openDemoShowcase();
        setIsShowcaseShareOpen(false);
        setShowcaseShareFeedback('');
        setIsAnnotationModeEnabled(true);
        setIsAnnotationPaused(false);
        setAnnotationNotes(buildOnboardingAnnotationNotes({
          projectId: 'unknown',
          projectName: demoData.projectName
        }));
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
    setAnnotationNotes,
    setIsAnnotationModeEnabled,
    setIsAnnotationPaused,
    setCurrentQuestionIndex,
    setHasUnsavedChanges,
    setIsShowcaseShareOpen,
    setSaveFeedback,
    setScreen,
    setShowcaseShareCommentsEnabled,
    setShowcaseShareFeedback,
    setShowcaseShareMode,
    setShowcaseProjectContext,
    setValidationError,
    buildOnboardingAnnotationNotes,
    showcaseDisplayMode,
    isShowcaseShareOpen
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
      isBackOfficeUnlocked,
      annotationNotes: cloneDeep(annotationNotes),
      annotationSources: cloneDeep(annotationSources),
      isAnnotationModeEnabled,
      isAnnotationPaused,
      showcaseAnnotationScope
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
    setAnnotationNotes([]);
    setAnnotationSources({ session: ANNOTATION_COLORS[0] });
    setIsAnnotationModeEnabled(false);
    setIsAnnotationPaused(false);
    setShowcaseAnnotationScope('display-full');
    setProjects(onboardingProjects);
    setProjectFiltersState(createDefaultProjectFiltersConfig());

    const {
      steps,
      labels,
      allowClose,
      showStepDots
    } = normalizedOnboardingConfig;

    if (!Array.isArray(steps) || steps.length === 0) {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('Le tour d’onboarding est vide. Veuillez vérifier la configuration.');
      }
      return;
    }

    const tour = new window.TourGuideClient({
      steps,
      labels,
      allowClose,
      showStepDots
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
    annotationNotes,
    annotationSources,
    isAnnotationModeEnabled,
    isAnnotationPaused,
    showcaseAnnotationScope,
    getDemoData,
    buildOnboardingProjects,
    normalizedOnboardingConfig,
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
    setAnnotationNotes,
    setAnnotationSources,
    setIsAnnotationModeEnabled,
    setIsAnnotationPaused,
    setShowcaseAnnotationScope,
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
    autosaveQueueRef.current = createAutosaveQueue({
      processItem: async (item) => {
        const expectedRowVersion = item?.expectedRowVersion;
        return dataProvider.upsertProject(item.project, {
          expectedRowVersion,
          userEmail: currentUserEmail
        });
      },
      onStatusChange: (state, details = {}) => {
        setSyncStatus({
          state,
          updatedAt: details.updatedAt || null,
          updatedBy: details.updatedBy || ''
        });

        if (state === 'synced' && details.projectId && details.updatedAt) {
          setProjects((prevProjects) => prevProjects.map((project) => {
            if (project.id !== details.projectId) {
              return project;
            }
            return {
              ...project,
              rowVersion: project.rowVersion ? project.rowVersion + 1 : 1,
              lastUpdated: details.updatedAt
            };
          }));
        }
      }
    });

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [currentUserEmail]);



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
    () => unansweredMandatoryQuestions.length > 0,
    [unansweredMandatoryQuestions]
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
    if (screen !== 'questionnaire' && screen !== 'synthesis') {
      setSaveFeedback(null);
    }
  }, [screen]);

  const activeProject = useMemo(
    () => projects.find(project => project.id === activeProjectId) || null,
    [projects, activeProjectId]
  );
  const activeInspirationProject = useMemo(
    () => inspirationProjects.find(project => project.id === activeInspirationId) || null,
    [inspirationProjects, activeInspirationId]
  );

  const activeProjectName = useMemo(() => {
    if (typeof activeProject?.projectName === 'string' && activeProject.projectName.trim().length > 0) {
      return activeProject.projectName.trim();
    }

    return extractProjectName(answers, questions);
  }, [activeProject, answers, questions]);

  useEffect(() => {
    if (!isHydrated || isOnboardingActive || !autosaveQueueRef.current) {
      return undefined;
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    const projectToSync = activeProject || projects[0];
    if (!projectToSync) {
      return undefined;
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      const expectedRowVersion = typeof projectToSync.rowVersion === 'number'
        ? projectToSync.rowVersion
        : undefined;

      autosaveQueueRef.current.enqueue({
        project: projectToSync,
        expectedRowVersion
      });
    }, 700);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
    };
  }, [
    activeProject,
    projects,
    isHydrated,
    isOnboardingActive,
    answers,
    analysis,
    currentQuestionIndex,
    inspirationProjects,
    adminView,
    screen,
    mode
  ]);

  const activeShowcaseProjectId = showcaseProjectContext?.projectId || null;
  const activeShowcaseProject = useMemo(
    () => projects.find(project => project?.id === activeShowcaseProjectId) || null,
    [activeShowcaseProjectId, projects]
  );
  const canManageProject = useCallback((project) => {
    if (!project) {
      return false;
    }

    if (isAdminMode) {
      return true;
    }

    if (!currentUserEmail) {
      return false;
    }

    const ownerEmail = normalizeEmail(project.ownerEmail || '');
    const sharedWith = Array.isArray(project.sharedWith) ? project.sharedWith : [];
    const isCoOwner = sharedWith.some(entry => normalizeEmail(entry) === currentUserEmail);

    return ownerEmail === currentUserEmail || isCoOwner;
  }, [currentUserEmail, isAdminMode]);
  const canCloseAnnotationNotes = useMemo(
    () => canManageProject(activeShowcaseProject),
    [activeShowcaseProject, canManageProject]
  );

  const activeAnnotationContextKey = useMemo(
    () => buildAnnotationContextKey({
      screen,
      projectId: activeShowcaseProjectId,
      scope: showcaseAnnotationScope
    }),
    [activeShowcaseProjectId, screen, showcaseAnnotationScope]
  );

  useEffect(() => {
    if (!isOnboardingActive || onboardingStepId !== 'showcase-comments') {
      return;
    }

    if (screen !== 'showcase') {
      return;
    }

    const hasOnboardingNotes = annotationNotes.some(note => note?.sourceId === 'onboarding-demo');
    if (hasOnboardingNotes) {
      return;
    }

    const demoData = getDemoData();
    setIsAnnotationModeEnabled(true);
    setIsAnnotationPaused(false);
    setAnnotationNotes(buildOnboardingAnnotationNotes({
      projectId: showcaseProjectContext?.projectId || 'unknown',
      projectName: demoData.projectName
    }));
  }, [
    annotationNotes,
    buildOnboardingAnnotationNotes,
    getDemoData,
    isOnboardingActive,
    onboardingStepId,
    screen,
    setAnnotationNotes,
    setIsAnnotationModeEnabled,
    setIsAnnotationPaused,
    showcaseProjectContext
  ]);

  const registerAnnotationSource = useCallback((sourceId, preferredColor) => {
    if (!sourceId) {
      return ANNOTATION_COLORS[0];
    }

    let resolvedColor = ANNOTATION_COLORS[0];

    setAnnotationSources(prevSources => {
      if (prevSources[sourceId]) {
        resolvedColor = prevSources[sourceId];
        return prevSources;
      }

      const usedColors = new Set(Object.values(prevSources));

      if (preferredColor && !usedColors.has(preferredColor)) {
        resolvedColor = preferredColor;
      } else {
        const availableColor = ANNOTATION_COLORS.find(color => !usedColors.has(color));
        resolvedColor = availableColor || ANNOTATION_COLORS[0];
      }

      return { ...prevSources, [sourceId]: resolvedColor };
    });

    return resolvedColor;
  }, []);

  const resolveAnnotationTarget = useCallback((clientX, clientY, targetElement = null) => {
    if (typeof document === 'undefined') {
      return { sectionId: null, sectionX: null, sectionY: null };
    }

    const activeTarget = targetElement instanceof Element
      ? targetElement
      : document.elementFromPoint(clientX, clientY);

    const sectionElement = activeTarget?.closest('[data-showcase-section]');

    if (!sectionElement) {
      return { sectionId: null, sectionX: null, sectionY: null };
    }

    const rect = sectionElement.getBoundingClientRect();
    const sectionWidth = rect?.width || 1;
    const sectionHeight = rect?.height || 1;

    return {
      sectionId: sectionElement.getAttribute('data-showcase-section') || null,
      sectionX: clamp01((clientX - rect.left) / sectionWidth),
      sectionY: clamp01((clientY - rect.top) / sectionHeight)
    };
  }, []);

  const handleAddAnnotationNote = useCallback((clientX, clientY, targetElement = null) => {
    if (screen !== 'showcase' || !showcaseProjectContext || isAnnotationPaused) {
      return;
    }

    const width = typeof window !== 'undefined' ? window.innerWidth || 1 : 1;
    const height = typeof window !== 'undefined' ? window.innerHeight || 1 : 1;
    const x = clamp01(clientX / width);
    const y = clamp01(clientY / height);
    const sourceId = currentUserDisplayName || 'session';
    const color = registerAnnotationSource(sourceId);
    const { sectionId, sectionX, sectionY } = resolveAnnotationTarget(clientX, clientY, targetElement);

    const newNoteId = createAnnotationId();

    setAnnotationNotes(prevNotes => [
      ...prevNotes,
      {
        id: newNoteId,
        x,
        y,
        sectionId,
        sectionX: sectionX ?? x,
        sectionY: sectionY ?? y,
        text: '',
        status: 'open',
        replies: [],
        attachments: [],
        color,
        contextId: activeAnnotationContextKey,
        projectId: showcaseProjectContext.projectId || 'unknown',
        projectName: showcaseProjectContext.projectName || '',
        sourceId
      }
    ]);
    setAutoFocusAnnotationId(newNoteId);
  }, [
    activeAnnotationContextKey,
    currentUserDisplayName,
    isAnnotationPaused,
    registerAnnotationSource,
    resolveAnnotationTarget,
    screen,
    showcaseProjectContext
  ]);

  const handleAnnotationTextChange = useCallback((noteId, text) => {
    setAnnotationNotes(prevNotes => prevNotes.map(note => (
      note?.id === noteId
        ? (note.status === 'closed' ? note : { ...note, text })
        : note
    )));
  }, []);

  const handleCloseAnnotationNote = useCallback((noteId) => {
    setAnnotationNotes(prevNotes => prevNotes.map(note => {
      if (!note || note.id !== noteId) {
        return note;
      }

      if (note.status === 'closed') {
        return note;
      }

      return {
        ...note,
        status: 'closed',
        closedAt: new Date().toISOString(),
        closedBy: currentUserDisplayName || 'Utilisateur'
      };
    }));
  }, [currentUserDisplayName]);

  const handleAddAnnotationReply = useCallback((noteId, replyText) => {
    if (!replyText) {
      return;
    }

    const trimmed = replyText.trim();
    if (!trimmed) {
      return;
    }

    const reply = {
      id: createAnnotationId(),
      text: trimmed,
      author: currentUserDisplayName || 'Utilisateur',
      createdAt: new Date().toISOString(),
      attachments: []
    };

    setAnnotationNotes(prevNotes => prevNotes.map(note => {
      if (!note || note.id !== noteId) {
        return note;
      }

      if (note.status === 'closed') {
        return note;
      }

      const existingReplies = Array.isArray(note.replies) ? note.replies : [];
      return {
        ...note,
        replies: [...existingReplies, reply]
      };
    }));
  }, [currentUserDisplayName]);

  const createLinkAttachment = useCallback((url) => ({
    id: createAnnotationId(),
    type: 'link',
    name: url,
    url,
    createdAt: new Date().toISOString()
  }), []);

  const handleAddAnnotationNoteLink = useCallback((noteId, url) => {
    if (typeof url !== 'string' || !url.trim()) {
      return;
    }

    const attachment = createLinkAttachment(url.trim());
    setAnnotationNotes(prevNotes => prevNotes.map(note => {
      if (!note || note.id !== noteId || note.status === 'closed') {
        return note;
      }

      const attachments = Array.isArray(note.attachments) ? note.attachments : [];
      return {
        ...note,
        attachments: [...attachments, attachment]
      };
    }));
  }, [createLinkAttachment]);

  const handleAddAnnotationReplyLink = useCallback((noteId, url) => {
    if (typeof url !== 'string' || !url.trim()) {
      return;
    }

    const attachment = createLinkAttachment(url.trim());
    setAnnotationNotes(prevNotes => prevNotes.map(note => {
      if (!note || note.id !== noteId || note.status === 'closed') {
        return note;
      }

      const replies = Array.isArray(note.replies) ? note.replies : [];
      if (replies.length === 0) {
        return note;
      }

      const lastReplyIndex = replies.length - 1;
      const updatedReplies = replies.map((reply, index) => {
        if (index !== lastReplyIndex) {
          return reply;
        }

        const replyAttachments = Array.isArray(reply?.attachments) ? reply.attachments : [];
        return {
          ...reply,
          attachments: [...replyAttachments, attachment]
        };
      });

      return {
        ...note,
        replies: updatedReplies
      };
    }));
  }, [createLinkAttachment]);

  const readFileAsDataUrl = useCallback((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  }), []);

  const createFileAttachment = useCallback(async (file) => {
    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl) {
      return null;
    }

    return {
      id: createAnnotationId(),
      type: 'file',
      name: file.name || 'document',
      url: dataUrl,
      createdAt: new Date().toISOString()
    };
  }, [readFileAsDataUrl]);

  const handleAddAnnotationNoteDocument = useCallback(async (noteId, file) => {
    if (!file) {
      return;
    }

    const attachment = await createFileAttachment(file);
    if (!attachment) {
      return;
    }

    setAnnotationNotes(prevNotes => prevNotes.map(note => {
      if (!note || note.id !== noteId || note.status === 'closed') {
        return note;
      }

      const attachments = Array.isArray(note.attachments) ? note.attachments : [];
      return {
        ...note,
        attachments: [...attachments, attachment]
      };
    }));
  }, [createFileAttachment]);

  const handleAddAnnotationReplyDocument = useCallback(async (noteId, file) => {
    if (!file) {
      return;
    }

    const attachment = await createFileAttachment(file);
    if (!attachment) {
      return;
    }

    setAnnotationNotes(prevNotes => prevNotes.map(note => {
      if (!note || note.id !== noteId || note.status === 'closed') {
        return note;
      }

      const replies = Array.isArray(note.replies) ? note.replies : [];
      if (replies.length === 0) {
        return note;
      }

      const lastReplyIndex = replies.length - 1;
      const updatedReplies = replies.map((reply, index) => {
        if (index !== lastReplyIndex) {
          return reply;
        }

        const replyAttachments = Array.isArray(reply?.attachments) ? reply.attachments : [];
        return {
          ...reply,
          attachments: [...replyAttachments, attachment]
        };
      });

      return {
        ...note,
        replies: updatedReplies
      };
    }));
  }, [createFileAttachment]);

  const handleToggleAnnotationMode = useCallback(() => {
    setIsAnnotationModeEnabled(prev => {
      const next = !prev;

      if (!next) {
        setIsAnnotationPaused(false);
      }

      return next;
    });
  }, []);

  const handleToggleAnnotationPause = useCallback(() => {
    setIsAnnotationPaused(prev => !prev);
  }, []);

  const downloadAnnotationFile = useCallback((notesToSave, projectName) => {
    if (!Array.isArray(notesToSave) || notesToSave.length === 0 || typeof window === 'undefined') {
      return;
    }

    const safeName = typeof projectName === 'string' && projectName.trim().length > 0
      ? projectName.trim()
      : 'projet';

    const payload = JSON.stringify(notesToSave, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Commentaire sur le projet ${safeName}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleSaveAnnotationNotes = useCallback(() => {
    if (!showcaseProjectContext) {
      return;
    }

    const projectNotes = annotationNotes.filter(note => note?.projectId === showcaseProjectContext.projectId);

    if (projectNotes.length === 0) {
      return;
    }

    downloadAnnotationFile(projectNotes, showcaseProjectContext.projectName);
  }, [annotationNotes, downloadAnnotationFile, showcaseProjectContext]);

  const handleRequestAnnotationFile = useCallback(() => {
    if (annotationFileInputRef.current) {
      annotationFileInputRef.current.value = '';
      annotationFileInputRef.current.click();
    }
  }, []);

  const handleAnnotationFileChange = useCallback((event) => {
    const [file] = event?.target?.files || [];
    const fileInput = event?.target;

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result || '[]');
        const rawNotes = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.notes)
            ? parsed.notes
            : [];

        if (!Array.isArray(rawNotes) || rawNotes.length === 0) {
          return;
        }

        const sourceId = file.name || `import-${Date.now()}`;
        const sourceColor = registerAnnotationSource(sourceId);

        const importedNotes = rawNotes.map(rawNote => {
          const normalizedX = clamp01(rawNote?.x ?? 0);
          const normalizedY = clamp01(rawNote?.y ?? 0);
          const normalizedReplies = Array.isArray(rawNote?.replies)
            ? rawNote.replies
                .filter(reply => reply && typeof reply.text === 'string' && reply.text.trim().length > 0)
                .map(reply => ({
                  id: reply.id || createAnnotationId(),
                  text: reply.text.trim(),
                  author: typeof reply.author === 'string' ? reply.author : '',
                  createdAt: reply.createdAt || null,
                  attachments: Array.isArray(reply.attachments)
                    ? reply.attachments
                        .filter(attachment => attachment && typeof attachment.url === 'string' && attachment.url.trim().length > 0)
                        .map(attachment => ({
                          id: attachment.id || createAnnotationId(),
                          type: attachment.type === 'file' ? 'file' : 'link',
                          name: typeof attachment.name === 'string' ? attachment.name : (attachment.url || ''),
                          url: attachment.url.trim(),
                          createdAt: attachment.createdAt || null
                        }))
                    : []
                }))
            : [];

          return {
            id: rawNote?.id || createAnnotationId(),
            x: normalizedX,
            y: normalizedY,
            sectionId: typeof rawNote?.sectionId === 'string' ? rawNote.sectionId : null,
            sectionX: clamp01(rawNote?.sectionX ?? normalizedX),
            sectionY: clamp01(rawNote?.sectionY ?? normalizedY),
            text: typeof rawNote?.text === 'string' ? rawNote.text : '',
            status: rawNote?.status === 'closed' ? 'closed' : 'open',
            closedAt: rawNote?.closedAt || null,
            closedBy: typeof rawNote?.closedBy === 'string' ? rawNote.closedBy : null,
            replies: normalizedReplies,
            attachments: Array.isArray(rawNote?.attachments)
              ? rawNote.attachments
                  .filter(attachment => attachment && typeof attachment.url === 'string' && attachment.url.trim().length > 0)
                  .map(attachment => ({
                    id: attachment.id || createAnnotationId(),
                    type: attachment.type === 'file' ? 'file' : 'link',
                    name: typeof attachment.name === 'string' ? attachment.name : (attachment.url || ''),
                    url: attachment.url.trim(),
                    createdAt: attachment.createdAt || null
                  }))
              : [],
            color: sourceColor,
            contextId: rawNote?.contextId || activeAnnotationContextKey,
            projectId: rawNote?.projectId || showcaseProjectContext?.projectId || 'unknown',
            projectName: rawNote?.projectName || showcaseProjectContext?.projectName || '',
            sourceId
          };
        });

        setAnnotationNotes(prevNotes => [...prevNotes, ...importedNotes]);
      } catch (error) {
        // Malformed file, ignore silently
      } finally {
        if (fileInput) {
          fileInput.value = '';
        }
      }
    };

    reader.readAsText(file);
  }, [activeAnnotationContextKey, registerAnnotationSource, showcaseProjectContext]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (!isAnnotationModeEnabled || isAnnotationPaused || screen !== 'showcase') {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      const target = event?.target;

      if (isAnnotationUiInteraction(event)) {
        return;
      }

      handleAddAnnotationNote(event.clientX, event.clientY, target);
    };

    window.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('click', handleDocumentClick, true);
    };
  }, [handleAddAnnotationNote, isAnnotationModeEnabled, isAnnotationPaused, isAnnotationUiInteraction, screen]);

  useEffect(() => {
    if (!showcaseProjectContext?.projectId) {
      return undefined;
    }

    const projectId = showcaseProjectContext.projectId;

    return () => {
      const projectNotes = (annotationNotesRef.current || []).filter(note => note?.projectId === projectId);

      if (projectNotes.length > 0) {
        downloadAnnotationFile(projectNotes, showcaseProjectNameRef.current);
      }
    };
  }, [downloadAnnotationFile, showcaseProjectContext?.projectId]);

  const isAdminMode = mode === 'admin';
  const isAdminHomeView = isAdminMode && adminView === 'home';
  const isAdminBackOfficeView = isAdminMode && adminView === 'back-office';
  const isActiveProjectEditable = !activeProject
    || (canManageProject(activeProject) && activeProject.status === 'draft')
    || isAdminMode;
  const annotationOffsetClass = isAnnotationModeEnabled && screen === 'showcase'
    ? 'pt-20 lg:pt-24'
    : '';

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
    const {
      totalMandatoryQuestions: totalMandatoryQuestionsCount,
      answeredMandatoryQuestions: answeredQuestionsCount
    } = computeMandatoryProgress(relevantQuestions, nextAnswersSnapshot);
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

        const totalQuestions = totalMandatoryQuestionsCount;
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
          const {
            totalMandatoryQuestions: totalQuestions,
            answeredMandatoryQuestions: answeredQuestionsCount
          } = computeMandatoryProgress(relevantQuestions, sanitizedResult);
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

  const handleUpdateComplianceComments = useCallback((updates) => {
    if (!activeProjectId || !updates || typeof updates !== 'object') {
      return;
    }

    let sanitizedResult = null;

    setAnswers(prevAnswers => {
      const nextAnswers = { ...prevAnswers };
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          delete nextAnswers[key];
        } else {
          nextAnswers[key] = value;
        }
      });
      sanitizedResult = nextAnswers;
      return nextAnswers;
    });

    if (sanitizedResult) {
      setHasUnsavedChanges(true);
      setProjects(prevProjects => {
        const projectIndex = prevProjects.findIndex(project => project.id === activeProjectId);
        if (projectIndex === -1) {
          return prevProjects;
        }

        const project = prevProjects[projectIndex];
        if (!project) {
          return prevProjects;
        }

        const updatedProject = {
          ...project,
          answers: sanitizedResult,
          lastUpdated: new Date().toISOString()
        };

        const nextProjects = prevProjects.slice();
        nextProjects[projectIndex] = updatedProject;
        return nextProjects;
      });
    }
  }, [activeProjectId, setHasUnsavedChanges]);

  const handleAddSharedMember = useCallback((email) => {
    if (!activeProjectId) {
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return;
    }

    setProjects(prevProjects => prevProjects.map(project => {
      if (project.id !== activeProjectId) {
        return project;
      }

      const existingShared = Array.isArray(project.sharedWith) ? project.sharedWith : [];
      const alreadyShared = existingShared.some(entry => normalizeEmail(entry) === normalizedEmail);
      if (alreadyShared) {
        return project;
      }

      return {
        ...project,
        ownerEmail: project.ownerEmail || currentUserEmail || '',
        sharedWith: [...existingShared, normalizedEmail],
        lastUpdated: new Date().toISOString()
      };
    }));
  }, [activeProjectId, currentUserEmail]);

  const handleRemoveSharedMember = useCallback((email) => {
    if (!activeProjectId) {
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return;
    }

    setProjects(prevProjects => prevProjects.map(project => {
      if (project.id !== activeProjectId) {
        return project;
      }

      const existingShared = Array.isArray(project.sharedWith) ? project.sharedWith : [];
      const nextShared = existingShared.filter(entry => normalizeEmail(entry) !== normalizedEmail);
      if (nextShared.length === existingShared.length) {
        return project;
      }

      return {
        ...project,
        sharedWith: nextShared,
        lastUpdated: new Date().toISOString()
      };
    }));
  }, [activeProjectId]);

  const buildDefaultAnswers = useCallback(() => {
    if (currentUserDisplayName) {
      return { teamLead: currentUserDisplayName };
    }
    return {};
  }, [currentUserDisplayName]);

  const resetProjectState = useCallback(() => {
    setAnswers(buildDefaultAnswers());
    setCurrentQuestionIndex(0);
    setAnalysis(null);
    setValidationError(null);
    setActiveProjectId(null);
    setHasUnsavedChanges(false);
    setReturnToSynthesisAfterEdit(false);
  }, [buildDefaultAnswers, setHasUnsavedChanges]);

  const openBackOfficePrompt = useCallback(() => new Promise((resolve) => {
    backOfficePromptResolverRef.current = resolve;
    setBackOfficePromptValue('');
    setBackOfficePromptError('');
    setIsBackOfficePromptOpen(true);
  }), []);

  const closeBackOfficePrompt = useCallback((result = false) => {
    setIsBackOfficePromptOpen(false);
    setBackOfficePromptValue('');
    setBackOfficePromptError('');
    const resolver = backOfficePromptResolverRef.current;
    backOfficePromptResolverRef.current = null;
    if (typeof resolver === 'function') {
      resolver(result);
    }
  }, []);

  const handleBackOfficePromptSubmit = useCallback(async (event) => {
    event.preventDefault();
    const trimmed = backOfficePromptValue.trim();
    if (!trimmed) {
      setBackOfficePromptError('Veuillez saisir un mot de passe.');
      return;
    }

    const isValid = await verifyBackOfficePassword(trimmed);

    if (isValid) {
      setIsBackOfficeUnlocked(true);
      setBackOfficeAuthError(null);
      closeBackOfficePrompt(true);
      return;
    }

    setIsBackOfficeUnlocked(false);
    setBackOfficeAuthError('Mot de passe incorrect. Veuillez réessayer.');
    setBackOfficePromptError('Mot de passe incorrect. Veuillez réessayer.');
  }, [backOfficePromptValue, closeBackOfficePrompt]);

  const requestAdminAccess = useCallback(async () => {
    if (isAdminMode) {
      setIsBackOfficeUnlocked(true);
      setBackOfficeAuthError(null);
      return true;
    }

    if (isCurrentUserAdmin) {
      setIsBackOfficeUnlocked(true);
      setBackOfficeAuthError(null);
      return true;
    }

    if (isBackOfficeUnlocked) {
      setBackOfficeAuthError(null);
      return true;
    }

    setBackOfficeAuthError(null);
    return openBackOfficePrompt();
  }, [
    isAdminMode,
    isCurrentUserAdmin,
    isBackOfficeUnlocked,
    openBackOfficePrompt,
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

  const handleStartInspirationProject = useCallback(() => {
    setScreen('inspiration-form');
  }, []);

  const handleSaveInspirationProject = useCallback((payload) => {
    const project = {
      id: createInspirationId(),
      ...payload,
      ownerEmail: currentUserEmail || '',
      teamLead: currentUserDisplayName || ''
    };
    setInspirationProjects((prev) => [project, ...(Array.isArray(prev) ? prev : [])]);
    setHomeView('inspiration');
    setScreen('home');
  }, [currentUserDisplayName, currentUserEmail]);

  const handleOpenInspirationProject = useCallback((projectId) => {
    if (!projectId) {
      return;
    }
    setActiveInspirationId(projectId);
    setScreen('inspiration-detail');
  }, []);

  const handleUpdateInspirationProject = useCallback((projectId, updates) => {
    if (!projectId || !updates) {
      return;
    }

    setInspirationProjects((prev) => (Array.isArray(prev) ? prev : []).map((project) => {
      if (!project || project.id !== projectId) {
        return project;
      }

      return { ...project, ...updates };
    }));
  }, []);

  const handleExportInspirationProject = useCallback((project) => {
    if (!project) {
      return;
    }

    exportInspirationToFile(project);
  }, []);

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
    const {
      totalMandatoryQuestions: totalQuestions,
      answeredMandatoryQuestions: answeredQuestionsCount
    } = computeMandatoryProgress(derivedQuestions, projectAnswers);
    const missingMandatory = derivedQuestions.filter(question => question.required && !isAnswerProvided(projectAnswers[question.id]));
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


  const handleReintegrateProjectInCommittee = useCallback((projectId, committeeId) => {
    if (!projectId || !committeeId) {
      return;
    }

    setProjects(prevProjects => prevProjects.map((project) => {
      if (!project || project.id !== projectId) {
        return project;
      }

      const answers = project.answers && typeof project.answers === 'object' ? project.answers : {};
      const rawComments = answers.__compliance_team_comments__;
      const comments = rawComments && typeof rawComments === 'object' && !Array.isArray(rawComments)
        ? rawComments
        : {};
      const forcedCommitteeIds = Array.isArray(comments.forcedCommitteeIds)
        ? comments.forcedCommitteeIds.filter((id) => typeof id === 'string' && id.trim().length > 0)
        : [];

      const nextForcedCommitteeIds = forcedCommitteeIds.includes(committeeId)
        ? forcedCommitteeIds
        : [...forcedCommitteeIds, committeeId];

      return {
        ...project,
        answers: {
          ...answers,
          __compliance_team_comments__: {
            ...comments,
            forcedCommitteeIds: nextForcedCommitteeIds
          }
        },
        lastUpdated: new Date().toISOString()
      };
    }));
  }, []);

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

      if (currentUserDisplayName) {
        answersClone.teamLead = currentUserDisplayName;
      }

      const relevantQuestions = questions.filter(question => shouldShowQuestion(question, answersClone));
      const {
        totalMandatoryQuestions: derivedTotalQuestions,
        answeredMandatoryQuestions: derivedAnsweredQuestions
      } = computeMandatoryProgress(relevantQuestions, answersClone);
      const totalQuestions = derivedTotalQuestions > 0
        ? derivedTotalQuestions
        : typeof sourceProject.totalQuestions === 'number' && sourceProject.totalQuestions > 0
          ? sourceProject.totalQuestions
          : 0;

      const answeredQuestionsCount = derivedTotalQuestions > 0
        ? derivedAnsweredQuestions
        : typeof sourceProject.answeredQuestions === 'number'
          ? Math.min(sourceProject.answeredQuestions, totalQuestions || sourceProject.answeredQuestions)
          : 0;

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
        answeredQuestions: Math.min(answeredQuestionsCount, totalQuestions || answeredQuestionsCount),
        ownerEmail: currentUserEmail || '',
        sharedWith: []
      };

      return [duplicateEntry, ...prevProjects];
    });
  }, [
    analyzeAnswers,
    currentUserDisplayName,
    currentUserEmail,
    questions,
    riskLevelRules,
    riskWeights,
    rules,
    shouldShowQuestion
  ]);

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

    const {
      totalMandatoryQuestions: totalQuestions,
      answeredMandatoryQuestions: answeredQuestionsCount
    } = computeMandatoryProgress(visibleQuestions, answersSource);

    const hasShowcaseIncompleteAnswers = visibleQuestions.length > 0
      ? visibleQuestions.some(
        question => question.required && !isAnswerProvided(answersSource[question.id])
      )
      : Object.keys(answersSource).length === 0;


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

    const pendingShowcaseMode = pendingShowcaseDisplayModeRef.current;
    const resolvedShowcaseMode = resolveShowcaseDisplayMode(pendingShowcaseMode) || 'full';
    const pendingSharedView = Boolean(pendingShowcaseSharedRef.current);
    const pendingComments = Boolean(pendingShowcaseCommentsRef.current);
    const pendingAnnotationVisibility = pendingShowcaseAnnotationVisibilityRef.current === 'mine' ? 'mine' : 'all';
    const resolvedDisplayModeLock = pendingSharedView
      ? resolvedShowcaseMode
      : resolvedShowcaseMode === 'light'
        ? 'light'
        : null;

    pendingShowcaseDisplayModeRef.current = null;
    pendingShowcaseSharedRef.current = false;
    pendingShowcaseCommentsRef.current = false;
    pendingShowcaseAnnotationVisibilityRef.current = 'all';
    setShowcaseDisplayMode(resolvedShowcaseMode);
    setShowcaseDisplayModeLock(resolvedDisplayModeLock);
    setIsShowcaseSharedView(pendingSharedView);
    setShowcaseCommentsEnabled(pendingComments);
    setShowcaseAnnotationVisibilityMode(pendingAnnotationVisibility);

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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const pendingProjectId = pendingShowcaseProjectIdRef.current;
    if (!pendingProjectId) {
      return;
    }

    const matchingProject = projects.find(project => project?.id === pendingProjectId);
    if (!matchingProject) {
      return;
    }

    pendingShowcaseProjectIdRef.current = null;
    openProjectShowcase({ projectId: pendingProjectId });
  }, [isHydrated, openProjectShowcase, projects]);

  const isActiveProjectShowcaseBlocked = useMemo(
    () => isShowcaseAccessBlockedByProjectType(answers),
    [answers]
  );

  const canShowProjectShowcase = useCallback(
    (project) => !isShowcaseAccessBlockedByProjectType(project?.answers || {}),
    []
  );

  const handleShowProjectShowcase = useCallback((projectId) => {
    if (!projectId) {
      return;
    }

    const project = projects.find((entry) => entry?.id === projectId);
    if (isShowcaseAccessBlockedByProjectType(project?.answers || {})) {
      return;
    }

    openProjectShowcase({ projectId });
  }, [openProjectShowcase, projects]);

  const handleOpenActiveProjectShowcase = useCallback((payload = {}) => {
    const projectId = payload?.projectId || activeProjectId || null;

    if (isShowcaseAccessBlockedByProjectType(answers)) {
      return;
    }

    openProjectShowcase({
      ...payload,
      projectId
    });
  }, [activeProjectId, answers, openProjectShowcase]);

  const handleCloseProjectShowcase = useCallback(() => {
    setShowcaseProjectContext(null);
    setShowcaseDisplayMode('full');
    setShowcaseDisplayModeLock(null);
    setIsShowcaseSharedView(false);
    setShowcaseCommentsEnabled(false);
    setShowcaseAnnotationVisibilityMode('all');
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
      setIsShowcaseSharedView(false);
      setShowcaseCommentsEnabled(false);
      setShowcaseAnnotationVisibilityMode('all');
      previousScreenRef.current = null;
      handleOpenProject(projectId, { view: 'synthesis' });
      return;
    }

    setShowcaseProjectContext(null);
    setIsShowcaseSharedView(false);
    setShowcaseCommentsEnabled(false);
    setShowcaseAnnotationVisibilityMode('all');

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
      || !canManageProject(projects.find(entry => entry.id === showcaseProjectContext.projectId))
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
      const {
        totalMandatoryQuestions: totalQuestions,
        answeredMandatoryQuestions: answeredQuestions
      } = computeMandatoryProgress(relevantQuestions, nextAnswers);

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
    canManageProject,
    extractProjectName,
    isAdminMode,
    setHasUnsavedChanges,
    projects,
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
    const existingProject = projects.find(project => project?.id === projectId);
    const {
      totalMandatoryQuestions: derivedTotalQuestions,
      answeredMandatoryQuestions: answeredQuestionsCount
    } = computeMandatoryProgress(relevantQuestions, sanitizedAnswers);
    const computedTotalQuestions = typeof payload.totalQuestions === 'number'
      ? payload.totalQuestions
      : derivedTotalQuestions;
    const totalQuestions = computedTotalQuestions > 0 ? computedTotalQuestions : 0;
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
      answeredQuestions: Math.min(answeredQuestionsCount, totalQuestions || answeredQuestionsCount),
      ownerEmail: existingProject?.ownerEmail || currentUserEmail || '',
      sharedWith: Array.isArray(existingProject?.sharedWith) ? existingProject.sharedWith : []
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
    currentUserEmail,
    extractProjectName,
    projects,
    questions,
    riskLevelRules,
    riskWeights,
    rules,
    setHasUnsavedChanges,
    shouldShowQuestion,
    upsertProject
  ]);

  const handleSubmitProject = useCallback((payload = {}) => {
    if (autosaveQueueRef.current && autosaveQueueRef.current.size() > 0) {
      setSaveFeedback({
        status: 'error',
        message: 'Synchronisation en cours : veuillez patienter avant de soumettre.'
      });
      return null;
    }

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

  const syncStatusLabel = formatSyncStatusLabel(syncStatus);
  const syncStatusMeta = formatSyncMeta(syncStatus);

  const showcaseProjectId = showcaseProjectContext?.projectId || '';
  const canShareActiveProjectShowcase = useMemo(
    () => !isShowcaseSharedView && canManageProject(activeShowcaseProject),
    [activeShowcaseProject, canManageProject, isShowcaseSharedView]
  );
  const canConfigureActiveProjectShowcaseModes = useMemo(
    () => !isShowcaseSharedView && canManageProject(activeShowcaseProject),
    [activeShowcaseProject, canManageProject, isShowcaseSharedView]
  );
  const buildShowcaseShareUrl = useCallback((shareMode) => {
    if (!showcaseProjectId || typeof window === 'undefined') {
      return '';
    }

    const url = new URL(window.location.href);
    url.searchParams.set('projectId', showcaseProjectId);
    url.searchParams.set('showcaseShared', '1');
    if (showcaseShareCommentsEnabled) {
      url.searchParams.set('showcaseComments', '1');
      if (showcaseShareAnnotationVisibility === 'mine') {
        url.searchParams.set('showcaseAnnotationVisibility', 'mine');
      } else {
        url.searchParams.delete('showcaseAnnotationVisibility');
      }
    } else {
      url.searchParams.delete('showcaseComments');
      url.searchParams.delete('showcaseAnnotationVisibility');
    }
    if (shareMode === 'light') {
      url.searchParams.set('showcaseMode', 'light');
    } else {
      url.searchParams.delete('showcaseMode');
    }
    url.hash = `showcase=${showcaseProjectId}`;
    return url.toString();
  }, [showcaseProjectId, showcaseShareAnnotationVisibility, showcaseShareCommentsEnabled]);

  const showcaseShareUrl = useMemo(
    () => buildShowcaseShareUrl(showcaseShareMode),
    [buildShowcaseShareUrl, showcaseShareMode]
  );

  const handleOpenShowcaseShare = useCallback(() => {
    if (!showcaseProjectId || !canShareActiveProjectShowcase) {
      return;
    }

    setShowcaseShareMode(showcaseDisplayMode === 'light' ? 'light' : 'full');
    setShowcaseShareCommentsEnabled(false);
        setShowcaseShareAnnotationVisibility('all');
    setIsShowcaseShareOpen(true);
    setShowcaseShareFeedback('');
  }, [canShareActiveProjectShowcase, showcaseDisplayMode, showcaseProjectId]);

  const handleCloseShowcaseShare = useCallback(() => {
    setIsShowcaseShareOpen(false);
    setShowcaseShareFeedback('');
  }, []);

  useEffect(() => {
    if (!isShowcaseShareOpen) {
      return;
    }

    if (showcaseShareInputRef.current && typeof showcaseShareInputRef.current.focus === 'function') {
      showcaseShareInputRef.current.focus();
    }
  }, [isShowcaseShareOpen]);

  const handleCopyShowcaseLink = useCallback(async () => {
    if (!showcaseShareUrl) {
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(showcaseShareUrl);
        setShowcaseShareFeedback('Lien copié dans le presse-papiers.');
        return;
      }
    } catch (error) {
      // Fallback below.
    }

    if (typeof document !== 'undefined') {
      const input = document.getElementById('showcase-share-link');
      if (input && typeof input.select === 'function') {
        input.select();
        const copied = document.execCommand && document.execCommand('copy');
        if (copied) {
          setShowcaseShareFeedback('Lien copié dans le presse-papiers.');
          return;
        }
      }
    }

    setShowcaseShareFeedback('Impossible de copier automatiquement le lien.');
  }, [showcaseShareUrl]);

  const handleDownloadShowcaseShortcut = useCallback(() => {
    if (!showcaseShareUrl || typeof window === 'undefined') {
      return;
    }

    const shortcutContent = `[InternetShortcut]\nURL=${showcaseShareUrl}\n`;
    const blob = new Blob([shortcutContent], { type: 'text/plain' });
    const fileName = `raccourci-showcase-${showcaseProjectId || 'projet'}.url`;
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = downloadUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
    setShowcaseShareFeedback('Raccourci téléchargé.');
  }, [showcaseProjectId, showcaseShareUrl]);

  return (
    <div className={`min-h-screen ${annotationOffsetClass}`}>
      <AnnotationLayer
        isActive={isAnnotationModeEnabled && screen === 'showcase'}
        isPaused={isAnnotationPaused}
        isEditing={isShowcaseEditing}
        hideToolbar={isOnboardingActive && onboardingStepId === 'showcase-back-to-report'}
        notes={annotationNotes}
        activeContextId={activeAnnotationContextKey}
        sourceColors={annotationSources}
        projectName={showcaseProjectContext?.projectName || ''}
        autoFocusNoteId={autoFocusAnnotationId}
        onAutoFocusComplete={() => setAutoFocusAnnotationId(null)}
        canCloseNotes={canCloseAnnotationNotes}
        noteVisibilityMode={isShowcaseSharedView ? showcaseAnnotationVisibilityMode : 'all'}
        currentSourceId={currentUserDisplayName || ''}
        onTogglePause={handleToggleAnnotationPause}
        onRequestSave={handleSaveAnnotationNotes}
        onRequestLoad={handleRequestAnnotationFile}
        onExit={handleToggleAnnotationMode}
        onNoteChange={handleAnnotationTextChange}
        onNoteClose={handleCloseAnnotationNote}
        onNoteReply={handleAddAnnotationReply}
      />

      <input
        ref={annotationFileInputRef}
        type="file"
        accept="application/json"
        className="sr-only"
        onChange={handleAnnotationFileChange}
        data-annotation-ui="true"
      />

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
              {screen === 'showcase' && (
                <button
                  type="button"
                  onClick={handleToggleAnnotationMode}
                  className={`order-first self-start sm:order-last sm:self-center inline-flex h-10 px-4 items-center justify-center rounded-full border text-blue-700 shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isAnnotationModeEnabled ? 'bg-blue-50 border-blue-200' : 'bg-white border-blue-100'
                  }`}
                  aria-pressed={isAnnotationModeEnabled}
                  aria-label={isAnnotationModeEnabled ? 'Désactiver le mode annotation' : 'Activer le mode annotation'}
                  title={isAnnotationModeEnabled ? 'Désactiver le mode annotation' : 'Activer le mode annotation'}
                  data-annotation-ui="true"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="sr-only">Annotation</span>
                </button>
              )}
              {screen === 'showcase' && canShareActiveProjectShowcase && (
                <button
                  type="button"
                  onClick={handleOpenShowcaseShare}
                  className="order-first self-start sm:order-last sm:self-center inline-flex h-10 px-4 items-center justify-center rounded-full border bg-white border-blue-100 text-blue-700 shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Partager la vitrine du projet"
                  title="Partager la vitrine du projet"
                  data-tour-id="showcase-share-trigger"
                >
                  <Link className="h-5 w-5" />
                  <span className="sr-only">Partager</span>
                </button>
              )}
              {mode === 'user' && screen === 'showcase' && showcaseProjectContext && (
                <button
                  type="button"
                  onClick={handleReturnToComplianceReport}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all hv-button bg-blue-600 text-white hv-button-primary"
                  aria-label="Revenir à la synthèse du projet"
                  title="Revenir à la synthèse du projet"
                  data-tour-id="showcase-back-to-report"
                >
                  Synthèse
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
                  aria-label="Accéder au Back-office"
                  title="Accéder au Back-office"
                >
                  <span>Accéder au Back-office</span>
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

      {isShowcaseShareOpen && canShareActiveProjectShowcase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black bg-opacity-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="showcase-share-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 hv-surface hv-modal-panel">
            <div className="text-center">
              <h2 id="showcase-share-title" className="text-xl font-semibold text-gray-800">
                Partager la vitrine du projet
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Copiez le lien ou téléchargez un raccourci pour ouvrir directement cette vitrine.
              </p>
            </div>
            <div className="space-y-3">
              <label htmlFor="showcase-share-link" className="text-sm font-medium text-gray-700">
                Lien à partager
              </label>
              <input
                id="showcase-share-link"
                type="text"
                value={showcaseShareUrl}
                ref={showcaseShareInputRef}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
              />
              {showcaseShareFeedback && (
                <p className="text-sm text-blue-600">{showcaseShareFeedback}</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Mode partagé</p>
              <div className="inline-flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowcaseShareMode('full')}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    showcaseShareMode === 'full'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                  aria-pressed={showcaseShareMode === 'full'}
                >
                  Mode complet
                </button>
                <button
                  type="button"
                  onClick={() => setShowcaseShareMode('light')}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    showcaseShareMode === 'light'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                  aria-pressed={showcaseShareMode === 'light'}
                >
                  Mode Light
                </button>
              </div>
              <p className="text-xs text-gray-500">
                En mode Light, seules les sections pré-sélectionnées sont visibles.
              </p>
            </div>
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  checked={showcaseShareCommentsEnabled}
                  onChange={(event) => setShowcaseShareCommentsEnabled(event.target.checked)}
                />
                Commentaires possibles
              </label>
              <p className="text-xs text-gray-500">
                Active un bouton de commentaires flottant pour lancer le module de post-it.
              </p>
              {showcaseShareCommentsEnabled && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Visibilité des post-its</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowcaseShareAnnotationVisibility('all')}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        showcaseShareAnnotationVisibility === 'all'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                      aria-pressed={showcaseShareAnnotationVisibility === 'all'}
                    >
                      Tous les post-its
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowcaseShareAnnotationVisibility('mine')}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        showcaseShareAnnotationVisibility === 'mine'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                      aria-pressed={showcaseShareAnnotationVisibility === 'mine'}
                    >
                      Seulement mes post-its
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleCopyShowcaseLink}
                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hv-button hv-button-primary"
              >
                Copier le lien
              </button>
              <button
                type="button"
                onClick={handleDownloadShowcaseShortcut}
                className="px-5 py-2 bg-white text-blue-700 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hv-button"
              >
                Télécharger le raccourci
              </button>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCloseShowcaseShare}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {isBackOfficePromptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="backoffice-auth-title"
        >
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => closeBackOfficePrompt(false)} aria-hidden="true" />
          <form
            onSubmit={handleBackOfficePromptSubmit}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl hv-surface"
          >
            <div className="text-center">
              <h2 id="backoffice-auth-title" className="text-xl font-semibold text-gray-800">
                Accès back-office
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Saisissez le mot de passe administrateur pour continuer.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              <label htmlFor="backoffice-password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="backoffice-password"
                type="password"
                value={backOfficePromptValue}
                onChange={(event) => setBackOfficePromptValue(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Mot de passe"
              />
              {backOfficePromptError && (
                <p className="text-sm text-red-600" role="alert">
                  {backOfficePromptError}
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => closeBackOfficePrompt(false)}
                className="px-5 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Déverrouiller
              </button>
            </div>
          </form>
        </div>
      )}

      <main id="main-content" tabIndex="-1" className="focus:outline-none hv-background">
        {!isHydrated ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <LoadingFallback
              label="Chargement de l’accueil…"
              hint="Préparation de votre espace."
            />
          </div>
        ) : isAdminBackOfficeView ? (
          <AdminBackOfficeErrorBoundary onRecover={handleReturnToProjectMode}>
            <Suspense
              fallback={(
                <LoadingFallback
                  label="Chargement du back-office…"
                  hint="Préparation des données administratives en cours."
                />
              )}
            >
              <LazyBackOffice
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
                inspirationFilters={inspirationFilters}
                setInspirationFilters={updateInspirationFilters}
                inspirationFormFields={inspirationFormFields}
                setInspirationFormFields={updateInspirationFormFields}
                onboardingTourConfig={onboardingTourConfig}
                setOnboardingTourConfig={setOnboardingTourConfig}
                validationCommitteeConfig={validationCommitteeConfig}
                setValidationCommitteeConfig={setValidationCommitteeConfig}
                adminEmails={adminEmails}
                setAdminEmails={setAdminEmails}
                currentUserEmail={currentUserEmail}
                isCurrentUserAdmin={isCurrentUserAdmin}
              />
            </Suspense>
          </AdminBackOfficeErrorBoundary>
        ) : screen === 'home' ? (
          <HomeScreen
            projects={projects}
            projectFilters={projectFilters}
            teamLeadOptions={teamLeadTeamOptions}
            teams={teams}
            inspirationProjects={inspirationProjects}
            inspirationFilters={inspirationFilters}
            validationCommitteeConfig={validationCommitteeConfig}
            currentUser={currentUser}
            homeView={homeView}
            onHomeViewChange={setHomeView}
            onStartInspirationProject={handleStartInspirationProject}
            onOpenInspirationProject={handleOpenInspirationProject}
            onStartNewProject={handleCreateNewProject}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onShowProjectShowcase={handleShowProjectShowcase}
            canShowProjectShowcase={canShowProjectShowcase}
            onDuplicateProject={handleDuplicateProject}
            onReintegrateProjectInCommittee={handleReintegrateProjectInCommittee}
            isAdminMode={isAdminMode}
            tourContext={tourContext}
          />
        ) : screen === 'inspiration-form' ? (
          <InspirationForm
            formConfig={inspirationFormFields}
            existingProjects={inspirationProjects}
            onSubmit={handleSaveInspirationProject}
            onCancel={() => {
              setScreen('home');
              setHomeView('inspiration');
            }}
          />
        ) : screen === 'inspiration-detail' ? (
          <InspirationDetail
            project={activeInspirationProject}
            formConfig={inspirationFormFields}
            onBack={() => {
              setScreen('home');
              setHomeView('inspiration');
            }}
            onUpdate={handleUpdateInspirationProject}
            onExport={handleExportInspirationProject}
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
            onNavigateToQuestion={handleNavigateToQuestion}
            onSaveDraft={undefined}
            saveFeedback={saveFeedback}
            onDismissSaveFeedback={handleDismissSaveFeedback}
            validationError={validationError}
            onReturnToSynthesis={
              returnToSynthesisAfterEdit ? handleReturnToSynthesisFromQuestionnaire : undefined
            }
            isReturnToSynthesisRequested={returnToSynthesisAfterEdit}
            tourContext={tourContext}
            onFinish={navigateToSynthesis}
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
              canOpenProjectShowcase={!isActiveProjectShowcaseBlocked}
              isProjectEditable={isActiveProjectEditable}
              onRestart={handleRestart}
              onBack={isActiveProjectEditable ? handleBackToQuestionnaire : undefined}
              onUpdateAnswers={isActiveProjectEditable ? handleUpdateAnswers : undefined}
              onUpdateComplianceComments={activeProjectId ? handleUpdateComplianceComments : undefined}
              currentUser={currentUser}
              sharedMembers={activeProject?.sharedWith || []}
              ownerEmail={activeProject?.ownerEmail || ''}
              onShareProjectMember={activeProjectId && canManageProject(activeProject) ? handleAddSharedMember : undefined}
              onRemoveProjectMember={activeProjectId && canManageProject(activeProject) ? handleRemoveSharedMember : undefined}
              onSubmitProject={handleSubmitProject}
              onNavigateToQuestion={handleNavigateToQuestionFromReport}
              isExistingProject={Boolean(activeProjectId)}
              onSaveDraft={undefined}
              saveFeedback={saveFeedback}
              onDismissSaveFeedback={handleDismissSaveFeedback}
              isAdminMode={isAdminMode}
              hasIncompleteAnswers={hasIncompleteAnswers}
              tourContext={tourContext}
              validationCommitteeConfig={validationCommitteeConfig}
              adminEmails={adminEmails}
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
              <Suspense
                fallback={(
                  <LoadingFallback
                    label="Chargement de la vitrine du projet…"
                    hint="Nous construisons la synthèse visuelle du projet."
                  />
                )}
              >
                <LazyProjectShowcase
                  projectName={showcaseProjectContext.projectName}
                  onClose={handleCloseProjectShowcase}
                  analysis={showcaseProjectContext.analysis}
                  relevantTeams={showcaseProjectContext.relevantTeams}
                  questions={showcaseProjectContext.questions}
                  answers={showcaseProjectContext.answers}
                  timelineDetails={showcaseProjectContext.timelineDetails}
                  showcaseThemes={showcaseThemes}
                  hasIncompleteAnswers={Boolean(showcaseProjectContext.hasIncompleteAnswers)}
                  initialDisplayMode={showcaseDisplayMode}
                  displayModeLock={showcaseDisplayModeLock}
                  hideEditBar={isShowcaseSharedView}
                  canConfigureDisplayModes={canConfigureActiveProjectShowcaseModes}
                  hideNotice={isShowcaseSharedView}
                  onUpdateAnswers={
                    isShowcaseSharedView
                      ? undefined
                      : isOnboardingActive
                        ? noop
                        : showcaseProjectContext.status === 'draft' || isAdminMode
                          ? handleUpdateProjectShowcaseAnswers
                          : undefined
                  }
                  tourContext={tourContext}
                  onDisplayModeChange={setShowcaseDisplayMode}
                  onAnnotationScopeChange={setShowcaseAnnotationScope}
                  onEditingStateChange={setIsShowcaseEditing}
                />
              </Suspense>
            </div>
          ) : null
      ) : null}
    </main>

    {screen === 'showcase' && isShowcaseSharedView && showcaseCommentsEnabled && (
      <button
        type="button"
        onClick={handleToggleAnnotationMode}
        className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold shadow-lg transition hover:shadow-xl ${
          isAnnotationModeEnabled
            ? 'border-blue-200 bg-blue-600 text-white'
            : 'border-blue-100 bg-white text-blue-700'
        }`}
        aria-pressed={isAnnotationModeEnabled}
        aria-label={isAnnotationModeEnabled ? 'Fermer les commentaires' : 'Ouvrir les commentaires'}
        title={isAnnotationModeEnabled ? 'Fermer les commentaires' : 'Ouvrir les commentaires'}
        data-annotation-ui="true"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Commentaires</span>
      </button>
    )}

    <footer className="bg-white border-t border-gray-200 mt-10" aria-label="Pied de page">
      <p className="text-xs text-gray-400 text-center py-4">
        Project Navigator · Version {APP_VERSION} · {syncStatusLabel}{syncStatusMeta ? ` · ${syncStatusMeta}` : ''} ·{' '}
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
