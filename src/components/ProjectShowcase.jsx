import React, { useCallback, useEffect, useMemo, useRef, useState } from '../react.js';
import {
  Rocket,
  Users,
  Calendar,
  AlertTriangle,
  Close,
  CheckCircle,
  Edit,
  Compass
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

const SHOWCASE_THEME = {
  id: 'aurora',
  label: 'Aurora néon',
  description: 'Jeux de lumières et ambiance futuriste pour un rendu premium.',
};

const SHOWCASE_FIELD_CONFIG = [
  { id: 'projectName', fallbackLabel: 'Nom du projet', fallbackType: 'text' },
  { id: 'projectSlogan', fallbackLabel: 'Slogan ou promesse', fallbackType: 'text' },
  { id: 'targetAudience', fallbackLabel: 'Audiences principales', fallbackType: 'multi_choice' },
  { id: 'problemPainPoints', fallbackLabel: 'Pain points', fallbackType: 'long_text' },
  { id: 'solutionDescription', fallbackLabel: 'Description de la solution', fallbackType: 'long_text' },
  { id: 'solutionBenefits', fallbackLabel: 'Bénéfices clés', fallbackType: 'long_text' },
  { id: 'solutionComparison', fallbackLabel: 'Différenciation', fallbackType: 'long_text' },
  { id: 'innovationProcess', fallbackLabel: 'Processus innovation', fallbackType: 'long_text' },
  { id: 'visionStatement', fallbackLabel: 'Vision', fallbackType: 'long_text' },
  { id: 'teamLead', fallbackLabel: 'Lead du projet', fallbackType: 'text' },
  { id: 'teamCoreMembers', fallbackLabel: 'Membres clés', fallbackType: 'long_text' },
  { id: 'campaignKickoffDate', fallbackLabel: 'Date de démarrage campagne', fallbackType: 'date' },
  { id: 'launchDate', fallbackLabel: 'Date de lancement', fallbackType: 'date' }
];

const formatValueForDraft = (type, rawValue) => {
  if (rawValue === null || rawValue === undefined) {
    return '';
  }

  if (type === 'multi_choice') {
    if (Array.isArray(rawValue)) {
      return rawValue.join('\n');
    }
    return String(rawValue);
  }

  if (type === 'date') {
    const parsed = rawValue instanceof Date ? rawValue : new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) {
      return String(rawValue);
    }
    return parsed.toISOString().slice(0, 10);
  }

  return String(rawValue);
};

const formatValueForUpdate = (type, draftValue) => {
  if (type === 'multi_choice') {
    if (typeof draftValue !== 'string') {
      return [];
    }

    return draftValue
      .split(/\r?\n|·|•|;|,/)
      .map(entry => entry.replace(/^[-•\s]+/, '').trim())
      .filter(entry => entry.length > 0);
  }

  if (type === 'date') {
    if (typeof draftValue !== 'string') {
      return null;
    }
    const trimmed = draftValue.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof draftValue !== 'string') {
    return '';
  }

  return draftValue;
};

const buildDraftValues = (fields, answers, fallbackProjectName) => {
  const draft = {};

  fields.forEach(field => {
    const question = field.question;
    const fieldType = question?.type || field.fallbackType || 'text';
    const rawValue = getRawAnswer(answers, field.id);
    if (rawValue === undefined || rawValue === null) {
      draft[field.id] = '';
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

const computeRunway = (answers) => {
  const startRaw = answers?.campaignKickoffDate;
  const endRaw = answers?.launchDate;

  if (!startRaw || !endRaw) {
    return null;
  }

  const start = new Date(startRaw);
  const end = new Date(endRaw);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) {
    return null;
  }

  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const diffWeeks = diffDays / 7;

  return {
    start,
    end,
    diffDays,
    diffWeeks,
    startLabel: formatDate(start),
    endLabel: formatDate(end),
    weeksLabel: `${Math.round(diffWeeks)} sem.`,
    daysLabel: `${Math.round(diffDays)} j.`
  };
};

const computeTimelineSummary = (timelineDetails) => {
  if (!Array.isArray(timelineDetails)) {
    return null;
  }

  const detailWithDiff = timelineDetails.find(detail => Boolean(detail?.diff));
  if (!detailWithDiff) {
    return null;
  }

  const diff = detailWithDiff.diff;
  const weeks = Math.round(diff.diffInWeeks);
  const days = Math.round(diff.diffInDays);

  return {
    ruleName: detailWithDiff.ruleName,
    satisfied: detailWithDiff.satisfied,
    weeks,
    days,
    profiles: Array.isArray(detailWithDiff.profiles) ? detailWithDiff.profiles : []
  };
};

const getPrimaryRisk = (analysis) => {
  const risks = Array.isArray(analysis?.risks) ? analysis.risks : [];
  if (risks.length === 0) {
    return null;
  }

  const priorityWeight = { Critique: 3, Important: 2, Recommandé: 1 };

  return risks.reduce((acc, risk) => {
    if (!acc) {
      return risk;
    }

    const currentWeight = priorityWeight[risk.priority] || 0;
    const bestWeight = priorityWeight[acc.priority] || 0;

    if (currentWeight > bestWeight) {
      return risk;
    }

    return acc;
  }, null);
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
  'teamLead',
  'teamCoreMembers',
  'campaignKickoffDate',
  'launchDate'
];

const buildHeroHighlights = ({ targetAudience, runway }) => {
  const highlights = [];

  if (hasText(targetAudience)) {
    highlights.push({
      id: 'audience',
      label: 'Audience principale',
      value: targetAudience,
      caption: 'Les personas qui verront la promesse en premier.'
    });
  }

  if (runway) {
    highlights.push({
      id: 'runway',
      label: 'Runway avant lancement',
      value: `${runway.weeksLabel} (${runway.daysLabel})`,
      caption: `Du ${runway.startLabel} au ${runway.endLabel}.`
    });
  }

  return highlights;
};

const renderList = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-200/90">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-4 w-4 text-sky-300" />
          <span className="flex-1">{renderTextWithLinks(item)}</span>
        </li>
      ))}
    </ul>
  );
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
  const closeButtonRef = useRef(null);
  const rawProjectName = typeof projectName === 'string' ? projectName.trim() : '';
  const safeProjectName = rawProjectName.length > 0 ? rawProjectName : 'Votre projet';
  const normalizedTeams = Array.isArray(relevantTeams) ? relevantTeams : [];
  const complexity = analysis?.complexity || 'Modérée';

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

  useEffect(() => {
    if (isEditing) {
      return;
    }
    setDraftValues(buildDraftValues(editableFields, answers, rawProjectName));
  }, [answers, editableFields, isEditing, rawProjectName]);

  const canEdit = typeof onUpdateAnswers === 'function';
  const shouldShowPreview = !isEditing || !canEdit;
  const formId = 'project-showcase-edit-form';

  const handleStartEditing = useCallback(() => {
    setDraftValues(buildDraftValues(editableFields, answers, rawProjectName));
    setIsEditing(true);
  }, [answers, editableFields, rawProjectName]);

  const handleCancelEditing = useCallback(() => {
    setDraftValues(buildDraftValues(editableFields, answers, rawProjectName));
    setIsEditing(false);
  }, [answers, editableFields, rawProjectName]);

  const handleFieldChange = useCallback((fieldId, value) => {
    setDraftValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
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
        const previousValue = formatValueForDraft(type, getRawAnswer(answers, id) ?? '');
        const nextValue = draftValues[id] ?? '';

        if (previousValue === nextValue) {
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

  const teamLead = getFormattedAnswer(questions, answers, 'teamLead');
  const teamCoreMembers = parseListAnswer(getRawAnswer(answers, 'teamCoreMembers'));

  const runway = useMemo(() => computeRunway(answers), [answers]);
  const timelineSummary = useMemo(() => computeTimelineSummary(timelineDetails), [timelineDetails]);
  const primaryRisk = useMemo(() => getPrimaryRisk(analysis), [analysis]);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  const handleParallaxMove = useCallback((event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;

    setParallaxOffset({
      x: Math.max(-0.5, Math.min(0.5, offsetX)),
      y: Math.max(-0.5, Math.min(0.5, offsetY))
    });
  }, []);

  const handleParallaxLeave = useCallback(() => {
    setParallaxOffset({ x: 0, y: 0 });
  }, []);

  const heroTitleStyle = useMemo(
    () => ({
      backgroundImage: 'linear-gradient(120deg, #a855f7, #6366f1, #0ea5e9)',
      backgroundSize: '200% 200%',
      backgroundPosition: `${50 + parallaxOffset.x * 30}% ${50 + parallaxOffset.y * 30}%`,
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      textShadow: '0 25px 60px rgba(79, 70, 229, 0.45)',
      transform: `translate3d(${parallaxOffset.x * 10}px, ${parallaxOffset.y * 16}px, 0)`,
      transition: 'background-position 0.25s ease, transform 0.25s ease'
    }),
    [parallaxOffset]
  );

  const parallaxLayers = useMemo(
    () => ({
      far: {
        transform: `translate3d(${parallaxOffset.x * 12}px, ${parallaxOffset.y * 12}px, 0)`
      },
      mid: {
        transform: `translate3d(${parallaxOffset.x * 20}px, ${parallaxOffset.y * 20}px, 0)`
      },
      near: {
        transform: `translate3d(${parallaxOffset.x * 32}px, ${parallaxOffset.y * 32}px, 0)`
      }
    }),
    [parallaxOffset]
  );

  const heroHighlights = useMemo(
    () =>
      buildHeroHighlights({
        targetAudience,
        runway
      }),
    [targetAudience, runway]
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

    if (closeButtonRef.current && typeof closeButtonRef.current.focus === 'function') {
      closeButtonRef.current.focus();
    }
  }, [renderInStandalone]);

  const neoCardShadow = '18px 18px 45px rgba(15, 23, 42, 0.55), -18px -18px 45px rgba(148, 163, 184, 0.12)';
  const neoInsetShadow = 'inset 8px 8px 16px rgba(15, 23, 42, 0.45), inset -8px -8px 16px rgba(148, 163, 184, 0.15)';

  const showcaseCard = (
    <div
      data-showcase-card
      data-showcase-theme={showcaseThemeId}
      className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100"
      onMouseMove={handleParallaxMove}
      onMouseLeave={handleParallaxLeave}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" data-showcase-overlay>
        <div
          className="absolute -top-48 -left-32 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl transition-transform duration-300 ease-out"
          style={parallaxLayers.far}
          aria-hidden="true"
          data-showcase-layer="glow-far"
        />
        <div
          className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-sky-500/25 blur-[120px] transition-transform duration-500 ease-out"
          style={parallaxLayers.mid}
          aria-hidden="true"
          data-showcase-layer="glow-mid"
        />
        <div
          className="absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition-transform duration-300 ease-out"
          style={parallaxLayers.near}
          aria-hidden="true"
          data-showcase-layer="glow-near"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_60%)]"
          aria-hidden="true"
          data-showcase-layer="glow-overlay"
        />
      </div>

      <div className="relative px-6 pt-10 pb-16 sm:px-14 sm:pt-16 sm:pb-20">
        <div
          data-showcase-theme-info
          className="mb-8 flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="text-xs text-slate-200/80">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/80">Style de présentation</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.3em] text-white">{SHOWCASE_THEME.label}</p>
          </div>
          {SHOWCASE_THEME.description && (
            <p className="text-[0.7rem] leading-relaxed text-slate-300/80 sm:max-w-sm">
              {SHOWCASE_THEME.description}
            </p>
          )}
        </div>

        <header
          data-showcase-section="hero"
          className="rounded-[32px] border border-white/10 bg-white/5 p-8 sm:p-12 backdrop-blur-xl"
          style={{ boxShadow: '20px 20px 60px rgba(2, 6, 23, 0.45), -18px -18px 50px rgba(148, 163, 184, 0.12)' }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            {shouldShowPreview ? (
              <>
                <h2
                  className="mt-6 text-5xl font-black leading-tight sm:text-6xl sm:leading-[1.05]"
                  style={heroTitleStyle}
                >
                  {safeProjectName}
                </h2>
                {hasText(slogan) && (
                  <p className="mt-5 text-2xl font-semibold text-indigo-200 sm:text-3xl" style={{ textShadow: '0 12px 40px rgba(79, 70, 229, 0.4)' }}>
                    {renderTextWithLinks(slogan)}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-6 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200">Mode édition</p>
                <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
                  Personnalisez la vitrine du projet
                </h2>
                <p className="mt-3 text-sm text-slate-300/80">
                  Modifiez les informations via le formulaire ci-dessous. L'aperçu est temporairement masqué pendant l'édition.
                </p>
              </>
            )}
          </div>
            <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 p-3 text-slate-200 transition hover:bg-white/20"
                aria-label="Fermer la vitrine du projet"
                ref={renderInStandalone ? undefined : closeButtonRef}
              >
                <Close className="h-4 w-4" />
              </button>
              </div>
            </div>

            {isEditing && canEdit && (
              <form
                id={formId}
                onSubmit={handleSubmitEdit}
                className="mt-10 space-y-6 rounded-[28px] border border-white/15 bg-slate-900/60 p-6 sm:p-8 text-slate-100 backdrop-blur-xl"
                style={{ boxShadow: neoCardShadow }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200">Mode édition actif</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Ajustez les informations présentées dans la vitrine</h3>
                  </div>
                  <p className="text-xs text-slate-300/80 sm:max-w-xs">
                    Chaque modification sera appliquée aux réponses du questionnaire correspondant.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {editableFields.map(field => {
                    const fieldId = field.id;
                    const question = field.question;
                    const type = question?.type || field.fallbackType || 'text';
                    const label = question?.question || field.fallbackLabel || fieldId;
                    const value = draftValues[fieldId] ?? '';
                    const isLong = type === 'long_text';
                    const isMulti = type === 'multi_choice';
                    const isDate = type === 'date';
                    const helperText = isMulti
                      ? 'Indiquez une audience par ligne.'
                      : ['problemPainPoints', 'solutionBenefits', 'teamCoreMembers'].includes(fieldId)
                        ? 'Utilisez une ligne par élément pour une meilleure mise en forme.'
                        : null;

                    return (
                      <div key={fieldId} className={`${isLong || isMulti ? 'sm:col-span-2' : ''}`}>
                        <label
                          htmlFor={`showcase-edit-${fieldId}`}
                          className="block text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-indigo-200/80"
                        >
                          {label}
                        </label>
                        {isDate ? (
                          <input
                            id={`showcase-edit-${fieldId}`}
                            type="date"
                            value={value}
                            onChange={event => handleFieldChange(fieldId, event.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                            style={{ boxShadow: neoInsetShadow }}
                          />
                        ) : isLong || isMulti ? (
                          <textarea
                            id={`showcase-edit-${fieldId}`}
                            value={value}
                            onChange={event => handleFieldChange(fieldId, event.target.value)}
                            rows={isMulti ? 4 : 5}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                            style={{ boxShadow: neoInsetShadow }}
                          />
                        ) : (
                          <input
                            id={`showcase-edit-${fieldId}`}
                            type="text"
                            value={value}
                            onChange={event => handleFieldChange(fieldId, event.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                            style={{ boxShadow: neoInsetShadow }}
                          />
                        )}
                        {helperText && (
                            <p className="mt-2 text-xs text-slate-400">{helperText}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-slate-200 transition hover:bg-white/10"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full border border-indigo-400/60 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              )}

              {shouldShowPreview && heroHighlights.length > 0 && (
                <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {heroHighlights.map(highlight => (
                    <div
                      key={highlight.id}
                      data-showcase-element="hero-highlight"
                      className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 backdrop-blur-xl"
                      style={{ boxShadow: neoCardShadow }}
                    >
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/90">
                        {highlight.label}
                      </p>
                      <p className="mt-3 text-3xl font-bold text-white" style={{ textShadow: '0 18px 45px rgba(79, 70, 229, 0.45)' }}>
                        {highlight.value}
                      </p>
                      <p className="mt-3 text-xs text-slate-300/80">{highlight.caption}</p>
                    </div>
                  ))}
                </div>
              )}
            </header>

            {shouldShowPreview && (
              <section
                data-showcase-section="problem"
                className="mt-14 rounded-[32px] border border-white/10 bg-white/5 p-8 sm:p-12 text-slate-100 backdrop-blur-xl"
                style={{ boxShadow: neoCardShadow }}
              >
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/80">Le problème</p>
                    <h3 className="mt-3 text-3xl font-bold text-white">Pourquoi ce projet doit exister</h3>
                    {renderList(problemPainPoints)}
                  </div>
                </div>
              </section>
            )}

            {shouldShowPreview && (
              <section
                data-showcase-section="solution"
                className="mt-14 rounded-[32px] border border-white/10 bg-gradient-to-br from-indigo-500/30 via-transparent to-sky-500/30 p-[1px]"
                style={{ boxShadow: neoCardShadow }}
              >
                <div className="h-full w-full rounded-[30px] bg-slate-950/80 px-8 py-10 text-slate-100 sm:px-12">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/80">La solution</p>
                      <h3 className="mt-3 text-3xl font-bold text-white">Comment nous changeons la donne</h3>
                    </div>
                    <Rocket className="text-4xl text-sky-300" />
                  </div>
                  <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {hasText(solutionDescription) && (
                      <div
                        data-showcase-element="solution-card"
                        className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 backdrop-blur-xl"
                        style={{ boxShadow: neoCardShadow }}
                      >
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/90">Expérience proposée</p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-200/90">
                          {renderTextWithLinks(solutionDescription)}
                        </p>
                      </div>
                    )}
                    {solutionBenefits.length > 0 && (
                      <div
                        data-showcase-element="solution-card"
                        className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 backdrop-blur-xl"
                        style={{ boxShadow: neoCardShadow }}
                      >
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/90">Bénéfices clés</p>
                        {renderList(solutionBenefits)}
                      </div>
                    )}
                    {hasText(solutionComparison) && (
                      <div
                        data-showcase-element="solution-card"
                        className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 backdrop-blur-xl"
                        style={{ boxShadow: neoCardShadow }}
                      >
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/90">Pourquoi c'est différent</p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-200/90">
                          {renderTextWithLinks(solutionComparison)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {shouldShowPreview && hasText(innovationProcess) && (
              <section
                data-showcase-section="innovation"
                className="mt-14 rounded-[32px] border border-white/10 bg-white/5 p-8 sm:p-12 text-slate-100 backdrop-blur-xl"
                style={{ boxShadow: neoCardShadow }}
              >
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/80">Innovation</p>
                    <h3 className="mt-3 text-2xl font-bold text-white">Ce qui rend l'approche unique</h3>
                  </div>
                  <div
                    data-showcase-element="innovation-card"
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-slate-200 backdrop-blur-xl"
                    style={{ boxShadow: neoCardShadow }}
                  >
                    <Compass className="mb-4 h-7 w-7 text-sky-300" />
                    {renderTextWithLinks(innovationProcess)}
                  </div>
                </div>
              </section>
            )}

            {shouldShowPreview && (
              <section
                data-showcase-section="evidence"
                className="mt-14 rounded-[32px] border border-white/10 bg-white/5 p-8 sm:p-12 text-slate-100 backdrop-blur-xl"
                style={{ boxShadow: neoCardShadow }}
              >
                <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl space-y-8">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/80">Potentiel & impact</p>
                      <h3 className="mt-3 text-3xl font-bold text-white">Les preuves qui donnent envie d'y croire</h3>
                      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {timelineSummary && (
                          <div
                            data-showcase-element="metric-card"
                            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 backdrop-blur-xl"
                            style={{ boxShadow: neoCardShadow }}
                          >
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/70">Préparation au lancement</p>
                            <p className="mt-2 text-2xl font-bold text-white">{`${timelineSummary.weeks} sem.`}</p>
                            <p className="mt-2 text-xs text-slate-300/80">
                              {timelineSummary.satisfied ? 'Runway suffisant pour activer les relais.' : 'Runway à renforcer pour sécuriser la diffusion.'}
                            </p>
                          </div>
                        )}
                        <div
                          data-showcase-element="metric-card"
                          className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 backdrop-blur-xl"
                          style={{ boxShadow: neoCardShadow }}
                        >
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/70">Complexité estimée</p>
                          <p className="mt-2 text-2xl font-bold text-white">{complexity}</p>
                          <p className="mt-2 text-xs text-slate-300/80">Basée sur les points de vigilance identifiés.</p>
                        </div>
                      </div>
                    </div>
                    {hasText(visionStatement) && (
                      <div
                        data-showcase-element="vision-card"
                        className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200 backdrop-blur-xl"
                        style={{ boxShadow: neoCardShadow }}
                      >
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/80">Vision</p>
                        <p className="mt-3 text-base leading-relaxed text-slate-200/90">{renderTextWithLinks(visionStatement)}</p>
                      </div>
                    )}
                  </div>
                  {primaryRisk && (
                    <aside
                      data-showcase-aside="risk"
                      className="max-w-sm rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-300/10 p-6 text-sm leading-relaxed text-amber-100 backdrop-blur-xl"
                      style={{ boxShadow: neoCardShadow }}
                    >
                      <AlertTriangle className="mb-4 h-8 w-8 text-amber-300" />
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-amber-200/90">Point de vigilance</p>
                      <h4 className="mt-3 text-xl font-semibold text-white">{primaryRisk.title || 'Vigilance prioritaire'}</h4>
                      <p className="mt-4 text-sm text-amber-100/90">{renderTextWithLinks(primaryRisk.description)}</p>
                      <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-amber-200/90">Priorité : {primaryRisk.priority}</p>
                    </aside>
                  )}
                </div>
              </section>
            )}

            {shouldShowPreview && (
              <section
                data-showcase-section="team"
                className="mt-14 rounded-[32px] border border-white/10 bg-white/5 p-8 sm:p-12 text-slate-100 backdrop-blur-xl"
                style={{ boxShadow: neoCardShadow }}
              >
                <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl space-y-6 text-sm text-slate-200/90">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/80">L'équipe</p>
                      <h3 className="mt-3 text-3xl font-bold text-white">Les talents derrière la vision</h3>
                    </div>
                    {hasText(teamLead) && (
                      <p>
                        <span className="font-semibold text-white">Lead du projet :</span>{' '}
                        {renderTextWithLinks(teamLead)}
                      </p>
                    )}
                    {teamCoreMembers.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200/90">Collectif moteur</p>
                        {renderList(teamCoreMembers)}
                      </div>
                    )}
                  </div>
                  {normalizedTeams.length > 0 && (
                    <aside
                      data-showcase-aside="teams"
                      className="max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-100 backdrop-blur-xl"
                      style={{ boxShadow: neoCardShadow }}
                    >
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/80">Alliés activés</p>
                      <div className="mt-4 space-y-3">
                        {normalizedTeams.map(team => (
                          <div key={team.id} className="flex items-start gap-3">
                            <Users className="mt-1 h-4 w-4 text-sky-300" />
                            <div>
                              <p className="text-sm font-semibold text-white">{team.name}</p>
                              <p className="text-xs text-slate-300/80">{team.expertise}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </aside>
                  )}
                </div>
              </section>
            )}

            {shouldShowPreview && (runway || timelineSummary) && (
              <section
                data-showcase-section="timeline"
                className="mt-14 rounded-[32px] border border-white/10 bg-gradient-to-br from-indigo-500/25 via-transparent to-sky-500/25 p-8 sm:p-12 text-slate-100 backdrop-blur-xl"
                style={{ boxShadow: neoCardShadow }}
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200/80">Prochaines étapes</p>
                    <h3 className="text-2xl font-bold text-white">Orchestrer la narration jusqu'au lancement</h3>
                    {runway && (
                      <p className="text-sm text-slate-200/90">
                        Runway prévu de <span className="font-semibold text-white">{runway.weeksLabel}</span> ({runway.daysLabel}) entre le {runway.startLabel} et le {runway.endLabel}.
                      </p>
                    )}
                  </div>
                  <Calendar className="text-4xl text-sky-300" />
                </div>
                {timelineSummary?.profiles?.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {timelineSummary.profiles.map(profile => (
                      <div
                        data-showcase-element="timeline-profile"
                        key={profile.id}
                        className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 backdrop-blur-xl"
                        style={{ boxShadow: neoCardShadow }}
                      >
                        <p className="text-sm font-semibold text-white">{profile.label}</p>
                        {profile.description && (
                          <p className="mt-2 text-xs text-slate-300/80">{profile.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {canEdit && (
              <div className="mt-16 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-end">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-slate-200 transition hover:bg-white/20"
                    >
                      Annuler l'édition
                    </button>
                    <button
                      type="submit"
                      form={formId}
                      className="inline-flex items-center justify-center rounded-full border border-indigo-400/60 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Enregistrer
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-indigo-200 transition hover:bg-white/20"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier le contenu
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
  );

  if (renderInStandalone) {
    return (
      <div
        data-showcase-scope
        data-showcase-theme={showcaseThemeId}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-8"
      >
        <div className="mx-auto w-full">{showcaseCard}</div>
      </div>
    );
  }

  return (
    <section
      data-showcase-scope
      data-showcase-theme={showcaseThemeId}
      className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 sm:px-8"
      aria-label="Vitrine marketing du projet"
    >
      <div className="w-full">{showcaseCard}</div>
    </section>
  );
};

