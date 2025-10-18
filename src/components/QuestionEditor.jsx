import React, { useEffect, useRef, useState } from '../react.js';
import {
  Plus,
  Trash2,
  GripVertical,
  Clipboard,
  Compass,
  Target,
  Lightbulb,
  CheckCircle
} from './icons.js';
import { applyConditionGroups, normalizeConditionGroups } from '../utils/conditionGroups.js';
import { ensureOperatorForType, getOperatorOptionsForType } from '../utils/operatorOptions.js';

export const QuestionEditor = ({ question, onSave, onCancel, allQuestions }) => {
  const ensureGuidance = (guidance) => {
    if (!guidance || typeof guidance !== 'object') {
      return { objective: '', details: '', tips: [] };
    }

    return {
      objective: guidance.objective || '',
      details: guidance.details || '',
      tips: Array.isArray(guidance.tips) ? guidance.tips : []
    };
  };

  const getDefaultPlaceholder = (type) => {
    if (type === 'text') {
      return 'Saisissez une réponse en une ligne';
    }
    if (type === 'long_text') {
      return 'Renseignez ici les informations détaillées...';
    }
    return '';
  };

  const sanitizeConditionGroups = (groups) => {
    return Array.isArray(groups)
      ? groups.map(group => ({
          ...group,
          conditions: Array.isArray(group.conditions)
            ? group.conditions.map(condition => {
                const question = allQuestions.find(q => q.id === condition?.question);
                const questionType = question?.type || 'choice';
                return {
                  ...condition,
                  operator: ensureOperatorForType(questionType, condition?.operator)
                };
              })
            : []
        }))
      : [];
  };

  const buildQuestionState = (source) => {
    const base = {
      ...source,
      type: source.type || 'choice',
      options: source.options || [],
      guidance: ensureGuidance(source.guidance),
      placeholder: typeof source.placeholder === 'string' ? source.placeholder : ''
    };

    const groups = sanitizeConditionGroups(normalizeConditionGroups(base));
    return applyConditionGroups(base, groups);
  };

  const [editedQuestion, setEditedQuestion] = useState(() => buildQuestionState(question));
  useEffect(() => {
    setEditedQuestion(buildQuestionState(question));
  }, [question]);

  const [draggedOptionIndex, setDraggedOptionIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const questionType = editedQuestion.type || 'choice';
  const typeUsesOptions = questionType === 'choice' || questionType === 'multi_choice';
  const normalizedGuidance = ensureGuidance(editedQuestion.guidance);

  const updateGuidanceField = (field, value) => {
    setEditedQuestion(prev => ({
      ...prev,
      guidance: {
        ...ensureGuidance(prev.guidance),
        [field]: value
      }
    }));
  };

  const addGuidanceTip = () => {
    setEditedQuestion(prev => {
      const current = ensureGuidance(prev.guidance);
      return {
        ...prev,
        guidance: {
          ...current,
          tips: [...current.tips, '']
        }
      };
    });
  };

  const updateGuidanceTip = (index, value) => {
    setEditedQuestion(prev => {
      const current = ensureGuidance(prev.guidance);
      const newTips = [...current.tips];
      newTips[index] = value;
      return {
        ...prev,
        guidance: {
          ...current,
          tips: newTips
        }
      };
    });
  };

  const deleteGuidanceTip = (index) => {
    setEditedQuestion(prev => {
      const current = ensureGuidance(prev.guidance);
      return {
        ...prev,
        guidance: {
          ...current,
          tips: current.tips.filter((_, i) => i !== index)
        }
      };
    });
  };

  const handleTypeChange = (newType) => {
    if (newType === 'choice' || newType === 'multi_choice') {
      setEditedQuestion(prev => ({
        ...prev,
        type: newType,
        options:
          prev.options && prev.options.length > 0
            ? prev.options
            : ['Option 1', 'Option 2']
      }));
      return;
    }

    setEditedQuestion(prev => ({
      ...prev,
      type: newType,
      options: [],
      placeholder: (newType === 'text' || newType === 'long_text')
        ? (prev.placeholder && prev.placeholder.trim() !== ''
          ? prev.placeholder
          : getDefaultPlaceholder(newType))
        : ''
    }));
  };

  const reorderOptions = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    setEditedQuestion(prev => {
      const newOptions = [...prev.options];
      const [moved] = newOptions.splice(fromIndex, 1);
      newOptions.splice(toIndex, 0, moved);

      return {
        ...prev,
        options: newOptions
      };
    });
  };

  const handleDragStart = (event, index) => {
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
    setDraggedOptionIndex(index);
    setDragOverIndex(index);
  };

  const handleDragEnter = (index) => {
    if (draggedOptionIndex === null || draggedOptionIndex === index) return;
    reorderOptions(draggedOptionIndex, index);
    setDraggedOptionIndex(index);
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedOptionIndex(null);
    setDragOverIndex(null);
  };

  const updateConditionGroupsState = (updater) => {
    setEditedQuestion(prev => {
      const currentGroups = Array.isArray(prev.conditionGroups) ? prev.conditionGroups : [];
      const nextGroups = sanitizeConditionGroups(updater(currentGroups));
      return applyConditionGroups(prev, nextGroups);
    });
  };

  const addConditionGroup = () => {
    updateConditionGroupsState(groups => ([
      ...groups,
      {
        logic: 'all',
        conditions: [{ question: '', operator: 'equals', value: '' }]
      }
    ]));
  };

  const updateConditionGroupLogic = (groupIndex, logic) => {
    updateConditionGroupsState(groups => {
      const updated = [...groups];
      const target = updated[groupIndex] || { logic: 'all', conditions: [] };
      updated[groupIndex] = {
        ...target,
        logic: logic === 'any' ? 'any' : 'all'
      };
      return updated;
    });
  };

  const addConditionToGroup = (groupIndex) => {
    updateConditionGroupsState(groups => {
      const updated = [...groups];
      const target = updated[groupIndex] || { logic: 'all', conditions: [] };
      updated[groupIndex] = {
        ...target,
        conditions: [...target.conditions, { question: '', operator: 'equals', value: '' }]
      };
      return updated;
    });
  };

  const updateConditionInGroup = (groupIndex, conditionIndex, field, value) => {
    updateConditionGroupsState(groups => {
      const updated = [...groups];
      const target = updated[groupIndex] || { logic: 'all', conditions: [] };
      const conditions = [...(target.conditions || [])];
      const condition = { ...conditions[conditionIndex] };

      if (field === 'question') {
        condition.question = value;
      } else if (field === 'operator') {
        condition.operator = value;
      } else {
        condition[field] = value;
      }

      const linkedQuestion = allQuestions.find(q => q.id === condition.question);
      const linkedType = linkedQuestion?.type || 'choice';
      condition.operator = ensureOperatorForType(linkedType, condition.operator);

      conditions[conditionIndex] = condition;
      updated[groupIndex] = { ...target, conditions };
      return updated;
    });
  };

  const deleteConditionFromGroup = (groupIndex, conditionIndex) => {
    updateConditionGroupsState(groups => {
      const updated = [...groups];
      const target = updated[groupIndex] || { logic: 'all', conditions: [] };
      const conditions = (target.conditions || []).filter((_, idx) => idx !== conditionIndex);
      updated[groupIndex] = { ...target, conditions };
      return updated;
    });
  };

  const deleteConditionGroup = (groupIndex) => {
    updateConditionGroupsState(groups => groups.filter((_, idx) => idx !== groupIndex));
  };

  const addOption = () => {
    setEditedQuestion({
      ...editedQuestion,
      options: [...editedQuestion.options, 'Nouvelle option']
    });
  };

  const updateOption = (index, value) => {
    const newOptions = [...editedQuestion.options];
    newOptions[index] = value;
    setEditedQuestion({ ...editedQuestion, options: newOptions });
  };

  const deleteOption = (index) => {
    if (editedQuestion.options.length > 1) {
      setEditedQuestion({
        ...editedQuestion,
        options: editedQuestion.options.filter((_, i) => i !== index)
      });
    }
  };

  // Filtrer les questions pour ne pas inclure la question en cours d'édition
  const availableQuestions = allQuestions.filter(q => q.id !== editedQuestion.id);
  const conditionGroups = Array.isArray(editedQuestion.conditionGroups) ? editedQuestion.conditionGroups : [];
  const dialogTitleId = 'question-editor-title';

  const handleSave = () => {
    onSave(applyConditionGroups(editedQuestion, conditionGroups));
  };

  const overlayRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.scrollTo({ top: 0 });
    }

    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto"
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-4 sm:my-8 overflow-y-auto hv-surface hv-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl hv-surface">
          <div className="flex justify-between items-center">
            <h2
              id={dialogTitleId}
              ref={titleRef}
              tabIndex={-1}
              className="text-3xl font-bold text-gray-800 focus:outline-none"
            >
              Édition de question
            </h2>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-all hv-button"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all hv-button hv-button-primary"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Informations de base */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-indigo-500" />
              Informations de base
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Identifiant de la question</label>
                <input
                  type="text"
                  value={editedQuestion.id}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">L'identifiant ne peut pas être modifié</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Texte de la question</label>
                <textarea
                  value={editedQuestion.question}
                  onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="2"
                  placeholder="Ex: Quel est le périmètre de votre projet ?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de question</label>
                <select
                  value={questionType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="choice">Liste de choix</option>
                  <option value="date">Date</option>
                  <option value="multi_choice">Choix multiples</option>
                  <option value="number">Valeur numérique</option>
                  <option value="url">Lien URL</option>
                  <option value="file">Fichier</option>
                  <option value="text">Texte libre (1 ligne)</option>
                  <option value="long_text">Texte libre (plusieurs lignes)</option>
                  <option value="milestone_list">Liste de jalons (date + description)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choisissez le format adapté : liste simple ou multiple, date, jalons structurés, valeurs numériques, URL, fichier ou zone de texte libre.
                </p>
              </div>

              {(questionType === 'text' || questionType === 'long_text') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder du champ</label>
                  {questionType === 'long_text' ? (
                    <textarea
                      value={editedQuestion.placeholder || ''}
                      onChange={(e) => setEditedQuestion(prev => ({ ...prev, placeholder: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows="2"
                      placeholder={getDefaultPlaceholder(questionType)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={editedQuestion.placeholder || ''}
                      onChange={(e) => setEditedQuestion(prev => ({ ...prev, placeholder: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={getDefaultPlaceholder(questionType)}
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Personnalisez le texte indicatif affiché dans le champ de réponse. Laissez vide pour utiliser la formulation par défaut.
                  </p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedQuestion.required}
                  onChange={(e) => setEditedQuestion({ ...editedQuestion, required: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Question obligatoire
                </label>
              </div>
            </div>
          </div>

          {/* Options de réponse */}
          <div>
            {typeUsesOptions ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    {questionType === 'multi_choice'
                      ? 'Options de sélection multiple'
                      : 'Options de réponse'}
                  </h3>
                  <button
                    onClick={addOption}
                    className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une option
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  Glissez-déposez les options pour modifier leur ordre d'affichage.
                  {questionType === 'multi_choice' && ' Les répondants pourront sélectionner plusieurs valeurs.'}
                </p>

                <div className="space-y-2">
                  {editedQuestion.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-2 rounded-lg border border-transparent bg-white p-2 transition-colors ${
                        dragOverIndex === idx ? 'border-indigo-200 bg-indigo-50 shadow' : 'shadow-sm'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverIndex(idx);
                      }}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        if (draggedOptionIndex !== idx) {
                          setDragOverIndex(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDragEnd();
                      }}
                      onDragEnd={handleDragEnd}
                    >
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => handleDragStart(event, idx)}
                        className="cursor-grab px-2 py-3 text-gray-400 hover:text-indigo-600 focus:outline-none"
                        aria-label={`Réordonner l'option ${idx + 1}`}
                      >
                        <GripVertical className="w-4 h-4" />
                      </button>
                      <span className="text-gray-500 font-medium w-6 text-center">{idx + 1}.</span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Texte de l'option..."
                      />
                      <button
                        onClick={() => deleteOption(idx)}
                        disabled={editedQuestion.options.length === 1}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-700">
                Ce type de question ne nécessite pas de liste d'options prédéfinies.
              </div>
            )}
          </div>

          {/* Guidage contextuel */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-500" />
              Guidage contextuel
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Renseignez les informations d'aide affichées au chef de projet pour expliquer la question.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objectif pédagogique</label>
                <input
                  type="text"
                  value={normalizedGuidance.objective}
                  onChange={(e) => updateGuidanceField('objective', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Pourquoi cette question est posée..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message principal</label>
                <textarea
                  value={normalizedGuidance.details}
                  onChange={(e) => updateGuidanceField('details', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Précisez le contexte, les impacts compliance ou les attentes..."
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Conseils pratiques</span>
                <button
                  type="button"
                  onClick={addGuidanceTip}
                  className="flex items-center px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter un conseil
                </button>
              </div>

              {normalizedGuidance.tips.length === 0 ? (
                <p className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4">
                  Ajoutez un ou plusieurs conseils opérationnels pour aider le chef de projet à répondre correctement.
                </p>
              ) : (
                <div className="space-y-2">
                  {normalizedGuidance.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm w-6">#{idx + 1}</span>
                      <input
                        type="text"
                        value={tip}
                        onChange={(e) => updateGuidanceTip(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Conseil pratique..."
                      />
                      <button
                        type="button"
                        onClick={() => deleteGuidanceTip(idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conditions d'affichage */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Conditions d'affichage
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Définissez quand cette question doit apparaître dans le questionnaire
                </p>
              </div>
              <button
                type="button"
                onClick={addConditionGroup}
                className="flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un groupe
              </button>
            </div>

            {conditionGroups.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-2">Cette question s'affiche toujours</p>
                <p className="text-sm text-gray-500">
                  Créez un groupe pour afficher cette question uniquement dans certains cas
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addConditionGroup}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un groupe de conditions
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                  {conditionGroups.length === 1 ? (
                    (() => {
                      const logic = conditionGroups[0].logic === 'any' ? 'any' : 'all';
                      const logicLabel = logic === 'any' ? 'OU' : 'ET';
                      const logicDescription = logic === 'any'
                        ? 'au moins une des conditions ci-dessous est remplie'
                        : 'toutes les conditions ci-dessous sont remplies';

                      return (
                        <p className="text-sm text-blue-900">
                          <strong className="inline-flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            Logique :
                          </strong>{' '}
                          Cette question s'affichera si{' '}
                          <strong className="text-blue-700">{logicDescription}</strong>{' '}
                          (logique {logicLabel}).
                        </p>
                      );
                    })()
                  ) : (
                    <div className="space-y-2 text-sm text-blue-900">
                      <p>
                        <strong className="inline-flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Logique :
                        </strong>{' '}
                        Cette question s'affiche lorsque{' '}
                        <strong className="text-blue-700">chaque groupe de conditions</strong> ci-dessous est validé (logique globale <strong>ET</strong>).
                      </p>
                      <p>
                        À l'intérieur d'un groupe, choisissez si{' '}
                        <strong className="text-blue-700">toutes</strong> les conditions doivent être vraies (ET) ou si{' '}
                        <strong className="text-blue-700">au moins une</strong> suffit (OU).
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {conditionGroups.map((group, groupIdx) => {
                    const logic = group.logic === 'any' ? 'any' : 'all';
                    const conditions = Array.isArray(group.conditions) ? group.conditions : [];
                    const connectorLabel = logic === 'any' ? 'OU' : 'ET';

                    return (
                      <div key={groupIdx}>
                        {groupIdx > 0 && (
                          <div className="flex justify-center -mb-3" aria-hidden="true">
                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
                              ET
                            </span>
                          </div>
                        )}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="text-sm font-semibold text-gray-700">
                              Groupe {groupIdx + 1}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-green-800 uppercase tracking-wide">
                              <span className="font-semibold">Logique interne</span>
                              <select
                                value={logic}
                                onChange={(e) => updateConditionGroupLogic(groupIdx, e.target.value)}
                                className="px-3 py-1.5 border border-green-200 rounded-lg bg-white text-xs focus:ring-2 focus:ring-green-400"
                              >
                                <option value="all">Toutes les conditions (ET)</option>
                                <option value="any">Au moins une condition (OU)</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteConditionGroup(groupIdx)}
                              className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded transition-all"
                              aria-label={`Supprimer le groupe ${groupIdx + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {conditions.length === 0 ? (
                            <div className="bg-white border border-dashed border-green-200 rounded-lg p-4 text-sm text-green-700">
                              <p>Ajoutez une condition pour définir ce groupe.</p>
                              <button
                                type="button"
                                onClick={() => addConditionToGroup(groupIdx)}
                                className="mt-3 inline-flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-sm font-medium"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter une condition
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {conditions.map((condition, idx) => (
                                <div key={idx} className="bg-white rounded-lg border border-green-200 p-4 shadow-sm">
                                  <div className="flex items-center space-x-3 mb-3">
                                    {idx > 0 && (
                                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        {connectorLabel}
                                      </span>
                                    )}
                                    <span className="text-sm font-semibold text-gray-700">
                                      Condition {idx + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => deleteConditionFromGroup(groupIdx, idx)}
                                      className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Si la question
                                      </label>
                                      <select
                                        value={condition.question}
                                        onChange={(e) => updateConditionInGroup(groupIdx, idx, 'question', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                      >
                                        <option value="">Sélectionner...</option>
                                        {availableQuestions.map(q => (
                                          <option key={q.id} value={q.id}>
                                            {q.id} - {q.question ?? ''}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Opérateur
                                      </label>
                                      {(() => {
                                        const selectedQuestion = allQuestions.find(q => q.id === condition.question);
                                        const selectedType = selectedQuestion?.type || 'choice';
                                        const operatorOptions = getOperatorOptionsForType(selectedType);
                                        const operatorValue = ensureOperatorForType(selectedType, condition.operator);
                                        return (
                                          <select
                                            value={operatorValue}
                                            onChange={(e) => updateConditionInGroup(groupIdx, idx, 'operator', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                          >
                                            {operatorOptions.map(option => (
                                              <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                          </select>
                                        );
                                      })()}
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Valeur
                                      </label>
                                      {(() => {
                                        if (!condition.question) {
                                          return (
                                            <input
                                              type="text"
                                              value={condition.value}
                                              onChange={(e) => updateConditionInGroup(groupIdx, idx, 'value', e.target.value)}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                              placeholder="Valeur..."
                                            />
                                          );
                                        }

                                        const selectedQuestion = allQuestions.find(q => q.id === condition.question);
                                        const selectedType = selectedQuestion?.type || 'choice';
                                        const usesOptions = ['choice', 'multi_choice'].includes(selectedType);

                                        if (usesOptions) {
                                          return (
                                            <select
                                              value={condition.value}
                                              onChange={(e) => updateConditionInGroup(groupIdx, idx, 'value', e.target.value)}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                            >
                                              <option value="">Sélectionner...</option>
                                              {(selectedQuestion?.options || []).map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          );
                                        }

                                        const inputType = selectedType === 'number' ? 'number' : 'text';
                                        const placeholder =
                                          selectedType === 'date'
                                            ? 'AAAA-MM-JJ'
                                            : selectedType === 'url'
                                              ? 'https://...'
                                              : 'Valeur...';

                                        return (
                                          <input
                                            type={inputType}
                                            value={condition.value}
                                            onChange={(e) => updateConditionInGroup(groupIdx, idx, 'value', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                                            placeholder={placeholder}
                                          />
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => addConditionToGroup(groupIdx)}
                                  className="inline-flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-sm font-medium"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Ajouter une condition
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

