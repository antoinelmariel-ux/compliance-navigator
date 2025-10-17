import React, { useEffect, useRef, useState } from '../react.js';
import { Plus, Trash2, CheckCircle } from './icons.js';
import {
  applyRuleConditionGroups,
  normalizeRuleConditionGroups,
  sanitizeRuleCondition,
  createEmptyQuestionCondition,
  createEmptyTimingCondition
} from '../utils/ruleConditions.js';

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

  const buildRuleState = (source) => {
    const base = {
      ...source,
      conditionLogic: source.conditionLogic === 'any' ? 'any' : 'all',
      conditions: Array.isArray(source.conditions)
        ? source.conditions.map(sanitizeRuleCondition)
        : [],
      conditionGroups: Array.isArray(source.conditionGroups) ? source.conditionGroups : [],
      teams: Array.isArray(source.teams) ? source.teams : [],
      questions: source.questions || {},
      risks: Array.isArray(source.risks) ? source.risks : []
    };

    const groups = normalizeRuleConditionGroups(base);
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
      const nextGroups = updater(currentGroups);
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
    const nextCondition = sanitizeRuleCondition(
      updater ? updater(currentCondition) || currentCondition : currentCondition
    );
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

  const cloneTimingProfiles = (condition) => {
    return Array.isArray(condition.complianceProfiles)
      ? condition.complianceProfiles.map(profile => ({
          ...profile,
          conditions: Array.isArray(profile.conditions)
            ? profile.conditions.map(cond => ({ ...cond }))
            : [],
          requirements: { ...(profile.requirements || {}) }
        }))
      : [];
  };

  const addTimingProfile = (groupIndex, conditionIndex) => {
    updateConditionGroupsState(groups =>
      withUpdatedCondition(groups, groupIndex, conditionIndex, current => {
        const profiles = cloneTimingProfiles(current);
        profiles.push({
          id: `profile_${Math.random().toString(36).slice(2, 8)}`,
          label: 'Nouveau scénario',
          description: '',
          requirements: {},
          conditions: [],
          conditionLogic: 'all'
        });
        return { ...current, complianceProfiles: profiles };
      })
    );
  };

  const updateTimingProfileField = (groupIndex, conditionIndex, profileIndex, field, value) => {
    updateConditionGroupsState(groups =>
      withUpdatedCondition(groups, groupIndex, conditionIndex, current => {
        const profiles = cloneTimingProfiles(current);
        if (!profiles[profileIndex]) {
          return current;
        }
        profiles[profileIndex] = {
          ...profiles[profileIndex],
          [field]: value
        };
        return { ...current, complianceProfiles: profiles };
      })
    );
  };

  const deleteTimingProfile = (groupIndex, conditionIndex, profileIndex) => {
    updateConditionGroupsState(groups =>
      withUpdatedCondition(groups, groupIndex, conditionIndex, current => {
        const profiles = cloneTimingProfiles(current).filter((_, idx) => idx !== profileIndex);
        return { ...current, complianceProfiles: profiles };
      })
    );
  };

  const addTimingProfileCondition = (groupIndex, conditionIndex, profileIndex) => {
    updateConditionGroupsState(groups =>
      withUpdatedCondition(groups, groupIndex, conditionIndex, current => {
        const profiles = cloneTimingProfiles(current);
        const profile = { ...(profiles[profileIndex] || { conditions: [] }) };
        profile.conditions = [...(profile.conditions || []), { question: '', operator: 'equals', value: '' }];
        profiles[profileIndex] = profile;
        return { ...current, complianceProfiles: profiles };
      })
    );
  };

  const updateTimingProfileCondition = (
    groupIndex,
    conditionIndex,
    profileIndex,
    conditionIdx,
    field,
    value
  ) => {
    updateConditionGroupsState(groups =>
      withUpdatedCondition(groups, groupIndex, conditionIndex, current => {
        const profiles = cloneTimingProfiles(current);
        const profile = { ...(profiles[profileIndex] || { conditions: [] }) };
        const profileConditions = Array.isArray(profile.conditions) ? [...profile.conditions] : [];

        if (!profileConditions[conditionIdx]) {
          profileConditions[conditionIdx] = { question: '', operator: 'equals', value: '' };
        }

        profileConditions[conditionIdx] = {
          ...profileConditions[conditionIdx],
          [field]: value
        };

        profile.conditions = profileConditions;
        profiles[profileIndex] = profile;
        return { ...current, complianceProfiles: profiles };
      })
    );
  };

  const deleteTimingProfileCondition = (groupIndex, conditionIndex, profileIndex, conditionIdx) => {
    updateConditionGroupsState(groups =>
      withUpdatedCondition(groups, groupIndex, conditionIndex, current => {
        const profiles = cloneTimingProfiles(current);
        const profile = { ...(profiles[profileIndex] || { conditions: [] }) };
        profile.conditions = Array.isArray(profile.conditions)
          ? profile.conditions.filter((_, idx) => idx !== conditionIdx)
          : [];
        profiles[profileIndex] = profile;
        return { ...current, complianceProfiles: profiles };
      })
    );
  };

  const updateTimingRequirement = (groupIndex, conditionIndex, profileIndex, teamId, value) => {
    updateConditionGroupsState(groups =>
      withUpdatedCondition(groups, groupIndex, conditionIndex, current => {
        const profiles = cloneTimingProfiles(current);
        const profile = { ...(profiles[profileIndex] || {}) };
        const requirements = { ...(profile.requirements || {}) };
        const currentRequirement = requirements[teamId];

        if (value === '') {
          delete requirements[teamId];
        } else {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            if (currentRequirement && typeof currentRequirement === 'object' && !Array.isArray(currentRequirement)) {
              requirements[teamId] = { ...currentRequirement, minimumWeeks: parsed };
            } else {
              requirements[teamId] = parsed;
            }
          }
        }

        profile.requirements = requirements;
        profiles[profileIndex] = profile;
        return { ...current, complianceProfiles: profiles };
      })
    );
  };

  const toggleTeam = (teamId) => {
    const currentTeams = Array.isArray(editedRule.teams) ? editedRule.teams : [];
    const newTeams = currentTeams.includes(teamId)
      ? currentTeams.filter(t => t !== teamId)
      : [...currentTeams, teamId];
    setEditedRule({ ...editedRule, teams: newTeams });
  };

  const addQuestionForTeam = (teamId) => {
    setEditedRule({
      ...editedRule,
      questions: {
        ...editedRule.questions,
        [teamId]: [...(editedRule.questions[teamId] || []), '']
      }
    });
  };

  const updateTeamQuestion = (teamId, index, value) => {
    const newQuestions = { ...editedRule.questions };
    newQuestions[teamId][index] = value;
    setEditedRule({ ...editedRule, questions: newQuestions });
  };

  const deleteTeamQuestion = (teamId, index) => {
    const newQuestions = { ...editedRule.questions };
    newQuestions[teamId] = newQuestions[teamId].filter((_, i) => i !== index);
    setEditedRule({ ...editedRule, questions: newQuestions });
  };

  const addRisk = () => {
    setEditedRule({
      ...editedRule,
      risks: [...editedRule.risks, { description: '', level: 'Moyen', mitigation: '' }]
    });
  };

  const updateRisk = (index, field, value) => {
    const newRisks = [...editedRule.risks];
    newRisks[index][field] = value;
    setEditedRule({ ...editedRule, risks: newRisks });
  };

  const deleteRisk = (index) => {
    setEditedRule({
      ...editedRule,
      risks: editedRule.risks.filter((_, i) => i !== index)
    });
  };

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
                onClick={() => onSave(applyRuleConditionGroups(editedRule, conditionGroups))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all hv-button hv-button-primary"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Informations générales */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Informations générales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la règle</label>
                <input
                  type="text"
                  value={editedRule.name}
                  onChange={(e) => setEditedRule({ ...editedRule, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Projet digital avec données de santé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau de priorité</label>
                <select
                  value={editedRule.priority}
                  onChange={(e) => setEditedRule({ ...editedRule, priority: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Critique">🔴 Critique</option>
                  <option value="Important">🟠 Important</option>
                  <option value="Recommandé">🔵 Recommandé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">🎯 Conditions de déclenchement</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Définissez dans quels cas cette règle doit s'activer automatiquement.
                </p>
              </div>
              <button
                type="button"
                onClick={addConditionGroup}
                className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-sm font-medium"
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
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
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
                          <strong>💡 Logique :</strong> Cette règle se déclenchera si{' '}
                          <strong className="text-blue-700">{logicDescription}</strong>{' '}
                          (logique {logicLabel}).
                        </p>
                      );
                    })()
                  ) : (
                    <div className="space-y-2 text-sm text-blue-900">
                      <p>
                        <strong>💡 Logique :</strong> La règle se déclenche lorsque{' '}
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
                            <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
                              ET
                            </span>
                          </div>
                        )}

                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="text-sm font-semibold text-gray-700">
                              Groupe {groupIdx + 1}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-indigo-800 uppercase tracking-wide">
                              <span className="font-semibold">Logique interne</span>
                              <select
                                value={logic}
                                onChange={(e) => updateConditionGroupLogic(groupIdx, e.target.value)}
                                className="px-3 py-1.5 border border-indigo-200 rounded-lg bg-white text-xs focus:ring-2 focus:ring-indigo-500"
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
                            <div className="bg-white border border-dashed border-indigo-200 rounded-lg p-4 text-sm text-indigo-700">
                              <p>Ajoutez une condition pour définir ce groupe.</p>
                              <button
                                type="button"
                                onClick={() => addConditionToGroup(groupIdx)}
                                className="mt-3 inline-flex items-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-sm font-medium"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter une condition
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {conditions.map((condition, conditionIdx) => {
                                const conditionType = condition.type === 'timing' ? 'timing' : 'question';
                                const selectedQuestion = questions.find(q => q.id === condition.question);
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
                                  <div key={conditionIdx} className="bg-white rounded-lg border border-indigo-200 p-4 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                      {conditionIdx > 0 && (
                                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                          {connectorLabel}
                                        </span>
                                      )}
                                      <span className="text-sm font-semibold text-gray-700">
                                        Condition {conditionIdx + 1}
                                      </span>
                                      <select
                                        value={conditionType}
                                        onChange={(e) => handleConditionTypeChange(groupIdx, conditionIdx, e.target.value)}
                                        className="px-3 py-2 border border-indigo-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500"
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
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                                >
                                                  <option value="">Sélectionner...</option>
                                                  {dateQuestions.map(q => (
                                                    <option key={q.id} value={q.id}>{q.id} - {q.question.substring(0, 40)}...</option>
                                                  ))}
                                                </select>
                                              </div>

                                              <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Date d'arrivée</label>
                                                <select
                                                  value={condition.endQuestion}
                                                  onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'endQuestion', e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                                >
                                                  <option value="">Sélectionner...</option>
                                                  {dateQuestions.map(q => (
                                                    <option key={q.id} value={q.id}>{q.id} - {q.question.substring(0, 40)}...</option>
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
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
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
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                                  placeholder="Laisser vide si non concerné"
                                                />
                                              </div>
                                            </div>

                                            <p className="text-xs text-gray-500">
                                              La règle sera valide si la durée entre les deux dates respecte les contraintes définies.
                                            </p>

                                            <div className="mt-4 border border-indigo-200 rounded-lg bg-white/60 p-4">
                                              <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-semibold text-gray-700">
                                                  Scénarios de délais par compliance
                                                </h4>
                                                <button
                                                  type="button"
                                                  onClick={() => addTimingProfile(groupIdx, conditionIdx)}
                                                  className="flex items-center px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
                                                >
                                                  <Plus className="w-4 h-4 mr-1" />
                                                  Ajouter un scénario
                                                </button>
                                              </div>

                                              {condition.complianceProfiles && condition.complianceProfiles.length > 0 ? (
                                                <div className="space-y-4">
                                                  {condition.complianceProfiles.map((profile, profileIdx) => {
                                                    const requirementEntries = Object.entries(profile.requirements || {});
                                                    const requirementValueForTeam = (teamId) => {
                                                      const requirement = profile.requirements?.[teamId];
                                                      if (requirement && typeof requirement === 'object' && !Array.isArray(requirement)) {
                                                        return requirement.minimumWeeks ?? '';
                                                      }
                                                      return requirement ?? '';
                                                    };

                                                    return (
                                                      <div
                                                        key={profile.id || `${groupIdx}-${conditionIdx}-${profileIdx}`}
                                                        className="bg-white border border-indigo-100 rounded-xl shadow-sm p-4"
                                                      >
                                                        <div className="flex flex-wrap items-start gap-3 mb-3">
                                                          <div className="flex-1 min-w-[200px]">
                                                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                                              Nom du scénario
                                                            </label>
                                                            <input
                                                              type="text"
                                                              value={profile.label || ''}
                                                              onChange={(e) => updateTimingProfileField(groupIdx, conditionIdx, profileIdx, 'label', e.target.value)}
                                                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                                              placeholder="Ex: Standard, Digital, Données de santé..."
                                                            />
                                                          </div>

                                                          <button
                                                            type="button"
                                                            onClick={() => deleteTimingProfile(groupIdx, conditionIdx, profileIdx)}
                                                            className="ml-auto text-red-500 hover:bg-red-50 px-3 py-1.5 rounded text-xs font-semibold"
                                                          >
                                                            Supprimer
                                                          </button>
                                                        </div>

                                                        <div className="mb-4">
                                                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                                            Description (optionnel)
                                                          </label>
                                                          <textarea
                                                            value={profile.description || ''}
                                                            onChange={(e) => updateTimingProfileField(groupIdx, conditionIdx, profileIdx, 'description', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                                            rows={2}
                                                            placeholder="Décrivez dans quel contexte appliquer ce scénario..."
                                                          />
                                                        </div>

                                                        <div className="mb-4">
                                                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                              Conditions d'application
                                                            </h5>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                                Logique
                                                              </span>
                                                              <select
                                                                value={profile.conditionLogic || 'all'}
                                                                onChange={(e) =>
                                                                  updateTimingProfileField(
                                                                    groupIdx,
                                                                    conditionIdx,
                                                                    profileIdx,
                                                                    'conditionLogic',
                                                                    e.target.value === 'any' ? 'any' : 'all'
                                                                  )
                                                                }
                                                                className="px-2.5 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-2 focus:ring-indigo-500"
                                                              >
                                                                <option value="all">Toutes (ET)</option>
                                                                <option value="any">Au moins une (OU)</option>
                                                              </select>
                                                              <button
                                                                type="button"
                                                                onClick={() => addTimingProfileCondition(groupIdx, conditionIdx, profileIdx)}
                                                                className="flex items-center px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                                              >
                                                                <Plus className="w-3 h-3 mr-1" />
                                                                Ajouter une condition
                                                              </button>
                                                            </div>
                                                          </div>

                                                          {profile.conditions && profile.conditions.length > 0 ? (
                                                            <div className="space-y-2">
                                                              {profile.conditions.map((profileCondition, conditionIdx2) => {
                                                                const conditionQuestion = questions.find(q => q.id === profileCondition.question);
                                                                const conditionQuestionType = conditionQuestion?.type || 'choice';
                                                                const conditionUsesOptions = ['choice', 'multi_choice'].includes(conditionQuestionType);
                                                                const profileInputType = conditionQuestionType === 'number'
                                                                  ? 'number'
                                                                  : conditionQuestionType === 'date'
                                                                    ? 'date'
                                                                    : 'text';

                                                                return (
                                                                  <div
                                                                    key={conditionIdx2}
                                                                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 border border-gray-200 rounded-lg p-3"
                                                                  >
                                                                    <div className="md:col-span-5">
                                                                      <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
                                                                      <select
                                                                        value={profileCondition.question}
                                                                        onChange={(e) => updateTimingProfileCondition(groupIdx, conditionIdx, profileIdx, conditionIdx2, 'question', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                                                      >
                                                                        <option value="">Sélectionner...</option>
                                                                        {questions.map(question => (
                                                                          <option key={question.id} value={question.id}>
                                                                            {question.id} - {question.question.substring(0, 45)}...
                                                                          </option>
                                                                        ))}
                                                                      </select>
                                                                    </div>

                                                                    <div className="md:col-span-3">
                                                                      <label className="block text-xs font-medium text-gray-600 mb-1">Opérateur</label>
                                                                      <select
                                                                        value={profileCondition.operator}
                                                                        onChange={(e) => updateTimingProfileCondition(groupIdx, conditionIdx, profileIdx, conditionIdx2, 'operator', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                                                      >
                                                                        <option value="equals">Est égal à (=)</option>
                                                                        <option value="not_equals">Est différent de (≠)</option>
                                                                        <option value="contains">Contient</option>
                                                                      </select>
                                                                    </div>

                                                                    <div className="md:col-span-3">
                                                                      <label className="block text-xs font-medium text-gray-600 mb-1">Valeur</label>
                                                                      {conditionUsesOptions ? (
                                                                        <select
                                                                          value={profileCondition.value}
                                                                          onChange={(e) => updateTimingProfileCondition(groupIdx, conditionIdx, profileIdx, conditionIdx2, 'value', e.target.value)}
                                                                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                                                        >
                                                                          <option value="">Sélectionner...</option>
                                                                          {(conditionQuestion?.options || []).map((option, optionIdx) => (
                                                                            <option key={optionIdx} value={option}>{option}</option>
                                                                          ))}
                                                                        </select>
                                                                      ) : (
                                                                        <input
                                                                          type={profileInputType}
                                                                          value={profileCondition.value}
                                                                          onChange={(e) => updateTimingProfileCondition(groupIdx, conditionIdx, profileIdx, conditionIdx2, 'value', e.target.value)}
                                                                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                                                          placeholder={profileInputType === 'number' ? 'Valeur numérique' : 'Valeur...'}
                                                                        />
                                                                      )}
                                                                    </div>

                                                                    <div className="md:col-span-1 flex justify-end">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => deleteTimingProfileCondition(groupIdx, conditionIdx, profileIdx, conditionIdx2)}
                                                                        className="text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                                                                      >
                                                                        <Trash2 className="w-4 h-4" />
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                );
                                                              })}
                                                            </div>
                                                          ) : (
                                                            <div className="text-xs text-gray-500 italic">
                                                              Aucun critère : ce scénario s'applique par défaut.
                                                            </div>
                                                          )}
                                                        </div>

                                                        <div>
                                                          <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                                            Délais (en semaines) par équipe
                                                          </h5>
                                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {teams.map(team => {
                                                              const requirementValue = requirementValueForTeam(team.id);
                                                              return (
                                                                <div
                                                                  key={team.id}
                                                                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                                                                >
                                                                  <span className="text-sm font-medium text-gray-700 pr-3 flex-1">
                                                                    {team.name}
                                                                  </span>
                                                                  <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={requirementValue === undefined ? '' : requirementValue}
                                                                    onChange={(e) => updateTimingRequirement(groupIdx, conditionIdx, profileIdx, team.id, e.target.value)}
                                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                                                                    placeholder="Sem."
                                                                  />
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
                                                          <p className="text-[11px] text-gray-500 mt-2">
                                                            Laissez le champ vide pour indiquer qu'aucun délai spécifique n'est requis pour cette équipe dans ce scénario.
                                                          </p>
                                                          {requirementEntries.length === 0 && (
                                                            <p className="text-[11px] text-orange-600 mt-1">
                                                              Aucun délai n'est défini pour ce scénario. Les équipes ne recevront pas d'exigence particulière.
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              ) : (
                                                <div className="text-xs text-gray-600 italic">
                                                  Aucun scénario configuré. Ajoutez un profil pour personnaliser les délais selon les équipes compliance.
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        ) : (
                                          <div className="bg-white border border-dashed border-indigo-200 rounded-lg p-4 text-sm text-indigo-700">
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                          >
                                            <option value="">Sélectionner...</option>
                                            {questions.map(q => (
                                              <option key={q.id} value={q.id}>{q.id} - {q.question.substring(0, 30)}...</option>
                                            ))}
                                          </select>
                                        </div>

                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Opérateur</label>
                                          <select
                                            value={condition.operator}
                                            onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'operator', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                          >
                                            <option value="equals">Est égal à (=)</option>
                                            <option value="not_equals">Est différent de (≠)</option>
                                            <option value="contains">Contient</option>
                                          </select>
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
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                                  placeholder="Valeur (texte, date, etc.)"
                                                />
                                              );
                                            }

                                            if (usesOptions) {
                                              return (
                                                <select
                                                  value={condition.value}
                                                  onChange={(e) => updateConditionField(groupIdx, conditionIdx, 'value', e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                                >
                                                  <option value="">Sélectionner...</option>
                                                  {(selectedQuestion?.options || []).map((opt, i) => (
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
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
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

                              <div className="pt-3 border-t border-indigo-100 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => addConditionToGroup(groupIdx)}
                                  className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-sm font-medium"
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">👥 Équipes compliance à déclencher</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    editedRule.teams.includes(team.id)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                      editedRule.teams.includes(team.id)
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300'
                    }`}>
                      {editedRule.teams.includes(team.id) && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{team.name}</div>
                      <div className="text-xs text-gray-500">{team.id}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Questions par équipe */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">📝 Questions à préparer par équipe</h3>
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
                        className="flex items-center px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter une question
                      </button>
                    </div>
                    {(editedRule.questions[teamId] || []).length > 0 ? (
                      <div className="space-y-2">
                        {(editedRule.questions[teamId] || []).map((questionText, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={questionText}
                              onChange={(e) => updateTeamQuestion(teamId, idx, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder="Question pour l'équipe..."
                            />
                            <button
                              onClick={() => deleteTeamQuestion(teamId, idx)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
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
              <h3 className="text-xl font-bold text-gray-800">⚠️ Risques associés</h3>
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
                {editedRule.risks.map((risk, idx) => (
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                          placeholder="Ex: Non-conformité RGPD sur les données de santé"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Niveau de criticité</label>
                        <select
                          value={risk.level}
                          onChange={(e) => updateRisk(idx, 'level', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Faible">🟢 Faible</option>
                          <option value="Moyen">🟠 Moyen</option>
                          <option value="Élevé">🔴 Élevé</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Actions de mitigation</label>
                        <textarea
                          value={risk.mitigation}
                          onChange={(e) => updateRisk(idx, 'mitigation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                          rows="2"
                          placeholder="Ex: Réaliser une DPIA et héberger sur un serveur HDS"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

