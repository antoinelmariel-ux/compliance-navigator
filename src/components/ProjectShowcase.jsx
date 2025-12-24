import React, { useCallback, useEffect, useMemo, useRef, useState } from '../react.js';
import {
  CheckCircle,
  Edit,
  Plus,
  Trash2
} from './icons.js';
import { formatAnswer } from '../utils/questions.js';
import { renderTextWithLinks } from '../utils/linkify.js';
import { initialShowcaseThemes } from '../data/showcaseThemes.js';
import { RichTextEditor } from './RichTextEditor.jsx';

const SHOWCASE_SECTION_OPTIONS = [
  { id: 'notice', label: 'Message de complétude' },
  { id: 'hero', label: 'Hero du projet' },
  { id: 'problem', label: 'Le problème' },
  { id: 'solution', label: 'La réponse' },
  { id: 'innovation', label: 'Différenciation & impact' },
  { id: 'team', label: 'Équipe & alliances' },
  { id: 'timeline', label: 'Feuille de route' }
];

const SECTION_TEMPLATES = [
  {
    id: 'highlight',
    name: 'Bloc mise en avant',
    description: 'Un bandeau court pour mettre un chiffre ou une promesse clé en lumière.',
    placeholder: {
      title: 'Impact attendu',
      description: 'Un message synthétique pour convaincre immédiatement.',
      accent: 'Nouveau'
    }
  },
  {
    id: 'document-viewer',
    name: 'Visionneuse documentaire',
    description: 'Un titre, un sous-titre et une visionneuse intégrée pour un document SharePoint.',
    placeholder: {
      title: 'Document de référence',
      subtitle: 'Accès rapide aux supports projet',
      description: 'Ajoutez un lien SharePoint (PDF, image ou présentation) pour l’afficher directement.',
      documentUrl: 'https://votre-tenant.sharepoint.com/sites/projet/Shared%20Documents/brief.pdf',
      documentType: 'pdf',
      accent: 'SharePoint'
    }
  },
  {
    id: 'story',
    name: 'Bloc narratif',
    description: 'Un encart avec un titre et un texte riche pour raconter une étape clé.',
    placeholder: {
      title: 'Une histoire qui marque',
      description: 'Ajoutez un paragraphe clair, des liens et des éléments de contexte.'
    }
  },
  {
    id: 'checklist',
    name: 'Points d’attention',
    description: 'Une liste courte pour détailler des livrables, risques ou actions à suivre.',
    placeholder: {
      title: 'Nos priorités',
      description: 'Listez 3 à 5 éléments concrets à surveiller.',
      items: ['Point clé #1', 'Point clé #2', 'Point clé #3']
    }
  }
];

const buildDefaultLightSectionSelection = (sectionIds = SHOWCASE_SECTION_OPTIONS.map(section => section.id)) =>
  sectionIds.reduce((acc, sectionId) => {
    acc[sectionId] = true;
    return acc;
  }, {});

const DOCUMENT_VIEWER_TYPES = [
  { id: 'pdf', label: 'PDF' },
  { id: 'jpg', label: 'JPG' },
  { id: 'png', label: 'PNG' },
  { id: 'pptx', label: 'PPTX' }
];

const resolveDocumentEmbedSrc = (documentUrl, documentType) => {
  if (!documentUrl) {
    return '';
  }

  if (documentType !== 'pptx') {
    return documentUrl;
  }

  if (documentUrl.includes('officeapps.live.com')) {
    return documentUrl;
  }

  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`;
};

const sanitizeCustomSections = (rawSections) => {
  if (!Array.isArray(rawSections)) {
    return [];
  }

  return rawSections
    .map((section, index) => {
      if (!section || typeof section !== 'object') {
        return null;
      }

      const id = typeof section.id === 'string' && section.id.trim().length > 0
        ? section.id.trim()
        : `custom-section-${index}`;

      const title = typeof section.title === 'string' ? section.title.trim() : '';
      const subtitle = typeof section.subtitle === 'string' ? section.subtitle.trim() : '';
      const description = typeof section.description === 'string' ? section.description.trim() : '';
      const accent = typeof section.accent === 'string' ? section.accent.trim() : '';
      const documentUrl = typeof section.documentUrl === 'string' ? section.documentUrl.trim() : '';
      const documentType = typeof section.documentType === 'string' ? section.documentType.trim() : '';
      const items = Array.isArray(section.items)
        ? section.items.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
        : [];
      const type = typeof section.type === 'string' ? section.type : SECTION_TEMPLATES[0].id;

      if (!title && !subtitle && !description && !documentUrl && items.length === 0) {
        return null;
      }

      return {
        id,
        type,
        title,
        subtitle,
        description,
        accent,
        documentUrl,
        documentType,
        items
      };
    })
    .filter(Boolean);
};

const normalizeSectionOrder = (rawOrder, customSections) => {
  const baseOrder = SHOWCASE_SECTION_OPTIONS.map(section => section.id);
  const customIds = Array.isArray(customSections) ? customSections.map(section => section.id) : [];
  const fallbackOrder = [...baseOrder, ...customIds];

  if (!Array.isArray(rawOrder)) {
    return fallbackOrder;
  }

  const knownIds = new Set(fallbackOrder);
  const seen = new Set();
  const normalized = [];

  rawOrder.forEach(entry => {
    if (typeof entry !== 'string' || !knownIds.has(entry) || seen.has(entry)) {
      return;
    }
    normalized.push(entry);
    seen.add(entry);
  });

  fallbackOrder.forEach(entry => {
    if (!seen.has(entry)) {
      normalized.push(entry);
    }
  });

  return normalized;
};

const areCustomSectionsEqual = (previous, next) => {
  if (!Array.isArray(previous) && !Array.isArray(next)) {
    return true;
  }

  if (!Array.isArray(previous) || !Array.isArray(next) || previous.length !== next.length) {
    return false;
  }

  return previous.every((entry, index) => {
    const candidate = next[index];
    if (!candidate) {
      return false;
    }

    return entry.id === candidate.id
      && entry.title === candidate.title
      && entry.description === candidate.description
      && entry.accent === candidate.accent
      && JSON.stringify(entry.items || []) === JSON.stringify(candidate.items || [])
      && entry.type === candidate.type;
  });
};

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

  const formatted = formatAnswer(question, answers?.[id]);

  if (typeof formatted === 'string') {
    const trimmed = formatted.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  } else if (formatted) {
    return formatted;
  }

  return question.required ? 'Information à compléter' : '';
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
    const diffWeeks = alert.diff && typeof alert.diff.diffInWeeks === 'number'
      ? alert.diff.diffInWeeks
      : null;
    const diffDays = alert.diff && typeof alert.diff.diffInDays === 'number'
      ? alert.diff.diffInDays
      : null;

    const requiredWeeks = typeof alert.requiredWeeks === 'number' ? alert.requiredWeeks : null;
    const requiredDays = typeof alert.requiredDays === 'number' ? alert.requiredDays : null;

    const requiredParts = [];
    if (requiredWeeks !== null) {
      requiredParts.push(`${formatNumberFR(requiredWeeks)} sem.`);
    }
    if (requiredDays !== null) {
      requiredParts.push(`${formatNumberFR(requiredDays)} j.`);
    }

    const missingParts = [];
    if (requiredWeeks !== null && diffWeeks !== null) {
      const missingWeeks = requiredWeeks - diffWeeks;
      if (missingWeeks > 0.0001) {
        missingParts.push(formatWeeksValue(missingWeeks));
      }
    }
    if (requiredDays !== null && diffDays !== null) {
      const missingDays = requiredDays - diffDays;
      if (missingDays > 0.0001) {
        missingParts.push(formatDaysValue(missingDays));
      }
    }

    if (missingParts.length > 0 && requiredParts.length > 0) {
      return `Écart à combler : ${missingParts.join(' / ')} pour atteindre le minimum requis de ${requiredParts.join(' / ')}. Ajuster le planning en conséquence.`;
    }

    if (missingParts.length > 0) {
      return `Écart à combler : ${missingParts.join(' / ')}. Ajuster le planning en conséquence.`;
    }

    const diffParts = [];
    if (diffWeeks !== null) {
      diffParts.push(formatWeeksValue(diffWeeks));
    }
    if (diffDays !== null) {
      diffParts.push(formatDaysValue(diffDays));
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
    .filter(alert => alert && typeof alert === 'object')
    .map((alert, index) => {
      const title = alert.riskDescription && alert.riskDescription.trim().length > 0
        ? alert.riskDescription.trim()
        : alert.ruleName;

      const normalizedRuleId = alert?.ruleId != null
        ? (() => {
            const value = String(alert.ruleId).trim();
            return value.length > 0 ? value : null;
          })()
        : null;
      const normalizedRiskId = alert?.riskId != null
        ? (() => {
            const value = String(alert.riskId).trim();
            return value.length > 0 ? value : null;
          })()
        : null;
      const normalizedRiskDescription = typeof alert?.riskDescription === 'string'
        ? alert.riskDescription.trim()
        : '';

      return {
        id: alert.id || `${alert.ruleId || 'rule'}-${alert.riskId || index}`,
        ruleId: normalizedRuleId,
        ruleName: alert.ruleName,
        riskId: normalizedRiskId,
        riskDescription: normalizedRiskDescription,
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

  const alertKeyMap = new Map();

  const registerKey = (map, key, entry) => {
    if (key === null || key === undefined) {
      return;
    }

    const stringKey = typeof key === 'string' ? key : String(key);
    if (stringKey.length === 0) {
      return;
    }

    if (!map.has(stringKey)) {
      map.set(stringKey, entry);
    }

    const normalized = stringKey.trim().toLowerCase();
    if (normalized.length > 0 && !map.has(normalized)) {
      map.set(normalized, entry);
    }
  };

  const registerTextKey = (map, text, entry) => {
    if (typeof text !== 'string') {
      return;
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }

    registerKey(map, trimmed, entry);
  };

  const registerCompositeKey = (map, parts, entry) => {
    if (!Array.isArray(parts)) {
      return;
    }

    const normalizedParts = parts
      .map(part => {
        if (part === null || part === undefined) {
          return null;
        }

        if (typeof part === 'string') {
          const trimmed = part.trim();
          return trimmed.length > 0 ? trimmed : null;
        }

        const stringified = String(part);
        return stringified.length > 0 ? stringified : null;
      })
      .filter(Boolean);

    if (normalizedParts.length === 0) {
      return;
    }

    registerKey(map, normalizedParts.join('::'), entry);
  };

  safeAlerts.forEach((alert, index) => {
    if (!alert || typeof alert !== 'object') {
      return;
    }

    const entry = { alert, index };

    registerTextKey(alertKeyMap, alert.id, entry);
    registerTextKey(alertKeyMap, alert.ruleId, entry);
    registerTextKey(alertKeyMap, alert.ruleName, entry);
    registerTextKey(alertKeyMap, alert.title, entry);
    registerTextKey(alertKeyMap, alert.riskDescription, entry);

    if (alert.ruleId) {
      if (alert.riskId != null) {
        const riskId = String(alert.riskId);
        registerKey(alertKeyMap, `${alert.ruleId}-${riskId}`, entry);
        registerKey(alertKeyMap, `${alert.ruleId}__${riskId}`, entry);
        registerCompositeKey(alertKeyMap, [alert.ruleId, riskId], entry);
      } else {
        registerKey(alertKeyMap, `${alert.ruleId}-risk`, entry);
      }

      if (typeof alert.title === 'string' && alert.title.trim().length > 0) {
        registerCompositeKey(alertKeyMap, [alert.ruleId, alert.title], entry);
      }

      if (typeof alert.riskDescription === 'string' && alert.riskDescription.trim().length > 0) {
        registerCompositeKey(alertKeyMap, [alert.ruleId, alert.riskDescription], entry);
      }

      if (typeof alert.ruleName === 'string' && alert.ruleName.trim().length > 0) {
        registerCompositeKey(alertKeyMap, [alert.ruleId, alert.ruleName], entry);
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

    if (summary.ruleId) {
      candidateKeys.push(summary.ruleId);

      if (summary.ruleLabel) {
        candidateKeys.push(`${summary.ruleId}::${summary.ruleLabel}`);
      }

      if (summary.ruleName && typeof summary.ruleName === 'string') {
        candidateKeys.push(`${summary.ruleId}::${summary.ruleName}`);
      }

      if (summary.riskDescription) {
        candidateKeys.push(`${summary.ruleId}::${summary.riskDescription}`);
      }

      if (!summary.riskId && summary.source) {
        candidateKeys.push(`${summary.ruleId}-${summary.source}`);
        candidateKeys.push(`${summary.ruleId}::${summary.source}`);
      }
    }

    if (summary.ruleLabel) {
      candidateKeys.push(summary.ruleLabel);
    }

    if (summary.ruleName && typeof summary.ruleName === 'string') {
      candidateKeys.push(summary.ruleName);
    }

    if (summary.riskDescription) {
      candidateKeys.push(summary.riskDescription);
    }

    if (summary.riskId != null) {
      candidateKeys.push(summary.riskId);

      if (summary.ruleId) {
        candidateKeys.push(`${summary.ruleId}-${summary.riskId}`);
        candidateKeys.push(`${summary.ruleId}__${summary.riskId}`);
        candidateKeys.push(`${summary.ruleId}::${summary.riskId}`);
      }
    }

    let matchedEntry = null;

    for (const key of candidateKeys) {
      if (!key) {
        continue;
      }

      if (alertKeyMap.has(key)) {
        matchedEntry = alertKeyMap.get(key);
        break;
      }

      if (typeof key === 'string') {
        const normalizedKey = key.trim().toLowerCase();
        if (alertKeyMap.has(normalizedKey)) {
          matchedEntry = alertKeyMap.get(normalizedKey);
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

const FALLBACK_SHOWCASE_THEME = initialShowcaseThemes[0] || {
  id: 'aurora',
  label: 'Aurora néon',
  description: 'Jeux de lumières et ambiance futuriste pour un rendu premium.',
  palette: {}
};

const normalizeColorValue = (value, fallback) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return fallback;
};

const toRgba = (value, alpha = 1, fallback = 'rgba(0, 0, 0, 1)') => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  const normalized = value.trim();

  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
    let hex = normalized.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    const numeric = parseInt(hex, 16);
    const r = (numeric >> 16) & 255;
    const g = (numeric >> 8) & 255;
    const b = numeric & 255;
    const safeAlpha = Math.min(1, Math.max(0, typeof alpha === 'number' ? alpha : 1));

    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }

  if (/^rgba?\(/i.test(normalized)) {
    if (normalized.startsWith('rgb(') && typeof alpha === 'number') {
      return normalized.replace(/^rgb\((.*)\)$/i, `rgba($1, ${Math.min(1, Math.max(0, alpha))})`);
    }

    return normalized;
  }

  return fallback;
};

const buildThemeVariables = (theme) => {
  const palette = (theme && typeof theme === 'object' ? theme.palette : null) || {};
  const accentPrimary = normalizeColorValue(palette.accentPrimary, '#2563eb');
  const accentSecondary = normalizeColorValue(palette.accentSecondary, '#06b6d4');
  const borderBase = normalizeColorValue(palette.border, '#94a3b8');
  const highlightBase = normalizeColorValue(palette.highlight, accentSecondary);

  return {
    '--showcase-bg-start': normalizeColorValue(palette.backgroundStart, '#020309'),
    '--showcase-bg-mid': normalizeColorValue(palette.backgroundMid, '#050b18'),
    '--showcase-bg-end': normalizeColorValue(palette.backgroundEnd, '#020309'),
    '--showcase-glow-primary': toRgba(palette.glowPrimary || accentPrimary, 0.18, 'rgba(59, 130, 246, 0.18)'),
    '--showcase-glow-secondary': toRgba(palette.glowSecondary || accentSecondary, 0.16, 'rgba(14, 165, 233, 0.16)'),
    '--showcase-text-strong': normalizeColorValue(palette.textPrimary, '#f8fafc'),
    '--showcase-text-soft': normalizeColorValue(palette.textSecondary, '#e2e8f0'),
    '--showcase-accent-primary': accentPrimary,
    '--showcase-accent-secondary': accentSecondary,
    '--showcase-surface': toRgba(palette.surface, 0.78, 'rgba(8, 13, 22, 0.78)'),
    '--showcase-border-strong': toRgba(borderBase, 0.25, 'rgba(148, 163, 184, 0.25)'),
    '--showcase-border-soft': toRgba(borderBase, 0.28, 'rgba(148, 163, 184, 0.28)'),
    '--showcase-highlight-strong': toRgba(highlightBase, 0.85, 'rgba(148, 197, 255, 0.85)'),
    '--showcase-highlight-soft': toRgba(highlightBase, 0.7, 'rgba(148, 197, 255, 0.7)'),
    '--showcase-shadow-soft': toRgba(accentSecondary, 0.32, 'rgba(14, 165, 233, 0.32)'),
    '--showcase-shadow-strong': toRgba(accentSecondary, 0.4, 'rgba(14, 165, 233, 0.4)')
  };
};

const normalizeThemeKey = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const resolveShowcaseTheme = (themes, answer) => {
  const availableThemes = Array.isArray(themes) && themes.length > 0 ? themes : initialShowcaseThemes;
  const normalizedAnswer = normalizeThemeKey(answer);

  if (normalizedAnswer.length > 0) {
    const matched = availableThemes.find(theme => {
      if (!theme) {
        return false;
      }

      const candidates = [theme.id, theme.label, ...(Array.isArray(theme.aliases) ? theme.aliases : [])]
        .filter(Boolean)
        .map(normalizeThemeKey);

      return candidates.includes(normalizedAnswer);
    });

    if (matched) {
      return matched;
    }
  }

  return availableThemes[0] || FALLBACK_SHOWCASE_THEME;
};

const SHOWCASE_FIELD_CONFIG = [
  { id: 'projectName', fallbackLabel: 'Nom du projet', fallbackType: 'text' },
  { id: 'projectSlogan', fallbackLabel: 'Slogan du projet', fallbackType: 'text' },
  { id: 'showcaseTheme', fallbackLabel: 'Thème de la vitrine', fallbackType: 'choice' },
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

const FIELD_SECTION_MAP = {
  projectName: 'hero',
  projectSlogan: 'hero',
  showcaseTheme: 'hero',
  targetAudience: 'hero',
  problemPainPoints: 'problem',
  solutionDescription: 'solution',
  solutionBenefits: 'solution',
  solutionComparison: 'solution',
  innovationProcess: 'innovation',
  visionStatement: 'innovation',
  BUDGET: 'innovation',
  teamLead: 'team',
  teamLeadTeam: 'team',
  teamCoreMembers: 'team',
  campaignKickoffDate: 'timeline',
  launchDate: 'timeline',
  roadmapMilestones: 'timeline'
};

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
      const ruleId = detail?.ruleId != null
        ? (() => {
            const value = String(detail.ruleId).trim();
            return value.length > 0 ? value : null;
          })()
        : null;
      const riskId = detail?.riskId != null
        ? (() => {
            const value = String(detail.riskId).trim();
            return value.length > 0 ? value : null;
          })()
        : null;
      const ruleLabel = typeof detail?.ruleName === 'string'
        ? detail.ruleName.trim()
        : '';
      const identifier = detail?.id
        || `${ruleId || ruleLabel || 'rule'}-${riskId || source || index}`;

      return {
        id: identifier,
        ruleId,
        ruleName: summaryLabel,
        ruleLabel,
        riskId,
        riskDescription: riskLabel,
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
  onUpdateAnswers,
  tourContext = null,
  showcaseThemes = initialShowcaseThemes,
  hasIncompleteAnswers = false,
  onAnnotationScopeChange = null,
  onEditingStateChange = null
}) => {
  const rawProjectName = typeof projectName === 'string' ? projectName.trim() : '';
  const safeProjectName = rawProjectName.length > 0 ? rawProjectName : 'Information à compléter';
  const normalizedTeams = Array.isArray(relevantTeams) ? relevantTeams : [];
  const availableThemes = useMemo(
    () => (Array.isArray(showcaseThemes) && showcaseThemes.length > 0
      ? showcaseThemes
      : initialShowcaseThemes),
    [showcaseThemes]
  );
  const selectedTheme = useMemo(
    () => resolveShowcaseTheme(availableThemes, answers?.showcaseTheme),
    [answers?.showcaseTheme, availableThemes]
  );
  const showcaseThemeId = selectedTheme?.id || FALLBACK_SHOWCASE_THEME.id;
  const showcaseThemeVariables = useMemo(
    () => buildThemeVariables(selectedTheme || FALLBACK_SHOWCASE_THEME),
    [selectedTheme]
  );
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

  const [isEditing, setIsEditing] = useState(false);
  const [draftValues, setDraftValues] = useState(() =>
    buildDraftValues(editableFields, answers, rawProjectName)
  );
  const [customSections, setCustomSections] = useState(() =>
    sanitizeCustomSections(answers?.customShowcaseSections)
  );
  const [sectionOrder, setSectionOrder] = useState(() =>
    normalizeSectionOrder(answers?.showcaseSectionOrder, sanitizeCustomSections(answers?.customShowcaseSections))
  );
  const [milestoneDragState, setMilestoneDragState] = useState(createEmptyMilestoneDragState);
  const [displayMode, setDisplayMode] = useState('full');
  const [lightSections, setLightSections] = useState(() =>
    buildDefaultLightSectionSelection(sectionOrder)
  );
  const [pendingLightSections, setPendingLightSections] = useState(lightSections);
  const [isLightConfigOpen, setIsLightConfigOpen] = useState(false);
  const [sectionDragState, setSectionDragState] = useState({ sourceIndex: null, targetIndex: null });
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionModalStep, setSectionModalStep] = useState('templates');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [pendingInsertionIndex, setPendingInsertionIndex] = useState(null);
  const [sectionDraft, setSectionDraft] = useState({
    title: '',
    subtitle: '',
    description: '',
    accent: '',
    documentUrl: '',
    documentType: 'pdf',
    items: []
  });
  const [sectionDraftItemsText, setSectionDraftItemsText] = useState('');

  const resetMilestoneDragState = useCallback(() => {
    setMilestoneDragState(createEmptyMilestoneDragState());
  }, []);

  useEffect(() => {
    if (isEditing) {
      return;
    }
    setDraftValues(buildDraftValues(editableFields, answers, rawProjectName));
    const sanitizedSections = sanitizeCustomSections(answers?.customShowcaseSections);
    setCustomSections(sanitizedSections);
    setSectionOrder(normalizeSectionOrder(answers?.showcaseSectionOrder, sanitizedSections));
  }, [answers, editableFields, rawProjectName]);

  useEffect(() => {
    if (!isEditing) {
      resetMilestoneDragState();
    }
  }, [isEditing, resetMilestoneDragState]);

  useEffect(() => {
    setLightSections(previous => {
      const nextState = { ...previous };
      let changed = false;

      sectionOrder.forEach(id => {
        if (nextState[id] === undefined) {
          nextState[id] = true;
          changed = true;
        }
      });

      Object.keys(nextState).forEach(id => {
        if (!sectionOrder.includes(id)) {
          delete nextState[id];
          changed = true;
        }
      });

      return changed ? nextState : previous;
    });
  }, [sectionOrder]);

  useEffect(() => {
    if (typeof onAnnotationScopeChange !== 'function') {
      return undefined;
    }

    const scope = isSectionModalOpen
      ? `section-modal-${sectionModalStep}`
      : isLightConfigOpen
        ? 'light-config'
        : `display-${displayMode}`;

    onAnnotationScopeChange(scope);

    return () => {
      onAnnotationScopeChange('');
    };
  }, [displayMode, isLightConfigOpen, isSectionModalOpen, onAnnotationScopeChange, sectionModalStep]);

  const handleDisplayModeChange = useCallback((mode) => {
    if (mode === 'full' || mode === 'light') {
      setDisplayMode(mode);
    }
  }, []);

  const handleOpenLightConfig = useCallback(() => {
    setPendingLightSections(lightSections);
    setIsLightConfigOpen(true);
  }, [lightSections]);

  const handleCancelLightConfig = useCallback(() => {
    setPendingLightSections(lightSections);
    setIsLightConfigOpen(false);
  }, [lightSections]);

  const handleTogglePendingSection = useCallback((sectionId) => {
    setPendingLightSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const handleSelectAllSections = useCallback(() => {
    setPendingLightSections(buildDefaultLightSectionSelection());
  }, []);

  const handleValidateLightConfig = useCallback(() => {
    setLightSections(pendingLightSections);
    setIsLightConfigOpen(false);
  }, [pendingLightSections]);

  const sanitizedCustomSections = useMemo(
    () => sanitizeCustomSections(customSections),
    [customSections]
  );

  const customSectionMap = useMemo(() => {
    const map = new Map();
    sanitizedCustomSections.forEach(section => {
      map.set(section.id, section);
    });
    return map;
  }, [sanitizedCustomSections]);

  const handleOpenSectionModal = useCallback((insertionIndex = null) => {
    setPendingInsertionIndex(insertionIndex);
    setSectionModalStep('templates');
    setSectionDraft({
      title: '',
      subtitle: '',
      description: '',
      accent: '',
      documentUrl: '',
      documentType: 'pdf',
      items: []
    });
    setSectionDraftItemsText('');
    setIsSectionModalOpen(true);
  }, []);

  const handleCloseSectionModal = useCallback(() => {
    setIsSectionModalOpen(false);
    setSectionModalStep('templates');
    setPendingInsertionIndex(null);
    setSectionDraft({
      title: '',
      subtitle: '',
      description: '',
      accent: '',
      documentUrl: '',
      documentType: 'pdf',
      items: []
    });
    setSectionDraftItemsText('');
  }, []);

  useEffect(() => {
    if (typeof onEditingStateChange === 'function') {
      onEditingStateChange(isEditing);
    }

    return () => {
      if (typeof onEditingStateChange === 'function') {
        onEditingStateChange(false);
      }
    };
  }, [isEditing, onEditingStateChange]);

  const handleTemplateNavigation = useCallback((direction) => {
    setSelectedTemplateIndex(previous => {
      const nextIndex = (previous + direction + SECTION_TEMPLATES.length) % SECTION_TEMPLATES.length;
      return nextIndex;
    });
  }, []);

  const handleConfirmTemplateChoice = useCallback(() => {
    const template = SECTION_TEMPLATES[selectedTemplateIndex];
    const placeholder = template?.placeholder || {};
    setSectionDraft({
      title: placeholder.title || '',
      subtitle: placeholder.subtitle || '',
      description: placeholder.description || '',
      accent: placeholder.accent || '',
      documentUrl: placeholder.documentUrl || '',
      documentType: placeholder.documentType || 'pdf',
      items: Array.isArray(placeholder.items) ? placeholder.items : []
    });
    setSectionDraftItemsText(Array.isArray(placeholder.items) ? placeholder.items.join('\n') : '');
    setSectionModalStep('form');
  }, [selectedTemplateIndex]);

  const handleSectionDraftChange = useCallback((field, value) => {
    setSectionDraft(previous => ({
      ...previous,
      [field]: value
    }));
  }, []);

  const handleSectionDraftItemsChange = useCallback((value) => {
    setSectionDraftItemsText(value);
    const items = value
      .split(/\r?\n/)
      .map(entry => entry.trim())
      .filter(Boolean);
    setSectionDraft(previous => ({
      ...previous,
      items
    }));
  }, []);

  const handleSubmitNewSection = useCallback((event) => {
    event.preventDefault();
    const template = SECTION_TEMPLATES[selectedTemplateIndex];
    const safeTemplateId = template?.id || SECTION_TEMPLATES[0].id;
    const newSectionId = `custom-section-${Date.now()}`;

    const newSection = {
      id: newSectionId,
      type: safeTemplateId,
      title: sectionDraft.title?.trim() || template?.name || 'Nouvelle section',
      subtitle: sectionDraft.subtitle?.trim() || '',
      description: sectionDraft.description?.trim() || '',
      accent: sectionDraft.accent?.trim() || '',
      documentUrl: sectionDraft.documentUrl?.trim() || '',
      documentType: sectionDraft.documentType?.trim() || '',
      items: Array.isArray(sectionDraft.items) ? sectionDraft.items : []
    };

    setCustomSections(previous => [...sanitizeCustomSections(previous), newSection]);
    setSectionOrder(previousOrder => {
      const base = Array.isArray(previousOrder) ? [...previousOrder] : [];
      const insertionIndex = typeof pendingInsertionIndex === 'number'
        ? Math.max(0, Math.min(base.length, pendingInsertionIndex))
        : base.length;
      base.splice(insertionIndex, 0, newSectionId);
      return normalizeSectionOrder(base, [...sanitizeCustomSections(customSections), newSection]);
    });
    handleCloseSectionModal();
  }, [customSections, handleCloseSectionModal, pendingInsertionIndex, sectionDraft, selectedTemplateIndex]);

  const handleBackToTemplates = useCallback(() => {
    setSectionModalStep('templates');
  }, []);

  useEffect(() => {
    if (!tourContext?.isActive) {
      return;
    }

    const { activeStep } = tourContext;
    const shouldForceEditing = activeStep === 'showcase-edit' || activeStep === 'showcase-save-edits';

    if (shouldForceEditing) {
      setDraftValues(buildDraftValues(editableFields, answers, rawProjectName));
      resetMilestoneDragState();
      setIsEditing(true);
    } else if (isEditing && activeStep !== 'showcase-edit' && activeStep !== 'showcase-save-edits') {
      setIsEditing(false);
    }

    if (typeof document === 'undefined') {
      return;
    }

    let selector = null;
    let scrollOptions = { behavior: 'smooth', block: 'center' };

    if (activeStep === 'showcase-top') {
      selector = '[data-tour-id="showcase-preview"]';
      scrollOptions = { behavior: 'smooth', block: 'start' };
    } else if (activeStep === 'showcase-bottom') {
      selector = '[data-tour-id="showcase-preview-bottom"]';
      scrollOptions = { behavior: 'smooth', block: 'end' };
    } else if (activeStep === 'showcase-edit-trigger') {
      selector = '[data-tour-id="showcase-edit-trigger"]';
    } else if (activeStep === 'showcase-edit' || activeStep === 'showcase-save-edits') {
      selector = '[data-tour-id="showcase-edit-panel"]';
    }

    if (selector) {
      let element = document.querySelector(selector);
      if (!element && activeStep === 'showcase-bottom') {
        element = document.querySelector('[data-tour-id="showcase-preview"]');
        scrollOptions = { behavior: 'smooth', block: 'end' };
      }
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView(scrollOptions);
      }
    }
  }, [
    tourContext,
    editableFields,
    buildDraftValues,
    answers,
    rawProjectName,
    resetMilestoneDragState,
    isEditing,
    setDraftValues
  ]);

  const isLightMode = displayMode === 'light';

  const shouldDisplaySection = useCallback(
    (sectionId) => displayMode === 'full' || lightSections[sectionId] !== false,
    [displayMode, lightSections]
  );

  const selectedLightSectionsCount = useMemo(
    () => Object.values(lightSections).filter(Boolean).length,
    [lightSections]
  );

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
    const sanitizedSections = sanitizeCustomSections(answers?.customShowcaseSections);
    setCustomSections(sanitizedSections);
    setSectionOrder(normalizeSectionOrder(answers?.showcaseSectionOrder, sanitizedSections));
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

  const handleRemoveCustomSection = useCallback((sectionId) => {
    setCustomSections(previous => previous.filter(section => section.id !== sectionId));
    setSectionOrder(previous => previous.filter(entry => entry !== sectionId));
  }, []);

  const handleSectionDragStart = useCallback((index, event) => {
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      try {
        event.dataTransfer.setData('text/plain', String(index));
      } catch (_error) {
        // Certains navigateurs bloquent l'écriture : on ignore.
      }
    }
    setSectionDragState({ sourceIndex: index, targetIndex: index });
  }, []);

  const handleSectionDragEnter = useCallback((index) => {
    setSectionDragState(previous => {
      if (previous.sourceIndex === null || previous.targetIndex === index) {
        return previous;
      }
      return { ...previous, targetIndex: index };
    });
  }, []);

  const handleSectionDragLeave = useCallback((index, event) => {
    if (event?.currentTarget?.contains(event?.relatedTarget)) {
      return;
    }
    setSectionDragState(previous => {
      if (previous.targetIndex !== index) {
        return previous;
      }
      return { ...previous, targetIndex: previous.sourceIndex };
    });
  }, []);

  const handleSectionDragOver = useCallback((event) => {
    if (sectionDragState.sourceIndex !== null) {
      event.preventDefault();
      if (event?.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }, [sectionDragState.sourceIndex]);

  const handleSectionDrop = useCallback((index, event) => {
    if (sectionDragState.sourceIndex === null) {
      return;
    }
    event.preventDefault();
    const sourceIndex = Math.max(0, Math.min(sectionOrder.length - 1, sectionDragState.sourceIndex));
    const targetIndex = Math.max(0, Math.min(sectionOrder.length - 1, index));

    if (sourceIndex === targetIndex) {
      setSectionDragState({ sourceIndex: null, targetIndex: null });
      return;
    }

    setSectionOrder(previous => {
      const next = [...previous];
      const [removed] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, removed);
      return next;
    });
    setSectionDragState({ sourceIndex: null, targetIndex: null });
  }, [sectionDragState.sourceIndex, sectionOrder.length]);

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

      const previousCustomSections = sanitizeCustomSections(answers?.customShowcaseSections);
      const nextCustomSections = sanitizeCustomSections(customSections);
      const previousSectionOrder = normalizeSectionOrder(answers?.showcaseSectionOrder, previousCustomSections);
      const nextSectionOrder = normalizeSectionOrder(sectionOrder, nextCustomSections);

      if (!areCustomSectionsEqual(previousCustomSections, nextCustomSections)) {
        updates.customShowcaseSections = nextCustomSections;
      }

      if (!areCustomSectionsEqual(
        previousSectionOrder.map(id => ({ id })),
        nextSectionOrder.map(id => ({ id }))
      )) {
        updates.showcaseSectionOrder = nextSectionOrder;
      }

      if (Object.keys(updates).length > 0) {
        onUpdateAnswers(updates);
      }

      setIsEditing(false);
    },
    [answers, canEdit, customSections, draftValues, editableFields, onUpdateAnswers, sectionOrder]
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

  const renderBaseSection = useCallback((sectionId, index) => {
    if (!shouldDisplaySection(sectionId)) {
      return null;
    }

    switch (sectionId) {
      case 'notice':
        if (!hasIncompleteAnswers) {
          return null;
        }
        return (
          <section key={`${sectionId}-${index}`} className="aurora-section" data-showcase-section="notice">
            <div className="aurora-section__inner aurora-section__inner--narrow">
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                En attente de l’ensemble des informations sur le projet pour une évaluation complète.
              </div>
            </div>
          </section>
        );
      case 'hero':
        return (
          <section
            key={`${sectionId}-${index}`}
            className="aurora-section aurora-hero"
            data-showcase-section="hero"
            data-tour-id="showcase-hero"
          >
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
                  {heroHighlights.map((highlight, highlightIndex) => (
                    <div
                      key={highlight.id}
                      className="aurora-hero-highlight"
                      style={{ animationDelay: `${highlightIndex * 0.15}s` }}
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
        );
      case 'problem':
        return (
          <section key={`${sectionId}-${index}`} className="aurora-section aurora-why" data-showcase-section="problem">
            <div className="aurora-section__inner aurora-section__inner--narrow">
              <div className="aurora-section__header">
                <p className="aurora-eyebrow">Le problème</p>
                <h2 className="aurora-section__title">Pourquoi ce projet doit exister</h2>
              </div>
              {problemPainPoints.length > 0 && (
                <div className="aurora-why__points">
                  {problemPainPoints.map((point, pointIndex) => (
                    <div
                      key={`${point}-${pointIndex}`}
                      className="aurora-why__point"
                      style={{ animationDelay: `${pointIndex * 0.12 + 0.1}s` }}
                    >
                      <span className="aurora-why__beam" />
                      <span className="aurora-why__text">{renderTextWithLinks(point)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      case 'solution':
        return (
          <section key={`${sectionId}-${index}`} className="aurora-section aurora-response" data-showcase-section="solution">
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
                      {solutionBenefits.map((benefit, benefitIndex) => (
                        <li key={`${benefit}-${benefitIndex}`} className="aurora-pillar__item">
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
        );
      case 'innovation':
        if (!hasText(innovationProcess) && !hasText(visionStatement)) {
          return null;
        }
        return (
          <section key={`${sectionId}-${index}`} className="aurora-section aurora-difference" data-showcase-section="innovation">
            <div className="aurora-section__inner">
              <div className="aurora-section__header aurora-section__header--split">
                <div>
                  <p className="aurora-eyebrow">Notre impact</p>
                  <h2 className="aurora-section__title">Délivrer le maximum de valeur</h2>
                </div>
                {hasText(budgetEstimate) && (
                  <div className="aurora-card aurora-card--budget" data-tour-id="showcase-budget">
                    <p className="aurora-eyebrow">Budget estimé</p>
                    <p className="aurora-card__metric">{formattedBudgetEstimate} K€</p>
                    <p className="aurora-card__caption">Prévision globale sur 12 mois.</p>
                  </div>
                )}
              </div>
              <div className="aurora-difference__grid">
                {hasText(innovationProcess) && (
                  <div className="aurora-difference__item">
                    <p className="aurora-eyebrow">Comment on s'y prend</p>
                    <h3 className="aurora-difference__title">Processus & expérimentation</h3>
                    <p className="aurora-difference__text">{renderTextWithLinks(innovationProcess)}</p>
                  </div>
                )}
                {visionStatementEntries.length > 0 && (
                  <div className="aurora-difference__item">
                    <p className="aurora-eyebrow">Indicateurs de valeur</p>
                    <h3 className="aurora-difference__title">Comment nous mesurons l'impact</h3>
                    <ul className="aurora-difference__list">
                      {visionStatementEntries.map((entry, entryIndex) => (
                        <li key={`${entry}-${entryIndex}`} className="aurora-difference__list-item">
                          <span className="aurora-difference__bullet" />
                          <span>{renderTextWithLinks(entry)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      case 'team':
        if (!hasText(teamLead) && !hasText(teamLeadTeam) && teamCoreMembers.length === 0) {
          return null;
        }
        return (
          <section key={`${sectionId}-${index}`} className="aurora-section aurora-alliances" data-showcase-section="team">
            <div className="aurora-section__inner">
              <div className="aurora-section__header aurora-section__header--split">
                <div>
                  <p className="aurora-eyebrow">Équipe & alliances</p>
                  <h2 className="aurora-section__title">Qui porte et sécurise le projet</h2>
                </div>
              </div>
              <div className="aurora-alliances__grid">
                {hasText(teamLead) && (
                  <div className="aurora-alliances__item">
                    <p className="aurora-eyebrow">Pilotage</p>
                    <h3 className="aurora-alliances__title">{teamLead}</h3>
                    {hasText(teamLeadTeam) && (
                      <p className="aurora-alliances__caption">{teamLeadTeam}</p>
                    )}
                  </div>
                )}
                {teamCoreMembers.length > 0 && (
                  <div className="aurora-alliances__item">
                    <p className="aurora-eyebrow">Équipe cœur</p>
                    <ul className="aurora-alliances__list">
                      {teamCoreMembers.map((member, memberIndex) => (
                        <li key={`${member}-${memberIndex}`} className="aurora-alliances__list-item">
                          <span className="aurora-alliances__badge" />
                          <span>{renderTextWithLinks(member)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      case 'timeline':
        if (!hasTimelineSection) {
          return null;
        }
        return (
          <section
            key={`${sectionId}-${index}`}
            className="aurora-section aurora-roadmap"
            data-showcase-section="timeline"
            data-tour-id="showcase-roadmap"
          >
            <div className="aurora-section__inner">
              <div className="aurora-section__header aurora-section__header--split">
                <div>
                  <p className="aurora-eyebrow">Feuille de route</p>
                  <h2 className="aurora-section__title">Les étapes clés pour livrer</h2>
                </div>
                {hasText(runway?.launchLabel) && (
                  <div className="aurora-chip aurora-chip--tone">
                    <span className="aurora-chip__dot" />
                    {runway.launchLabel}
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
                timelineSummariesToDisplay.map((summary, summaryIndex) => {
                  const summaryRuleLabel = summary?.alert?.ruleName || summary?.ruleName;
                  const alertTitle = summary?.alert?.title;

                  return (
                    <div
                      key={summary.id || `timeline-summary-${summaryIndex}`}
                      className={`${
                        summary.satisfied
                          ? 'aurora-roadmap__summary aurora-roadmap__summary--ok'
                          : 'aurora-roadmap__summary aurora-roadmap__summary--alert'
                      }`}
                      style={{ animationDelay: `${summaryIndex * 0.08}s` }}
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
                      {summary.satisfied && (
                        <>
                          <p className="aurora-roadmap__value">{summary.weeks} semaines ({summary.days} jours)</p>
                          <p className="aurora-roadmap__caption">Runway conforme aux exigences identifiées.</p>
                        </>
                      )}
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
                  {unmatchedVigilanceAlerts.map((alert, alertIndex) => (
                    <div
                      key={alert.id}
                      className={`aurora-roadmap__watchpoint aurora-roadmap__watchpoint--${alert.status}`}
                      style={{ animationDelay: `${alertIndex * 0.08}s` }}
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
                  {timelineEntries.map((entry, entryIndex) => (
                    <li
                      key={entry.id || `timeline-entry-${entryIndex}`}
                      className="aurora-roadmap__step"
                      style={{ animationDelay: `${entryIndex * 0.1}s` }}
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
        );
      default:
        return null;
    }
  }, [
    formattedBudgetEstimate,
    hasIncompleteAnswers,
    hasText,
    hasTimelineEntries,
    hasTimelineSection,
    hasTimelineSummaries,
    heroHighlights,
    innovationProcess,
    problemPainPoints,
    runway,
    shouldDisplaySection,
    solutionBenefits,
    solutionComparison,
    solutionDescription,
    teamCoreMembers,
    teamLead,
    teamLeadTeam,
    timelineEntries,
    timelineSummariesToDisplay,
    unmatchedVigilanceAlerts,
    visionStatement,
    visionStatementEntries,
    slogan,
    safeProjectName
  ]);

  const renderCustomSection = useCallback((section, index) => {
    if (!section) {
      return null;
    }

    return (
      <section
        key={section.id}
        className="aurora-section aurora-section--custom"
        data-showcase-section={section.type || 'custom'}
      >
        <div className="aurora-section__inner aurora-section__inner--narrow">
          <div className="aurora-section__header aurora-section__header--split">
            <div>
              <p className="aurora-eyebrow">{section.accent || 'Section additionnelle'}</p>
              <h2 className="aurora-section__title">{section.title}</h2>
              {section.subtitle && (
                <p className="mt-1 text-sm text-gray-600">{renderTextWithLinks(section.subtitle)}</p>
              )}
            </div>
            <div className="aurora-chip aurora-chip--ghost">Bloc personnalisé #{index + 1}</div>
          </div>
          {section.description && (
            <p className="aurora-body-text">{renderTextWithLinks(section.description)}</p>
          )}
          {section.documentUrl && (
            <div className="mt-6 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Visionneuse documentaire</p>
                  <p className="text-xs text-gray-500">Source SharePoint • {section.documentType?.toUpperCase() || 'DOC'}</p>
                </div>
                <a
                  href={section.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Ouvrir dans un nouvel onglet
                </a>
              </div>
              {['jpg', 'png'].includes(section.documentType) ? (
                <img
                  src={section.documentUrl}
                  alt={`Document ${section.title || 'section personnalisée'}`}
                  className="max-h-96 w-full rounded-xl border border-gray-100 object-contain"
                  loading="lazy"
                />
              ) : (
                <iframe
                  title={`Document ${section.title || 'section personnalisée'}`}
                  src={resolveDocumentEmbedSrc(section.documentUrl, section.documentType)}
                  className="h-80 w-full rounded-xl border border-gray-100"
                  loading="lazy"
                />
              )}
              <p className="text-xs text-gray-500">
                Pour les présentations PPTX, utilisez un lien SharePoint accessible ou un lien d’intégration Office.
              </p>
            </div>
          )}
          {Array.isArray(section.items) && section.items.length > 0 && (
            <ul className="mt-4 space-y-3">
              {section.items.map((item, itemIndex) => (
                <li key={`${section.id}-item-${itemIndex}`} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-teal-400 text-xs font-semibold text-white">
                    {itemIndex + 1}
                  </span>
                  <span className="text-base text-gray-800">{renderTextWithLinks(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }, []);

  const orderedSections = useMemo(() => {
    const sections = [];
    sectionOrder.forEach((sectionId, index) => {
      if (!shouldDisplaySection(sectionId)) {
        return;
      }

      if (customSectionMap.has(sectionId)) {
        const renderedCustom = renderCustomSection(customSectionMap.get(sectionId), index);
        if (renderedCustom) {
          sections.push(renderedCustom);
        }
        return;
      }

      const rendered = renderBaseSection(sectionId, index);
      if (rendered) {
        sections.push(rendered);
      }
    });

    return sections;
  }, [customSectionMap, renderBaseSection, renderCustomSection, sectionOrder, shouldDisplaySection]);

  const sectionDescriptors = useMemo(() => {
    return sectionOrder.map((sectionId) => {
      const custom = customSectionMap.get(sectionId);
      if (custom) {
        return {
          id: sectionId,
          title: custom.title || 'Bloc personnalisé',
          subtitle: 'Section personnalisée',
          isCustom: true
        };
      }

      const option = SHOWCASE_SECTION_OPTIONS.find(section => section.id === sectionId);
      return {
        id: sectionId,
        title: option?.label || sectionId,
        subtitle: 'Section standard',
        isCustom: false
      };
    });
  }, [customSectionMap, sectionOrder]);

  const selectedTemplate = SECTION_TEMPLATES[selectedTemplateIndex] || SECTION_TEMPLATES[0];

  const previewContent = shouldShowPreview ? (
    <div className="aurora-sections" data-tour-id="showcase-preview">
      {orderedSections}
    </div>
  ) : (
    <div className="aurora-preview-placeholder">
      <h2 className="aurora-preview-placeholder__title">Mode édition activé</h2>
      <p className="aurora-preview-placeholder__text">
        Le rendu Aurora est temporairement masqué pendant vos ajustements.
      </p>
    </div>
  );

  const sectionModal = isSectionModalOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="absolute inset-0" onClick={handleCloseSectionModal} aria-hidden="true" />
      <div
        className="relative z-10 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="aurora-eyebrow aurora-eyebrow--soft">Nouvelle section</p>
            <h3 className="text-xl font-bold text-gray-900">Choisissez un modèle puis complétez son contenu</h3>
            <p className="text-sm text-gray-600">Les miniatures donnent un aperçu rapide du rendu final.</p>
          </div>
          <button
            type="button"
            onClick={handleCloseSectionModal}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
          >
            Fermer
          </button>
        </div>

        {sectionModalStep === 'templates' ? (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-stretch">
              <button
                type="button"
                onClick={() => handleTemplateNavigation(-1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
                aria-label="Modèle précédent"
              >
                ←
              </button>
              <div className="flex-1 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Modèle {selectedTemplateIndex + 1}/{SECTION_TEMPLATES.length}</p>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedTemplate?.name}</h4>
                    <p className="text-sm text-gray-600">{selectedTemplate?.description}</p>
                  </div>
                  <div className="h-12 w-24 rounded-lg bg-gradient-to-r from-blue-500/80 via-cyan-400/70 to-emerald-300/70 shadow-inner" />
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2 rounded-xl bg-white p-4 shadow-inner">
                  <div className="col-span-5 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                  <div className="col-span-3 h-2 rounded-full bg-gray-200" />
                  <div className="col-span-2 h-2 rounded-full bg-gray-100" />
                  <div className="col-span-2 h-20 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100" />
                  <div className="col-span-3 space-y-2">
                    <div className="h-2 rounded-full bg-gray-200" />
                    <div className="h-2 rounded-full bg-gray-100" />
                    <div className="h-2 rounded-full bg-gray-100" />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTemplateNavigation(1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
                aria-label="Modèle suivant"
              >
                →
              </button>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseSectionModal}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmTemplateChoice}
                className="rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Valider ce modèle
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitNewSection} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="section-title" className="text-sm font-medium text-gray-800">Titre</label>
                <input
                  id="section-title"
                  type="text"
                  value={sectionDraft.title}
                  onChange={(event) => handleSectionDraftChange('title', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                  placeholder={selectedTemplate?.placeholder?.title || 'Titre du bloc'}
                  required
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="section-subtitle" className="text-sm font-medium text-gray-800">Sous-titre</label>
                <input
                  id="section-subtitle"
                  type="text"
                  value={sectionDraft.subtitle}
                  onChange={(event) => handleSectionDraftChange('subtitle', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                  placeholder={selectedTemplate?.placeholder?.subtitle || 'Complément de contexte'}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="section-accent" className="text-sm font-medium text-gray-800">Accent (optionnel)</label>
                <input
                  id="section-accent"
                  type="text"
                  value={sectionDraft.accent}
                  onChange={(event) => handleSectionDraftChange('accent', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                  placeholder="Badge, statut ou enjeu"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="section-description" className="text-sm font-medium text-gray-800">Description</label>
              <textarea
                id="section-description"
                value={sectionDraft.description}
                onChange={(event) => handleSectionDraftChange('description', event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                placeholder={selectedTemplate?.placeholder?.description || 'Expliquez le contenu principal de cette section'}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="section-document-url" className="text-sm font-medium text-gray-800">
                  Lien SharePoint du document
                </label>
                <input
                  id="section-document-url"
                  type="url"
                  value={sectionDraft.documentUrl}
                  onChange={(event) => handleSectionDraftChange('documentUrl', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                  placeholder={selectedTemplate?.placeholder?.documentUrl || 'https://votre-tenant.sharepoint.com/...'}
                />
                <p className="text-xs text-gray-500">
                  Utilisez un lien SharePoint accessible ou un lien d’intégration Office pour les PPTX.
                </p>
              </div>
              <div className="space-y-1">
                <label htmlFor="section-document-type" className="text-sm font-medium text-gray-800">
                  Type de document
                </label>
                <select
                  id="section-document-type"
                  value={sectionDraft.documentType}
                  onChange={(event) => handleSectionDraftChange('documentType', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                >
                  {DOCUMENT_VIEWER_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="section-items" className="text-sm font-medium text-gray-800">Liste (une ligne par élément)</label>
              <textarea
                id="section-items"
                value={sectionDraftItemsText}
                onChange={(event) => handleSectionDraftItemsChange(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-100"
                placeholder={(selectedTemplate?.placeholder?.items || ['Élément #1', 'Élément #2']).join('\n')}
              />
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <button
                type="button"
                onClick={handleBackToTemplates}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300"
              >
                Retour aux modèles
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCloseSectionModal}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Ajouter la section
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  ) : null;
  const modeSelectionPanel = (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur">
      <div
        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        role="group"
        aria-label="Sélection du mode d'utilisation"
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sélection du mode d'utilisation</p>
          <p className="text-sm text-gray-600">
            Choisissez entre l'affichage complet ou Light pour ajuster la vitrine.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDisplayModeChange('light')}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              isLightMode
                ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
            aria-pressed={isLightMode}
          >
            Mode Light
            <span className="text-xs text-gray-500">({selectedLightSectionsCount}/{sectionOrder.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleDisplayModeChange('full')}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              !isLightMode
                ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
            aria-pressed={!isLightMode}
          >
            Mode complet
          </button>
          <button
            type="button"
            onClick={handleOpenLightConfig}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            Configurer
          </button>
        </div>
      </div>

      {isLightConfigOpen && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Sections visibles en mode Light</p>
                <p className="text-xs text-gray-600">Décochez les sections à masquer dans l'affichage allégé.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllSections}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Tout sélectionner
                </button>
                <button
                  type="button"
                  onClick={handleCancelLightConfig}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleValidateLightConfig}
                  className="rounded-full border border-blue-200 bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  Valider
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SHOWCASE_SECTION_OPTIONS.map(section => {
                const checkboxId = `light-section-${section.id}`;
                const isChecked = pendingLightSections[section.id] !== false;
                return (
                  <label
                    key={section.id}
                    htmlFor={checkboxId}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:border-blue-200"
                  >
                    <input
                      id={checkboxId}
                      name={checkboxId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePendingSection(section.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-800">{section.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const editPanel = isEditing && canEdit ? (
    <form
      id={formId}
      onSubmit={handleSubmitEdit}
      className="aurora-edit-panel"
      data-tour-id="showcase-edit-panel"
    >
      <div className="aurora-edit-panel__header">
        <div>
          <p className="aurora-eyebrow aurora-eyebrow--soft">Mode édition actif</p>
          <h3 className="aurora-edit-panel__title">Ajustez les informations présentées dans la vitrine</h3>
        </div>
        <p className="aurora-edit-panel__intro">
          Chaque modification sera appliquée aux réponses du questionnaire correspondant.
        </p>
      </div>
      <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 shadow-inner">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="aurora-eyebrow aurora-eyebrow--soft">Organisation des sections</p>
            <h4 className="text-lg font-semibold text-gray-900">Réorganisez et ajoutez de nouveaux blocs</h4>
            <p className="text-sm text-gray-600">Glissez-déposez pour changer l'ordre ou utilisez le bouton + pour insérer une nouvelle section.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenSectionModal(0)}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-600 transition hover:border-blue-300 hover:text-blue-600 sm:inline-flex"
              aria-label="Ajouter une section au début"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenSectionModal(sectionOrder.length)}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nouvelle section
            </button>
          </div>
        </div>
        <ol className="mt-4 space-y-3">
          {sectionDescriptors.map((section, index) => {
            const isTarget = sectionDragState.targetIndex === index;
            return (
              <li key={section.id} className="space-y-2">
                <div
                  draggable
                  onDragStart={(event) => handleSectionDragStart(index, event)}
                  onDragEnter={() => handleSectionDragEnter(index)}
                  onDragOver={handleSectionDragOver}
                  onDragLeave={(event) => handleSectionDragLeave(index, event)}
                  onDrop={(event) => handleSectionDrop(index, event)}
                  className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-sm transition ${
                    isTarget ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-500">
                      ☰
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                      <p className="text-xs text-gray-500">{section.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenSectionModal(index + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-600 transition hover:border-blue-300 hover:text-blue-600"
                      aria-label="Ajouter une section à cet endroit"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    {section.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSection(section.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-red-200 hover:text-red-600"
                        aria-label="Supprimer cette section personnalisée"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
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
          const isRichText = type === 'text' || type === 'long_text';
          const isMulti = type === 'multi_choice';
          const isChoice = type === 'choice';
          const isDate = type === 'date';
          const isMilestoneList = type === 'milestone_list';
          const isMultiWithOptions = isMulti && options.length > 0;
          const isMultiFreeform = isMulti && !isMultiWithOptions;
          const isChoiceWithOptions = isChoice && options.length > 0;
          const selectedValues = Array.isArray(fieldValue) ? fieldValue : [];
          const textValue = typeof fieldValue === 'string' ? fieldValue : '';
          const placeholder =
            typeof question?.placeholder === 'string' && question.placeholder.trim() !== ''
              ? question.placeholder.trim()
              : isLong
                ? 'Ajoutez ici un texte riche pour la vitrine'
                : 'Saisissez un texte riche ou un lien';
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

          const annotationSectionId = FIELD_SECTION_MAP[fieldId];

          return (
            <div
              key={fieldId}
              className={`aurora-field${isLong || isMulti || isMilestoneList ? ' aurora-field--wide' : ''}`}
              data-annotation-target-section={annotationSectionId || undefined}
            >
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
              ) : isRichText ? (
                <RichTextEditor
                  id={`showcase-edit-${fieldId}`}
                  value={textValue}
                  onChange={(nextValue) => handleFieldChange(fieldId, nextValue)}
                  placeholder={placeholder}
                  compact={!isLong}
                  ariaLabel={`${label} (édition riche)`}
                />
              ) : isMultiFreeform ? (
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
        <button
          type="submit"
          className="aurora-button aurora-button--primary"
          data-tour-id="showcase-save-edits"
        >
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
          data-tour-id="showcase-edit-trigger"
        >
          <Edit className="aurora-button__icon" />
          Modifier
        </button>
      </div>
    ) : null;

  const content = (
    <>
      {modeSelectionPanel}
      {editBar}
      {editPanel}
      {sectionModal}
      {previewContent}
    </>
  );

  if (renderInStandalone) {
    return (
      <div
        data-showcase-scope
        data-showcase-theme={showcaseThemeId}
        className="aurora-shell aurora-shell--standalone"
        style={showcaseThemeVariables}
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
      style={showcaseThemeVariables}
      aria-label="Vitrine marketing du projet"
    >
      {content}
    </section>
  );
};
