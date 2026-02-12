import React, { useEffect, useRef, useState } from '../react.js';
import {
  Plus,
  Trash2,
  CheckCircle,
  Clipboard,
  Target,
  Lightbulb,
  Users,
  FileText,
  AlertTriangle
} from './icons.js';
import {
  applyRuleConditionGroups,
  normalizeRuleConditionGroups,
  sanitizeRuleCondition,
  createEmptyQuestionCondition,
  createEmptyTimingCondition
} from '../utils/ruleConditions.js';
import { ensureOperatorForType, getOperatorOptionsForType } from '../utils/operatorOptions.js';
import { getConditionQuestionEntries, getQuestionOptionLabels } from '../utils/questions.js';
import {
  sanitizeRiskTimingConstraint,
  sanitizeTeamQuestionEntry,
  sanitizeTeamQuestionsByTeam
} from '../utils/rules.js';
import { RichTextEditor } from './RichTextEditor.jsx';

const RISK_PRIORITY_OPTIONS = [
  'A réaliser',
  'A anticiper',
  'A particulièrement anticiper'
];

const normalizeRiskEntry = (risk, availableTeams = []) => {
  const safeTeams = Array.isArray(availableTeams) ? availableTeams : [];
  const fallbackTeam = safeTeams[0] || '';

  const normalized = {
    description: '',
    level: 'Moyen',
    mitigation: '',
    priority: 'A réaliser',
    teamId: fallbackTeam,
    ...risk
  };

  if (!RISK_PRIORITY_OPTIONS.includes(normalized.priority)) {
    normalized.priority = 'A réaliser';
  }

  if (normalized.level !== 'Faible' && normalized.level !== 'Moyen' && normalized.level !== 'Élevé') {
    normalized.level = 'Moyen';
  }

  if (!safeTeams.includes(normalized.teamId)) {
    normalized.teamId = fallbackTeam || '';
  }

  return {
    ...normalized,
    timingConstraint: sanitizeRiskTimingConstraint(normalized?.timingConstraint)
  };
};

const normalizeRiskList = (risks, availableTeams = []) => {
  if (!Array.isArray(risks)) {
    return [];
  }

  return risks.map((risk) => normalizeRiskEntry(risk, availableTeams));
};

export const RuleEditor = ({ rule, onSave, onCancel, questions, teams }) => {
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

  const sanitizeConditionGroups = (groups) => {
    const conditionQuestions = getConditionQuestionEntries(questions);
    return Array.isArray(groups)
      ? groups.map(group => ({
          ...group,
          conditions: Array.isArray(group.conditions)
            ? group.conditions.map(condition => {
                if (condition?.type === 'timing') {
                  const { complianceProfiles: _discardedComplianceProfiles, ...restTiming } = condition || {};
                  return restTiming;
                }

                const question = conditionQuestions.find(q => q.id === condition?.question);
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

  const buildRuleState = (source) => {
    const sanitizedSource = source || {};
    const { priority: _discardedPriority, ...rest } = sanitizedSource;
    const teamsList = Array.isArray(rest.teams) ? rest.teams : [];

    const base = {
      ...rest,
      conditionLogic: rest.conditionLogic === 'any' ? 'any' : 'all',
      conditions: Array.isArray(rest.conditions)
        ? rest.conditions.map(sanitizeRuleCondition)
        : [],
      conditionGroups: Array.isArray(rest.conditionGroups) ? rest.conditionGroups : [],
      teams: teamsList,
      questions: sanitizeTeamQuestionsByTeam(rest.questions || {}),
      risks: normalizeRiskList(rest.risks, teamsList)
    };

    const groups = sanitizeConditionGroups(normalizeRuleConditionGroups(base));
    return applyRuleConditionGroups(base, groups);
  };

  const [editedRule, setEditedRule] = useState(() => buildRuleState(rule));

  useEffect(() => {
    setEditedRule(buildRuleState(rule));
  }, [rule]);

  const conditionGroups = Array.isArray(editedRule.conditionGroups)
    ? editedRule.conditionGroups
    : [];

  const updateConditionGroupsState = (updater) => {
    setEditedRule(prev => {
      const currentGroups = Array.isArray(prev.conditionGroups) ? prev.conditionGroups : [];
      const nextGroups = sanitizeConditionGroups(updater(currentGroups));
      return applyRuleConditionGroups(prev, nextGroups);
    });
  };

  const addConditionGroup = () => {
    updateConditionGroupsState(groups => ([
      ...groups,
      { logic: 'all', conditions: [createEmptyQuestionCondition()] }
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

  const deleteConditionGroup = (groupIndex) => {
    updateConditionGroupsState(groups => groups.filter((_, idx) => idx !== groupIndex));
  };

  const withUpdatedCondition = (groups, groupIndex, conditionIndex, updater) => {
    const updated = [...groups];
    const target = updated[groupIndex] || { logic: 'all', conditions: [] };
    const conditions = Array.isArray(target.conditions) ? [...target.conditions] : [];
    const currentCondition = sanitizeRuleCondition(
      conditions[conditionIndex] || createEmptyQuestionCondition()
    );
    const updatedCondition = sanitizeRuleCondition(
      updater ? updater(currentCondition) || currentCondition : currentCondition
    );
    const question = conditionQuestionEntries.find(q => q.id === updatedCondition.question);
    const questionType = question?.type || 'choice';
    const nextCondition = updatedCondition.type === 'timing'
      ? updatedCondition
      : { ...updatedCondition, operator: ensureOperatorForType(questionType, updatedCondition.operator) };
    conditions[conditionIndex] = nextCondition;
    updated[groupIndex] = { ...target, conditions };
    return updated;
  };

  const addConditionToGroup = (groupIndex) => {
    updateConditionGroupsState(groups => {
      const updated = [...groups];
      const target = updated[groupIndex] || { logic: 'all', conditions: [] };
      const conditions = Array.isArray(target.conditions) ? [...target.conditions] : [];
      conditions.push(createEmptyQuestionCondition());
      updated[groupIndex] = { ...target, conditions };
      return updated;
    });
  };

  const updateConditionField = (groupIndex, conditionIndex, field, value) => {
    updateConditionGroupsState(groups =>
      withUpdatedCondition(groups, groupIndex, conditionIndex, condition => ({
        ...condition,
        [field]: value
      }))
    );
  };

  const deleteConditionFromGroup = (groupIndex, conditionIndex) => {
    updateConditionGroupsState(groups => {
      const updated = [...groups];
      const target = updated[groupIndex] || { logic: 'all', conditions: [] };
      const conditions = Array.isArray(target.conditions)
        ? target.conditions.filter((_, idx) => idx !== conditionIndex)
        : [];
      updated[groupIndex] = { ...target, conditions };
      return updated;
    });
  };

  const handleConditionTypeChange = (groupIndex, conditionIndex, type) => {
    updateConditionGroupsState(groups => {
      const updated = [...groups];
      const target = updated[groupIndex] || { logic: 'all', conditions: [] };
      const conditions = Array.isArray(target.conditions) ? [...target.conditions] : [];
      const normalizedType = type === 'timing' ? 'timing' : 'question';
      conditions[conditionIndex] = normalizedType === 'timing'
        ? createEmptyTimingCondition()
        : createEmptyQuestionCondition();
      updated[groupIndex] = { ...target, conditions };
      return updated;
    });
  };

  const toggleTeam = (teamId) => {
    const currentTeams = Array.isArray(editedRule.teams) ? editedRule.teams : [];
    const newTeams = currentTeams.includes(teamId)
      ? currentTeams.filter(t => t !== teamId)
      : [...currentTeams, teamId];
    const normalizedRisks = normalizeRiskList(editedRule.risks, newTeams);
    setEditedRule({ ...editedRule, teams: newTeams, risks: normalizedRisks });
  };

  const addQuestionForTeam = (teamId) => {
    setEditedRule(prev => {
      const currentQuestions = typeof prev.questions === 'object' && prev.questions !== null
        ? { ...prev.questions }
        : {};
      const existing = Array.isArray(currentQuestions[teamId])
        ? [...currentQuestions[teamId]]
        : [];
      existing.push(sanitizeTeamQuestionEntry({ text: '' }));
      currentQuestions[teamId] = existing;
      return { ...prev, questions: currentQuestions };
    });
  };

  const updateTeamQuestion = (teamId, index, value) => {
    setEditedRule(prev => {
      const currentQuestions = typeof prev.questions === 'object' && prev.questions !== null
        ? { ...prev.questions }
        : {};
      const existing = Array.isArray(currentQuestions[teamId])
        ? [...currentQuestions[teamId]]
        : [];
      const currentEntry = sanitizeTeamQuestionEntry(existing[index] || {});
      existing[index] = { ...currentEntry, text: value };
      currentQuestions[teamId] = existing;
      return { ...prev, questions: currentQuestions };
    });
  };

  const deleteTeamQuestion = (teamId, index) => {
    setEditedRule(prev => {
      const currentQuestions = typeof prev.questions === 'object' && prev.questions !== null
        ? { ...prev.questions }
        : {};
      const existing = Array.isArray(currentQuestions[teamId])
        ? currentQuestions[teamId].filter((_, i) => i !== index)
        : [];
      currentQuestions[teamId] = existing;
      return { ...prev, questions: currentQuestions };
    });
  };

  const updateTeamQuestionTiming = (teamId, index, updates) => {
    setEditedRule(prev => {
      const currentQuestions = typeof prev.questions === 'object' && prev.questions !== null
        ? { ...prev.questions }
        : {};
      const existing = Array.isArray(currentQuestions[teamId])
        ? [...currentQuestions[teamId]]
        : [];
      const currentEntry = sanitizeTeamQuestionEntry(existing[index] || {});
      const mergedConstraint = {
        ...currentEntry.timingConstraint,
        ...(typeof updates === 'function'
          ? updates(currentEntry.timingConstraint)
          : updates)
      };
      existing[index] = {
        ...currentEntry,
        timingConstraint: sanitizeRiskTimingConstraint(mergedConstraint)
      };
      currentQuestions[teamId] = existing;
      return { ...prev, questions: currentQuestions };
    });
  };

  const addRisk = () => {
    const teamsForRisk = Array.isArray(editedRule.teams) ? editedRule.teams : [];
    const fallbackTeam = teamsForRisk[0] || '';
    const newRisk = normalizeRiskEntry({
      description: '',
      level: 'Moyen',
      mitigation: '',
      priority: 'A réaliser',
      teamId: fallbackTeam,
      timingConstraint: sanitizeRiskTimingConstraint()
    }, teamsForRisk);

    const existingRisks = Array.isArray(editedRule.risks) ? editedRule.risks : [];
    setEditedRule({
      ...editedRule,
      risks: [...existingRisks, newRisk]
    });
  };

  const updateRisk = (index, field, value) => {
    const currentRisks = Array.isArray(editedRule.risks) ? [...editedRule.risks] : [];
    const baseRisk = normalizeRiskEntry(currentRisks[index] || {}, editedRule.teams);
    currentRisks[index] = { ...baseRisk, [field]: value };
    const normalizedRisks = normalizeRiskList(currentRisks, editedRule.teams);
    setEditedRule({ ...editedRule, risks: normalizedRisks });
  };

  const deleteRisk = (index) => {
    setEditedRule({
      ...editedRule,
      risks: editedRule.risks.filter((_, i) => i !== index)
    });
  };

  const updateRiskTimingConstraint = (index, updates) => {
    setEditedRule(prev => {
      const currentRisks = Array.isArray(prev.risks) ? [...prev.risks] : [];
      const baseRisk = normalizeRiskEntry(currentRisks[index] || {}, prev.teams);
      const mergedConstraint = {
        ...baseRisk.timingConstraint,
        ...(typeof updates === 'function' ? updates(baseRisk.timingConstraint) : updates)
      };
      baseRisk.timingConstraint = sanitizeRiskTimingConstraint(mergedConstraint);
      currentRisks[index] = baseRisk;
      const normalizedRisks = normalizeRiskList(currentRisks, prev.teams);
      return { ...prev, risks: normalizedRisks };
    });
  };

  const conditionQuestionEntries = getConditionQuestionEntries(questions);
  const dateQuestions = questions.filter(q => (q.type || 'choice') === 'date');
  const dialogTitleId = 'rule-editor-title';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto"
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-4 sm:my-8 overflow-y-auto hv-surface hv-modal-panel"
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
              Édition de règle
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
                onClick={() => {
                  const normalizedRisks = normalizeRiskList(editedRule.risks, editedRule.teams);
                  onSave(
                    applyRuleConditionGroups(
                      {
                        ...editedRule,
                        questions: sanitizeTeamQuestionsByTeam(editedRule.questions),
                        risks: normalizedRisks
                      },
                      conditionGroups
                    )
                  );
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all hv-button hv-button-primary"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Informations générales */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-blue-500" />
              Informations générales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la règle</label>
                <input
                  type="text"
                  value={editedRule.name}
                  onChange={(e) => setEditedRule({ ...editedRule, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Projet digital avec données de santé"
                />
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Conditions de déclenchement
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Définissez dans quels cas cette règle doit s'activer automatiquement.
                </p>
              </div>
              <button
                type="button"
                onClick={addConditionGroup}
                className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un groupe
              </button>
            </div>

            {conditionGroups.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-2">
                  Cette règle est toujours déclenchée pour le moment.
                </p>
                <p className="text-sm text-gray-500">
                  Créez un groupe pour spécifier des conditions de déclenchement.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addConditionGroup}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
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
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            Logique :
                          </strong>{' '}
                          Cette règle se déclenchera si{' '}
                          <strong className="text-blue-700">{logicDescription}</strong>{' '}
                          (logique {logicLabel}).
                        </p>
                      );
                    })()
                  ) : (
                    <div className="space-y-2 text-sm text-blue-900">
                      <p>
                        <strong className="inline-flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          Logique :
                        </strong>{' '}
                        La règle se déclenche lorsque{' '}
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
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
                              ET
                            </span>
                          </div>
                        )}

                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="text-sm font-semibold text-gray-700">
                              Groupe {groupIdx + 1}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-blue-800 uppercase tracking-wide">
                              <span className="font-semibold">Logique interne</span>
                              <select
                                value={logic}
                                onChange={(e) => updateConditionGroupLogic(groupIdx, e.target.value)}
                                className="px-3 py-1.5 border border-blue-200 rounded-lg bg-white text-xs focus:ring-2 focus:ring-blue-500"
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
                            <div className="bg-white border border-dashed border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                              <p>Ajoutez une condition pour définir ce groupe.</p>
                              <button
                                type="button"
                                onClick={() => addConditionToGroup(groupIdx)}
                                className="mt-3 inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter une condition
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {conditions.map((condition, conditionIdx) => {
                                const conditionType = condition.type === 'timing' ? 'timing' : 'question';
                                const selectedQuestion = conditionQuestionEntries.find(q => q.id === condition.question);
                                const selectedQuestionType = selectedQuestion?.type || 'choice';
                                const usesOptions = ['choice', 'multi_choice'].includes(selectedQuestionType);
                                const inputType = selectedQuestionType === 'number'
                                  ? 'number'
                                  : selectedQuestionType === 'date'
                                    ? 'date'
                                    : 'text';
                                const placeholder = selectedQuestionType === 'date'
                                  ? 'AAAA-MM-JJ'
                                  : selectedQuestionType === 'url'
                                    ? 'https://...'
                                    : 'Valeur (texte, date, etc.)';

                                return (
                                  <div key={conditionIdx} className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                      {conditionIdx > 0 && (
                                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                          {connectorLabel}
                                        </span>
                                      )}
                                      <span className="text-sm font-semibold text-gray-700">
                                        Condition {conditionIdx + 1}
                                      </span>
                                      <select
                                        value={conditionType}
                                        onChange={(e) => handleConditionTypeChange(groupIdx, conditionIdx, e.target.value)}
                                        className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="question">Basée sur une réponse</option>
                                        <option value="timing">Comparaison de dates</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => deleteConditionFromGroup(groupIdx, conditionIdx)}
                                        className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {conditionType === 'timing' ? (
                                      <div className="space-y-4">
                                        {dateQuestions.length >= 2 ? (
                                          <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Date de départ</label>
                                                <select
                                                  value={condition.startQuestion}
                                                  onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'startQuestion', e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                >
                                                  <option value="">Sélectionner...</option>
                                                  {dateQuestions.map(q => (
                                                    <option key={q.id} value={q.id}>{q.question || q.id}</option>
                                                  ))}
                                                </select>
                                              </div>

                                              <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Date d'arrivée</label>
                                                <select
                                                  value={condition.endQuestion}
                                                  onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'endQuestion', e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                >
                                                  <option value="">Sélectionner...</option>
                                                  {dateQuestions.map(q => (
                                                    <option key={q.id} value={q.id}>{q.question || q.id}</option>
                                                  ))}
                                                </select>
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Durée minimale (semaines)</label>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  value={condition.minimumWeeks ?? ''}
                                                  onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'minimumWeeks', e.target.value === '' ? undefined : Number(e.target.value))}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                  placeholder="Ex: 8"
                                                />
                                              </div>

                                              <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Durée maximale (semaines - optionnel)</label>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  value={condition.maximumWeeks ?? ''}
                                                  onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'maximumWeeks', e.target.value === '' ? undefined : Number(e.target.value))}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                  placeholder="Laisser vide si non concerné"
                                                />
                                              </div>
                                            </div>

                                            <p className="text-xs text-gray-500">
                                              La règle sera valide si la durée entre les deux dates respecte les contraintes définies.
                                            </p>

                                          </>
                                        ) : (
                                          <div className="bg-white border border-dashed border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                                            Ajoutez au moins deux questions de type date pour configurer cette condition temporelle.
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
                                          <select
                                            value={condition.question}
                                            onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'question', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                          >
                                            <option value="">Sélectionner...</option>
                                            {conditionQuestionEntries.map(q => (
                                              <option key={q.id} value={q.id}>{q.question || q.id}</option>
                                            ))}
                                          </select>
                                        </div>

                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Opérateur</label>
                                          {(() => {
                                            const operatorOptions = getOperatorOptionsForType(selectedQuestionType);
                                            const operatorValue = ensureOperatorForType(selectedQuestionType, condition.operator);
                                            return (
                                              <select
                                                value={operatorValue}
                                                onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'operator', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                              >
                                                {operatorOptions.map(option => (
                                                  <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                              </select>
                                            );
                                          })()}
                                        </div>

                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Valeur</label>
                                          {(() => {
                                            if (!condition.question) {
                                              return (
                                                <input
                                                  type="text"
                                                  value={condition.value}
                                                  onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'value', e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                  placeholder="Valeur (texte, date, etc.)"
                                                />
                                              );
                                            }

                                            if (selectedQuestionType === 'boolean') {
                                              return (
                                                <select
                                                  value={condition.value}
                                                  onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'value', e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                >
                                                  <option value="">Sélectionner...</option>
                                                  <option value="true">Coché</option>
                                                  <option value="false">Non coché</option>
                                                </select>
                                              );
                                            }

                                            if (usesOptions) {
                                              const optionLabels = getQuestionOptionLabels(selectedQuestion);
                                              return (
                                                <select
                                                  value={condition.value}
                                                  onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'value', e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                >
                                                  <option value="">Sélectionner...</option>
                                                  {optionLabels.map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                  ))}
                                                </select>
                                              );
                                            }

                                            return (
                                              <input
                                                type={inputType}
                                                value={condition.value}
                                                onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'value', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                placeholder={placeholder}
                                              />
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              <div className="pt-3 border-t border-blue-100 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => addConditionToGroup(groupIdx)}
                                  className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
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
          {/* Équipes à déclencher */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Équipes compliance à déclencher
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    editedRule.teams.includes(team.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                      editedRule.teams.includes(team.id)
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300'
                    }`}>
                      {editedRule.teams.includes(team.id) && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{team.name}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Questions par équipe */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Questions à préparer par équipe
            </h3>
            {editedRule.teams.length === 0 ? (
              <div className="text-sm text-gray-500 italic">
                Sélectionnez au moins une équipe pour définir les questions.
              </div>
            ) : (
              <div className="space-y-4">
                {editedRule.teams.map(teamId => (
                  <div key={teamId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        {teams.find(team => team.id === teamId)?.name || teamId}
                      </h4>
                      <button
                        onClick={() => addQuestionForTeam(teamId)}
                        className="flex items-center px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter une question
                      </button>
                    </div>
                    {(editedRule.questions[teamId] || []).length > 0 ? (
                      <div className="space-y-2">
                        {(editedRule.questions[teamId] || []).map((questionEntry, idx) => {
                          const sanitizedEntry = sanitizeTeamQuestionEntry(questionEntry);
                          const timingConstraint = sanitizeRiskTimingConstraint(
                            sanitizedEntry.timingConstraint
                          );
                          const hasDateQuestions = dateQuestions.length >= 2;
                          const toggleDisabled = !hasDateQuestions && !timingConstraint.enabled;
                          const isToggleChecked = Boolean(timingConstraint.enabled);

                          return (
                            <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-white space-y-3">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 min-w-0">
                                  <RichTextEditor
                                    id={`team-question-${teamId}-${idx}`}
                                    value={sanitizedEntry.text}
                                    onChange={(nextValue) => updateTeamQuestion(teamId, idx, nextValue)}
                                    placeholder="Question pour l'équipe..."
                                    compact
                                    ariaLabel="Question pour l'équipe"
                                  />
                                </div>
                                <button
                                  onClick={() => deleteTeamQuestion(teamId, idx)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-all"
                                  aria-label="Supprimer la question"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="border-t border-gray-100 pt-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-medium text-gray-600">
                                      Associer au non-respect d'un délai minimum
                                    </p>
                                    <p className="text-xs text-gray-500 leading-snug">
                                      Utilise deux questions de type « date » pour vérifier le délai réel.
                                    </p>
                                  </div>
                                  <label
                                    className={`inline-flex items-center gap-2 text-xs font-medium ${
                                      toggleDisabled ? 'text-gray-400' : 'text-gray-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={isToggleChecked}
                                      onChange={(event) =>
                                        updateTeamQuestionTiming(teamId, idx, { enabled: event.target.checked })
                                      }
                                      disabled={toggleDisabled}
                                    />
                                    <span>{isToggleChecked ? 'Activé' : 'Désactivé'}</span>
                                  </label>
                                </div>

                                {!hasDateQuestions ? (
                                  <p className="mt-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                                    Ajoutez au moins deux questions de type date pour pouvoir contrôler un délai minimum.
                                  </p>
                                ) : isToggleChecked ? (
                                  <div className="mt-3 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Date de départ</label>
                                        <select
                                          value={timingConstraint.startQuestion}
                                          onChange={(e) =>
                                            updateTeamQuestionTiming(teamId, idx, { startQuestion: e.target.value })
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        >
                                          <option value="">Sélectionner...</option>
                                          {dateQuestions.map(question => (
                                            <option key={question.id} value={question.id}>
                                              {question.question || question.id}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Date de fin</label>
                                        <select
                                          value={timingConstraint.endQuestion}
                                          onChange={(e) =>
                                            updateTeamQuestionTiming(teamId, idx, { endQuestion: e.target.value })
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        >
                                          <option value="">Sélectionner...</option>
                                          {dateQuestions.map(question => (
                                            <option key={question.id} value={question.id}>
                                              {question.question || question.id}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Minimum (semaines)</label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.1"
                                          value={timingConstraint.minimumWeeks ?? ''}
                                          onChange={(e) => {
                                            const rawValue = e.target.value;
                                            updateTeamQuestionTiming(teamId, idx, {
                                              minimumWeeks: rawValue === '' ? undefined : Number(rawValue)
                                            });
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                          placeholder="Ex: 4"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Minimum (jours)</label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={timingConstraint.minimumDays ?? ''}
                                          onChange={(e) => {
                                            const rawValue = e.target.value;
                                            updateTeamQuestionTiming(teamId, idx, {
                                              minimumDays: rawValue === '' ? undefined : Number(rawValue)
                                            });
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                          placeholder="Ex: 90"
                                        />
                                      </div>
                                    </div>

                                    <p className="text-[11px] text-gray-500">
                                      La question sera affichée uniquement si le délai constaté est inférieur au minimum défini.
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Aucune question définie</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risques */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Risques associés
              </h3>
              <button
                onClick={addRisk}
                className="flex items-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un risque
              </button>
            </div>

            {editedRule.risks.length === 0 ? (
              <div className="text-sm text-gray-500 italic">
                Aucun risque défini pour cette règle.
              </div>
            ) : (
              <div className="space-y-3">
                {editedRule.risks.map((risk, idx) => {
                  const timingConstraint = sanitizeRiskTimingConstraint(risk.timingConstraint);
                  const hasDateQuestions = dateQuestions.length >= 2;
                  const toggleDisabled = !hasDateQuestions && !timingConstraint.enabled;
                  const isToggleChecked = Boolean(timingConstraint.enabled);

                  return (
                    <div key={idx} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center mb-3">
                        <span className="text-sm font-semibold text-gray-700">Risque {idx + 1}</span>
                        <button
                          onClick={() => deleteRisk(idx)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-all ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description du risque</label>
                          <input
                            type="text"
                            value={risk.description}
                            onChange={(e) => updateRisk(idx, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Non-conformité RGPD sur les données de santé"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Équipe référente</label>
                          <select
                            value={risk.teamId}
                            onChange={(e) => updateRisk(idx, 'teamId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            disabled={editedRule.teams.length === 0}
                          >
                            {editedRule.teams.length === 0 ? (
                              <option value="">Aucune équipe disponible</option>
                            ) : (
                              <>
                                {editedRule.teams.map(teamId => (
                                  <option key={teamId} value={teamId}>
                                    {teams.find(team => team.id === teamId)?.name || teamId}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                          {editedRule.teams.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              Sélectionnez une équipe dans la section précédente pour associer ce risque.
                            </p>
                          )}
                        </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Niveau de criticité</label>
                        <select
                          value={risk.level}
                          onChange={(e) => updateRisk(idx, 'level', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Faible">Faible (niveau vert)</option>
                          <option value="Moyen">Moyen (niveau orange)</option>
                          <option value="Élevé">Élevé (niveau rouge)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Priorité du risque</label>
                        <select
                          value={risk.priority}
                          onChange={(e) => updateRisk(idx, 'priority', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          {RISK_PRIORITY_OPTIONS.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Actions de mitigation</label>
                        <textarea
                          value={risk.mitigation}
                          onChange={(e) => updateRisk(idx, 'mitigation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          placeholder="Ex: Réaliser une DPIA et héberger sur un serveur HDS"
                        />
                      </div>

                      <div className="border-t border-red-100 pt-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              Associer au non-respect d'un délai minimum
                            </p>
                            <p className="text-xs text-gray-500 leading-snug">
                              Utilise deux questions de type « date » pour vérifier le délai réel.
                            </p>
                          </div>
                          <label className={`inline-flex items-center gap-2 text-xs font-medium ${toggleDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-red-500 focus:ring-red-400"
                              checked={isToggleChecked}
                              onChange={(event) => updateRiskTimingConstraint(idx, { enabled: event.target.checked })}
                              disabled={toggleDisabled}
                            />
                            <span>{isToggleChecked ? 'Activé' : 'Désactivé'}</span>
                          </label>
                        </div>

                        {!hasDateQuestions ? (
                          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            Ajoutez au moins deux questions de type date pour pouvoir contrôler un délai minimum.
                          </p>
                        ) : isToggleChecked ? (
                          <div className="mt-3 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Date de départ</label>
                                <select
                                  value={timingConstraint.startQuestion}
                                  onChange={(e) => updateRiskTimingConstraint(idx, { startQuestion: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Sélectionner...</option>
                                  {dateQuestions.map(question => (
                                    <option key={question.id} value={question.id}>
                                      {question.question || question.id}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Date de fin</label>
                                <select
                                  value={timingConstraint.endQuestion}
                                  onChange={(e) => updateRiskTimingConstraint(idx, { endQuestion: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Sélectionner...</option>
                                  {dateQuestions.map(question => (
                                    <option key={question.id} value={question.id}>
                                      {question.question || question.id}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Minimum (semaines)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={timingConstraint.minimumWeeks ?? ''}
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    updateRiskTimingConstraint(idx, { minimumWeeks: rawValue === '' ? undefined : Number(rawValue) });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder="Ex: 4"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Minimum (jours)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={timingConstraint.minimumDays ?? ''}
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    updateRiskTimingConstraint(idx, { minimumDays: rawValue === '' ? undefined : Number(rawValue) });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder="Ex: 90"
                                />
                              </div>
                            </div>

                            <p className="text-[11px] text-gray-500">
                              Le risque sera signalé si le délai réel est inférieur à l'un des minimums renseignés.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
