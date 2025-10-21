import React, { useEffect, useMemo, useRef, useState } from '../react.js';
import {
  Info,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Save,
  Plus,
  Trash2
} from './icons.js';
import { formatAnswer } from '../utils/questions.js';
import { normalizeConditionGroups } from '../utils/conditionGroups.js';
import { renderTextWithLinks } from '../utils/linkify.js';

const OPERATOR_LABELS = {
  equals: 'est égal à',
  not_equals: 'est différent de',
  contains: 'contient',
  lt: 'est inférieur à',
  lte: 'est inférieur ou égal à',
  gt: 'est supérieur à',
  gte: 'est supérieur ou égal à'
};

const normalizeMilestoneDrafts = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(item => ({
    date: typeof item?.date === 'string' ? item.date : '',
    description: typeof item?.description === 'string' ? item.description : ''
  }));
};

const isMilestoneDraftEmpty = (entry) => {
  const date = typeof entry?.date === 'string' ? entry.date.trim() : '';
  const description = typeof entry?.description === 'string' ? entry.description.trim() : '';

  return date.length === 0 && description.length === 0;
};

const areMilestoneDraftsEqual = (first, second) => {
  if (!Array.isArray(first) || !Array.isArray(second)) {
    return false;
  }

  if (first.length !== second.length) {
    return false;
  }

  return first.every((entry, index) => {
    const counterpart = second[index];

    if (!counterpart) {
      return false;
    }

    const entryDate = typeof entry?.date === 'string' ? entry.date : '';
    const entryDescription = typeof entry?.description === 'string' ? entry.description : '';
    const counterpartDate = typeof counterpart?.date === 'string' ? counterpart.date : '';
    const counterpartDescription =
      typeof counterpart?.description === 'string' ? counterpart.description : '';

    return entryDate === counterpartDate && entryDescription === counterpartDescription;
  });
};

const sanitizeMilestonesForAnswer = (drafts) => {
  if (!Array.isArray(drafts)) {
    return [];
  }

  return drafts
    .map(item => ({
      date: typeof item?.date === 'string' ? item.date.trim() : '',
      description: typeof item?.description === 'string' ? item.description.trim() : ''
    }))
    .filter(entry => entry.date.length > 0 || entry.description.length > 0);
};

export const QuestionnaireScreen = ({
  questions,
  currentIndex,
  answers,
  onAnswer,
  onNext,
  onBack,
  allQuestions,
  onSaveDraft,
  saveFeedback,
  onDismissSaveFeedback,
  validationError
}) => {
  const currentQuestion = questions[currentIndex];
  const questionBank = allQuestions || questions;

  if (!currentQuestion) {
    return null;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const questionType = currentQuestion.type || 'choice';
  const currentAnswer = answers[currentQuestion.id];
  const multiSelection = Array.isArray(currentAnswer) ? currentAnswer : [];
  const [showGuidance, setShowGuidance] = useState(false);
  const [milestoneDrafts, setMilestoneDrafts] = useState(() => normalizeMilestoneDrafts(currentAnswer));
  const milestoneQuestionIdRef = useRef(questionType === 'milestone_list' ? currentQuestion.id : null);
  const questionTextId = `question-${currentQuestion.id}`;
  const instructionsId = `instructions-${currentQuestion.id}`;
  const guidancePanelId = `guidance-${currentQuestion.id}`;
  const progressLabelId = `progress-label-${currentQuestion.id}`;
  const hasValidationError = validationError?.questionId === currentQuestion.id;
  const hasSaveFeedback = Boolean(saveFeedback?.message);
  const isSaveSuccess = saveFeedback?.status === 'success';

  useEffect(() => {
    setShowGuidance(false);
  }, [currentQuestion.id]);

  useEffect(() => {
    if (questionType !== 'milestone_list') {
      milestoneQuestionIdRef.current = null;
      setMilestoneDrafts([]);
      return;
    }

    const normalizedAnswer = normalizeMilestoneDrafts(currentAnswer);
    const previousQuestionId = milestoneQuestionIdRef.current;
    milestoneQuestionIdRef.current = currentQuestion.id;

    setMilestoneDrafts(previousDrafts => {
      if (previousQuestionId !== currentQuestion.id) {
        return normalizedAnswer;
      }

      if (
        normalizedAnswer.length === 0 &&
        Array.isArray(previousDrafts) &&
        previousDrafts.length > 0 &&
        previousDrafts.every(isMilestoneDraftEmpty)
      ) {
        return previousDrafts;
      }

      const normalizedPreviousDrafts = normalizeMilestoneDrafts(previousDrafts);

      if (
        normalizedPreviousDrafts.length > normalizedAnswer.length &&
        areMilestoneDraftsEqual(
          sanitizeMilestonesForAnswer(normalizedPreviousDrafts),
          normalizedAnswer
        )
      ) {
        return previousDrafts;
      }

      if (areMilestoneDraftsEqual(normalizedPreviousDrafts, normalizedAnswer)) {
        return previousDrafts;
      }

      return normalizedAnswer;
    });
  }, [currentAnswer, currentQuestion.id, questionType]);

  const guidance = currentQuestion.guidance || {};
  const guidanceTips = useMemo(() => (
    Array.isArray(guidance.tips)
      ? guidance.tips.filter(tip => typeof tip === 'string' && tip.trim() !== '')
      : []
  ), [guidance]);

  const conditionSummaries = useMemo(() => {
    const conditionGroups = normalizeConditionGroups(currentQuestion);
    return conditionGroups.map((group, groupIdx) => {
      const logic = group.logic === 'any' ? 'any' : 'all';
      const conditions = (group.conditions || []).map(condition => {
        const referenceQuestion = questionBank.find(q => q.id === condition.question);
        const label = referenceQuestion?.question || `Question ${condition.question}`;
        const formattedAnswer = formatAnswer(referenceQuestion, answers[condition.question]);

        return {
          label,
          operator: OPERATOR_LABELS[condition.operator] || condition.operator,
          value: condition.value,
          answer: formattedAnswer
        };
      });

      return {
        logic,
        conditions,
        groupIdx
      };
    });
  }, [answers, currentQuestion, questionBank]);

  const hasConditions = useMemo(
    () => conditionSummaries.some(summary => summary.conditions.length > 0),
    [conditionSummaries]
  );

  const hasGuidanceContent = useMemo(() => {
    const hasObjective = typeof guidance.objective === 'string' && guidance.objective.trim() !== '';
    const hasDetails = typeof guidance.details === 'string' && guidance.details.trim() !== '';

    return hasObjective || hasDetails || guidanceTips.length > 0 || hasConditions;
  }, [guidance, guidanceTips, hasConditions]);

  const renderQuestionInput = () => {
    switch (questionType) {
      case 'date':
        return (
          <div className="mb-8">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3" htmlFor={`${currentQuestion.id}-date`}>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Sélectionnez une date
              </span>
            </label>
            <input
              type="date"
              value={currentAnswer ?? ''}
              onChange={(e) => onAnswer(currentQuestion.id, e.target.value)}
              id={`${currentQuestion.id}-date`}
              aria-describedby={currentIndex === 0 ? instructionsId : undefined}
              className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hv-focus-ring"
            />
            <p className="text-xs text-gray-500 mt-2">
              Utilisez le sélecteur ou le format AAAA-MM-JJ pour garantir une analyse correcte.
            </p>
          </div>
        );
      case 'choice':
        return (
          <fieldset className="space-y-3 mb-8" aria-describedby={currentIndex === 0 ? instructionsId : undefined}>
            <legend className="sr-only">{currentQuestion.question}</legend>
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === option;
              const optionId = `${currentQuestion.id}-option-${idx}`;

              return (
                <label
                  key={idx}
                  htmlFor={optionId}
                  className={`w-full p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border-2 transition-all duration-200 cursor-pointer hv-focus-ring ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={optionId}
                      name={currentQuestion.id}
                      value={option}
                      checked={isSelected}
                      onChange={() => onAnswer(currentQuestion.id, option)}
                      className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 hv-focus-ring"
                    />
                    <span className="ml-3 font-medium text-sm sm:text-base">{option}</span>
                  </div>
                  {isSelected && <CheckCircle className="w-5 h-5 text-blue-600 self-end sm:self-auto" />}
                </label>
              );
            })}
          </fieldset>
        );
      case 'multi_choice':
        return (
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = multiSelection.includes(option);
              const optionId = `${currentQuestion.id}-multi-option-${idx}`;

              const toggleOption = () => {
                if (isSelected) {
                  onAnswer(
                    currentQuestion.id,
                    multiSelection.filter(item => item !== option)
                  );
                } else {
                  onAnswer(currentQuestion.id, [...multiSelection, option]);
                }
              };

              return (
                <label
                  key={idx}
                  htmlFor={optionId}
                  className={`w-full p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border-2 transition-all duration-200 cursor-pointer hv-focus-ring ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={toggleOption}
                      id={optionId}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 hv-focus-ring"
                    />
                    <span className="ml-3 font-medium text-sm sm:text-base">{option}</span>
                  </div>
                  {isSelected && <CheckCircle className="w-5 h-5 text-blue-600 self-end sm:self-auto" />}
                </label>
              );
            })}
          </div>
        );
      case 'milestone_list': {
        const handleMilestoneUpdate = (updater) => {
          setMilestoneDrafts(prev => {
            const nextDrafts = typeof updater === 'function' ? updater(prev) : updater;
            const sanitized = sanitizeMilestonesForAnswer(nextDrafts);
            onAnswer(currentQuestion.id, sanitized);
            return nextDrafts;
          });
        };

        const handleMilestoneFieldChange = (index, field, value) => {
          handleMilestoneUpdate(prev => {
            const nextDrafts = prev.map((entry, entryIndex) => {
              if (entryIndex !== index) {
                return entry;
              }

              return {
                ...entry,
                [field]: value
              };
            });

            return nextDrafts;
          });
        };

        const handleMilestoneRemoval = (index) => {
          handleMilestoneUpdate(prev => prev.filter((_, entryIndex) => entryIndex !== index));
        };

        const handleAddMilestone = () => {
          handleMilestoneUpdate(prev => [...prev, { date: '', description: '' }]);
        };

        const emptyState = milestoneDrafts.length === 0;

        return (
          <div className="mb-8">
            <fieldset className="space-y-4" aria-describedby={currentIndex === 0 ? instructionsId : undefined}>
              <legend className="sr-only">{currentQuestion.question}</legend>
              {emptyState && (
                <p className="text-sm text-gray-600">
                  Ajoutez vos prochains jalons pour préparer la feuille de route.
                </p>
              )}
              {milestoneDrafts.map((entry, index) => {
                const dateInputId = `${currentQuestion.id}-milestone-${index}-date`;
                const descriptionInputId = `${currentQuestion.id}-milestone-${index}-description`;

                return (
                  <div
                    key={`milestone-${index}`}
                    className="p-4 border-2 border-gray-200 rounded-xl space-y-4 sm:space-y-0 sm:flex sm:items-end sm:gap-4"
                  >
                    <div className="sm:w-40">
                      <label htmlFor={dateInputId} className="block text-sm font-medium text-gray-700 mb-2">
                        Date du jalon
                      </label>
                      <input
                        id={dateInputId}
                        type="date"
                        value={entry.date || ''}
                        onChange={(event) => handleMilestoneFieldChange(index, 'date', event.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hv-focus-ring"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={descriptionInputId} className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        id={descriptionInputId}
                        type="text"
                        value={entry.description || ''}
                        onChange={(event) => handleMilestoneFieldChange(index, 'description', event.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hv-focus-ring"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMilestoneRemoval(index)}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </button>
                  </div>
                );
              })}
            </fieldset>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="mt-4 inline-flex items-center px-4 py-2 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un jalon
            </button>
          </div>
        );
      }
      case 'text':
        return (
          <div className="mb-8">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3" htmlFor={`${currentQuestion.id}-text`}>
              Renseignez votre réponse
            </label>
            <input
              type="text"
              value={currentAnswer ?? ''}
              onChange={(e) => onAnswer(currentQuestion.id, e.target.value)}
              placeholder={
                typeof currentQuestion.placeholder === 'string' && currentQuestion.placeholder.trim() !== ''
                  ? currentQuestion.placeholder.trim()
                  : 'Saisissez une réponse en une ligne'
              }
              id={`${currentQuestion.id}-text`}
              className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hv-focus-ring"
            />
            <p className="text-xs text-gray-500 mt-2">
              Utilisez ce champ pour des réponses courtes sous forme de texte libre.
            </p>
          </div>
        );
      case 'long_text':
        return (
          <div className="mb-8">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3" htmlFor={`${currentQuestion.id}-long-text`}>
              Décrivez les éléments pertinents
            </label>
            <textarea
              value={currentAnswer ?? ''}
              onChange={(e) => onAnswer(currentQuestion.id, e.target.value)}
              placeholder={
                typeof currentQuestion.placeholder === 'string' && currentQuestion.placeholder.trim() !== ''
                  ? currentQuestion.placeholder.trim()
                  : 'Renseignez ici les informations détaillées...'
              }
              rows={5}
              id={`${currentQuestion.id}-long-text`}
              className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y hv-focus-ring"
            />
            <p className="text-xs text-gray-500 mt-2">
              Ce champ accepte plusieurs lignes : structurez votre réponse librement.
            </p>
          </div>
        );
      case 'number': {
        const unitLabel =
          typeof currentQuestion.numberUnit === 'string' && currentQuestion.numberUnit.trim() !== ''
            ? currentQuestion.numberUnit.trim()
            : '';
        return (
          <div className="mb-8">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3" htmlFor={`${currentQuestion.id}-number`}>
              Renseignez une valeur numérique
            </label>
            <div className={`flex items-center gap-3 ${unitLabel ? 'flex-wrap sm:flex-nowrap' : ''}`}>
              <input
                type="number"
                inputMode="decimal"
                value={currentAnswer ?? ''}
                onChange={(e) => onAnswer(currentQuestion.id, e.target.value)}
                id={`${currentQuestion.id}-number`}
                className="w-full flex-1 min-w-0 px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hv-focus-ring"
              />
              {unitLabel && (
                <span className="inline-flex items-center px-4 py-2.5 sm:py-3 border-2 border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700 rounded-xl whitespace-nowrap">
                  {unitLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Vous pouvez saisir un nombre entier ou décimal.
            </p>
          </div>
        );
      }
      case 'url':
        return (
          <div className="mb-8">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3" htmlFor={`${currentQuestion.id}-url`}>
              Indiquez une adresse URL
            </label>
            <input
              type="url"
              value={currentAnswer ?? ''}
              onChange={(e) => onAnswer(currentQuestion.id, e.target.value)}
              placeholder="https://exemple.com"
              id={`${currentQuestion.id}-url`}
              className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hv-focus-ring"
            />
            <p className="text-xs text-gray-500 mt-2">
              Incluez le protocole (https://) pour une URL valide.
            </p>
          </div>
        );
      case 'file':
        return (
          <div className="mb-8">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3" htmlFor={`${currentQuestion.id}-file`}>
              Téléversez un fichier de référence
            </label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                  onAnswer(currentQuestion.id, {
                    name: file.name,
                    size: file.size,
                    type: file.type
                  });
                } else {
                  onAnswer(currentQuestion.id, null);
                }
              }}
              id={`${currentQuestion.id}-file`}
              className="w-full focus:outline-none hv-focus-ring"
            />
            {currentAnswer && (
              <p className="text-xs text-gray-500 mt-2">
                {(() => {
                  const size = typeof currentAnswer.size === 'number'
                    ? ` (${Math.round(currentAnswer.size / 1024)} Ko)`
                    : '';
                  return `Fichier sélectionné : ${currentAnswer.name}${size}`;
                })()}
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-6 sm:px-8 sm:py-10 hv-background">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 hv-surface">
          <div className="mb-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
              <span id={progressLabelId} className="text-sm font-medium text-gray-600 hv-text-muted" aria-live="polite">
                Question {currentIndex + 1} sur {questions.length}
              </span>
              <span className="text-sm font-medium text-blue-600 sm:text-right" aria-live="polite">
                {Math.round(progress)}% complété
              </span>
            </div>
            <div
              className="w-full bg-gray-200 rounded-full h-2 hv-progress"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-labelledby={progressLabelId}
            >
              <span
                className="block bg-blue-600 h-2 rounded-full transition-all duration-300 hv-progress-indicator"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentIndex === 0 && (
              <p id={instructionsId} className="text-xs text-gray-500 mt-2 flex items-center hv-text-muted">
                <Info className="w-3 h-3 mr-1" />
                Certaines questions peuvent apparaître en fonction de vos réponses
              </p>
            )}
            {currentIndex === 0 && (
              <p className="mt-4 text-xs italic text-gray-400">
                Le LFB traite les données recueillies pour gérer les projets à soumettre aux équipes compliance.{' '}
                <a
                  href="/mentions-legales.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-500"
                >
                  En savoir plus sur vos données et vos droits
                </a>
              </p>
            )}
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

          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <h2 id={questionTextId} className="text-2xl font-bold text-gray-800 sm:text-3xl">
                {currentQuestion.question}
              </h2>
              {!currentQuestion.required && (
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-600 rounded-full border border-gray-200 hv-badge self-start">
                  Réponse facultative
                </span>
              )}
              {hasGuidanceContent && (
                <button
                  type="button"
                  onClick={() => setShowGuidance(prev => !prev)}
                  className={`inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg border transition-all hv-button hv-focus-ring ${
                    showGuidance
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                  }`}
                  aria-expanded={showGuidance}
                  aria-controls={guidancePanelId}
                >
                  <Info className="w-4 h-4 mr-2" />
                  {showGuidance ? "Masquer l'aide" : 'Comprendre cette question'}
                </button>
              )}
            </div>

            {hasGuidanceContent && showGuidance && (
              <div
                id={guidancePanelId}
                className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-gray-700 hv-surface"
                role="region"
                aria-label="Aide contextuelle"
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5 text-blue-600">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-blue-700">Guidage contextuel</h3>
                      {guidance.objective && (
                        <p className="mt-1 text-gray-700">{renderTextWithLinks(guidance.objective)}</p>
                      )}
                    </div>

                    {guidance.details && (
                      <p className="text-gray-700 leading-relaxed">{renderTextWithLinks(guidance.details)}</p>
                    )}

                    {hasConditions && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-700">Pourquoi cette question apparaît</h4>
                        {conditionSummaries.length === 1 ? (
                          (() => {
                            const logic = conditionSummaries[0].logic === 'any' ? 'any' : 'all';
                            return (
                              <p className="text-xs text-blue-600 mt-1">
                                Elle s'affiche lorsque {logic === 'any'
                                  ? "au moins une des conditions suivantes est remplie"
                                  : 'toutes les conditions suivantes sont remplies'}.
                              </p>
                            );
                          })()
                        ) : (
                          <div className="text-xs text-blue-600 mt-1 space-y-1">
                            <p>
                              Cette question apparaît lorsque{' '}
                              <strong className="text-blue-700">chaque groupe de conditions</strong> ci-dessous est vérifié.
                            </p>
                            <p>
                              À l'intérieur de chaque groupe, suivez la logique indiquée (ET ou OU) pour les conditions listées.
                            </p>
                          </div>
                        )}
                        <div className="mt-3 space-y-3">
                          {conditionSummaries.map((groupSummary, idx) => {
                            const logicLabel = groupSummary.logic === 'any' ? 'OU' : 'ET';
                            const connectorLabel = groupSummary.logic === 'any' ? 'OU' : 'ET';

                            if (groupSummary.conditions.length === 0) {
                              return null;
                            }

                            return (
                              <div key={`condition-group-${idx}`} className="bg-white border border-blue-100 rounded-xl p-3 hv-surface">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                    Groupe {idx + 1}
                                  </span>
                                  <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                    Logique {logicLabel}
                                  </span>
                                  {idx > 0 && (
                                    <span className="ml-auto text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
                                      ET avec précédent
                                    </span>
                                  )}
                                </div>
                                <ul className="space-y-2">
                                  {groupSummary.conditions.map((item, conditionIdx) => (
                                    <li key={`${item.label}-${conditionIdx}`} className="text-sm text-gray-700">
                                      <p className="font-medium text-gray-800">
                                        {conditionIdx > 0 && (
                                          <span className="inline-flex items-center px-2 py-0.5 mr-2 text-[11px] font-semibold uppercase tracking-wide rounded-full bg-blue-100 text-blue-700">
                                            {connectorLabel}
                                          </span>
                                        )}
                                        {item.label} {item.operator} "{item.value}"
                                      </p>
                                      {item.answer && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Votre réponse :{' '}
                                          <span className="font-medium text-gray-700">
                                            {renderTextWithLinks(item.answer)}
                                          </span>
                                        </p>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {guidanceTips.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-700">Conseils pratiques</h4>
                        <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-gray-700">
                          {guidanceTips.map((tip, idx) => (
                            <li key={idx}>{renderTextWithLinks(tip)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {hasValidationError && (
            <div className="mb-6" role="alert" aria-live="assertive">
              <div className="flex items-start space-x-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 hv-surface">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Réponse obligatoire manquante</p>
                  <p className="text-sm">{validationError?.message}</p>
                </div>
              </div>
            </div>
          )}

          {renderQuestionInput()}

          <div
            className={`flex flex-col-reverse gap-3 sm:flex-row sm:items-center ${
              currentIndex === 0 && !onSaveDraft
                ? 'sm:justify-end'
                : 'sm:justify-between'
            }`}
          >
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center justify-center px-6 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all hv-button w-full sm:w-auto text-sm sm:text-base"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Précédent
              </button>
            )}

            {onSaveDraft && (
              <button
                type="button"
                onClick={onSaveDraft}
                className="flex items-center justify-center px-6 py-3 rounded-lg font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition-all hv-button w-full sm:w-auto text-sm sm:text-base"
              >
                <Save className="w-5 h-5 mr-2" />
                Enregistrer le projet
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              className="flex items-center justify-center px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
            >
              {currentIndex === questions.length - 1 ? 'Voir la synthèse' : 'Suivant'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

