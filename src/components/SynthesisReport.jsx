import React, { useState, useCallback, useEffect, useRef } from '../react.js';
import { FileText, Calendar, Users, AlertTriangle, Send, Sparkles, CheckCircle, Save } from './icons.js';
import { formatAnswer } from '../utils/questions.js';
import { renderTextWithLinks } from '../utils/linkify.js';
import { ProjectShowcase } from './ProjectShowcase.jsx';
import { extractProjectName } from '../utils/projects.js';
import {
  buildProjectExport,
  downloadProjectJson,
  getTeamPriority,
  sanitizeFileName
} from '../utils/projectExport.js';

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

const formatRequirementValue = (requirement) => {
  if (requirement.requiredWeeks !== undefined) {
    return `${formatNumber(requirement.requiredWeeks)} sem.`;
  }

  if (requirement.requiredDays !== undefined) {
    return `${formatNumber(requirement.requiredDays)} j.`;
  }

  return '-';
};

const computeTeamTimeline = (timelineByTeam, teamId) => {
  const entries = timelineByTeam[teamId] || [];
  if (entries.length === 0) {
    return null;
  }

  const actualWeeks = entries[0].actualWeeks;
  const actualDays = entries[0].actualDays;
  const meetsAll = entries.every(entry => entry.satisfied);
  const strictestRequirement = entries.reduce((acc, entry) => {
    const requirementWeeks =
      entry.requiredWeeks !== undefined
        ? entry.requiredWeeks
        : entry.requiredDays !== undefined
          ? entry.requiredDays / 7
          : 0;

    return requirementWeeks > acc ? requirementWeeks : acc;
  }, 0);

  return {
    entries,
    actualWeeks,
    actualDays,
    meetsAll,
    strictestRequirement
  };
};

const formatAsHtmlText = (value) => {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
};

const buildEmailHtml = ({
  projectName,
  questions,
  answers,
  analysis,
  relevantTeams,
  timelineByTeam,
  timelineDetails
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
  const firstTimelineDetail = timelineDetails.find(detail => detail.diff);
  const hasTimelineData = Object.keys(timelineByTeam).length > 0 || Boolean(firstTimelineDetail);

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

  const timelineSection = hasTimelineData
    ? `
        <div style="margin-bottom:24px;">
          <h2 style="font-size:18px; font-weight:600; color:#1f2937; margin-bottom:12px;">
            Délais compliance recommandés
          </h2>
          <div style="background-color:#eef2ff; border:1px solid #c7d2fe; border-radius:12px; padding:16px; color:#312e81; font-size:14px; margin-bottom:16px;">
            ${firstTimelineDetail?.diff
              ? `Buffer projet : <strong>${escapeHtml(
                  formatWeeksValue(firstTimelineDetail.diff.diffInWeeks)
                )}</strong> (${escapeHtml(formatDaysValue(firstTimelineDetail.diff.diffInDays))})`
              : 'Dates projet incomplètes : les délais sont fournis à titre indicatif.'}
          </div>
          ${relevantTeams
            .map(team => {
              const timelineInfo = computeTeamTimeline(timelineByTeam, team.id);
              const teamName = escapeHtml(team.name);

              if (!timelineInfo) {
                return `
                  <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:12px; background-color:#ffffff;">
                    <h3 style="margin:0 0 8px; font-size:16px; font-weight:600; color:#1f2937;">${teamName}</h3>
                    <p style="margin:0; font-size:14px; color:#4b5563;">Aucune exigence de délai configurée.</p>
                  </div>
                `;
              }

              const entriesHtml = timelineInfo.entries
                .map(entry => {
                  const statusColor = entry.satisfied ? '#059669' : '#dc2626';
                  const statusLabel = entry.satisfied ? 'Délai respecté' : 'Délai insuffisant';
                  const requirementLabel = escapeHtml(formatRequirementValue(entry));
                  const profileLabel = escapeHtml(entry.profileLabel);

                  return `
                    <li style="margin-bottom:6px;">
                      <span style="font-weight:600; color:#1f2937;">${profileLabel}</span>
                      <span style="color:#4b5563;"> — ${requirementLabel}</span>
                      <span style="color:${statusColor}; font-weight:600;"> (${statusLabel})</span>
                    </li>
                  `;
                })
                .join('');

              return `
                <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:12px; background-color:#ffffff;">
                  <h3 style="margin:0 0 8px; font-size:16px; font-weight:600; color:#1f2937;">${teamName}</h3>
                  <p style="margin:0; font-size:14px; color:#4b5563;">
                    Buffer actuel : <strong>${escapeHtml(formatWeeksValue(timelineInfo.actualWeeks))}</strong>
                    (${escapeHtml(formatDaysValue(timelineInfo.actualDays))})
                  </p>
                  <p style="margin:4px 0 10px; font-size:14px; color:#4b5563;">
                    Exigence la plus stricte : <strong>${escapeHtml(
                      formatWeeksValue(timelineInfo.strictestRequirement)
                    )}</strong>
                  </p>
                  <ul style="margin:0; padding-left:18px; list-style-type:disc; color:#4b5563; font-size:13px;">
                    ${entriesHtml}
                  </ul>
                </div>
              `;
            })
            .join('')}
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
              const contact = team.contact ? `<span style="color:#4b5563;"> | Contact : ${escapeHtml(team.contact)}</span>` : '';

              const questionsHtml = Array.isArray(teamQuestions) && teamQuestions.length
                ? `
                    <div style="margin-top:8px;">
                      <span style="font-size:13px; color:#4b5563; font-weight:600;">Points à préparer :</span>
                      <ul style="margin:8px 0 0; padding-left:18px; list-style-type:disc; color:#4b5563; font-size:13px;">
                        ${teamQuestions
                          .map(question => `<li>${escapeHtml(question)}</li>`)
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
              return `
                <div style="border:1px solid #fee2e2; border-radius:12px; padding:16px; margin-bottom:12px; background-color:#fef2f2;">
                  <div style="font-size:15px; font-weight:600; color:#b91c1c;">
                    ${escapeHtml(risk.level)} — Priorité : ${escapeHtml(risk.priority)}
                  </div>
                  <p style="margin:8px 0 4px; font-size:14px; color:#4b5563;">
                    <strong>Description :</strong> ${formatAsHtmlText(risk.description)}
                  </p>
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
                <h1 style="font-size:24px; color:#111827; margin:0 0 6px;">Rapport de Compliance</h1>
                <p style="margin:0; color:#4b5563; font-size:14px;">${escapeHtml(title)}</p>
              </div>
              <div style="padding:10px 16px; background-color:#eef2ff; color:#4338ca; border-radius:9999px; font-weight:600; font-size:14px;">
                Complexité : ${escapeHtml(analysis.complexity)}
              </div>
            </div>
            <p style="margin:0 0 20px; font-size:14px; color:#1f2937;">
              Bonjour équipe Compliance, un nouveau projet a été soumis pour revue. Vous trouverez ci-dessous les informations principales.
            </p>
            ${overviewSection}
            ${timelineSection}
            ${teamSection}
            ${riskSection}
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
  const recipients = relevantTeams
    .map(team => (team.contact || '').trim())
    .filter(contact => contact.length > 0);

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
  onRestart,
  onBack,
  onUpdateAnswers,
  onSubmitProject,
  onSaveDraft,
  saveFeedback,
  onDismissSaveFeedback
}) => {
  const [isShowcaseFallbackOpen, setIsShowcaseFallbackOpen] = useState(false);
  const showcaseFallbackRef = useRef(null);
  const relevantTeams = teams.filter(team => (analysis?.teams || []).includes(team.id));
  const hasSaveFeedback = Boolean(saveFeedback?.message);
  const isSaveSuccess = saveFeedback?.status === 'success';

  const priorityColors = {
    Critique: 'bg-red-100 text-red-800 border-red-300',
    Important: 'bg-orange-100 text-orange-800 border-orange-300',
    Recommandé: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const riskColors = {
    Élevé: 'bg-red-50 border-red-300 text-red-900',
    Moyen: 'bg-orange-50 border-orange-300 text-orange-900',
    Faible: 'bg-green-50 border-green-300 text-green-900'
  };

  const complexityColors = {
    Élevé: 'text-red-600',
    Moyen: 'text-orange-600',
    Faible: 'text-green-600'
  };

  const timelineByTeam = analysis?.timeline?.byTeam || {};
  const timelineDetails = analysis?.timeline?.details || [];
  const firstTimelineDetail = timelineDetails.find(detail => detail.diff);

  const hasTimelineData =
    Object.keys(timelineByTeam).length > 0 || Boolean(firstTimelineDetail);

  const projectName = extractProjectName(answers, questions);

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

  const handleOpenShowcase = useCallback(() => {
    setIsShowcaseFallbackOpen(true);

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        scrollShowcaseIntoView();
      });
    } else {
      scrollShowcaseIntoView();
    }
  }, [scrollShowcaseIntoView]);

  const handleCloseShowcase = useCallback(() => {
    setIsShowcaseFallbackOpen(false);
  }, []);

  const handleSaveProject = useCallback(() => {
    if (!onSubmitProject) {
      return;
    }

    onSubmitProject({
      projectName,
      answers,
      analysis,
      relevantTeams,
      timelineDetails
    });
  }, [analysis, answers, onSubmitProject, projectName, relevantTeams, timelineDetails]);

  const handleDownloadProject = useCallback(() => {
    if (!onSaveDraft) {
      return;
    }

    onSaveDraft({
      projectName,
      answers,
      analysis,
      questions,
      relevantTeams,
      timelineDetails,
      lastQuestionIndex: questions.length > 0 ? questions.length - 1 : 0
    });
  }, [analysis, answers, onSaveDraft, projectName, questions, relevantTeams, timelineDetails]);

  const handleSubmitByEmail = useCallback(async () => {
    const emailHtml = buildEmailHtml({
      projectName,
      questions,
      answers,
      analysis,
      relevantTeams,
      timelineByTeam,
      timelineDetails
    });
    const emailText = buildPlainTextEmail(emailHtml);
    const projectExport = buildProjectExport({
      projectName,
      answers,
      analysis,
      relevantTeams,
      timelineByTeam,
      timelineDetails,
      questions
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

    const fileNameBase = sanitizeFileName(projectName || 'Projet compliance');
    const fileName = `${fileNameBase}.json`;
    const subject = projectName || 'Projet compliance';

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

    downloadProjectJson(projectJson, { projectName });

    const fallbackBody = `${emailText}\n\nFichier du projet : ${fileName}\nLe fichier JSON a été téléchargé automatiquement ; merci de l'ajouter en pièce jointe avant envoi.`;
    const mailtoLink = buildMailtoLink({ projectName, relevantTeams, body: fallbackBody });
    if (typeof window !== 'undefined') {
      window.location.href = mailtoLink;
    }
  }, [
    analysis,
    answers,
    projectName,
    questions,
    relevantTeams,
    timelineByTeam,
    timelineDetails
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-6 sm:px-8 sm:py-10 hv-background">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6 hv-surface" role="region" aria-label="Synthèse du projet">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">Rapport de Compliance</h1>
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
              {onSubmitProject && (
                <button
                  type="button"
                  onClick={handleSaveProject}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all flex items-center justify-center hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enregistrer le projet
                </button>
              )}
              {onSaveDraft && (
                <button
                  type="button"
                  onClick={handleDownloadProject}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all flex items-center justify-center hv-button w-full sm:w-auto text-sm sm:text-base"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Télécharger le projet
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmitByEmail}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
              >
                <Send className="w-4 h-4 mr-2" />
                Soumettre par e-mail
              </button>
              <button
                type="button"
                onClick={handleOpenShowcase}
                className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-all flex items-center justify-center hv-button hv-focus-ring w-full sm:w-auto text-sm sm:text-base"
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
          <section className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 sm:p-6 mb-8 border border-indigo-200 hv-surface" aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-indigo-600" />
              Vue d'ensemble du projet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map(q =>
                answers[q.id] ? (
                  <div key={q.id} className="bg-white rounded-lg p-4 border border-gray-200 hv-surface">
                    <p className="text-sm text-gray-600 mb-1">{q.question}</p>
                    <p className="font-semibold text-gray-900 whitespace-pre-line">
                      {renderTextWithLinks(formatAnswer(q, answers[q.id]))}
                    </p>
                  </div>
                ) : null
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg p-4 border border-gray-200 hv-surface" role="status" aria-live="polite">
              <span className="font-medium text-gray-700">Niveau de complexité compliance :</span>
              <span className={`text-xl font-bold ${complexityColors[analysis.complexity]}`}>
                {analysis.complexity}
              </span>
            </div>
          </section>

          {hasTimelineData && (
            <section className="mb-8" aria-labelledby="timeline-heading">
              <h2 id="timeline-heading" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-indigo-600" />
                Délais compliance recommandés
              </h2>
                {firstTimelineDetail?.diff ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 text-sm text-gray-700 hv-surface">
                  <span className="font-semibold text-gray-800">Buffer projet calculé :</span>{' '}
                  {formatWeeksValue(firstTimelineDetail.diff.diffInWeeks)}
                  {' '}({formatDaysValue(firstTimelineDetail.diff.diffInDays)}) entre la soumission et le lancement.
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-yellow-800 hv-surface" role="status" aria-live="polite">
                  Les dates projet ne sont pas complètes. Les exigences de délais sont indiquées à titre informatif.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relevantTeams.map(team => {
                  const timelineInfo = computeTeamTimeline(timelineByTeam, team.id);

                  if (!timelineInfo) {
                    return (
                      <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-5 hv-surface">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200 hv-badge">
                            Pas d'exigence
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Aucun délai spécifique n'a été configuré pour cette équipe dans le back-office.
                        </p>
                      </div>
                    );
                  }

                  const statusClasses = timelineInfo.meetsAll
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200';

                  return (
                    <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-5 hv-surface" role="article" aria-label={`Exigences de délai pour ${team.name}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                          <p className="text-xs text-gray-500">{team.expertise}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusClasses} self-start sm:self-auto`}>
                          {timelineInfo.meetsAll ? 'Délai suffisant' : 'Délai insuffisant'}
                        </span>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 mb-3 hv-surface">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-medium text-gray-800">Buffer actuel</span>
                          <span>{formatWeeksValue(timelineInfo.actualWeeks)} ({formatDaysValue(timelineInfo.actualDays)})</span>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-1">
                          <span className="text-gray-600">Exigence la plus stricte</span>
                          <span>{formatWeeksValue(timelineInfo.strictestRequirement)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {timelineInfo.entries.map(entry => {
                          const requirementLabel = formatRequirementValue(entry);
                          return (
                            <div
                              key={`${entry.profileId}-${entry.requiredWeeks ?? entry.requiredDays ?? 'req'}`}
                              className={`border rounded-lg p-3 text-sm hv-surface ${entry.satisfied ? 'border-green-200 bg-green-50 text-green-800' : 'border-orange-200 bg-orange-50 text-orange-800'}`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold">{entry.profileLabel}</span>
                                <span className="font-mono text-xs">{requirementLabel}</span>
                              </div>
                              {entry.description && (
                                <p className="text-xs opacity-80">{renderTextWithLinks(entry.description)}</p>
                              )}
                              <div className="mt-2 text-xs font-semibold">
                                {entry.satisfied ? '✅ Délai respecté' : '⚠️ Prévoir un délai supplémentaire'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Équipes à solliciter */}
          <section className="mb-8" aria-labelledby="teams-heading">
            <h2 id="teams-heading" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-6 h-6 mr-2 text-indigo-600" />
              Équipes à solliciter ({relevantTeams.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relevantTeams.map(team => {
                const teamPriority = getTeamPriority(analysis, team.id);
                const teamQuestions = analysis.questions?.[team.id];

                return (
                  <div key={team.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-300 transition-all hv-surface" role="article" aria-label={`Équipe ${team.name}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border hv-badge ${priorityColors[teamPriority]}`}>
                        {teamPriority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{renderTextWithLinks(team.expertise)}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>À solliciter en phase de conception</span>
                    </div>
                    <div className="mt-2 text-sm text-indigo-600 font-medium">
                      📧 {renderTextWithLinks(team.contact)}
                    </div>

                      {teamQuestions && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">Points à préparer :</h4>
                          <ul className="space-y-1">
                            {teamQuestions.map((question, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex">
                              <span className="text-indigo-500 mr-2">•</span>
                              <span>{renderTextWithLinks(question)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Risques identifiés */}
          <section aria-labelledby="risks-heading">
            <h2 id="risks-heading" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
              Risques identifiés ({analysis.risks.length})
            </h2>
            <div className="space-y-3">
              {analysis.risks.map((risk, idx) => (
                <div key={idx} className={`p-4 rounded-xl border hv-surface ${riskColors[risk.level]}`} role="article" aria-label={`Risque ${risk.level}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-700">{risk.level}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border hv-badge ${priorityColors[risk.priority]}`}>
                      {risk.priority}
                    </span>
                  </div>
                  <p className="text-gray-800 font-medium">{renderTextWithLinks(risk.description)}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-semibold text-gray-700">Mitigation :</span>{' '}
                    {renderTextWithLinks(risk.mitigation)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {isShowcaseFallbackOpen && (
        <div ref={showcaseFallbackRef}>
          <ProjectShowcase
            projectName={projectName}
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
    </div>
  );
};

