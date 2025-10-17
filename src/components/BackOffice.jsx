import React, { useEffect, useState } from '../react.js';
import { Settings, Plus, Edit, Trash2, Eye, Info, GripVertical, Download } from './icons.js';
import { QuestionEditor } from './QuestionEditor.jsx';
import { RuleEditor } from './RuleEditor.jsx';
import { renderTextWithLinks } from '../utils/linkify.js';
import { normalizeConditionGroups } from '../utils/conditionGroups.js';
import { normalizeTimingRequirement } from '../utils/rules.js';
import { sanitizeRuleCondition } from '../utils/ruleConditions.js';

const QUESTION_TYPE_META = {
  choice: {
    label: 'Liste de choix',
    description: "Affiche une liste d'options exclusives."
  },
  multi_choice: {
    label: 'Choix multiples',
    description: 'Permet de sélectionner plusieurs réponses.'
  },
  date: {
    label: 'Date',
    description: 'Attend la sélection d\'une date précise.'
  },
  number: {
    label: 'Valeur numérique',
    description: 'Attend un nombre entier ou décimal.'
  },
  url: {
    label: 'Lien URL',
    description: 'Attend un lien complet (https://...).'
  },
  file: {
    label: 'Fichier',
    description: 'Permet de téléverser un document de référence.'
  },
  text: {
    label: 'Texte libre (1 ligne)',
    description: 'Attend une réponse texte courte.'
  },
  long_text: {
    label: 'Texte libre (plusieurs lignes)',
    description: 'Attend une réponse texte détaillée.'
  }
};

const getQuestionTypeMeta = (type) => {
  const key = type || 'choice';
  return QUESTION_TYPE_META[key] || QUESTION_TYPE_META.choice;
};

const buildConditionSummary = (question, allQuestions) => {
  const conditionGroups = normalizeConditionGroups(question);
  const summaries = [];

  for (let groupIndex = 0; groupIndex < conditionGroups.length; groupIndex += 1) {
    const group = conditionGroups[groupIndex];
    const conditions = Array.isArray(group && group.conditions) ? group.conditions : [];

    if (conditions.length === 0) {
      continue;
    }

    const parts = [];
    for (let conditionIndex = 0; conditionIndex < conditions.length; conditionIndex += 1) {
      const condition = conditions[conditionIndex];
      if (!condition) {
        continue;
      }

      const refQuestion = allQuestions.find((item) => item.id === condition.question);
      const label = refQuestion ? refQuestion.question : `Question ${condition.question}`;
      const operator = condition.operator === 'equals'
        ? '='
        : condition.operator === 'not_equals'
          ? '≠'
          : condition.operator === 'contains'
            ? 'contient'
            : (condition.operator || '=');

      const value = typeof condition.value === 'string' ? condition.value : JSON.stringify(condition.value);
      const connector = conditionIndex > 0 ? (group.logic === 'any' ? 'OU' : 'ET') : '';
      parts.push({ label, operator, value, connector });
    }

    if (parts.length > 0) {
      summaries.push({
        index: groupIndex + 1,
        logic: group.logic === 'any' ? 'OU' : 'ET',
        parts
      });
    }
  }

  return summaries;
};

const buildRuleConditionSummary = (rule, questions) => {
  const groups = normalizeConditionGroups(rule, sanitizeRuleCondition);
  const formatted = [];

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex];
    const conditions = Array.isArray(group && group.conditions) ? group.conditions : [];

    if (conditions.length === 0) {
      continue;
    }

    const items = [];
    for (let conditionIndex = 0; conditionIndex < conditions.length; conditionIndex += 1) {
      const condition = conditions[conditionIndex];
      if (!condition) {
        continue;
      }

      if (condition.type === 'timing') {
        const requirement = normalizeTimingRequirement(condition);
        const start = condition.startQuestion || 'début ?';
        const end = condition.endQuestion || 'fin ?';
        const constraintParts = [];

        if (typeof requirement.minimumWeeks === 'number') {
          constraintParts.push(`≥ ${requirement.minimumWeeks} sem.`);
        }
        if (typeof requirement.maximumWeeks === 'number') {
          constraintParts.push(`≤ ${requirement.maximumWeeks} sem.`);
        }
        if (typeof requirement.minimumDays === 'number') {
          constraintParts.push(`≥ ${requirement.minimumDays} j.`);
        }
        if (typeof requirement.maximumDays === 'number') {
          constraintParts.push(`≤ ${requirement.maximumDays} j.`);
        }

        const constraint = constraintParts.length > 0 ? constraintParts.join(' / ') : 'plage personnalisée';
        items.push({
          type: 'timing',
          description: `Fenêtre entre « ${start} » et « ${end} » (${constraint})`
        });
        continue;
      }

      const refQuestion = questions.find((item) => item.id === condition.question);
      const label = refQuestion ? `${refQuestion.id} – ${refQuestion.question}` : `Question ${condition.question}`;
      const operator = condition.operator === 'equals'
        ? '='
        : condition.operator === 'not_equals'
          ? '≠'
          : condition.operator === 'contains'
            ? 'contient'
            : (condition.operator || '=');
      const value = typeof condition.value === 'string' ? condition.value : JSON.stringify(condition.value);

      items.push({
        type: 'question',
        description: `${label} ${operator} « ${value} »`
      });
    }

    if (items.length > 0) {
      formatted.push({
        index: groupIndex + 1,
        logic: group.logic === 'any' ? 'OU' : 'ET',
        items
      });
    }
  }

  return formatted;
};

const formatGuidanceTips = (guidance) => {
  if (!guidance || !Array.isArray(guidance.tips)) {
    return [];
  }

  const tips = [];
  for (let index = 0; index < guidance.tips.length; index += 1) {
    const tip = guidance.tips[index];
    if (typeof tip === 'string' && tip.trim() !== '') {
      tips.push(tip);
    }
  }

  return tips;
};

const getTeamLabel = (teamId, teams) => {
  for (let index = 0; index < teams.length; index += 1) {
    const team = teams[index];
    if (team && team.id === teamId) {
      return `${team.name || team.id}`;
    }
  }
  return teamId;
};

export const BackOffice = ({ questions, setQuestions, rules, setRules, teams, setTeams }) => {
  const [activeTab, setActiveTab] = useState('questions');
  const [editingRule, setEditingRule] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState('');

  useEffect(() => {
    if (!reorderAnnouncement || typeof window === 'undefined') {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setReorderAnnouncement('');
    }, 2000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [reorderAnnouncement]);

  const moveQuestion = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) {
      return;
    }

    setQuestions(prevQuestions => {
      if (
        fromIndex < 0 ||
        fromIndex >= prevQuestions.length ||
        toIndex < 0 ||
        toIndex >= prevQuestions.length
      ) {
        return prevQuestions;
      }

      const updated = [...prevQuestions];
      const [movedQuestion] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedQuestion);

      if (movedQuestion) {
        const label = movedQuestion.question || movedQuestion.id || 'Question';
        setReorderAnnouncement(`La question « ${label} » est maintenant en position ${toIndex + 1} sur ${updated.length}.`);
      }

      return updated;
    });
  };

  const handleDragStart = (event, index) => {
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
    setDraggedQuestionIndex(index);
    setDragOverIndex(index);
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (event, index) => {
    event.preventDefault();

    let fromIndex = draggedQuestionIndex;
    if (fromIndex === null) {
      const transferIndex = Number.parseInt(event?.dataTransfer?.getData('text/plain'), 10);
      if (Number.isFinite(transferIndex)) {
        fromIndex = transferIndex;
      }
    }

    if (fromIndex !== null) {
      moveQuestion(fromIndex, index);
    }

    setDraggedQuestionIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedQuestionIndex(null);
    setDragOverIndex(null);
  };

  const handleKeyboardReorder = (event, index) => {
    if (questions.length <= 1) {
      return;
    }

    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault();
      moveQuestion(index, index - 1);
    } else if (event.key === 'ArrowDown' && index < questions.length - 1) {
      event.preventDefault();
      moveQuestion(index, index + 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveQuestion(index, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveQuestion(index, questions.length - 1);
    }
  };

  const getNextId = (items, prefix) => {
    const ids = new Set(items.map((item) => item.id));
    const maxNumericSuffix = items
      .map((item) => item.id)
      .filter((id) => typeof id === 'string' && id.startsWith(prefix))
      .map((id) => Number.parseInt(id.slice(prefix.length), 10))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0);

    let counter = maxNumericSuffix + 1;
    let candidate = `${prefix}${counter}`;
    while (ids.has(candidate)) {
      counter += 1;
      candidate = `${prefix}${counter}`;
    }
    return candidate;
  };

  const downloadDataModule = (filename, exportName, data) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const serialized = JSON.stringify(data, null, 2);
    const moduleContent = `export const ${exportName} = ${serialized};\n`;
    const blob = new Blob([moduleContent], { type: 'application/javascript;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadDataFiles = () => {
    downloadDataModule('questions.js', 'initialQuestions', questions);
    downloadDataModule('rules.js', 'initialRules', rules);
    downloadDataModule('teams.js', 'initialTeams', teams);
  };

  const tabDefinitions = [
    {
      id: 'questions',
      label: `Questions (${questions.length})`,
      panelId: 'backoffice-tabpanel-questions'
    },
    {
      id: 'rules',
      label: `Règles (${rules.length})`,
      panelId: 'backoffice-tabpanel-rules'
    },
    {
      id: 'teams',
      label: `Équipes (${teams.length})`,
      panelId: 'backoffice-tabpanel-teams'
    }
  ];

  const createDefaultQuestion = (existingQuestions) => ({
    id: getNextId(existingQuestions, 'q'),
    type: 'choice',
    question: 'Nouvelle question',
    options: ['Option 1', 'Option 2'],
    required: true,
    conditions: [],
    conditionLogic: 'all',
    conditionGroups: [],
    guidance: {
      objective: '',
      details: '',
      tips: []
    }
  });

  const addQuestion = () => {
    const newQuestion = createDefaultQuestion(questions);

    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
  };

  const addQuestionAtIndex = (targetIndex) => {
    const newQuestion = createDefaultQuestion(questions);
    const next = questions.slice();
    next.splice(targetIndex, 0, newQuestion);

    setQuestions(next);
    setEditingQuestion(newQuestion);
    setReorderAnnouncement(`Nouvelle question ajoutée en position ${targetIndex + 1} sur ${next.length}.`);
  };

  const deleteQuestion = (id) => {
    const target = questions.find((question) => question.id === id);
    if (target && target.showcase) {
      return;
    }

    setQuestions(questions.filter((question) => question.id !== id));
  };

  const saveQuestion = (updatedQuestion) => {
    const index = questions.findIndex((question) => question.id === updatedQuestion.id);

    if (index >= 0) {
      const next = questions.slice();
      next[index] = updatedQuestion;
      setQuestions(next);
    } else {
      setQuestions([...questions, updatedQuestion]);
    }
    setEditingQuestion(null);
  };

  const addRule = () => {
    const newRule = {
      id: getNextId(rules, 'rule'),
      name: 'Nouvelle règle',
      conditions: [],
      conditionGroups: [],
      conditionLogic: 'all',
      teams: [],
      questions: {},
      risks: [],
      priority: 'Important'
    };

    setRules([...rules, newRule]);
    setEditingRule(newRule);
  };

  const deleteRule = (id) => {
    setRules(rules.filter((rule) => rule.id !== id));
    if (editingRule && editingRule.id === id) {
      setEditingRule(null);
    }
  };

  const saveRule = (updatedRule) => {
    const index = rules.findIndex((rule) => rule.id === updatedRule.id);

    if (index >= 0) {
      const next = rules.slice();
      next[index] = updatedRule;
      setRules(next);
    } else {
      setRules([...rules, updatedRule]);
    }
    setEditingRule(null);
  };

  const addTeam = () => {
    const newTeam = {
      id: getNextId(teams, 'team'),
      name: 'Nouvelle équipe',
      contact: 'email@company.com',
      expertise: "Domaine d'expertise"
    };

    setTeams([...teams, newTeam]);
  };

  const updateTeamField = (index, field, value) => {
    const next = teams.slice();
    if (!next[index]) {
      return;
    }
    next[index] = { ...next[index], [field]: value };
    setTeams(next);
  };

  const deleteTeam = (id) => {
    setTeams(teams.filter((team) => team.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8 hv-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 hv-surface" role="region" aria-label="Back-office compliance">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-xl">
                <Settings className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Back-Office Compliance</h1>
                <p className="text-sm text-gray-500">Configurez vos référentiels et automatisations</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full lg:w-auto">
              <button
                type="button"
                onClick={handleDownloadDataFiles}
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg shadow-sm hover:bg-indigo-50 hv-button hv-focus-ring text-sm sm:text-base"
              >
                <Download className="w-5 h-5 mr-2" />
                Télécharger les fichiers (questions, règles, équipes)
              </button>
            </div>
          </header>

          <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 mb-6" role="tablist" aria-label="Navigation back-office">
            {tabDefinitions.map((tab) => (
              <button
                key={tab.id}
                type="button"
                id={`backoffice-tab-${tab.id}`}
                role="tab"
                aria-controls={tab.panelId}
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-md text-sm font-medium hv-focus-ring ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'questions' && (
            <section id="backoffice-tabpanel-questions" role="tabpanel" aria-labelledby="backoffice-tab-questions" className="space-y-4">
              <div className="sr-only" aria-live="polite">{reorderAnnouncement}</div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Gestion des questions</h2>
                  <p className="text-sm text-gray-600">Définissez les questions et leur logique d'affichage conditionnel.</p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter une question
                </button>
              </div>

              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
                <p className="font-medium">Questions vitrine projet</p>
                <p className="mt-1 text-indigo-800">
                  Les questions marquées «&nbsp;Vitrine projet&nbsp;» alimentent automatiquement la vitrine marketing.
                  Elles sont obligatoires pour compléter le showcase et ne peuvent pas être supprimées.
                </p>
              </div>

              {questions.length === 0 && (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                  Aucune question configurée pour le moment.
                </div>
              )}

              {questions.map((question, index) => {
                const typeMeta = getQuestionTypeMeta(question.type);
                const conditionSummary = buildConditionSummary(question, questions);
                const guidance = question.guidance || {};
                const tips = formatGuidanceTips(guidance);
                const isShowcaseQuestion = Boolean(question && question.showcase);
                const deleteButtonClasses = isShowcaseQuestion
                  ? 'p-2 text-gray-300 bg-gray-100 cursor-not-allowed rounded hv-button'
                  : 'p-2 text-red-600 hover:bg-red-50 rounded hv-button';
                const deleteButtonTitle = isShowcaseQuestion
                  ? 'Cette question alimente la vitrine showcase et ne peut pas être supprimée.'
                  : `Supprimer la question ${question.id}`;

                return (
                  <React.Fragment key={question.id}>
                    <article
                      className={`border border-gray-200 rounded-xl p-6 bg-white shadow-sm hv-surface transition-shadow ${
                      dragOverIndex === index ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
                    } ${
                      draggedQuestionIndex === index ? 'opacity-75' : ''
                    }`}
                    aria-label={`Question ${question.id}`}
                    onDragOver={(event) => handleDragOver(event, index)}
                    onDrop={(event) => handleDrop(event, index)}
                  >
                    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {question.id}
                          </span>
                          <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {typeMeta.label}
                          </span>
                          {isShowcaseQuestion && (
                            <span className="text-xs text-indigo-800 bg-indigo-100 px-2 py-1 rounded-full font-medium">
                              Vitrine projet
                            </span>
                          )}
                          {question.required && (
                            <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">Obligatoire</span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">{question.question}</h3>
                        <p id={`question-${question.id}-position`} className="text-xs text-gray-500">Position {index + 1} sur {questions.length}</p>
                        <p className="text-sm text-gray-500">{typeMeta.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="p-2 text-gray-500 hover:text-indigo-600 rounded hv-button cursor-move"
                          aria-label={`Réorganiser la question ${question.id}. Position ${index + 1} sur ${questions.length}. Utilisez les flèches haut et bas.`}
                          aria-describedby={`question-${question.id}-position`}
                          draggable
                          onDragStart={(event) => handleDragStart(event, index)}
                          onDragOver={(event) => handleDragOver(event, index)}
                          onDrop={(event) => handleDrop(event, index)}
                          onDragEnd={handleDragEnd}
                          onKeyDown={(event) => handleKeyboardReorder(event, index)}
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingQuestion(question)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded hv-button"
                          aria-label={`Modifier la question ${question.id}`}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isShowcaseQuestion) {
                              return;
                            }

                            const confirmationMessage = `Voulez-vous vraiment supprimer la question ${question.id} ?`;
                            const shouldDelete = typeof window === 'undefined'
                              ? true
                              : window.confirm(confirmationMessage);

                            if (shouldDelete) {
                              deleteQuestion(question.id);
                            }
                          }}
                          className={deleteButtonClasses}
                          aria-label={deleteButtonTitle}
                          aria-disabled={isShowcaseQuestion}
                          disabled={isShowcaseQuestion}
                          title={deleteButtonTitle}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </header>

                    {(Array.isArray(question.options) && question.options.length > 0) && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                          <Info className="w-4 h-4 mr-2" /> Options proposées
                        </h4>
                        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                          {question.options.map((option, index) => (
                            <li key={`${question.id}-option-${index}`} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {conditionSummary.length > 0 ? (
                      <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-gray-700">
                        <h4 className="text-sm font-semibold text-indigo-700 mb-3">Conditions d'affichage</h4>
                        <ol className="space-y-3">
                          {conditionSummary.map((group) => (
                            <li key={`${question.id}-condition-group-${group.index}`} className="space-y-2">
                              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                                Groupe {group.index} – logique {group.logic === 'OU' ? 'OU (au moins une)' : 'ET (toutes)'}
                              </div>
                              <ul className="space-y-1">
                                {group.parts.map((part, idx) => (
                                  <li key={`${question.id}-part-${group.index}-${idx}`} className="flex items-baseline space-x-2">
                                    {part.connector && <span className="text-xs text-indigo-500">{part.connector}</span>}
                                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-100">{part.label}</span>
                                    <span>{part.operator}</span>
                                    <span className="font-semibold text-indigo-700">« {part.value} »</span>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <p className="mt-6 text-xs text-gray-500 italic">Cette question est toujours affichée.</p>
                    )}

                    {(guidance.objective || guidance.details || tips.length > 0) && (
                      <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700 space-y-2">
                        {guidance.objective && (
                          <p>
                            <strong className="text-gray-800">Objectif :</strong>{' '}
                            {renderTextWithLinks(guidance.objective)}
                          </p>
                        )}
                        {guidance.details && (
                          <p>{renderTextWithLinks(guidance.details)}</p>
                        )}
                        {tips.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Conseils pratiques</p>
                            <ul className="list-disc list-inside space-y-1">
                              {tips.map((tip, index) => (
                                <li key={`${question.id}-tip-${index}`}>{renderTextWithLinks(tip)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                    {index < questions.length - 1 && (
                      <div className="flex justify-center my-3">
                        <button
                          type="button"
                          onClick={() => addQuestionAtIndex(index + 1)}
                          className="w-10 h-10 rounded-full border-2 border-dashed border-indigo-300 text-indigo-600 bg-white flex items-center justify-center shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 hv-button"
                          aria-label={`Insérer une nouvelle question après la question ${question.id}`}
                        >
                          <Plus className="w-5 h-5" />
                          <span className="sr-only">Ajouter une question à cet emplacement</span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </section>
          )}

          {activeTab === 'rules' && (
            <section id="backoffice-tabpanel-rules" role="tabpanel" aria-labelledby="backoffice-tab-rules" className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Gestion des règles</h2>
                  <p className="text-sm text-gray-600">Identifiez les combinaisons à risque et les équipes concernées.</p>
                </div>
                <button
                  type="button"
                  onClick={addRule}
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter une règle
                </button>
              </div>

              {rules.length === 0 && (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                  Aucune règle métier n'est configurée.
                </div>
              )}

              {rules.map((rule) => {
                const conditionSummary = buildRuleConditionSummary(rule, questions);
                const teamLabels = Array.isArray(rule.teams) ? rule.teams.map((teamId) => getTeamLabel(teamId, teams)) : [];
                const risks = Array.isArray(rule.risks) ? rule.risks : [];

                return (
                  <article key={rule.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hv-surface">
                    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">{rule.id}</span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Priorité : {rule.priority || 'N/A'}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">{rule.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingRule(rule)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded hv-button"
                          aria-label={`Afficher la règle ${rule.name}`}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRule(rule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded hv-button"
                          aria-label={`Supprimer la règle ${rule.name}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </header>

                    {conditionSummary.length > 0 ? (
                      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700 space-y-3">
                        <h4 className="text-sm font-semibold text-blue-700">Conditions de déclenchement</h4>
                        <ol className="space-y-3">
                          {conditionSummary.map((group) => (
                            <li key={`${rule.id}-group-${group.index}`} className="space-y-2">
                              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                Groupe {group.index} – logique {group.logic === 'OU' ? 'OU' : 'ET'}
                              </div>
                              <ul className="space-y-1">
                                {group.items.map((item, idx) => (
                                  <li key={`${rule.id}-item-${group.index}-${idx}`} className="flex items-start space-x-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{item.description}</span>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-gray-500 italic">Cette règle est toujours active (aucune condition configurée).</p>
                    )}

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-800">Équipes impliquées</h4>
                        {teamLabels.length > 0 ? (
                          <ul className="flex flex-wrap gap-2">
                            {teamLabels.map((label) => (
                              <li key={`${rule.id}-team-${label}`} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                                {label}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aucune équipe associée.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-800">Risques identifiés</h4>
                        {risks.length > 0 ? (
                          <ul className="space-y-1">
                            {risks.map((risk, index) => (
                              <li key={`${rule.id}-risk-${index}`} className="flex items-start space-x-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{risk && risk.description ? risk.description : 'Risque non renseigné'}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aucun risque documenté.</p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {activeTab === 'teams' && (
            <section id="backoffice-tabpanel-teams" role="tabpanel" aria-labelledby="backoffice-tab-teams" className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Gestion des équipes</h2>
                  <p className="text-sm text-gray-600">Définissez les équipes contactées selon les scénarios identifiés.</p>
                </div>
                <button
                  type="button"
                  onClick={addTeam}
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter une équipe
                </button>
              </div>

              {teams.length === 0 && (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                  Aucune équipe renseignée.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team, index) => (
                  <article key={team.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hv-surface" aria-label={`Équipe ${team.name}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                      <input
                        type="text"
                        value={team.name}
                        onChange={(event) => updateTeamField(index, 'name', event.target.value)}
                        className="text-lg font-semibold text-gray-800 border-b border-transparent focus:border-indigo-600 focus:outline-none flex-1 hv-focus-ring"
                        aria-label={`Nom de l'équipe ${team.id}`}
                      />
                      <div className="flex justify-end sm:justify-start">
                        <button
                          type="button"
                          onClick={() => deleteTeam(team.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded hv-button"
                          aria-label={`Supprimer l'équipe ${team.name}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" htmlFor={`${team.id}-contact`}>
                      Contact principal
                    </label>
                    <input
                      id={`${team.id}-contact`}
                      type="text"
                      value={team.contact}
                      onChange={(event) => updateTeamField(index, 'contact', event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 hv-focus-ring"
                    />

                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1" htmlFor={`${team.id}-expertise`}>
                      Domaine d'expertise
                    </label>
                    <textarea
                      id={`${team.id}-expertise`}
                      value={team.expertise}
                      onChange={(event) => updateTeamField(index, 'expertise', event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y hv-focus-ring"
                      rows={3}
                    />
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        {editingQuestion && (
          <QuestionEditor
            question={editingQuestion}
            onSave={saveQuestion}
            onCancel={() => setEditingQuestion(null)}
            allQuestions={questions}
          />
        )}

        {editingRule && (
          <RuleEditor
            rule={editingRule}
            onSave={saveRule}
            onCancel={() => setEditingRule(null)}
            questions={questions}
            teams={teams}
          />
        )}
      </div>
    </div>
  );
};
