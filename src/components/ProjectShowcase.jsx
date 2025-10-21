import React, { useCallback, useEffect, useMemo, useRef, useState } from '../react.js';
import {
  CheckCircle,
  Edit,
  Plus,
  Trash2
} from './icons.js';
import { formatAnswer } from '../utils/questions.js';
import { renderTextWithLinks } from '../utils/linkify.js';

const findQuestionById = (questions, id) => {
  if (!Array.isArray(questions)) {
    return null;
  }

  return questions.find(question => question?.id === id) || null;
};

const getFormattedAnswer = (questions, answers, id) => {
  const question = findQuestionById(questions, id);
  if (!question) {
    return '';
  }

  return formatAnswer(question, answers?.[id]);
};

const getRawAnswer = (answers, id) => {
  if (!answers) {
    return undefined;
  }

  return answers[id];
};

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const formatNumberFR = (value, options = {}) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '';
  }

  return numericValue.toLocaleString('fr-FR', options);
};

const formatWeeksValue = (weeks) => {
  if (weeks === undefined || weeks === null) {
    return '';
  }

  const rounded = Math.round(weeks * 10) / 10;
  const hasDecimal = Math.abs(rounded - Math.round(rounded)) > 0.0001;

  return `${formatNumberFR(rounded, {
    minimumFractionDigits: hasDecimal ? 1 : 0,
    maximumFractionDigits: hasDecimal ? 1 : 0
  })} sem.`;
};

const formatDaysValue = (days) => {
  if (days === undefined || days === null) {
    return '';
  }

  return `${formatNumberFR(Math.round(days))} j.`;
};

const resolveQuestionTitle = (questions, id) => {
  if (!id) {
    return '';
  }

  const question = findQuestionById(questions, id);
  return question?.question || id;
};

const formatTimingRequirementSummary = (questions, constraint) => {
  if (!constraint || typeof constraint !== 'object') {
    return '';
  }

  const startLabel = resolveQuestionTitle(questions, constraint.startQuestion);
  const endLabel = resolveQuestionTitle(questions, constraint.endQuestion);

  const requirementParts = [];
  if (typeof constraint.minimumWeeks === 'number') {
    requirementParts.push(`${formatNumberFR(constraint.minimumWeeks)} sem.`);
  }
  if (typeof constraint.minimumDays === 'number') {
    requirementParts.push(`${formatNumberFR(constraint.minimumDays)} j.`);
  }

  const hasRequirement = requirementParts.length > 0;
  const hasStart = Boolean(startLabel);
  const hasEnd = Boolean(endLabel);

  if (!hasRequirement && !hasStart && !hasEnd) {
    return '';
  }

  if (hasRequirement && hasStart && hasEnd) {
    return `Respecter un délai minimal de ${requirementParts.join(' / ')} entre « ${startLabel} » et « ${endLabel} ».`;
  }

  if (hasRequirement && hasStart && !hasEnd) {
    return `Respecter un délai minimal de ${requirementParts.join(' / ')} après « ${startLabel} ».`;
  }

  if (hasRequirement && !hasStart && hasEnd) {
    return `Respecter un délai minimal de ${requirementParts.join(' / ')} avant « ${endLabel} ».`;
  }

  if (hasRequirement) {
    return `Respecter un délai minimal de ${requirementParts.join(' / ')} avant la prochaine étape.`;
  }

  if (hasStart && hasEnd) {
    return `Surveiller le délai entre « ${startLabel} » et « ${endLabel} ».`;
  }

  const singleLabel = startLabel || endLabel;
  if (singleLabel) {
    return `Surveiller la date « ${singleLabel} ».`;
  }

  return '';
};

const formatVigilanceStatusMessage = (alert) => {
  if (!alert || typeof alert !== 'object') {
    return '';
  }

  if (alert.status === 'unknown') {
    return "Dates manquantes : complétez les informations pour confirmer ce délai.";
  }

  if (alert.status === 'breach') {
    const diffParts = [];
    if (alert.diff && typeof alert.diff.diffInWeeks === 'number') {
      diffParts.push(formatWeeksValue(alert.diff.diffInWeeks));
    }
    if (alert.diff && typeof alert.diff.diffInDays === 'number') {
      diffParts.push(formatDaysValue(alert.diff.diffInDays));
    }

    const requiredParts = [];
    if (typeof alert.requiredWeeks === 'number') {
      requiredParts.push(`${formatNumberFR(alert.requiredWeeks)} sem.`);
    }
    if (typeof alert.requiredDays === 'number') {
      requiredParts.push(`${formatNumberFR(alert.requiredDays)} j.`);
    }

    if (diffParts.length === 0 && requiredParts.length === 0) {
      return 'Délai insuffisant : ajuster les jalons pour respecter l’exigence.';
    }

    if (diffParts.length === 0) {
      return `Délai insuffisant – minimum requis : ${requiredParts.join(' / ')}.`;
    }

    const diffLabel = diffParts.join(' / ');
    if (requiredParts.length === 0) {
      return `Délai constaté : ${diffLabel}. Ajuster le planning pour sécuriser le lancement.`;
    }

    return `Délai constaté : ${diffLabel} – minimum requis : ${requiredParts.join(' / ')}. Ajuster le planning en conséquence.`;
  }

  if (alert.status === 'satisfied' && alert.diff) {
    const parts = [];
    if (typeof alert.diff.diffInWeeks === 'number') {
      parts.push(formatWeeksValue(alert.diff.diffInWeeks));
    }
    if (typeof alert.diff.diffInDays === 'number') {
      parts.push(formatDaysValue(alert.diff.diffInDays));
    }

    const diffLabel = parts.length > 0 ? parts.join(' / ') : '';
    if (diffLabel) {
      return `Délai actuel : ${diffLabel}. Maintenir cette marge pour éviter l’alerte.`;
    }

    return 'Délai actuel conforme. Maintenir cette marge pour éviter l’alerte.';
  }

  return '';
};

const buildVigilanceAlerts = (analysis, questions, resolveTeamLabel) => {
  const rawAlerts = Array.isArray(analysis?.timeline?.vigilance)
    ? analysis.timeline.vigilance
    : [];

  return rawAlerts
    .filter(alert => alert && typeof alert === 'object' && alert.status !== 'breach')
    .map((alert, index) => {
      const title = alert.riskDescription && alert.riskDescription.trim().length > 0
        ? alert.riskDescription.trim()
        : alert.ruleName;

      return {
        id: alert.id || `${alert.ruleId || 'rule'}-${alert.riskId || index}`,
        ruleName: alert.ruleName,
        title,
        priority: alert.priority || '',
        requirementSummary: formatTimingRequirementSummary(questions, alert.timingConstraint),
        statusMessage: formatVigilanceStatusMessage(alert),
        status: alert.status || 'unknown',
        teamId: alert.teamId || '',
        teamLabel: typeof resolveTeamLabel === 'function'
          ? resolveTeamLabel(alert.teamId)
          : (alert.teamId || '')
      };
    })
    .filter(entry => entry.title || entry.requirementSummary || entry.statusMessage);
};

const mergeTimelineSummariesWithAlerts = (summaries, alerts) => {
  const safeSummaries = Array.isArray(summaries) ? summaries : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  if (safeSummaries.length === 0) {
    return { summaries: safeSummaries, unmatchedAlerts: safeAlerts };
  }

  const alertIdMap = new Map();
  const alertRuleNameMap = new Map();

  safeAlerts.forEach((alert, index) => {
    if (!alert || typeof alert !== 'object') {
      return;
    }

    const entry = { alert, index };

    if (alert.id) {
      alertIdMap.set(alert.id, entry);
    }

    if (alert.ruleId) {
      alertIdMap.set(alert.ruleId, entry);
    }

    if (typeof alert.ruleName === 'string') {
      const normalizedRuleName = alert.ruleName.trim().toLowerCase();
      if (normalizedRuleName.length > 0) {
        if (!alertRuleNameMap.has(normalizedRuleName)) {
          alertRuleNameMap.set(normalizedRuleName, entry);
        }
        if (!alertIdMap.has(normalizedRuleName)) {
          alertIdMap.set(normalizedRuleName, entry);
        }
      }
    }
  });

  const matchedAlertIndexes = new Set();

  const mergedSummaries = safeSummaries.map(summary => {
    if (!summary || typeof summary !== 'object') {
      return summary;
    }

    const candidateKeys = [];

    if (summary.id) {
      candidateKeys.push(summary.id);
    }

    if (summary.source) {
      candidateKeys.push(summary.source);
    }

    if (summary.ruleName && typeof summary.ruleName === 'string') {
      const normalizedRuleName = summary.ruleName.trim().toLowerCase();
      if (normalizedRuleName.length > 0) {
        candidateKeys.push(normalizedRuleName);
      }
    }

    let matchedEntry = null;

    for (const key of candidateKeys) {
      if (!key) {
        continue;
      }

      if (alertIdMap.has(key)) {
        matchedEntry = alertIdMap.get(key);
        break;
      }

      if (typeof key === 'string') {
        const normalizedKey = key.trim().toLowerCase();
        if (alertIdMap.has(normalizedKey)) {
          matchedEntry = alertIdMap.get(normalizedKey);
          break;
        }
        if (alertRuleNameMap.has(normalizedKey)) {
          matchedEntry = alertRuleNameMap.get(normalizedKey);
          break;
        }
      }
    }

    if (matchedEntry) {
      matchedAlertIndexes.add(matchedEntry.index);
      return {
        ...summary,
        alert: matchedEntry.alert
      };
    }

    return summary;
  });

  const unmatchedAlerts = safeAlerts.filter((_, index) => !matchedAlertIndexes.has(index));

  return {
    summaries: mergedSummaries,
    unmatchedAlerts
  };
};

const SHOWCASE_THEME = {
  id: 'aurora',
  label: 'Aurora néon',
  description: 'Jeux de lumières et ambiance futuriste pour un rendu premium.',
};

const SHOWCASE_FIELD_CONFIG = [
  { id: 'projectName', fallbackLabel: 'Nom du projet', fallbackType: 'text' },
  { id: 'projectSlogan', fallbackLabel: 'Slogan du projet', fallbackType: 'text' },
  { id: 'targetAudience', fallbackLabel: 'Audience cible', fallbackType: 'multi_choice' },
  { id: 'problemPainPoints', fallbackLabel: 'Besoins utilisateurs', fallbackType: 'long_text' },
  { id: 'solutionDescription', fallbackLabel: 'Description de la solution', fallbackType: 'long_text' },
  { id: 'solutionBenefits', fallbackLabel: 'Bénéfices clés', fallbackType: 'long_text' },
  { id: 'solutionComparison', fallbackLabel: 'Différenciation', fallbackType: 'long_text' },
  { id: 'innovationProcess', fallbackLabel: 'Processus innovation', fallbackType: 'long_text' },
  { id: 'visionStatement', fallbackLabel: "Indicateurs d'impact", fallbackType: 'long_text' },
  { id: 'BUDGET', fallbackLabel: 'Budget estimé (K€)', fallbackType: 'number' },
  { id: 'teamLead', fallbackLabel: 'Lead du projet', fallbackType: 'text' },
  { id: 'teamLeadTeam', fallbackLabel: 'Équipe du lead', fallbackType: 'text' },
  { id: 'teamCoreMembers', fallbackLabel: 'Membres clés', fallbackType: 'long_text' },
  { id: 'campaignKickoffDate', fallbackLabel: 'Date de soumission compliance', fallbackType: 'date' },
  { id: 'launchDate', fallbackLabel: 'Date de lancement', fallbackType: 'date' },
  { id: 'roadmapMilestones', fallbackLabel: 'Jalons du projet', fallbackType: 'milestone_list' }
];

const createEmptyMilestoneDragState = () => ({
  fieldId: null,
  sourceIndex: null,
  targetIndex: null
});

const ensureStringArrayUniqueness = (values) => {
  const seen = new Set();
  return values.filter(value => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

const normalizeMultiChoiceValue = (rawValue) => {
  const normalizeEntry = (entry) => {
    if (entry === null || entry === undefined) {
      return '';
    }

    if (typeof entry === 'string') {
      return entry.trim();
    }

    return String(entry).trim();
  };

  if (Array.isArray(rawValue)) {
    const normalized = rawValue
      .map(normalizeEntry)
      .filter(entry => entry.length > 0);

    return ensureStringArrayUniqueness(normalized);
  }

  if (typeof rawValue === 'string') {
    const splitValues = rawValue
      .split(/\r?\n|·|•|;|,/)
      .map(entry => entry.replace(/^[-•\s]+/, '').trim())
      .filter(entry => entry.length > 0);

    return ensureStringArrayUniqueness(splitValues);
  }

  return [];
};

const sanitizeMilestoneEntries = (entries) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map(item => ({
      date: typeof item?.date === 'string' ? item.date.trim() : '',
      description: typeof item?.description === 'string' ? item.description.trim() : ''
    }))
    .filter(entry => entry.date.length > 0 || entry.description.length > 0)
    .map(entry => ({ date: entry.date, description: entry.description }));
};

const formatMilestoneDraftState = (entries) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map(item => ({
      date: typeof item?.date === 'string' ? item.date : '',
      description: typeof item?.description === 'string' ? item.description : ''
    }))
    .filter(entry => entry.date.trim().length > 0 || entry.description.trim().length > 0);
};

const formatValueForDraft = (type, rawValue) => {
  if (rawValue === null || rawValue === undefined) {
    return type === 'multi_choice' || type === 'milestone_list' ? [] : '';
  }

  if (type === 'multi_choice') {
    return normalizeMultiChoiceValue(rawValue);
  }

  if (type === 'date') {
    const parsed = rawValue instanceof Date ? rawValue : new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) {
      return String(rawValue);
    }
    return parsed.toISOString().slice(0, 10);
  }

  if (type === 'milestone_list') {
    return formatMilestoneDraftState(rawValue);
  }

  return String(rawValue);
};

const formatValueForUpdate = (type, draftValue) => {
  if (type === 'multi_choice') {
    return normalizeMultiChoiceValue(draftValue);
  }

  if (type === 'date') {
    if (typeof draftValue !== 'string') {
      return null;
    }
    const trimmed = draftValue.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (type === 'milestone_list') {
    return sanitizeMilestoneEntries(draftValue);
  }

  if (typeof draftValue !== 'string') {
    return '';
  }

  return draftValue;
};

const areFieldValuesEqual = (type, previousValue, nextValue) => {
  if (type === 'multi_choice') {
    const previousArray = Array.isArray(previousValue)
      ? previousValue
      : normalizeMultiChoiceValue(previousValue);
    const nextArray = Array.isArray(nextValue)
      ? nextValue
      : normalizeMultiChoiceValue(nextValue);

    if (previousArray.length !== nextArray.length) {
      return false;
    }

    return previousArray.every((entry, index) => entry === nextArray[index]);
  }

  if (type === 'milestone_list') {
    const previousEntries = sanitizeMilestoneEntries(previousValue);
    const nextEntries = sanitizeMilestoneEntries(nextValue);

    if (previousEntries.length !== nextEntries.length) {
      return false;
    }

    return previousEntries.every((entry, index) => {
      const nextEntry = nextEntries[index];
      if (!nextEntry) {
        return false;
      }

      return entry.date === nextEntry.date && entry.description === nextEntry.description;
    });
  }

  return previousValue === nextValue;
};

const buildDraftValues = (fields, answers, fallbackProjectName) => {
  const draft = {};

  fields.forEach(field => {
    const question = field.question;
    const fieldType = question?.type || field.fallbackType || 'text';
    const rawValue = getRawAnswer(answers, field.id);
    if (rawValue === undefined || rawValue === null) {
      draft[field.id] = fieldType === 'multi_choice' || fieldType === 'milestone_list' ? [] : '';
    } else {
      draft[field.id] = formatValueForDraft(fieldType, rawValue);
    }
  });

  if (typeof fallbackProjectName === 'string' && fallbackProjectName.trim().length > 0) {
    if (!hasText(draft.projectName)) {
      draft.projectName = fallbackProjectName.trim();
    }
  }

  return draft;
};

const parseListAnswer = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(item => hasText(String(item)));
  }

  const normalized = String(value)
    .split(/\r?\n|·|•|;|,/)
    .map(entry => entry.replace(/^[-•\s]+/, '').trim())
    .filter(entry => entry.length > 0);

  return normalized;
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsed);
};

const formatMilestoneDisplayDate = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '';
  }

  const formatted = formatDate(value);
  if (formatted && formatted.length > 0) {
    return formatted;
  }

  return value.trim();
};

const buildManualMilestones = (entries) => {
  const sanitized = sanitizeMilestoneEntries(entries);

  return sanitized.map((entry, index) => {
    const formattedDate = formatMilestoneDisplayDate(entry.date);

    return {
      id: `manual-milestone-${index}`,
      date: entry.date,
      formattedDate,
      description: entry.description
    };
  });
};

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const computeRunway = (answers) => {
  const launchRaw = answers?.launchDate;

  if (!launchRaw) {
    return null;
  }

  const launchDate = new Date(launchRaw);

  if (Number.isNaN(launchDate.getTime())) {
    return null;
  }

  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const launchNormalized = new Date(
    launchDate.getFullYear(),
    launchDate.getMonth(),
    launchDate.getDate()
  );

  const diffMs = launchNormalized.getTime() - todayNormalized.getTime();
  const diffInDays = Math.max(0, Math.round(diffMs / MS_IN_DAY));
  const diffInWeeks = diffInDays / 7;

  return {
    launchDate: launchNormalized,
    diffDays: diffInDays,
    diffWeeks: diffInWeeks,
    weeks: diffInWeeks,
    days: diffInDays,
    isToday: diffMs === 0,
    isOverdue: diffMs < 0,
    launchLabel: formatDate(launchNormalized),
    weeksLabel: `${Math.round(diffInWeeks)} sem.`,
    daysLabel: `${diffInDays} j.`
  };
};

const formatCountdownUnit = (value, unit) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return `0 ${unit}`;
  }

  const rounded = Math.max(0, Math.round(value));
  return `${rounded} ${unit}`;
};

const useAnimatedCounter = (targetValue, options = {}) => {
  const { duration = 1000 } = options;
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = useRef(null);
  const previousTargetRef = useRef(null);

  useEffect(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (typeof targetValue !== 'number' || Number.isNaN(targetValue)) {
      previousTargetRef.current = null;
      setDisplayValue(0);
      return undefined;
    }

    const clampedTarget = Math.max(0, targetValue);

    if (duration <= 0) {
      setDisplayValue(clampedTarget);
      previousTargetRef.current = clampedTarget;
      return undefined;
    }

    if (previousTargetRef.current === clampedTarget) {
      setDisplayValue(clampedTarget);
      return undefined;
    }

    previousTargetRef.current = clampedTarget;
    let start = null;

    const step = (timestamp) => {
      if (start === null) {
        start = timestamp;
      }

      const progress = Math.min((timestamp - start) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = clampedTarget * easedProgress;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [targetValue, duration]);

  return displayValue;
};

const computeTimelineSummaries = (timelineDetails) => {
  if (!Array.isArray(timelineDetails)) {
    return [];
  }

  return timelineDetails
    .filter(detail => Boolean(detail?.diff) && detail?.satisfied === false)
    .map((detail, index) => {
      const diff = detail.diff;
      const weeks = Number.isFinite(diff?.diffInWeeks)
        ? Math.round(diff.diffInWeeks)
        : 0;
      const days = Number.isFinite(diff?.diffInDays)
        ? Math.round(diff.diffInDays)
        : 0;
      const riskLabel = typeof detail?.riskDescription === 'string'
        ? detail.riskDescription.trim()
        : '';
      const summaryLabel = riskLabel.length > 0 ? riskLabel : detail?.ruleName;
      const hasProfiles = Array.isArray(detail?.profiles) && detail.profiles.length > 0;
      const source = typeof detail?.source === 'string' ? detail.source : null;
      const identifier = detail?.id
        || `${detail?.ruleId || detail?.ruleName || 'rule'}-${detail?.riskId || source || index}`;

      return {
        id: identifier,
        ruleName: summaryLabel,
        satisfied: detail?.satisfied ?? false,
        weeks,
        days,
        hasProfiles,
        source
      };
    });
};

const extractTimelineProfiles = (timelineDetails) => {
  if (!Array.isArray(timelineDetails)) {
    return [];
  }

  const detailWithProfiles = timelineDetails.find(
    (detail) => Array.isArray(detail?.profiles) && detail.profiles.length > 0
  );

  if (!detailWithProfiles) {
    return [];
  }

  return detailWithProfiles.profiles
    .map((profile) => ({
      id: profile?.id ?? null,
      label: typeof profile?.label === 'string' ? profile.label : '',
      description: typeof profile?.description === 'string' ? profile.description : ''
    }))
    .filter(profile => profile.label.length > 0 || profile.description.length > 0);
};

const REQUIRED_SHOWCASE_QUESTION_IDS = [
  'projectName',
  'projectSlogan',
  'targetAudience',
  'problemPainPoints',
  'solutionDescription',
  'solutionBenefits',
  'solutionComparison',
  'innovationProcess',
  'visionStatement',
  'BUDGET',
  'teamLead',
  'teamLeadTeam',
  'teamCoreMembers',
  'campaignKickoffDate',
  'launchDate',
  'roadmapMilestones'
];

const buildHeroHighlights = ({ targetAudience, runway }) => {
  const highlights = [];

  if (hasText(targetAudience)) {
    highlights.push({
      id: 'audience',
      label: 'Audience cible',
      value: targetAudience,
      caption: ''
    });
  }

  if (runway) {
    highlights.push({
      id: 'runway',
      label: 'Compte à rebours avant lancement',
      value: `${runway.weeksLabel} (${runway.daysLabel})`,
      caption: runway.isOverdue
        ? `Lancement prévu le ${runway.launchLabel} (échéance atteinte).`
        : runway.isToday
          ? `Lancement prévu aujourd'hui (${runway.launchLabel}).`
          : `Lancement prévu le ${runway.launchLabel}.`
    });
  }

  return highlights;
};

export const ProjectShowcase = ({
  projectName,
  onClose,
  analysis,
  relevantTeams,
  questions,
  answers,
  timelineDetails,
  renderInStandalone = false,
  onUpdateAnswers
}) => {
  const rawProjectName = typeof projectName === 'string' ? projectName.trim() : '';
  const safeProjectName = rawProjectName.length > 0 ? rawProjectName : 'Votre projet';
  const normalizedTeams = Array.isArray(relevantTeams) ? relevantTeams : [];
  const teamNameById = useMemo(() => {
    const map = new Map();
    normalizedTeams.forEach(team => {
      if (team && team.id) {
        map.set(team.id, team.name || team.id);
      }
    });
    return map;
  }, [normalizedTeams]);

  const editableFields = useMemo(
    () =>
      SHOWCASE_FIELD_CONFIG.map(config => ({
        ...config,
        question: findQuestionById(questions, config.id)
      })),
    [questions]
  );

  const showcaseThemeId = SHOWCASE_THEME.id;

  const [isEditing, setIsEditing] = useState(false);
  const [draftValues, setDraftValues] = useState(() =>
    buildDraftValues(editableFields, answers, rawProjectName)
  );
  const [milestoneDragState, setMilestoneDragState] = useState(createEmptyMilestoneDragState);

  const resetMilestoneDragState = useCallback(() => {
    setMilestoneDragState(createEmptyMilestoneDragState());
  }, []);

  useEffect(() => {
    if (isEditing) {
      return;
    }
    setDraftValues(buildDraftValues(editableFields, answers, rawProjectName));
  }, [answers, editableFields, isEditing, rawProjectName]);

  useEffect(() => {
    if (!isEditing) {
      resetMilestoneDragState();
    }
  }, [isEditing, resetMilestoneDragState]);

  const canEdit = typeof onUpdateAnswers === 'function';
  const shouldShowPreview = !isEditing || !canEdit;
  const formId = 'project-showcase-edit-form';

  const handleStartEditing = useCallback(() => {
    setDraftValues(buildDraftValues(editableFields, answers, rawProjectName));
    resetMilestoneDragState();
    setIsEditing(true);
  }, [answers, editableFields, rawProjectName, resetMilestoneDragState]);

  const handleCancelEditing = useCallback(() => {
    setDraftValues(buildDraftValues(editableFields, answers, rawProjectName));
    setIsEditing(false);
  }, [answers, editableFields, rawProjectName]);

  const handleFieldChange = useCallback((fieldId, valueOrUpdater) => {
    setDraftValues(prev => {
      const nextValue =
        typeof valueOrUpdater === 'function'
          ? valueOrUpdater(prev[fieldId], prev)
          : valueOrUpdater;

      if (prev[fieldId] === nextValue) {
        return prev;
      }

      return {
        ...prev,
        [fieldId]: nextValue
      };
    });
  }, []);

  const handleSubmitEdit = useCallback(
    (event) => {
      event.preventDefault();
      if (!canEdit) {
        setIsEditing(false);
        return;
      }

      const updates = {};

      editableFields.forEach(field => {
        const { id } = field;
        if (!id) {
          return;
        }

        const type = field.question?.type || field.fallbackType || 'text';
        const rawPreviousValue = getRawAnswer(answers, id);
        const previousValue =
          rawPreviousValue === undefined || rawPreviousValue === null
            ? (type === 'multi_choice' || type === 'milestone_list' ? [] : '')
            : formatValueForDraft(type, rawPreviousValue);
        const nextValue =
          draftValues[id] !== undefined
            ? draftValues[id]
            : (type === 'multi_choice' || type === 'milestone_list' ? [] : '');

        if (areFieldValuesEqual(type, previousValue, nextValue)) {
          return;
        }

        updates[id] = formatValueForUpdate(type, nextValue);
      });

      if (Object.keys(updates).length > 0) {
        onUpdateAnswers(updates);
      }

      setIsEditing(false);
    },
    [answers, canEdit, draftValues, editableFields, onUpdateAnswers]
  );

  const missingShowcaseQuestions = useMemo(() => {
    const available = new Set(Array.isArray(questions) ? questions.map(question => question?.id).filter(Boolean) : []);
    return REQUIRED_SHOWCASE_QUESTION_IDS.filter(id => !available.has(id));
  }, [questions]);

  const slogan = getFormattedAnswer(questions, answers, 'projectSlogan');
  const targetAudience = getFormattedAnswer(questions, answers, 'targetAudience');
  const problemPainPoints = parseListAnswer(getRawAnswer(answers, 'problemPainPoints'));

  const solutionDescription = getFormattedAnswer(questions, answers, 'solutionDescription');
  const solutionBenefits = parseListAnswer(getRawAnswer(answers, 'solutionBenefits'));
  const solutionComparison = getFormattedAnswer(questions, answers, 'solutionComparison');

  const innovationProcess = getFormattedAnswer(questions, answers, 'innovationProcess');
  const visionStatement = getFormattedAnswer(questions, answers, 'visionStatement');
  const visionStatementEntries = useMemo(
    () => parseListAnswer(getRawAnswer(answers, 'visionStatement')),
    [answers]
  );
  const budgetEstimate = getFormattedAnswer(questions, answers, 'BUDGET');
  const normalizedTimelineDetails = useMemo(() => {
    if (Array.isArray(timelineDetails)) {
      return timelineDetails;
    }

    const analysisDetails = analysis?.timeline?.details;
    return Array.isArray(analysisDetails) ? analysisDetails : [];
  }, [analysis, timelineDetails]);

  const formattedBudgetEstimate = useMemo(() => {
    if (!hasText(budgetEstimate)) {
      return '';
    }

    const trimmed = budgetEstimate.trim();
    if (/[€]/i.test(trimmed)) {
      return trimmed;
    }

    return `${trimmed} K€`;
  }, [budgetEstimate]);

  const teamLead = getFormattedAnswer(questions, answers, 'teamLead');
  const teamLeadTeam = getFormattedAnswer(questions, answers, 'teamLeadTeam');
  const teamCoreMembers = parseListAnswer(getRawAnswer(answers, 'teamCoreMembers'));

  const rawRunway = useMemo(() => computeRunway(answers), [answers]);
  const animatedWeeks = useAnimatedCounter(rawRunway?.weeks ?? null, { duration: 1200 });
  const animatedDays = useAnimatedCounter(rawRunway?.days ?? null, { duration: 1200 });
  const runway = useMemo(() => {
    if (!rawRunway) {
      return null;
    }

    return {
      ...rawRunway,
      weeksLabel: formatCountdownUnit(animatedWeeks, 'sem.'),
      daysLabel: formatCountdownUnit(animatedDays, 'j.')
    };
  }, [rawRunway, animatedWeeks, animatedDays]);
  const timelineSummaries = useMemo(
    () => computeTimelineSummaries(normalizedTimelineDetails),
    [normalizedTimelineDetails]
  );
  const timelineProfiles = useMemo(
    () => extractTimelineProfiles(normalizedTimelineDetails),
    [normalizedTimelineDetails]
  );
  const vigilanceAlerts = useMemo(
    () =>
      buildVigilanceAlerts(
        analysis,
        questions,
        (teamId) => (teamNameById.has(teamId) ? teamNameById.get(teamId) : teamId || '')
      ),
    [analysis, questions, teamNameById]
  );
  const { summaries: timelineSummariesWithAlerts, unmatchedAlerts: unmatchedVigilanceAlerts } = useMemo(
    () => mergeTimelineSummariesWithAlerts(timelineSummaries, vigilanceAlerts),
    [timelineSummaries, vigilanceAlerts]
  );
  const manualMilestones = useMemo(
    () => buildManualMilestones(getRawAnswer(answers, 'roadmapMilestones')),
    [answers]
  );
  const heroHighlights = useMemo(
    () =>
      buildHeroHighlights({
        targetAudience,
        runway
      }),
    [targetAudience, runway]
  );

  const teamMemberCards = useMemo(
    () =>
      teamCoreMembers.map((entry, index) => {
        const raw = typeof entry === 'string' ? entry : String(entry ?? '');
        const normalized = raw.trim();

        if (normalized.length === 0) {
          return {
            id: `team-member-${index}`,
            name: 'Membre clé',
            details: null,
            initials: '•',
            fullText: raw
          };
        }

        const separatorIndex = normalized.search(/[-–—:•]/);
        const name = separatorIndex > -1 ? normalized.slice(0, separatorIndex).trim() : normalized;
        const details = separatorIndex > -1 ? normalized.slice(separatorIndex + 1).trim() : '';
        const initials = name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(part => part[0]?.toUpperCase() || '')
          .join('');

        return {
          id: `team-member-${index}`,
          name: name || normalized,
          details: details.length > 0 ? details : null,
          initials: initials.length > 0 ? initials : (normalized[0]?.toUpperCase() ?? '•'),
          fullText: normalized
        };
      }),
    [teamCoreMembers]
  );

  useEffect(() => {
    if (missingShowcaseQuestions.length === 0) {
      return;
    }

    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn(
        '[ProjectShowcase] Les questions suivantes sont absentes alors que la vitrine les attend :',
        missingShowcaseQuestions.join(', ')
      );
    }
  }, [missingShowcaseQuestions]);

  useEffect(() => {
    if (renderInStandalone || typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, renderInStandalone]);

  useEffect(() => {
    if (renderInStandalone) {
      return;
    }

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [renderInStandalone]);


  const hasTimelineProfiles = Array.isArray(timelineProfiles) && timelineProfiles.length > 0;
  const hasManualMilestones = manualMilestones.length > 0;
  const timelineProfileEntries = useMemo(() => {
    if (!hasTimelineProfiles) {
      return [];
    }

    return timelineProfiles.map((profile, index) => ({
      id: profile.id || `profile-${index}`,
      label: profile.label,
      description: profile.description || ''
    }));
  }, [hasTimelineProfiles, timelineProfiles]);

  const manualTimelineEntries = useMemo(
    () =>
      manualMilestones.map((milestone, index) => {
        const hasDate = typeof milestone.formattedDate === 'string' && milestone.formattedDate.length > 0;
        const hasDescription = typeof milestone.description === 'string' && milestone.description.length > 0;
        const label = hasDate
          ? milestone.formattedDate
          : hasDescription
            ? milestone.description
            : 'Jalon à venir';
        const description = hasDate && hasDescription ? milestone.description : '';

        return {
          id: milestone.id || `manual-milestone-${index}`,
          label,
          description
        };
      }),
    [manualMilestones]
  );

  const timelineEntries = useMemo(
    () => [...timelineProfileEntries, ...manualTimelineEntries],
    [timelineProfileEntries, manualTimelineEntries]
  );
  const hasTimelineEntries = timelineEntries.length > 0;
  const timelineSummariesToDisplay = useMemo(() => {
    if (!hasTimelineProfiles) {
      return timelineSummariesWithAlerts;
    }

    return timelineSummariesWithAlerts.filter(summary => !summary.hasProfiles);
  }, [hasTimelineProfiles, timelineSummariesWithAlerts]);
  const hasTimelineSummaries = timelineSummariesToDisplay.length > 0;
  const hasVigilanceAlerts = unmatchedVigilanceAlerts.length > 0;
  const hasTimelineSection = Boolean(
    runway || hasTimelineSummaries || hasManualMilestones || hasTimelineProfiles || hasVigilanceAlerts
  );

  const previewContent = shouldShowPreview ? (
    <div className="aurora-sections">
      <section className="aurora-section aurora-hero" data-showcase-section="hero">
        <div className="aurora-section__inner">
          <div className="aurora-hero__copy">
            
            <h1 className="aurora-hero__title">{safeProjectName}</h1>
            {hasText(slogan) && (
              <p className="aurora-hero__subtitle">{renderTextWithLinks(slogan)}</p>
            )}
            <div className="aurora-cta-group">
              <button type="button" className="aurora-cta">Découvrir le projet</button>
            </div>
          </div>
          {heroHighlights.length > 0 && (
            <div className="aurora-hero__highlights">
              {heroHighlights.map((highlight, index) => (
                <div
                  key={highlight.id}
                  className="aurora-hero-highlight"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <p className="aurora-hero-highlight__label">{highlight.label}</p>
                  <p className="aurora-hero-highlight__value">{highlight.value}</p>
                  <p className="aurora-hero-highlight__caption">{highlight.caption}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="aurora-section aurora-why" data-showcase-section="problem">
        <div className="aurora-section__inner aurora-section__inner--narrow">
          <div className="aurora-section__header">
            <p className="aurora-eyebrow">Le problème</p>
            <h2 className="aurora-section__title">Pourquoi ce projet doit exister</h2>
          </div>
          {problemPainPoints.length > 0 && (
            <div className="aurora-why__points">
              {problemPainPoints.map((point, index) => (
                <div
                  key={`${point}-${index}`}
                  className="aurora-why__point"
                  style={{ animationDelay: `${index * 0.12 + 0.1}s` }}
                >
                  <span className="aurora-why__beam" />
                  <span className="aurora-why__text">{renderTextWithLinks(point)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="aurora-section aurora-response" data-showcase-section="solution">
        <div className="aurora-section__inner">
          <div className="aurora-section__header aurora-section__header--split">
            <div>
              <p className="aurora-eyebrow">Notre solution</p>
              <h2 className="aurora-section__title">Comment nous changeons la donne</h2>
            </div>
          </div>
          <div className="aurora-pillars">
            {hasText(solutionDescription) && (
              <div className="aurora-pillar">
                <h3 className="aurora-pillar__title">En clair</h3>
                <p className="aurora-pillar__text">{renderTextWithLinks(solutionDescription)}</p>
              </div>
            )}
            {solutionBenefits.length > 0 && (
              <div className="aurora-pillar">
                <h3 className="aurora-pillar__title">Bénéfices clefs</h3>
                <ul className="aurora-pillar__list">
                  {solutionBenefits.map((benefit, index) => (
                    <li key={`${benefit}-${index}`} className="aurora-pillar__item">
                      <span className="aurora-pillar__bullet" />
                      <span>{renderTextWithLinks(benefit)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasText(solutionComparison) && (
              <div className="aurora-pillar">
                <h3 className="aurora-pillar__title">Pourquoi c'est différent</h3>
                <p className="aurora-pillar__text">{renderTextWithLinks(solutionComparison)}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {(hasText(innovationProcess) || hasText(visionStatement)) && (
        <section className="aurora-section aurora-difference" data-showcase-section="innovation">
          <div className="aurora-section__inner">
            <div className="aurora-section__header aurora-section__header--split">
              <div>
                <p className="aurora-eyebrow">Notre impact</p>
                <h2 className="aurora-section__title">Délivrer le maximum de valeur</h2>
              </div>
            </div>
            <div className="aurora-difference__layout">
              {hasText(innovationProcess) && (
                <div className="aurora-difference__text">
                  <div className="aurora-difference__text-section">
                    <p className="aurora-eyebrow">Objectifs</p>
                    <div className="aurora-difference__text-content">
                      {renderTextWithLinks(innovationProcess)}
                    </div>
                  </div>
                </div>
              )}
              {(visionStatementEntries.length > 0 || hasText(visionStatement)) && (
                <div className="aurora-difference__metrics">
                  <p className="aurora-eyebrow">KPIs</p>
                  {visionStatementEntries.length > 0 ? (
                    <ul className="aurora-difference__metrics-list">
                      {visionStatementEntries.map((entry, index) => (
                        <li key={`kpi-${index}`} className="aurora-difference__metrics-item">
                          <span className="aurora-difference__metrics-bullet" />
                          <span>{renderTextWithLinks(entry)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="aurora-difference__metrics-text">
                      {renderTextWithLinks(visionStatement)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="aurora-section aurora-team" data-showcase-section="team">
        <div className="aurora-section__inner">
          <div className="aurora-section__header">
            <p className="aurora-eyebrow">Équipe & alliances</p>
            <h2 className="aurora-section__title">L'équipe derrière le projet</h2>
          </div>
          <div className="aurora-team__layout">
            <div className="aurora-team__lead">
              {hasText(teamLead) && (
                <div className="aurora-team__lead-info">
                  <p className="aurora-team__lead-label">Lead du projet</p>
                  <p className="aurora-team__lead-name">{renderTextWithLinks(teamLead)}</p>
                  {hasText(teamLeadTeam) && (
                    <p className="aurora-team__lead-team">{`Équipe : ${teamLeadTeam}`}</p>
                  )}
                </div>
              )}
            </div>
            {teamMemberCards.length > 0 && (
              <div className="aurora-team__members">
                <p className="aurora-team__members-label">Équipe projet</p>
                <div className="aurora-team__carousel">
                  {teamMemberCards.map((member, index) => (
                    <div
                      key={member.id}
                      className="aurora-team__card"
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <span className="aurora-team__avatar">{member.initials}</span>
                      <div className="aurora-team__card-text">
                        <p className="aurora-team__card-name">{member.name}</p>
                        <p className="aurora-team__card-role">
                          {member.details
                            ? renderTextWithLinks(member.details)
                            : renderTextWithLinks(member.fullText)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {normalizedTeams.length > 0 && (
            <div className="aurora-partners">
              {normalizedTeams.map(team => (
                <div key={team.id} className="aurora-partner">
                  <span className="aurora-partner__name">{team.name}</span>
                  {team.expertise && <span className="aurora-partner__role">{team.expertise}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {hasTimelineSection && (
        <section className="aurora-section aurora-roadmap" data-showcase-section="timeline">
          <div className="aurora-section__inner">
            <div className="aurora-section__header aurora-section__header--split">
              <div>
                <p className="aurora-eyebrow">Feuille de route</p>
                <h2 className="aurora-section__title">Les prochains jalons</h2>
              </div>
              {hasText(formattedBudgetEstimate) && (
                <div className="aurora-roadmap__budget">
                  <p className="aurora-roadmap__budget-label">Budget estimé</p>
                  <p className="aurora-roadmap__budget-value">{formattedBudgetEstimate}</p>
                  <p className="aurora-roadmap__budget-caption">Montant total projeté pour l'initiative.</p>
                </div>
              )}
            </div>
            {runway && (
              <p className="aurora-roadmap__intro">
                {runway.isOverdue ? (
                  <>Le lancement prévu le {runway.launchLabel} a déjà eu lieu.</>
                ) : runway.isToday ? (
                  <>Dernière ligne droite : lancement aujourd'hui ({runway.launchLabel}).</>
                ) : (
                  <>
                    Compte à rebours : <span>{runway.weeksLabel}</span> ({runway.daysLabel}) avant le lancement prévu le {runway.launchLabel}.
                  </>
                )}
              </p>
            )}
            {hasTimelineSummaries && (
              timelineSummariesToDisplay.map((summary, index) => {
                const summaryRuleLabel = summary?.alert?.ruleName || summary?.ruleName;
                const alertTitle = summary?.alert?.title;

                return (
                  <div
                    key={summary.id || `timeline-summary-${index}`}
                    className={`aurora-roadmap__summary ${
                      summary.satisfied
                        ? 'aurora-roadmap__summary--ok'
                        : 'aurora-roadmap__summary--alert'
                    }`}
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {summaryRuleLabel && (
                      <p className="aurora-roadmap__label">
                        {renderTextWithLinks(summaryRuleLabel)}
                      </p>
                    )}
                    {alertTitle && (
                      <p className="aurora-roadmap__summary-title">
                        {renderTextWithLinks(alertTitle)}
                      </p>
                    )}
                    <p className="aurora-roadmap__value">{summary.weeks} semaines ({summary.days} jours)</p>
                    <p className="aurora-roadmap__caption">
                      {summary.satisfied
                        ? 'Runway conforme aux exigences identifiées.'
                        : 'Un ajustement est recommandé pour sécuriser les jalons.'}
                    </p>
                    {summary.alert?.requirementSummary && (
                      <p className="aurora-roadmap__summary-detail">
                        {renderTextWithLinks(summary.alert.requirementSummary)}
                      </p>
                    )}
                    {summary.alert?.statusMessage && (
                      <p className="aurora-roadmap__summary-detail aurora-roadmap__summary-detail--status">
                        {renderTextWithLinks(summary.alert.statusMessage)}
                      </p>
                    )}
                    {summary.alert?.teamLabel && (
                      <p className="aurora-roadmap__summary-team">Équipe référente : {summary.alert.teamLabel}</p>
                    )}
                  </div>
                );
              })
            )}
            {hasVigilanceAlerts && (
              <div className="aurora-roadmap__watchpoints">
                {unmatchedVigilanceAlerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    className={`aurora-roadmap__watchpoint aurora-roadmap__watchpoint--${alert.status}`}
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <p className="aurora-roadmap__watchpoint-eyebrow">{alert.ruleName}</p>
                    <p className="aurora-roadmap__watchpoint-title">{renderTextWithLinks(alert.title)}</p>
                    {alert.requirementSummary && (
                      <p className="aurora-roadmap__watchpoint-text">{alert.requirementSummary}</p>
                    )}
                    {alert.statusMessage && (
                      <p className="aurora-roadmap__watchpoint-caption">{alert.statusMessage}</p>
                    )}
                    {alert.teamLabel && (
                      <p className="aurora-roadmap__watchpoint-team">Équipe référente : {alert.teamLabel}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {hasTimelineEntries && (
              <ul className="aurora-roadmap__timeline">
                {timelineEntries.map((entry, index) => (
                  <li
                    key={entry.id || `timeline-entry-${index}`}
                    className="aurora-roadmap__step"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className="aurora-roadmap__node" />
                    <div>
                      <p className="aurora-roadmap__label">{entry.label}</p>
                      {entry.description && (
                        <p className="aurora-roadmap__caption">{renderTextWithLinks(entry.description)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  ) : (
    <div className="aurora-preview-placeholder">
      <h2 className="aurora-preview-placeholder__title">Mode édition activé</h2>
      <p className="aurora-preview-placeholder__text">
        Le rendu Aurora est temporairement masqué pendant vos ajustements.
      </p>
    </div>
  );

  const editPanel = isEditing && canEdit ? (
    <form id={formId} onSubmit={handleSubmitEdit} className="aurora-edit-panel">
      <div className="aurora-edit-panel__header">
        <div>
          <p className="aurora-eyebrow aurora-eyebrow--soft">Mode édition actif</p>
          <h3 className="aurora-edit-panel__title">Ajustez les informations présentées dans la vitrine</h3>
        </div>
        <p className="aurora-edit-panel__intro">
          Chaque modification sera appliquée aux réponses du questionnaire correspondant.
        </p>
      </div>
      <div className="aurora-edit-panel__grid">
        {editableFields.map(field => {
          const fieldId = field.id;
          const question = field.question;
          const type = question?.type || field.fallbackType || 'text';
          const label = question?.question || field.fallbackLabel || fieldId;
          const fieldValue = draftValues[fieldId];
          const options = Array.isArray(question?.options) ? question.options : [];
          const isLong = type === 'long_text';
          const isMulti = type === 'multi_choice';
          const isChoice = type === 'choice';
          const isDate = type === 'date';
          const isMilestoneList = type === 'milestone_list';
          const isMultiWithOptions = isMulti && options.length > 0;
          const isMultiFreeform = isMulti && !isMultiWithOptions;
          const isChoiceWithOptions = isChoice && options.length > 0;
          const selectedValues = Array.isArray(fieldValue) ? fieldValue : [];
          const textValue = typeof fieldValue === 'string' ? fieldValue : '';
          const helperText = isMilestoneList
            ? 'Ajoutez une date (optionnelle) et un descriptif pour chaque jalon.'
            : isMultiWithOptions
              ? 'Sélectionnez une ou plusieurs options.'
              : isMultiFreeform
                ? 'Indiquez une valeur par ligne.'
                : ['problemPainPoints', 'solutionBenefits', 'teamCoreMembers', 'visionStatement'].includes(fieldId)
                  ? 'Utilisez une ligne par élément pour une meilleure mise en forme.'
                  : null;

          const milestoneDraftEntries = isMilestoneList && Array.isArray(fieldValue) ? fieldValue : [];

          const updateMilestoneDraft = (updater) => {
            handleFieldChange(fieldId, previousValue => {
              const previousEntries = Array.isArray(previousValue)
                ? previousValue.map(entry => ({
                    date: typeof entry?.date === 'string' ? entry.date : '',
                    description: typeof entry?.description === 'string' ? entry.description : ''
                  }))
                : [];
              const nextEntries = typeof updater === 'function' ? updater(previousEntries) : updater;
              return Array.isArray(nextEntries) ? nextEntries : [];
            });
          };

          const handleMilestoneDraftChange = (index, fieldName, value) => {
            updateMilestoneDraft(entries => {
              const nextEntries = entries.map((entry, entryIndex) => (
                entryIndex === index ? { ...entry, [fieldName]: value } : entry
              ));
              return nextEntries;
            });
          };

          const handleMilestoneDraftRemoval = (index) => {
            updateMilestoneDraft(entries => entries.filter((_, entryIndex) => entryIndex !== index));
          };

          const handleMilestoneDraftAddition = () => {
            updateMilestoneDraft(entries => [...entries, { date: '', description: '' }]);
          };

          const handleMilestoneDragStart = (index, event) => {
            if (event?.dataTransfer) {
              event.dataTransfer.effectAllowed = 'move';
              try {
                event.dataTransfer.setData('text/plain', String(index));
              } catch (_error) {
                // Certains navigateurs peuvent empêcher l'écriture : on ignore l'erreur.
              }
            }

            setMilestoneDragState({
              fieldId,
              sourceIndex: index,
              targetIndex: index
            });
          };

          const handleMilestoneDragEnter = (index) => {
            setMilestoneDragState(previous => {
              if (previous.fieldId !== fieldId || previous.targetIndex === index) {
                return previous;
              }

              return {
                ...previous,
                targetIndex: index
              };
            });
          };

          const handleMilestoneDragLeave = (index, event) => {
            if (event?.currentTarget?.contains(event?.relatedTarget)) {
              return;
            }

            setMilestoneDragState(previous => {
              if (previous.fieldId !== fieldId || previous.targetIndex !== index) {
                return previous;
              }

              return {
                ...previous,
                targetIndex: previous.sourceIndex
              };
            });
          };

          const handleMilestoneDragOver = (event) => {
            if (milestoneDragState.fieldId === fieldId) {
              event.preventDefault();
              if (event?.dataTransfer) {
                event.dataTransfer.dropEffect = 'move';
              }
            }
          };

          const handleMilestoneDrop = (index, event) => {
            if (milestoneDragState.fieldId !== fieldId) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();

            setMilestoneDragState(previous => {
              if (previous.fieldId !== fieldId || typeof previous.sourceIndex !== 'number') {
                return createEmptyMilestoneDragState();
              }

              const rawTargetIndex = typeof index === 'number' ? index : previous.targetIndex;

              if (typeof rawTargetIndex !== 'number') {
                return createEmptyMilestoneDragState();
              }

              updateMilestoneDraft(entries => {
                if (!Array.isArray(entries) || entries.length <= 1) {
                  return Array.isArray(entries) ? entries : [];
                }

                const boundedSourceIndex = Math.max(0, Math.min(entries.length - 1, previous.sourceIndex));
                const maxTargetIndex = entries.length;
                const normalizedTargetIndex = Math.max(0, Math.min(maxTargetIndex, rawTargetIndex));

                let insertionIndex = normalizedTargetIndex;
                if (boundedSourceIndex < normalizedTargetIndex) {
                  insertionIndex = normalizedTargetIndex - 1;
                }

                const workingEntries = entries.slice();
                const [movedEntry] = workingEntries.splice(boundedSourceIndex, 1);

                if (!movedEntry) {
                  return entries;
                }

                const safeInsertionIndex = Math.max(0, Math.min(workingEntries.length, insertionIndex));
                workingEntries.splice(safeInsertionIndex, 0, movedEntry);

                return workingEntries;
              });

              return createEmptyMilestoneDragState();
            });
          };

          const handleMilestoneDragEnd = () => {
            resetMilestoneDragState();
          };

          const isDropTargetAtEnd =
            milestoneDragState.fieldId === fieldId && milestoneDragState.targetIndex === milestoneDraftEntries.length;

          return (
            <div key={fieldId} className={`aurora-field${isLong || isMulti || isMilestoneList ? ' aurora-field--wide' : ''}`}>
              <label htmlFor={`showcase-edit-${fieldId}`} className="aurora-field__label">
                {label}
              </label>
              {isMilestoneList ? (
                <div className="aurora-milestone-list">
                  {milestoneDraftEntries.length === 0 && (
                    <p className="aurora-field__helper">Aucun jalon n'a encore été ajouté.</p>
                  )}
                  {milestoneDraftEntries.map((entry, index) => {
                    const dateInputId = `showcase-edit-${fieldId}-date-${index}`;
                    const descriptionInputId = `showcase-edit-${fieldId}-description-${index}`;
                    const isCurrentDragging =
                      milestoneDragState.fieldId === fieldId && milestoneDragState.sourceIndex === index;
                    const isCurrentDropTarget =
                      milestoneDragState.fieldId === fieldId &&
                      milestoneDragState.targetIndex === index &&
                      milestoneDragState.sourceIndex !== index;
                    const milestoneRowClasses = [
                      'aurora-milestone-row',
                      isCurrentDragging ? 'aurora-milestone-row--dragging' : '',
                      isCurrentDropTarget ? 'aurora-milestone-row--drop-target' : ''
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <div
                        key={dateInputId}
                        className={milestoneRowClasses}
                        draggable={milestoneDraftEntries.length > 1}
                        onDragStart={event => handleMilestoneDragStart(index, event)}
                        onDragEnter={() => handleMilestoneDragEnter(index)}
                        onDragLeave={event => handleMilestoneDragLeave(index, event)}
                        onDragOver={handleMilestoneDragOver}
                        onDrop={event => handleMilestoneDrop(index, event)}
                        onDragEnd={handleMilestoneDragEnd}
                        aria-grabbed={isCurrentDragging ? 'true' : 'false'}
                      >
                        <div className="aurora-milestone-row__date">
                          <label htmlFor={dateInputId} className="aurora-milestone-label">
                            Date
                          </label>
                          <input
                            id={dateInputId}
                            type="date"
                            value={typeof entry?.date === 'string' ? entry.date : ''}
                            onChange={event => handleMilestoneDraftChange(index, 'date', event.target.value)}
                            className="aurora-form-control"
                          />
                        </div>
                        <div className="aurora-milestone-row__description">
                          <label htmlFor={descriptionInputId} className="aurora-milestone-label">
                            Description
                          </label>
                          <input
                            id={descriptionInputId}
                            type="text"
                            value={typeof entry?.description === 'string' ? entry.description : ''}
                            onChange={event => handleMilestoneDraftChange(index, 'description', event.target.value)}
                            className="aurora-form-control"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMilestoneDraftRemoval(index)}
                          className="aurora-milestone-remove"
                        >
                          <Trash2 className="aurora-milestone-remove__icon" />
                          Supprimer
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleMilestoneDraftAddition}
                    className={`aurora-milestone-add${isDropTargetAtEnd ? ' aurora-milestone-add--drop-target' : ''}`}
                    onDragEnter={() => handleMilestoneDragEnter(milestoneDraftEntries.length)}
                    onDragLeave={event => handleMilestoneDragLeave(milestoneDraftEntries.length, event)}
                    onDragOver={handleMilestoneDragOver}
                    onDrop={event => handleMilestoneDrop(milestoneDraftEntries.length, event)}
                  >
                    <Plus className="aurora-milestone-add__icon" />
                    Ajouter un jalon
                  </button>
                </div>
              ) : isDate ? (
                <input
                  id={`showcase-edit-${fieldId}`}
                  type="date"
                  value={typeof fieldValue === 'string' ? fieldValue : ''}
                  onChange={event => handleFieldChange(fieldId, event.target.value)}
                  className="aurora-form-control"
                />
              ) : isMultiWithOptions ? (
                <div className="aurora-option-grid">
                  {options.map((option, optionIndex) => {
                    const optionId = `showcase-edit-${fieldId}-option-${optionIndex}`;
                    const isChecked = selectedValues.includes(option);

                    return (
                      <label
                        key={optionId}
                        htmlFor={optionId}
                        className={`aurora-option${isChecked ? ' aurora-option--active' : ''}`}
                      >
                        <input
                          id={optionId}
                          type="checkbox"
                          value={option}
                          checked={isChecked}
                          onChange={event => {
                            const { checked } = event.target;
                            handleFieldChange(fieldId, previousValue => {
                              const previousSelections = Array.isArray(previousValue) ? previousValue : [];
                              const selectionSet = new Set(previousSelections);

                              if (checked) {
                                selectionSet.add(option);
                              } else {
                                selectionSet.delete(option);
                              }

                              if (options.length > 0) {
                                return options.filter(choice => selectionSet.has(choice));
                              }

                              return Array.from(selectionSet);
                            });
                          }}
                          className="aurora-option__checkbox"
                        />
                        <span className="aurora-option__text">{option}</span>
                      </label>
                    );
                  })}
                </div>
              ) : isChoiceWithOptions ? (
                <select
                  id={`showcase-edit-${fieldId}`}
                  value={textValue}
                  onChange={event => handleFieldChange(fieldId, event.target.value)}
                  className="aurora-form-control"
                >
                  <option value="">Sélectionnez une option</option>
                  {options.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : isLong || isMultiFreeform ? (
                <textarea
                  id={`showcase-edit-${fieldId}`}
                  value={textValue}
                  onChange={event => handleFieldChange(fieldId, event.target.value)}
                  rows={isMultiFreeform ? 4 : 5}
                  className="aurora-form-control aurora-form-control--textarea"
                />
              ) : (
                <input
                  id={`showcase-edit-${fieldId}`}
                  type="text"
                  value={textValue}
                  onChange={event => handleFieldChange(fieldId, event.target.value)}
                  className="aurora-form-control"
                />
              )}
              {helperText && <p className="aurora-field__helper">{helperText}</p>}
            </div>
          );
        })}
      </div>
      <div className="aurora-edit-panel__actions">
        <button type="button" onClick={handleCancelEditing} className="aurora-button aurora-button--ghost">
          Annuler
        </button>
        <button type="submit" className="aurora-button aurora-button--primary">
          <CheckCircle className="aurora-button__icon" />
          Enregistrer les modifications
        </button>
      </div>
    </form>
  ) : null;

  const editBar =
    canEdit && !isEditing ? (
      <div className="aurora-edit-bar">
        <button
          type="button"
          onClick={handleStartEditing}
          className="aurora-button aurora-button--outline aurora-edit-bar__trigger"
        >
          <Edit className="aurora-button__icon" />
          Modifier
        </button>
      </div>
    ) : null;

  const content = (
    <>
      {editBar}
      {editPanel}
      {previewContent}
    </>
  );

  if (renderInStandalone) {
    return (
      <div
        data-showcase-scope
        data-showcase-theme={showcaseThemeId}
        className="aurora-shell aurora-shell--standalone"
      >
        {content}
      </div>
    );
  }

  return (
    <section
      data-showcase-scope
      data-showcase-theme={showcaseThemeId}
      className="aurora-shell"
      aria-label="Vitrine marketing du projet"
    >
      {content}
    </section>
  );
};
