import React, { useState, useCallback, useEffect, useRef, useMemo } from '../react.js';
import {
  FileText,
  Users,
  AlertTriangle,
  Send,
  Sparkles,
  CheckCircle,
  Save,
  Mail,
  Info,
  Edit
} from './icons.js';
import { formatAnswer } from '../utils/questions.js';
import { computeRankingRecommendations, normalizeRankingConfig } from '../utils/ranking.js';
import { renderTextWithLinks } from '../utils/linkify.js';
import { ProjectShowcase } from './ProjectShowcase.jsx';
import { extractProjectName } from '../utils/projects.js';
import {
  buildProjectExport,
  downloadProjectJson,
  getTeamPriority,
  sanitizeFileName
} from '../utils/projectExport.js';
import {
  DEFAULT_COMMITTEE_ID,
  getTriggeredValidationCommittees,
  normalizeValidationCommitteeConfig
} from '../utils/validationCommittee.js';
import { formatTeamContacts, normalizeTeamContacts } from '../utils/teamContacts.js';

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatNumber = (value, options = {}) => {
  return Number(value).toLocaleString('fr-FR', options);
};

const formatCriterionScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }

  if (numeric >= 3) return '+++';
  if (numeric >= 2) return '++';
  if (numeric >= 1) return '+';
  return '—';
};

const COMPLIANCE_COMMENTS_KEY = '__compliance_team_comments__';
const COMMENT_STATUS_OPTIONS = [
  {
    value: 'validated',
    label: 'Validé',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    value: 'validated_with_conditions',
    label: 'Validé sous condition',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    value: 'not_concerned',
    label: 'Non-concerné',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200'
  },
  {
    value: 'rejected',
    label: 'Refusé',
    badgeClass: 'bg-red-100 text-red-800 border-red-200'
  }
];

const formatWeeksValue = (weeks) => {
  if (weeks === undefined || weeks === null) {
    return '-';
  }

  const rounded = Math.round(weeks * 10) / 10;
  const hasDecimal = Math.abs(rounded - Math.round(rounded)) > 0.0001;

  return `${formatNumber(rounded, {
    minimumFractionDigits: hasDecimal ? 1 : 0,
    maximumFractionDigits: hasDecimal ? 1 : 0
  })} sem.`;
};

const formatDaysValue = (days) => {
  if (days === undefined || days === null) {
    return '-';
  }

  return `${formatNumber(Math.round(days))} j.`;
};

const formatRiskScore = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return null;
  }

  const sanitized = Math.max(0, score);
  const hasDecimals = Math.abs(sanitized - Math.round(sanitized)) > 0.0001;

  return formatNumber(sanitized, {
    minimumFractionDigits: hasDecimals ? 1 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0
  });
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

const getCommentStatusMeta = (status) => {
  return COMMENT_STATUS_OPTIONS.find((option) => option.value === status) || COMMENT_STATUS_OPTIONS[2];
};

const normalizeCommentEntry = (entry) => {
  const comment = typeof entry?.comment === 'string' ? entry.comment : '';
  const statusCandidate = typeof entry?.status === 'string' ? entry.status : '';
  const status = COMMENT_STATUS_OPTIONS.some((option) => option.value === statusCandidate)
    ? statusCandidate
    : COMMENT_STATUS_OPTIONS[2].value;

  return {
    comment,
    status
  };
};

const normalizeComplianceComments = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const teams = value.teams && typeof value.teams === 'object' ? value.teams : {};
    const committees =
      value.committees && typeof value.committees === 'object' ? value.committees : {};
    const legacyCommittee =
      value.committee && typeof value.committee === 'object' ? value.committee : null;

    return {
      teams,
      committees: legacyCommittee && !committees[DEFAULT_COMMITTEE_ID]
        ? {
          ...committees,
          [DEFAULT_COMMITTEE_ID]: legacyCommittee
        }
        : committees,
      legacy: typeof value.legacy === 'string' ? value.legacy : ''
    };
  }

  if (typeof value === 'string') {
    return {
      teams: {},
      committees: {},
      legacy: value
    };
  }

  return {
    teams: {},
    committees: {},
    legacy: ''
  };
};

const buildComplianceCommentDrafts = (comments, teams, committees) => {
  const teamDrafts = {};
  const committeeDrafts = {};

  (Array.isArray(teams) ? teams : []).forEach((team) => {
    if (!team?.id) {
      return;
    }
    teamDrafts[team.id] = normalizeCommentEntry(comments?.teams?.[team.id]);
  });

  (Array.isArray(committees) ? committees : []).forEach((committee) => {
    if (!committee?.id) {
      return;
    }
    committeeDrafts[committee.id] = normalizeCommentEntry(comments?.committees?.[committee.id]);
  });

  return {
    teams: teamDrafts,
    committees: committeeDrafts
  };
};

const formatOverviewValue = (question, answer) => {
  const formatted = formatAnswer(question, answer);

  if (typeof formatted === 'string') {
    if (formatted.trim().length > 0) {
      return formatted;
    }
  } else if (formatted) {
    return formatted;
  }

  return question?.required ? 'Information à compléter' : '';
};

const formatRiskTimingViolation = (violation) => {
  if (!violation) {
    return '';
  }

  const actualParts = [];
  if (typeof violation.actualWeeks === 'number') {
    actualParts.push(formatWeeksValue(violation.actualWeeks));
  }
  if (typeof violation.actualDays === 'number') {
    actualParts.push(formatDaysValue(violation.actualDays));
  }

  const requiredParts = [];
  if (typeof violation.requiredWeeks === 'number') {
    requiredParts.push(`${formatNumber(violation.requiredWeeks)} sem.`);
  }
  if (typeof violation.requiredDays === 'number') {
    requiredParts.push(`${formatNumber(violation.requiredDays)} j.`);
  }

  if (actualParts.length === 0 && requiredParts.length === 0) {
    return '';
  }

  const actualText = actualParts.length > 0 ? actualParts.join(' / ') : 'non calculé';

  if (requiredParts.length === 0) {
    return `Délai constaté : ${actualText}.`;
  }

  return `Délai constaté : ${actualText} – minimum requis : ${requiredParts.join(' / ')}`;
};

const formatTimingRequirementSummary = (questionBank, constraint) => {
  if (!constraint || typeof constraint !== 'object') {
    return '';
  }

  const startId = constraint.startQuestion;
  const endId = constraint.endQuestion;
  const minimumWeeks =
    typeof constraint.minimumWeeks === 'number' ? constraint.minimumWeeks : undefined;
  const minimumDays =
    typeof constraint.minimumDays === 'number' ? constraint.minimumDays : undefined;

  const startLabel = resolveQuestionLabel(questionBank, startId);
  const endLabel = resolveQuestionLabel(questionBank, endId);

  const startDisplay = startLabel || startId || '';
  const endDisplay = endLabel || endId || '';

  const requirementParts = [];
  if (minimumWeeks !== undefined) {
    requirementParts.push(`${formatNumber(minimumWeeks)} sem.`);
  }
  if (minimumDays !== undefined) {
    requirementParts.push(`${formatNumber(minimumDays)} j.`);
  }

  const hasRequirement = requirementParts.length > 0;
  const hasStart = startDisplay.length > 0;
  const hasEnd = endDisplay.length > 0;

  if (!hasRequirement && !hasStart && !hasEnd) {
    return '';
  }

  if (hasRequirement && hasStart && hasEnd) {
    return `Respecter un délai minimal de ${requirementParts.join(' / ')} entre « ${startDisplay} » et « ${endDisplay} ».`;
  }

  if (hasRequirement && hasStart && !hasEnd) {
    return `Respecter un délai minimal de ${requirementParts.join(' / ')} après « ${startDisplay} ».`;
  }

  if (hasRequirement && !hasStart && hasEnd) {
    return `Respecter un délai minimal de ${requirementParts.join(' / ')} avant « ${endDisplay} ».`;
  }

  if (hasRequirement) {
    return `Respecter un délai minimal de ${requirementParts.join(' / ')} avant la prochaine étape.`;
  }

  if (hasStart && hasEnd) {
    return `Surveiller le délai entre « ${startDisplay} » et « ${endDisplay} ».`;
  }

  if (hasStart || hasEnd) {
    return `Surveiller la date « ${hasStart ? startDisplay : endDisplay} ».`;
  }

  return '';
};

const formatVigilanceStatusMessage = (alert) => {
  if (!alert || typeof alert !== 'object') {
    return '';
  }

  if (alert.status === 'unknown') {
    return "Dates manquantes : renseignez-les pour vérifier ce délai.";
  }

  if (alert.status === 'satisfied' && alert.diff) {
    const parts = [];
    if (typeof alert.diff.diffInWeeks === 'number') {
      parts.push(formatWeeksValue(alert.diff.diffInWeeks));
    }
    if (typeof alert.diff.diffInDays === 'number') {
      parts.push(formatDaysValue(alert.diff.diffInDays));
    }

    if (parts.length === 0) {
      return 'Délai déclaré conforme. Anticiper pour éviter l’alerte.';
    }

    return `Délai constaté : ${parts.join(' / ')} — anticiper pour éviter l’alerte.`;
  }

  return '';
};

const resolveQuestionLabel = (questionBank, questionId) => {
  if (!questionId) {
    return '';
  }

  const collection = Array.isArray(questionBank) ? questionBank : [];
  const match = collection.find(question => question?.id === questionId);

  return match?.question || questionId;
};

const normalizeTeamQuestionForDisplay = (entry) => {
  if (typeof entry === 'string') {
    return { text: entry, timingViolation: null };
  }

  if (entry && typeof entry === 'object') {
    return {
      text: typeof entry.text === 'string' ? entry.text : '',
      timingViolation:
        entry.timingViolation && typeof entry.timingViolation === 'object'
          ? entry.timingViolation
          : null
    };
  }

  return { text: '', timingViolation: null };
};

const formatTeamQuestionTimingMessage = (questionBank, violation) => {
  if (!violation) {
    return '';
  }

  const base = formatRiskTimingViolation(violation);
  if (!base) {
    return '';
  }

  const startLabel = resolveQuestionLabel(questionBank, violation.startQuestion);
  const endLabel = resolveQuestionLabel(questionBank, violation.endQuestion);

  if (startLabel || endLabel) {
    const safeStart = startLabel || violation.startQuestion || 'début';
    const safeEnd = endLabel || violation.endQuestion || 'fin';
    return `Délai entre « ${safeStart} » et « ${safeEnd} » — ${base}`;
  }

  return base;
};

const formatAsHtmlText = (value) => {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
};

const buildEmailHtml = ({
  projectName,
  questions,
  answers,
  analysis,
  relevantTeams
}) => {
  const title = projectName || 'Projet sans nom';
  const answeredQuestions = questions.filter(question => {
    const value = answers[question.id];
    if (value === null || value === undefined) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return true;
  });

  const risks = Array.isArray(analysis?.risks) ? analysis.risks : [];
  const vigilanceAlerts = Array.isArray(analysis?.timeline?.vigilance)
    ? analysis.timeline.vigilance.filter(alert => alert && alert.status !== 'breach')
    : [];

  const overviewSection = answeredQuestions.length
    ? `
        <div style="margin-bottom:24px;">
          <h2 style="font-size:18px; font-weight:600; color:#1f2937; margin-bottom:12px;">
            Vue d'ensemble du projet
          </h2>
          <table style="width:100%; border-collapse:collapse; background-color:#f9fafb; border-radius:12px; overflow:hidden;">
            <tbody>
              ${answeredQuestions
                .map(question => {
                  const questionLabel = escapeHtml(question.question);
                  const formattedAnswer = formatAsHtmlText(formatAnswer(question, answers[question.id]));
                  return `
                    <tr>
                      <td style="width:40%; padding:12px 16px; font-size:13px; font-weight:700; color:#001f3f; border-bottom:1px solid #e5e7eb;">
                        ${questionLabel}
                      </td>
                      <td style="padding:12px 16px; font-size:14px; font-weight:600; color:#1f2937; border-bottom:1px solid #e5e7eb;">
                        ${formattedAnswer || '<span style="color:#9ca3af;">Non renseigné</span>'}
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `
    : '';

  const teamSection = relevantTeams.length
    ? `
        <div style="margin-bottom:24px;">
          <h2 style="font-size:18px; font-weight:600; color:#1f2937; margin-bottom:12px;">
            Équipes à mobiliser
          </h2>
          ${relevantTeams
            .map(team => {
              const teamPriority = getTeamPriority(analysis, team.id);
              const teamQuestions = analysis.questions?.[team.id] || [];
              const teamContactLabel = formatTeamContacts(team, ', ');
              const contact = teamContactLabel
                ? `<span style="color:#4b5563;"> | Contacts : ${escapeHtml(teamContactLabel)}</span>`
                : '';

              const formattedTeamQuestions = Array.isArray(teamQuestions)
                ? teamQuestions
                    .map(normalizeTeamQuestionForDisplay)
                    .filter(question => (question.text || '').trim().length > 0)
                : [];

              const questionsHtml = formattedTeamQuestions.length
                ? `
                    <div style="margin-top:8px;">
                      <span style="font-size:13px; color:#4b5563; font-weight:600;">Points à préparer :</span>
                      <ul style="margin:8px 0 0; padding-left:18px; list-style-type:disc; color:#4b5563; font-size:13px;">
                        ${formattedTeamQuestions
                          .map(question => {
                            const timingMessage = formatTeamQuestionTimingMessage(questions, question.timingViolation);
                            const timingHtml = timingMessage
                              ? `<div style="margin-top:4px; font-size:12px; color:#b45309;">⚠️ ${escapeHtml(timingMessage)}</div>`
                              : '';
                            return `<li>${escapeHtml(question.text)}${timingHtml}</li>`;
                          })
                          .join('')}
                      </ul>
                    </div>
                  `
                : '';

              return `
                <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:12px; background-color:#f9fafb;">
                  <div style="font-size:15px; font-weight:600; color:#1f2937;">
                    ${escapeHtml(team.name)} — Priorité : ${escapeHtml(teamPriority)}${contact}
                  </div>
                  ${questionsHtml}
                </div>
              `;
            })
            .join('')}
        </div>
      `
    : '';

  const riskSection = risks.length
    ? `
        <div style="margin-bottom:24px;">
          <h2 style="font-size:18px; font-weight:600; color:#1f2937; margin-bottom:12px;">
            Risques identifiés et actions
          </h2>
          ${risks
            .map(risk => {
              const timingInfo = formatRiskTimingViolation(risk.timingViolation);

              return `
                <div style="border:1px solid #fee2e2; border-radius:12px; padding:16px; margin-bottom:12px; background-color:#fef2f2;">
                  <div style="font-size:15px; font-weight:600; color:#b91c1c;">
                    ${escapeHtml(risk.level)} — Priorité : ${escapeHtml(risk.priority)}
                  </div>
                  <p style="margin:8px 0 4px; font-size:14px; color:#4b5563;">
                    <strong>Description :</strong> ${formatAsHtmlText(risk.description)}
                  </p>
                  ${timingInfo
                    ? `<p style="margin:0 0 6px; font-size:13px; color:#b91c1c;">${escapeHtml(timingInfo)}</p>`
                    : ''}
                  <p style="margin:0; font-size:14px; color:#4b5563;">
                    <strong>Mitigation :</strong> ${formatAsHtmlText(risk.mitigation)}
                  </p>
                </div>
              `;
            })
            .join('')}
        </div>
      `
    : '';

  const vigilanceSection = vigilanceAlerts.length
    ? `
        <div style="margin-bottom:24px;">
          <h2 style="font-size:18px; font-weight:600; color:#1f2937; margin-bottom:12px;">
            Points de vigilance
          </h2>
          ${vigilanceAlerts
            .map(alert => {
              const requirementSummary = formatTimingRequirementSummary(questions, alert.timingConstraint);
              const statusMessage = formatVigilanceStatusMessage(alert);
              const title = alert.riskDescription && alert.riskDescription.trim().length > 0
                ? alert.riskDescription
                : alert.ruleName;

              return `
                <div style="border:1px solid #bbf7d0; border-radius:12px; padding:16px; margin-bottom:12px; background-color:#ecfdf5;">
                  <div style="font-size:15px; font-weight:600; color:#047857;">
                    ${escapeHtml(alert.ruleName)}${alert.priority ? ` — Priorité : ${escapeHtml(alert.priority)}` : ''}
                  </div>
                  <p style="margin:8px 0 4px; font-size:14px; color:#064e3b; font-weight:600;">
                    ${formatAsHtmlText(title)}
                  </p>
                  ${requirementSummary
                    ? `<p style="margin:0 0 6px; font-size:13px; color:#047857;">${escapeHtml(requirementSummary)}</p>`
                    : ''}
                  ${statusMessage
                    ? `<p style="margin:0; font-size:12px; color:#1f2937;">${escapeHtml(statusMessage)}</p>`
                    : ''}
                </div>
              `;
            })
            .join('')}
        </div>
      `
    : '';

  return `<!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:'Segoe UI', Arial, sans-serif; color:#1f2937;">
        <div style="max-width:720px; margin:0 auto; padding:32px 24px;">
          <div style="background-color:#ffffff; border-radius:20px; padding:32px; box-shadow:0 10px 30px rgba(15, 23, 42, 0.08); border:1px solid #e5e7eb;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
              <div>
                <h1 style="font-size:24px; color:#111827; margin:0 0 6px;">Synthèse</h1>
                <p style="margin:0; color:#4b5563; font-size:14px;">${escapeHtml(title)}</p>
              </div>
              <div style="padding:10px 16px; background-color:#eff6ff; color:#1d4ed8; border-radius:9999px; font-weight:600; font-size:14px;">
                Complexité : ${escapeHtml(analysis.complexity)}
              </div>
            </div>
            <p style="margin:0 0 20px; font-size:14px; color:#1f2937;">
              Bonjour équipe Compliance, un nouveau projet a été soumis pour revue. Vous trouverez ci-dessous les informations principales.
            </p>
            ${overviewSection}
            ${teamSection}
            ${riskSection}
            ${vigilanceSection}
          </div>
        </div>
      </body>
    </html>`;
};

const decodeHtmlEntities = (text) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const buildPlainTextEmail = (html) => {
  if (!html) {
    return '';
  }

  let text = html
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');

  text = text
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|section|article)\s*>/gi, '\n\n')
    .replace(/<\/(?:h[1-6])\s*>/gi, '\n')
    .replace(/<\/(?:ul|ol)\s*>/gi, '\n')
    .replace(/<li\s*>/gi, '• ')
    .replace(/<\/(?:tr)\s*>/gi, '\n')
    .replace(/<\/(?:td|th)\s*>/gi, '\t');

  text = text.replace(/<[^>]+>/g, '');
  text = decodeHtmlEntities(text);

  text = text
    .replace(/\r/g, '')
    .replace(/\t+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  return text.trim();
};

const buildMailtoLink = ({ projectName, relevantTeams, body }) => {
  const recipients = relevantTeams.flatMap((team) => normalizeTeamContacts(team));

  const toField = recipients.join(',');
  const subject = projectName || 'Projet compliance';
  const normalizedBody = (body || '').replace(/\r?\n/g, '\r\n');
  const encodedParams = [];

  if (subject) {
    encodedParams.push(`subject=${encodeURIComponent(subject)}`);
  }

  if (normalizedBody) {
    encodedParams.push(`body=${encodeURIComponent(normalizedBody)}`);
  }

  const prefix = toField ? `mailto:${toField}` : 'mailto:';
  const query = encodedParams.join('&');

  return query ? `${prefix}?${query}` : prefix;
};

export const SynthesisReport = ({
  answers,
  analysis,
  teams,
  questions,
  projectStatus,
  projectId,
  projectName: providedProjectName,
  onOpenProjectShowcase,
  isProjectEditable = true,
  onRestart,
  onBack,
  onUpdateAnswers,
  onSubmitProject,
  onNavigateToQuestion,
  onSaveDraft,
  saveFeedback,
  onDismissSaveFeedback,
  isAdminMode = false,
  tourContext = null,
  hasIncompleteAnswers = false,
  validationCommitteeConfig = null
}) => {
  const [isShowcaseFallbackOpen, setIsShowcaseFallbackOpen] = useState(false);
  const showcaseFallbackRef = useRef(null);
  const [attachmentReminder, setAttachmentReminder] = useState(null);
  const reminderCloseButtonRef = useRef(null);
  const complianceCommentFeedbackTimeoutRef = useRef(null);
  useEffect(() => {
    if (!tourContext?.isActive) {
      return;
    }

    if (typeof document === 'undefined') {
      return;
    }

    const stepToSelectorMap = {
      'compliance-report': '[data-tour-id="synthesis-summary"]',
      'compliance-report-top': '[data-tour-id="synthesis-summary"]',
      'compliance-teams': '[data-tour-id="synthesis-teams"]',
      'compliance-risks': '[data-tour-id="synthesis-risks"]'
    };

    const selector = stepToSelectorMap[tourContext.activeStep];
    if (!selector) {
      return;
    }

    const element = document.querySelector(selector);
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [tourContext]);
  const relevantTeams = teams.filter(team => (analysis?.teams || []).includes(team.id));
  const hasSaveFeedback = Boolean(saveFeedback?.message);
  const isSaveSuccess = saveFeedback?.status === 'success';
  const complianceComments = useMemo(
    () => normalizeComplianceComments(answers?.[COMPLIANCE_COMMENTS_KEY]),
    [answers]
  );
  const [complianceCommentDrafts, setComplianceCommentDrafts] = useState(() =>
    buildComplianceCommentDrafts(complianceComments, relevantTeams, [])
  );
  const [complianceCommentFeedback, setComplianceCommentFeedback] = useState(null);
  const canSaveComplianceComment = typeof onUpdateAnswers === 'function';
  const normalizedValidationCommitteeConfig = useMemo(
    () => normalizeValidationCommitteeConfig(validationCommitteeConfig),
    [validationCommitteeConfig]
  );
  const validationCommittees = normalizedValidationCommitteeConfig.committees;
  const triggeredValidationCommittees = useMemo(
    () =>
      getTriggeredValidationCommittees(normalizedValidationCommitteeConfig, {
        answers,
        analysis,
        relevantTeams
      }),
    [analysis, answers, normalizedValidationCommitteeConfig, relevantTeams]
  );

  const resolveTeamLabel = useCallback(
    (teamId) => {
      if (!teamId) {
        return '';
      }

      const teamMatch = teams.find(team => team?.id === teamId);
      return teamMatch?.name || teamId;
    },
    [teams]
  );

  const normalizedProjectStatus =
    typeof projectStatus === 'string' ? projectStatus.toLowerCase() : null;
  const statusLabelMap = {
    draft: 'Brouillon',
    submitted: 'Soumis'
  };
  const statusClassMap = {
    draft: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    submitted: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
  };
  const projectStatusLabel = normalizedProjectStatus
    ? statusLabelMap[normalizedProjectStatus] || projectStatus
    : null;
  const projectStatusClasses = normalizedProjectStatus
    ? statusClassMap[normalizedProjectStatus] || 'bg-gray-100 text-gray-700 border border-gray-200'
    : '';

  const priorityColors = {
    'A particulièrement anticiper': 'bg-red-100 text-red-800 border-red-300',
    'A anticiper': 'bg-orange-100 text-orange-800 border-orange-300',
    'A réaliser': 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const riskColors = {
    Élevé: 'bg-red-50 border-red-300 text-red-900',
    Moyen: 'bg-orange-50 border-orange-300 text-orange-900',
    Faible: 'bg-green-50 border-green-300 text-green-900'
  };

  const vigilanceStatusClasses = {
    satisfied: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    unknown: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    breach: 'bg-red-50 border-red-300 text-red-900'
  };

  const complexityColors = {
    Élevé: 'text-red-600',
    Moyen: 'text-orange-600',
    Faible: 'text-green-600'
  };

  const formattedRiskScore = formatRiskScore(analysis?.riskScore);

  const rankingQuestions = useMemo(
    () => (Array.isArray(questions) ? questions.filter(question => question?.type === 'ranking') : []),
    [questions]
  );

  const rankingResults = useMemo(() => {
    return rankingQuestions
      .map(question => {
        const config = normalizeRankingConfig(question.rankingConfig || {});
        const answer = answers?.[question.id];
        const recommendations = computeRankingRecommendations(answer, config, 3);
        const formattedAnswer = formatAnswer(question, answer);
        const prioritizedOrder = Array.isArray(answer?.prioritized)
          ? answer.prioritized
          : config.criteria.map(item => item.id);
        const ignoredSet = new Set(Array.isArray(answer?.ignored) ? answer.ignored : []);
        const orderedCriteria = prioritizedOrder
          .map(id => config.criteria.find(criterion => criterion.id === id))
          .filter(Boolean)
          .filter(criterion => !ignoredSet.has(criterion.id));
        const ignoredCriteria = config.criteria.filter(criterion => ignoredSet.has(criterion.id));

        return {
          question,
          config,
          recommendations,
          formattedAnswer,
          orderedCriteria,
          ignoredCriteria
        };
      })
      .filter(entry => entry.recommendations.length > 0 && entry.formattedAnswer);
  }, [answers, rankingQuestions]);

  const timelineDetails = analysis?.timeline?.details || [];
  const vigilanceAlerts = (Array.isArray(analysis?.timeline?.vigilance)
    ? analysis.timeline.vigilance
    : [])
    .filter(alert => alert && alert.status !== 'breach')
    .map(alert => ({
      ...alert,
      requirementSummary: formatTimingRequirementSummary(questions, alert.timingConstraint),
      statusMessage: formatVigilanceStatusMessage(alert)
    }));

  const extractedProjectName = extractProjectName(answers, questions);
  const effectiveProjectName =
    typeof providedProjectName === 'string' && providedProjectName.trim().length > 0
      ? providedProjectName.trim()
      : extractedProjectName;

  const scrollShowcaseIntoView = useCallback(() => {
    const node = showcaseFallbackRef.current;

    if (node) {
      if (typeof node.scrollIntoView === 'function') {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showcaseFallbackRef]);

  useEffect(() => {
    if (!isShowcaseFallbackOpen) {
      return;
    }

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        scrollShowcaseIntoView();
      });
    } else {
      scrollShowcaseIntoView();
    }
  }, [isShowcaseFallbackOpen, scrollShowcaseIntoView]);

  useEffect(() => {
    if (!attachmentReminder) {
      return;
    }

    if (
      reminderCloseButtonRef.current
      && typeof reminderCloseButtonRef.current.focus === 'function'
    ) {
      reminderCloseButtonRef.current.focus();
    }
  }, [attachmentReminder]);

  useEffect(() => {
    setComplianceCommentDrafts(
      buildComplianceCommentDrafts(complianceComments, relevantTeams, validationCommittees)
    );
  }, [complianceComments, relevantTeams, validationCommittees]);

  useEffect(() => {
    return () => {
      if (complianceCommentFeedbackTimeoutRef.current) {
        clearTimeout(complianceCommentFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const scheduleComplianceFeedback = useCallback((targetId, message) => {
    if (complianceCommentFeedbackTimeoutRef.current) {
      clearTimeout(complianceCommentFeedbackTimeoutRef.current);
    }

    setComplianceCommentFeedback({ targetId, message });

    complianceCommentFeedbackTimeoutRef.current = setTimeout(() => {
      setComplianceCommentFeedback(null);
    }, 4000);
  }, []);

  const handleComplianceCommentSubmit = useCallback(
    ({ event, targetId, targetType }) => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }

      if (!canSaveComplianceComment) {
        return;
      }

      const isCommittee = targetType === 'committee';
      const currentEntry = isCommittee
        ? complianceCommentDrafts.committees?.[targetId]
        : complianceCommentDrafts.teams?.[targetId];

      if (!currentEntry) {
        return;
      }

      const normalizedDraft =
        typeof currentEntry.comment === 'string' ? currentEntry.comment.replace(/\r\n/g, '\n') : '';
      const trimmedDraft = normalizedDraft.trim();
      const nextEntry = {
        comment: trimmedDraft,
        status: currentEntry.status
      };

      const nextComments = {
        teams: { ...(complianceComments?.teams || {}) },
        committees: { ...(complianceComments?.committees || {}) },
        legacy: complianceComments?.legacy || ''
      };

      if (isCommittee && targetId) {
        nextComments.committees[targetId] = nextEntry;
      } else if (targetId) {
        nextComments.teams[targetId] = nextEntry;
      }

      onUpdateAnswers({
        [COMPLIANCE_COMMENTS_KEY]: nextComments
      });

      setComplianceCommentDrafts((prev) => {
        const nextDrafts = {
          ...prev,
          teams: { ...(prev?.teams || {}) },
          committees: { ...(prev?.committees || {}) }
        };
        if (isCommittee && targetId) {
          nextDrafts.committees[targetId] = nextEntry;
        } else if (targetId) {
          nextDrafts.teams[targetId] = nextEntry;
        }
        return nextDrafts;
      });

      scheduleComplianceFeedback(
        `${targetType}-${targetId || 'committee'}`,
        trimmedDraft.length > 0
          ? 'Commentaire enregistré. Enregistrez ensuite le projet et chargez-le dans le dossier « submitted-projects » pour le rendre visible au porteur de projet.'
          : 'Commentaire effacé.'
      );
    },
    [
      canSaveComplianceComment,
      complianceCommentDrafts,
      complianceComments,
      onUpdateAnswers,
      scheduleComplianceFeedback
    ]
  );

  const handleComplianceCommentChange = useCallback(
    ({ targetId, targetType, field, value }) => {
      setComplianceCommentDrafts((prev) => {
        const nextDrafts = {
          ...prev,
          teams: { ...(prev?.teams || {}) },
          committees: { ...(prev?.committees || {}) }
        };
        if (targetType === 'committee' && targetId) {
          nextDrafts.committees[targetId] = {
            ...prev?.committees?.[targetId],
            [field]: value
          };
        } else if (targetId) {
          nextDrafts.teams[targetId] = {
            ...prev?.teams?.[targetId],
            [field]: value
          };
        }
        return nextDrafts;
      });

      if (complianceCommentFeedback) {
        if (complianceCommentFeedbackTimeoutRef.current) {
          clearTimeout(complianceCommentFeedbackTimeoutRef.current);
          complianceCommentFeedbackTimeoutRef.current = null;
        }
        setComplianceCommentFeedback(null);
      }
    },
    [complianceCommentFeedback]
  );

  const handleOpenShowcase = useCallback(() => {
    if (typeof onOpenProjectShowcase === 'function') {
      onOpenProjectShowcase({
        projectId,
        projectName: effectiveProjectName,
        status: projectStatus,
        answers,
        analysis,
        relevantTeams,
        questions,
        timelineDetails
      });
      return;
    }

    setIsShowcaseFallbackOpen(true);

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        scrollShowcaseIntoView();
      });
    } else {
      scrollShowcaseIntoView();
    }
  }, [
    analysis,
    answers,
    effectiveProjectName,
    onOpenProjectShowcase,
    projectId,
    projectStatus,
    questions,
    relevantTeams,
    scrollShowcaseIntoView,
    timelineDetails
  ]);

  const handleCloseShowcase = useCallback(() => {
    setIsShowcaseFallbackOpen(false);
  }, []);

  const handleDismissAttachmentReminder = useCallback(() => {
    setAttachmentReminder(null);
  }, []);

  const legacyComplianceComment = complianceComments.legacy?.trim() || '';
  const hasLegacyComplianceComment = legacyComplianceComment.length > 0;
  const committeeCommentMap = useMemo(() => {
    const nextMap = {};
    validationCommittees.forEach((committee) => {
      if (!committee?.id) {
        return;
      }
      nextMap[committee.id] = normalizeCommentEntry(complianceComments.committees?.[committee.id]);
    });
    return nextMap;
  }, [complianceComments.committees, validationCommittees]);
  const triggeredCommitteeIds = useMemo(
    () => new Set(triggeredValidationCommittees.map((committee) => committee.id)),
    [triggeredValidationCommittees]
  );
  const committeesToDisplay = validationCommittees.filter((committee) => {
    if (isAdminMode) {
      return true;
    }
    const hasComment = committeeCommentMap[committee.id]?.comment?.trim().length > 0;
    return triggeredCommitteeIds.has(committee.id) || hasComment;
  });
  const shouldShowCommitteeSection = committeesToDisplay.length > 0;
  const shouldShowComplianceCommentsSection =
    isAdminMode || relevantTeams.length > 0 || shouldShowCommitteeSection || hasLegacyComplianceComment;

  const getComplianceFeedbackMessage = useCallback(
    (targetId) => (complianceCommentFeedback?.targetId === targetId ? complianceCommentFeedback.message : null),
    [complianceCommentFeedback]
  );

  const handleSaveProject = useCallback(() => {
    if (!onSubmitProject) {
      return;
    }

    onSubmitProject({
      projectName: effectiveProjectName,
      answers,
      analysis,
      relevantTeams,
      timelineDetails
    });
  }, [analysis, answers, effectiveProjectName, onSubmitProject, relevantTeams, timelineDetails]);

  const handleDownloadProject = useCallback(() => {
    if (!onSaveDraft) {
      return;
    }

    onSaveDraft({
      projectName: effectiveProjectName,
      answers,
      analysis,
      questions,
      relevantTeams,
      timelineDetails,
      lastQuestionIndex: questions.length > 0 ? questions.length - 1 : 0
    });
  }, [analysis, answers, effectiveProjectName, onSaveDraft, questions, relevantTeams, timelineDetails]);

  const handleSubmitByEmail = useCallback(async () => {
    const emailHtml = buildEmailHtml({
      projectName: effectiveProjectName,
      questions,
      answers,
      analysis,
      relevantTeams
    });
    const emailText = buildPlainTextEmail(emailHtml);
    const projectExport = buildProjectExport({
      projectName: effectiveProjectName,
      answers
    });

    let projectJson = '';
    try {
      projectJson = JSON.stringify(projectExport, null, 2);
    } catch (error) {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('[SynthesisReport] Impossible de sérialiser le projet :', error);
      }
      projectJson = JSON.stringify(
        {
          version: 1,
          project: {
            name: projectExport.project.name,
            answers: {}
          }
        },
        null,
        2
      );
    }

    const fileNameBase = sanitizeFileName(effectiveProjectName || 'Projet compliance');
    const fileName = `${fileNameBase}.json`;
    const subject = effectiveProjectName || 'Projet compliance';

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof File === 'function') {
      try {
        const projectFile = new File([projectJson], fileName, {
          type: 'application/json'
        });
        const canShare =
          typeof navigator.canShare === 'function'
            ? navigator.canShare({ files: [projectFile] })
            : true;

        if (canShare) {
          await navigator.share({
            title: subject,
            text: `${emailText}\n\nFichier du projet : ${fileName}`,
            files: [projectFile]
          });
          return;
        }
      } catch (error) {
        if (error && error.name === 'AbortError') {
          return;
        }

        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('[SynthesisReport] Partage du projet impossible :', error);
        }
      }
    }

    downloadProjectJson(projectJson, { projectName: effectiveProjectName });
    setAttachmentReminder({ fileName });

    const fallbackBody = `${emailText}\n\nFichier du projet : ${fileName}\nLe fichier JSON a été téléchargé automatiquement ; merci de l'ajouter en pièce jointe avant envoi.`;
    const mailtoLink = buildMailtoLink({ projectName: effectiveProjectName, relevantTeams, body: fallbackBody });
    if (typeof window !== 'undefined') {
      window.location.href = mailtoLink;
    }
  }, [
    analysis,
    answers,
    effectiveProjectName,
    questions,
    relevantTeams,
    timelineDetails,
    setAttachmentReminder
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-6 sm:px-8 sm:py-10 hv-background">
      <div className="max-w-6xl mx-auto">
        <div
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6 hv-surface"
          role="region"
          aria-label="Synthèse du projet"
          data-tour-id="synthesis-summary"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">Synthèse</h1>
              {projectStatusLabel && (
                <span
                  className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${projectStatusClasses}`}
                >
                  Statut : {projectStatusLabel}
                </span>
              )}
              {!isProjectEditable && (
                <p className="text-sm text-gray-500">
                  Ce projet n'est pas en mode brouillon. Les modifications sont désactivées dans cette vue.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 w-full lg:w-auto">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium text-gray-700 transition-all hv-button hv-focus-ring w-full sm:w-auto justify-center text-sm sm:text-base"
                >
                  Retour au questionnaire
                </button>
              )}
              {onSaveDraft && (
                <button
                  type="button"
                  onClick={handleDownloadProject}
                  className="px-4 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all flex items-center justify-center hv-button hv-focus-ring w-full sm:w-auto text-sm sm:text-base"
                  data-tour-id="synthesis-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder le projet
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmitByEmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
                data-tour-id="synthesis-submit"
              >
                <Send className="w-4 h-4 mr-2" />
                Soumettre par e-mail
              </button>
              <button
                type="button"
                onClick={handleOpenShowcase}
                className="px-4 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all flex items-center justify-center hv-button hv-focus-ring w-full sm:w-auto text-sm sm:text-base"
                data-tour-id="synthesis-showcase"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Vitrine du projet
              </button>
            </div>
          </div>

          {hasSaveFeedback && (
            <div className="mb-6" role="status" aria-live="polite">
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                  isSaveSuccess
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {isSaveSuccess ? (
                  <CheckCircle className="mt-0.5 h-5 w-5" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{saveFeedback.message}</p>
                </div>
                {typeof onDismissSaveFeedback === 'function' && (
                  <button
                    type="button"
                    onClick={onDismissSaveFeedback}
                    className="text-xs font-semibold uppercase tracking-wide text-current hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-current rounded"
                  >
                    Fermer
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Vue d'ensemble */}
          <section className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 sm:p-6 mb-8 border border-blue-200 hv-surface" aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-600" />
              Vue d'ensemble du projet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map(q => {
                const answerValue = answers[q.id];
                const shouldRenderCard = isAnswerProvided(answerValue) || q.required;

                if (!shouldRenderCard) {
                  return null;
                }

                const displayValue = formatOverviewValue(q, answerValue);

                return (
                  <div key={q.id} className="bg-white rounded-lg p-4 border border-gray-200 hv-surface">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm text-gray-600">{q.question}</p>
                      {typeof onNavigateToQuestion === 'function' && isProjectEditable && (
                        <button
                          type="button"
                          onClick={() => onNavigateToQuestion(q.id)}
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors hv-button hv-focus-ring"
                          aria-label={`Modifier la réponse pour « ${q.question} »`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 whitespace-pre-line">
                      {renderTextWithLinks(displayValue || 'Information à compléter')}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg p-4 border border-gray-200 hv-surface" role="status" aria-live="polite">
              <span className="font-medium text-gray-700">Niveau de complexité compliance :</span>
              <span className={`text-xl font-bold ${complexityColors[analysis.complexity] || 'text-blue-600'}`}>
                {analysis.complexity}
              </span>
            </div>
            {analysis?.complexityRule?.description && (
              <p className="mt-3 bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-600 hv-surface">
                {analysis.complexityRule.description}
              </p>
            )}
            {formattedRiskScore && (
              <p className="mt-3 text-sm text-gray-500">
                Score de risque total : {formattedRiskScore}
              </p>
            )}
          </section>


          {/* Équipes à solliciter */}
          <section className="mb-8" aria-labelledby="teams-heading" data-tour-id="synthesis-teams">
            <h2 id="teams-heading" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Équipes à solliciter ({relevantTeams.length})
            </h2>
            {hasIncompleteAnswers && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                <Info className="mt-0.5 h-5 w-5" />
                <p>En attente de l’ensemble des informations sur le projet pour une évaluation complète.</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relevantTeams.map(team => {
                const teamPriority = getTeamPriority(analysis, team.id);
                const teamQuestions = analysis.questions?.[team.id];
                const teamContactLabel = formatTeamContacts(team, ' · ');
                const formattedTeamQuestions = Array.isArray(teamQuestions)
                  ? teamQuestions
                      .map(normalizeTeamQuestionForDisplay)
                      .filter(question => (question.text || '').trim().length > 0)
                  : [];

                return (
                  <div key={team.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all hv-surface" role="article" aria-label={`Équipe ${team.name}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border hv-badge ${priorityColors[teamPriority]}`}>
                        {teamPriority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{renderTextWithLinks(team.expertise)}</p>
                    {teamContactLabel && (
                      <div className="mt-2 text-sm text-blue-600 font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {renderTextWithLinks(teamContactLabel)}
                      </div>
                    )}

                    {formattedTeamQuestions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Points à préparer :</h4>
                        <ul className="space-y-1">
                          {formattedTeamQuestions.map((question, idx) => {
                            const timingMessage = formatTeamQuestionTimingMessage(questions, question.timingViolation);
                            return (
                              <li key={idx} className="text-sm text-gray-700 flex flex-col">
                                <div className="flex">
                                  <span className="text-blue-500 mr-2">•</span>
                                  <span>{renderTextWithLinks(question.text)}</span>
                                </div>
                                {timingMessage && (
                                  <span className="ml-5 text-xs text-yellow-600 mt-1">⚠️ {timingMessage}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div data-tour-id="synthesis-risks" className="space-y-8">
            {/* Risques identifiés */}
            <section aria-labelledby="risks-heading">
              <h2 id="risks-heading" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
                Risques identifiés ({analysis.risks.length})
              </h2>
              {hasIncompleteAnswers && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  <Info className="mt-0.5 h-5 w-5" />
                  <p>En attente de l’ensemble des informations sur le projet pour une évaluation complète.</p>
                </div>
              )}
              <div className="space-y-3">
                {analysis.risks.map((risk, idx) => {
                  const timingViolationMessage = formatRiskTimingViolation(risk.timingViolation);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border hv-surface ${riskColors[risk.level]}`}
                      role="article"
                      aria-label={`Risque ${risk.level}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-700">{risk.level}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border hv-badge ${priorityColors[risk.priority]}`}>
                          {risk.priority}
                        </span>
                      </div>
                      <p className="text-gray-800 font-medium">{renderTextWithLinks(risk.description)}</p>
                      {timingViolationMessage && (
                        <p className="text-xs text-red-600 mt-2">{timingViolationMessage}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-2">
                        <span className="font-semibold text-gray-700">Équipe référente :</span>{' '}
                        {(() => {
                          const associatedTeam = teams.find(team => {
                            if (risk.teamId) {
                              return team.id === risk.teamId;
                            }
                            if (Array.isArray(risk.teams)) {
                              return risk.teams.includes(team.id);
                            }
                            return false;
                          });

                          if (associatedTeam) {
                            return associatedTeam.name;
                          }

                          if (risk.teamId) {
                            return risk.teamId;
                          }

                          if (Array.isArray(risk.teams) && risk.teams.length > 0) {
                            return risk.teams[0];
                          }

                          return 'Non renseignée';
                        })()}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-semibold text-gray-700">Mitigation :</span>{' '}
                        {renderTextWithLinks(risk.mitigation)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {rankingResults.map(result => (
              <section key={result.question.id} aria-labelledby={`ranking-${result.question.id}`} className="mt-8">
                <h3
                  id={`ranking-${result.question.id}`}
                  className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  {result.config.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">Priorités déclarées : {result.formattedAnswer}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.recommendations.map(recommendation => (
                    <article
                      key={recommendation.id}
                      className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-3 hv-surface"
                      aria-label={`Recommandation ${recommendation.name}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{recommendation.name}</h4>
                          {recommendation.previousProject && (
                            <p className="text-xs text-gray-600">Projet récent : {recommendation.previousProject}</p>
                          )}
                          {recommendation.opinion && (
                            <p className="text-xs text-gray-600">Avis global : {recommendation.opinion}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-gray-500 uppercase">Score</span>
                          <p className="text-xl font-bold text-indigo-700">{formatNumber(recommendation.score, { maximumFractionDigits: 1 })}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {result.orderedCriteria.map(criterion => (
                          <span
                            key={`${recommendation.id}-${criterion.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {criterion.label} : <span className="text-gray-900">{formatCriterionScore(recommendation.scores?.[criterion.id])}</span>
                          </span>
                        ))}
                        {result.ignoredCriteria.map(criterion => (
                          <span
                            key={`${recommendation.id}-${criterion.id}-ignored`}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200"
                          >
                            {criterion.label} : sans importance
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-col gap-1 text-sm text-gray-700">
                        {recommendation.contact && (
                          <div className="flex items-center gap-2 text-blue-700">
                            <Mail className="w-4 h-4" />
                            {renderTextWithLinks(recommendation.contact)}
                          </div>
                        )}
                        {recommendation.website && (
                          <a
                            href={recommendation.website}
                            className="text-sm text-blue-600 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Consulter le site
                          </a>
                        )}
                        {recommendation.notes && (
                          <p className="text-xs text-gray-600 mt-1">{renderTextWithLinks(recommendation.notes)}</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {vigilanceAlerts.length > 0 && (
              <section aria-labelledby="vigilance-heading" className="mt-8">
                <h2 id="vigilance-heading" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-emerald-500" />
                  Points de vigilance ({vigilanceAlerts.length})
                </h2>
                <div className="space-y-3">
                  {vigilanceAlerts.map(alert => {
                    const priorityClass = priorityColors[alert.priority] || 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    const statusClass = vigilanceStatusClasses[alert.status] || vigilanceStatusClasses.unknown;
                    const title = alert.riskDescription && alert.riskDescription.trim().length > 0
                      ? alert.riskDescription
                      : alert.ruleName;
                    const teamLabel = resolveTeamLabel(alert.teamId);

                    return (
                      <div
                        key={alert.id || `${alert.ruleId}-${alert.riskId || 'risk'}`}
                        className={`p-4 rounded-xl border hv-surface ${statusClass}`}
                        role="article"
                        aria-label={`Point de vigilance ${alert.ruleName}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700">{alert.ruleName}</span>
                          {alert.priority && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border hv-badge ${priorityClass}`}>
                              {alert.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 font-medium">{renderTextWithLinks(title)}</p>
                        {alert.requirementSummary && (
                          <p className="text-xs text-emerald-800 mt-2">{alert.requirementSummary}</p>
                        )}
                        {alert.statusMessage && (
                          <p className="text-xs text-gray-600 mt-2">{alert.statusMessage}</p>
                        )}
                        {teamLabel && (
                          <p className="text-xs text-gray-600 mt-2">
                            <span className="font-semibold text-gray-700">Équipe référente :</span>{' '}
                            {teamLabel}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {shouldShowComplianceCommentsSection && (
            <section className="mt-8" aria-labelledby="compliance-comments-heading">
              <div className="bg-white rounded-xl border border-blue-200 p-6 hv-surface space-y-6">
                <div className="flex items-center">
                  <Info className="w-6 h-6 mr-2 text-blue-600" />
                  <h2 id="compliance-comments-heading" className="text-2xl font-bold text-gray-800">
                    Commentaire des experts sujets
                  </h2>
                </div>

                {relevantTeams.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aucune équipe compliance n’est sollicitée pour ce projet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {relevantTeams.map((team) => {
                      const storedEntry = normalizeCommentEntry(complianceComments.teams?.[team.id]);
                      const draftEntry = complianceCommentDrafts.teams?.[team.id] || storedEntry;
                      const statusMeta = getCommentStatusMeta(isAdminMode ? draftEntry.status : storedEntry.status);
                      const isDirty =
                        draftEntry.comment !== storedEntry.comment || draftEntry.status !== storedEntry.status;
                      const feedbackMessage = getComplianceFeedbackMessage(`team-${team.id}`);
                      const teamContactLabel = formatTeamContacts(team, ' · ');

                      return (
                        <article key={`compliance-comment-${team.id}`} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base font-semibold text-gray-800">{team.name}</h3>
                              {teamContactLabel && (
                                <p className="text-xs text-gray-500">{teamContactLabel}</p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}>
                              {statusMeta.label}
                            </span>
                          </div>

                          {isAdminMode ? (
                            <form
                              onSubmit={(event) =>
                                handleComplianceCommentSubmit({ event, targetId: team.id, targetType: 'team' })
                              }
                              className="mt-4 space-y-3"
                            >
                              <div>
                                <label className="block text-sm font-medium text-gray-700" htmlFor={`compliance-status-${team.id}`}>
                                  Statut
                                </label>
                                <select
                                  id={`compliance-status-${team.id}`}
                                  value={draftEntry.status}
                                  onChange={(event) =>
                                    handleComplianceCommentChange({
                                      targetId: team.id,
                                      targetType: 'team',
                                      field: 'status',
                                      value: event.target.value
                                    })
                                  }
                                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                  {COMMENT_STATUS_OPTIONS.map((option) => (
                                    <option key={`status-${team.id}-${option.value}`} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700" htmlFor={`compliance-comment-${team.id}`}>
                                  Commentaire
                                </label>
                                <textarea
                                  id={`compliance-comment-${team.id}`}
                                  rows={4}
                                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                  placeholder="Ajoutez ici vos recommandations ou points d'attention..."
                                  value={draftEntry.comment}
                                  onChange={(event) =>
                                    handleComplianceCommentChange({
                                      targetId: team.id,
                                      targetType: 'team',
                                      field: 'comment',
                                      value: event.target.value
                                    })
                                  }
                                />
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-gray-500">
                                  Ces commentaires sont enregistrés dans le rapport. Enregistrez ensuite le projet et chargez-le dans le dossier « submitted-projects » pour qu’ils soient visibles par le Chef de projet.
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <button
                                    type="submit"
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all hv-button ${
                                      canSaveComplianceComment && isDirty
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 hv-button-primary'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                    disabled={!canSaveComplianceComment || !isDirty}
                                  >
                                    Enregistrer le commentaire
                                  </button>
                                  {feedbackMessage && (
                                    <span className="text-xs font-medium text-emerald-700">
                                      {feedbackMessage}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </form>
                          ) : (
                            <div className="mt-3">
                              {storedEntry.comment.trim().length > 0 ? (
                                <p className="text-sm text-gray-800 whitespace-pre-line">
                                  {renderTextWithLinks(storedEntry.comment)}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  Aucun commentaire communiqué pour le moment.
                                </p>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

                {shouldShowCommitteeSection && (
                  <div className="space-y-4">
                    {triggeredValidationCommittees.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <p className="font-medium">Comité(s) requis pour ce projet :</p>
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                          {triggeredValidationCommittees.map((committee) => (
                            <li key={`required-${committee.id}`}>{committee.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {committeesToDisplay.map((committee) => {
                      const committeeCommentEntry = committeeCommentMap[committee.id] || normalizeCommentEntry();
                      const committeeDraft = complianceCommentDrafts.committees?.[committee.id] || committeeCommentEntry;
                      const feedbackMessage = getComplianceFeedbackMessage(`committee-${committee.id}`);
                      const isRequired = triggeredCommitteeIds.has(committee.id);
                      const isDirty =
                        committeeDraft.comment !== committeeCommentEntry.comment
                        || committeeDraft.status !== committeeCommentEntry.status;

                      return (
                        <article key={committee.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base font-semibold text-gray-800">{committee.name}</h3>
                              <p className="text-xs text-gray-500">
                                {isRequired
                                  ? 'Commentaire requis selon la configuration.'
                                  : 'Commentaire optionnel selon la configuration.'}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                getCommentStatusMeta(
                                  isAdminMode ? committeeDraft.status : committeeCommentEntry.status
                                ).badgeClass
                              }`}
                            >
                              {
                                getCommentStatusMeta(
                                  isAdminMode ? committeeDraft.status : committeeCommentEntry.status
                                ).label
                              }
                            </span>
                          </div>

                          {isAdminMode ? (
                            <form
                              onSubmit={(event) =>
                                handleComplianceCommentSubmit({
                                  event,
                                  targetId: committee.id,
                                  targetType: 'committee'
                                })
                              }
                              className="mt-4 space-y-3"
                            >
                              <div>
                                <label
                                  className="block text-sm font-medium text-gray-700"
                                  htmlFor={`compliance-committee-status-${committee.id}`}
                                >
                                  Statut
                                </label>
                                <select
                                  id={`compliance-committee-status-${committee.id}`}
                                  value={committeeDraft.status}
                                  onChange={(event) =>
                                    handleComplianceCommentChange({
                                      targetId: committee.id,
                                      targetType: 'committee',
                                      field: 'status',
                                      value: event.target.value
                                    })
                                  }
                                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                  {COMMENT_STATUS_OPTIONS.map((option) => (
                                    <option key={`status-committee-${committee.id}-${option.value}`} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label
                                  className="block text-sm font-medium text-gray-700"
                                  htmlFor={`compliance-committee-comment-${committee.id}`}
                                >
                                  Commentaire
                                </label>
                                <textarea
                                  id={`compliance-committee-comment-${committee.id}`}
                                  rows={4}
                                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                  placeholder="Ajoutez ici les décisions ou arbitrages du comité..."
                                  value={committeeDraft.comment}
                                  onChange={(event) =>
                                    handleComplianceCommentChange({
                                      targetId: committee.id,
                                      targetType: 'committee',
                                      field: 'comment',
                                      value: event.target.value
                                    })
                                  }
                                />
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-gray-500">
                                  Le commentaire du comité est enregistré dans le rapport projet.
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <button
                                    type="submit"
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all hv-button ${
                                      canSaveComplianceComment && isDirty
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 hv-button-primary'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                    disabled={!canSaveComplianceComment || !isDirty}
                                  >
                                    Enregistrer le commentaire
                                  </button>
                                  {feedbackMessage && (
                                    <span className="text-xs font-medium text-emerald-700">
                                      {feedbackMessage}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </form>
                          ) : (
                            <div className="mt-3">
                              {committeeCommentEntry.comment.trim().length > 0 ? (
                                <p className="text-sm text-gray-800 whitespace-pre-line">
                                  {renderTextWithLinks(committeeCommentEntry.comment)}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  Aucun commentaire du comité pour le moment.
                                </p>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

                {hasLegacyComplianceComment && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Commentaire historique
                    </p>
                    <p className="mt-2 whitespace-pre-line text-gray-700">
                      {renderTextWithLinks(legacyComplianceComment)}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
      {isShowcaseFallbackOpen && (
        <div ref={showcaseFallbackRef}>
          <ProjectShowcase
            projectName={effectiveProjectName}
            onClose={handleCloseShowcase}
            analysis={analysis}
            relevantTeams={relevantTeams}
            questions={questions}
            answers={answers}
            timelineDetails={timelineDetails}
            onUpdateAnswers={onUpdateAnswers}
          />
        </div>
      )}
      {attachmentReminder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black bg-opacity-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attachment-reminder-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 hv-surface hv-modal-panel">
            <div className="flex items-center justify-center">
              <Mail className="w-10 h-10 text-blue-600" aria-hidden="true" />
            </div>
            <div className="text-center">
              <h2 id="attachment-reminder-title" className="text-xl font-semibold text-gray-800">
                N'oubliez pas la pièce jointe JSON
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Le fichier{' '}
                <span className="font-medium text-gray-900">{attachmentReminder.fileName}</span>
                {' '}vient d'être téléchargé. Ajoutez-le en pièce jointe de votre e-mail aux équipes compliance pour garantir
                l'intégration du projet dans la base de données.
              </p>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleDismissAttachmentReminder}
                ref={reminderCloseButtonRef}
                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hv-button hv-button-primary"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
