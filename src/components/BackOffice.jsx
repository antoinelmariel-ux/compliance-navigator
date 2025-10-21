import React, { useCallback, useEffect, useMemo, useRef, useState } from '../react.js';
import { normalizeRiskWeighting } from '../utils/risk.js';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Info,
  GripVertical,
  Download,
  ArrowUp,
  ArrowDown,
  Copy,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronLeft
} from './icons.js';
import { QuestionEditor } from './QuestionEditor.jsx';
import { RuleEditor } from './RuleEditor.jsx';
import { renderTextWithLinks } from '../utils/linkify.js';
import { normalizeConditionGroups } from '../utils/conditionGroups.js';
import {
  normalizeTimingRequirement,
  sanitizeRiskTimingConstraint,
  sanitizeTeamQuestionEntry
} from '../utils/rules.js';
import { sanitizeRuleCondition } from '../utils/ruleConditions.js';
import {
  normalizeProjectFilterConfig,
  resetProjectFiltersConfig,
  updateProjectFilterField
} from '../utils/projectFilters.js';

const QUESTION_TYPE_META = {
  choice: {
    label: 'Liste de choix',
    description: "Affiche une liste d'options exclusives."
  },
  multi_choice: {
    label: 'Choix multiples',
    description: 'Permet de sélectionner plusieurs réponses.'
  },
  milestone_list: {
    label: 'Liste de jalons',
    description: 'Collecte des jalons avec une date et une description.'
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

const formatOperatorSymbol = (operator) => {
  switch (operator) {
    case 'equals':
      return '=';
    case 'not_equals':
      return '≠';
    case 'contains':
      return 'contient';
    case 'lt':
      return '<';
    case 'lte':
      return '≤';
    case 'gt':
      return '>';
    case 'gte':
      return '≥';
    default:
      return operator || '=';
  }
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
      const operator = formatOperatorSymbol(condition.operator);

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
      const operator = formatOperatorSymbol(condition.operator);
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

const collectRuleTeamIds = (rule) => {
  const teamIds = new Set();

  if (!rule || typeof rule !== 'object') {
    return teamIds;
  }

  const baseTeams = Array.isArray(rule?.teams) ? rule.teams : [];
  baseTeams.forEach((teamId) => {
    if (typeof teamId === 'string' && teamId.trim() !== '') {
      teamIds.add(teamId);
    }
  });

  if (rule?.questions && typeof rule.questions === 'object') {
    Object.keys(rule.questions).forEach((teamId) => {
      if (typeof teamId === 'string' && teamId.trim() !== '') {
        teamIds.add(teamId);
      }
    });
  }

  const risks = Array.isArray(rule?.risks) ? rule.risks : [];
  risks.forEach((risk) => {
    if (risk && typeof risk.teamId === 'string' && risk.teamId.trim() !== '') {
      teamIds.add(risk.teamId);
    }
  });

  return teamIds;
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

const PRIORITY_WEIGHTS = {
  'A particulièrement anticiper': 3,
  'A anticiper': 2,
  'A réaliser': 1
};

const RISK_WEIGHT_FIELDS = [
  {
    key: 'low',
    label: 'Risque faible',
    description: 'Poids appliqué aux risques de criticité faible.'
  },
  {
    key: 'medium',
    label: 'Risque moyen',
    description: 'Poids appliqué aux risques de criticité moyenne.'
  },
  {
    key: 'high',
    label: 'Risque élevé',
    description: 'Poids appliqué aux risques de criticité élevée.'
  }
];

const parseScoreValue = (value, fallback, { allowNull = false } = {}) => {
  if (allowNull && (value === null || value === undefined || value === '')) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed < 0 ? 0 : parsed;
};

const getRuleMinScoreValue = (rule) => parseScoreValue(
  rule?.minScore !== undefined ? rule.minScore : rule?.minRisks,
  0
);

const getRuleMaxScoreValue = (rule) => parseScoreValue(
  rule?.maxScore !== undefined ? rule.maxScore : rule?.maxRisks,
  null,
  { allowNull: true }
);

const formatScoreValue = (value) => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

const getPointUnit = (value) => (Math.abs(value - 1) < 1e-9 ? 'point' : 'points');

const getHighestRiskPriority = (risks = []) => {
  if (!Array.isArray(risks) || risks.length === 0) {
    return null;
  }

  let bestPriority = null;

  risks.forEach((risk) => {
    const priority = risk?.priority;
    if (!priority) {
      return;
    }

    const currentWeight = PRIORITY_WEIGHTS[priority] || 0;
    const bestWeight = PRIORITY_WEIGHTS[bestPriority] || 0;

    if (!bestPriority || currentWeight > bestWeight) {
      bestPriority = priority;
    }
  });

  return bestPriority;
};

const getPriorityBadgeClasses = (priority) => {
  switch (priority) {
    case 'A particulièrement anticiper':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'A anticiper':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'A réaliser':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};

const PROJECT_FILTER_TYPE_LABELS = {
  text: 'Champ texte',
  select: 'Liste déroulante',
  sort: 'Tri par date'
};

const FILTER_COMPATIBLE_QUESTION_TYPES = new Set([
  'choice',
  'multi_choice',
  'text',
  'long_text',
  'number',
  'url',
  'date'
]);

const PROJECT_FILTER_FIELD_DESCRIPTIONS = {
  projectName:
    'Permet de rechercher un projet par le titre saisi lors de la qualification.',
  teamLead:
    'Filtre les projets en fonction du nom du lead renseigné dans le questionnaire.',
  teamLeadTeam:
    'Affiche une liste des équipes possibles pour retrouver rapidement les initiatives associées.',
  dateOrder:
    "Définit l'ordre d'affichage par défaut des projets (du plus récent au plus ancien ou inversement)."
};

export const BackOffice = ({
  questions,
  setQuestions,
  rules,
  setRules,
  riskLevelRules,
  setRiskLevelRules,
  riskWeights,
  setRiskWeights,
  teams,
  setTeams,
  projectFilters,
  setProjectFilters
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingRule, setEditingRule] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState('');
  const [questionTitleFilter, setQuestionTitleFilter] = useState('');
  const [questionTeamFilter, setQuestionTeamFilter] = useState('all');
  const [ruleTitleFilter, setRuleTitleFilter] = useState('');
  const [ruleTeamFilter, setRuleTeamFilter] = useState('all');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState(() => new Set());
  const [expandedRuleIds, setExpandedRuleIds] = useState(() => new Set());
  const [selectedFilterQuestionId, setSelectedFilterQuestionId] = useState('');
  const undoStackRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');
  const safeRiskLevelRules = Array.isArray(riskLevelRules) ? riskLevelRules : [];
  const riskLevelRuleCount = safeRiskLevelRules.length;
  const normalizedRiskWeights = useMemo(
    () => normalizeRiskWeighting(riskWeights),
    [riskWeights]
  );

  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (!stack || stack.length === 0) {
      setUndoMessage('');
      setCanUndo(false);
      return;
    }

    const entry = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);
    setCanUndo(undoStackRef.current.length > 0);

    if (!entry) {
      setUndoMessage('');
      return;
    }

    switch (entry.type) {
      case 'question': {
        if (typeof setQuestions === 'function') {
          setQuestions((prevQuestions) => {
            const next = Array.isArray(prevQuestions) ? prevQuestions.slice() : [];
            const insertIndex = Math.max(0, Math.min(entry.index ?? next.length, next.length));
            next.splice(insertIndex, 0, entry.item);
            return next;
          });
        }
        setUndoMessage(`La question « ${entry.item?.question || entry.item?.id || 'question'} » a été restaurée.`);
        setReorderAnnouncement('Suppression de question annulée.');
        break;
      }
      case 'rule': {
        if (typeof setRules === 'function') {
          setRules((prevRules) => {
            const next = Array.isArray(prevRules) ? prevRules.slice() : [];
            const insertIndex = Math.max(0, Math.min(entry.index ?? next.length, next.length));
            next.splice(insertIndex, 0, entry.item);
            return next;
          });
        }
        setUndoMessage(`La règle « ${entry.item?.name || entry.item?.id || 'règle'} » a été restaurée.`);
        setReorderAnnouncement('Suppression de règle annulée.');
        break;
      }
      case 'riskLevelRule': {
        if (typeof setRiskLevelRules === 'function') {
          setRiskLevelRules((prevRules) => {
            const base = Array.isArray(prevRules) ? prevRules.slice() : [];
            const insertIndex = Math.max(0, Math.min(entry.index ?? base.length, base.length));
            base.splice(insertIndex, 0, entry.item);
            return base;
          });
        }
        setUndoMessage(`Le niveau « ${entry.item?.label || entry.item?.id || 'niveau'} » a été restauré.`);
        setReorderAnnouncement('Suppression de niveau de complexité annulée.');
        break;
      }
      case 'team': {
        if (typeof setTeams === 'function') {
          setTeams((prevTeams) => {
            const next = Array.isArray(prevTeams) ? prevTeams.slice() : [];
            const insertIndex = Math.max(0, Math.min(entry.index ?? next.length, next.length));
            next.splice(insertIndex, 0, entry.item);
            return next;
          });
        }
        setUndoMessage(`L'équipe « ${entry.item?.name || entry.item?.id || 'équipe'} » a été restaurée.`);
        setReorderAnnouncement('Suppression d’équipe annulée.');
        break;
      }
      case 'projectFilter': {
        if (typeof setProjectFilters === 'function') {
          setProjectFilters((prevFilters) => {
            const normalized = normalizeProjectFilterConfig(prevFilters);
            const fields = Array.isArray(normalized.fields) ? normalized.fields.slice() : [];
            const insertIndex = Math.max(0, Math.min(entry.index ?? fields.length, fields.length));
            fields.splice(insertIndex, 0, entry.item);
            return {
              ...normalized,
              fields
            };
          });
        }
        setUndoMessage(`Le filtre « ${entry.item?.label || entry.item?.id || 'filtre'} » a été restauré.`);
        setReorderAnnouncement('Suppression de filtre annulée.');
        break;
      }
      default:
        setUndoMessage('Dernière action annulée.');
        break;
    }
  }, [setQuestions, setRules, setRiskLevelRules, setTeams, setProjectFilters, setReorderAnnouncement]);

  const confirmDeletion = useCallback((message) => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.confirm(message);
  }, []);

  const pushUndoEntry = useCallback((entry) => {
    undoStackRef.current = [...undoStackRef.current.slice(-19), entry];
    setCanUndo(true);
    if (entry && entry.message) {
      setUndoMessage(entry.message);
    } else {
      setUndoMessage('Dernière suppression enregistrée. Vous pouvez utiliser Ctrl+Z pour annuler.');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const keydownHandler = (event) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }

        if (!undoStackRef.current.length) {
          return;
        }

        event.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', keydownHandler);

    return () => {
      window.removeEventListener('keydown', keydownHandler);
    };
  }, [handleUndo]);

  const questionTeamAssignments = useMemo(() => {
    const setMap = new Map();
    const safeRules = Array.isArray(rules) ? rules : [];

    const addTeamsForQuestion = (questionId, teamIds) => {
      if (!questionId) {
        return;
      }

      const normalizedQuestionId = typeof questionId === 'string' ? questionId : String(questionId);
      const candidates = Array.isArray(teamIds) ? teamIds : [];
      const validTeamIds = candidates.filter((teamId) => typeof teamId === 'string' && teamId.trim() !== '');

      if (validTeamIds.length === 0) {
        return;
      }

      const existing = setMap.get(normalizedQuestionId);
      if (existing) {
        validTeamIds.forEach((teamId) => existing.add(teamId));
        return;
      }

      setMap.set(normalizedQuestionId, new Set(validTeamIds));
    };

    safeRules.forEach((rule) => {
      const aggregatedTeamIds = collectRuleTeamIds(rule);
      const teamsForRule = Array.from(aggregatedTeamIds);

      if (teamsForRule.length === 0) {
        return;
      }

      const baseConditions = Array.isArray(rule?.conditions) ? rule.conditions : [];
      baseConditions.forEach((condition) => {
        if (!condition) {
          return;
        }

        if (condition.type === 'question' && condition.question) {
          addTeamsForQuestion(condition.question, teamsForRule);
          return;
        }

        if (condition.type === 'timing') {
          if (condition.startQuestion) {
            addTeamsForQuestion(condition.startQuestion, teamsForRule);
          }
          if (condition.endQuestion) {
            addTeamsForQuestion(condition.endQuestion, teamsForRule);
          }
        }
      });

      const groups = normalizeConditionGroups(rule, sanitizeRuleCondition);
      groups.forEach((group) => {
        const groupConditions = Array.isArray(group?.conditions) ? group.conditions : [];
        groupConditions.forEach((condition) => {
          if (!condition) {
            return;
          }

          if (condition.type === 'question' && condition.question) {
            addTeamsForQuestion(condition.question, teamsForRule);
            return;
          }

          if (condition.type === 'timing') {
            if (condition.startQuestion) {
              addTeamsForQuestion(condition.startQuestion, teamsForRule);
            }
            if (condition.endQuestion) {
              addTeamsForQuestion(condition.endQuestion, teamsForRule);
            }
          }
        });
      });

      const risks = Array.isArray(rule?.risks) ? rule.risks : [];
      risks.forEach((risk) => {
        const timingConstraint = sanitizeRiskTimingConstraint(risk?.timingConstraint);

        if (!timingConstraint.enabled) {
          return;
        }

        const relatedTeams = new Set(teamsForRule);
        if (risk && typeof risk.teamId === 'string' && risk.teamId.trim() !== '') {
          relatedTeams.add(risk.teamId);
        }

        if (timingConstraint.startQuestion) {
          addTeamsForQuestion(timingConstraint.startQuestion, Array.from(relatedTeams));
        }
        if (timingConstraint.endQuestion) {
          addTeamsForQuestion(timingConstraint.endQuestion, Array.from(relatedTeams));
        }
      });

      if (rule?.questions && typeof rule.questions === 'object') {
        Object.entries(rule.questions).forEach(([teamId, entries]) => {
          if (typeof teamId !== 'string' || teamId.trim() === '') {
            return;
          }

          const sanitizedEntries = Array.isArray(entries) ? entries : [];
          sanitizedEntries.forEach((entry) => {
            const sanitizedEntry = sanitizeTeamQuestionEntry(entry);
            const timingConstraint = sanitizeRiskTimingConstraint(sanitizedEntry?.timingConstraint);

            if (!timingConstraint.enabled) {
              return;
            }

            if (timingConstraint.startQuestion) {
              addTeamsForQuestion(timingConstraint.startQuestion, [teamId]);
            }
            if (timingConstraint.endQuestion) {
              addTeamsForQuestion(timingConstraint.endQuestion, [teamId]);
            }
          });
        });
      }
    });

    return new Map(
      Array.from(setMap.entries()).map(([questionId, teamSet]) => [
        questionId,
        Array.from(teamSet)
      ])
    );
  }, [rules]);

  const availableTeamFilterOptions = useMemo(() => {
    const options = [];
    const seen = new Set();
    const safeTeams = Array.isArray(teams) ? teams : [];

    safeTeams.forEach((team) => {
      if (!team || typeof team.id !== 'string' || team.id.trim() === '' || seen.has(team.id)) {
        return;
      }

      options.push({ value: team.id, label: getTeamLabel(team.id, safeTeams) });
      seen.add(team.id);
    });

    const safeRules = Array.isArray(rules) ? rules : [];
    safeRules.forEach((rule) => {
      collectRuleTeamIds(rule).forEach((teamId) => {
        if (!teamId || seen.has(teamId)) {
          return;
        }

        options.push({ value: teamId, label: getTeamLabel(teamId, safeTeams) });
        seen.add(teamId);
      });
    });

    return options;
  }, [teams, rules]);

  const visibleQuestionIds = useMemo(() => {
    const ids = [];
    const normalizedTitle = questionTitleFilter.trim().toLowerCase();
    const safeQuestions = Array.isArray(questions) ? questions : [];

    safeQuestions.forEach((question) => {
      if (!question) {
        return;
      }

      const questionId = typeof question.id === 'string' ? question.id : String(question.id || '');
      if (!questionId) {
        return;
      }

      const label = typeof question.question === 'string' ? question.question : '';
      const titleMatches =
        normalizedTitle === '' ||
        label.toLowerCase().includes(normalizedTitle) ||
        questionId.toLowerCase().includes(normalizedTitle);

      if (!titleMatches) {
        return;
      }

      const teamsForQuestion = questionTeamAssignments.get(questionId) || [];
      let teamMatches = true;

      if (questionTeamFilter === 'none') {
        teamMatches = teamsForQuestion.length === 0;
      } else if (questionTeamFilter !== 'all') {
        teamMatches = teamsForQuestion.includes(questionTeamFilter);
      }

      if (teamMatches) {
        ids.push(questionId);
      }
    });

    return ids;
  }, [questions, questionTitleFilter, questionTeamFilter, questionTeamAssignments]);

  const visibleQuestionIdSet = useMemo(() => new Set(visibleQuestionIds), [visibleQuestionIds]);

  const visibleRuleIds = useMemo(() => {
    const ids = [];
    const normalizedTitle = ruleTitleFilter.trim().toLowerCase();
    const safeRules = Array.isArray(rules) ? rules : [];

    safeRules.forEach((rule) => {
      if (!rule) {
        return;
      }

      const ruleId = typeof rule.id === 'string' ? rule.id : String(rule.id || '');
      if (!ruleId) {
        return;
      }

      const name = typeof rule.name === 'string' ? rule.name : '';
      const titleMatches =
        normalizedTitle === '' ||
        name.toLowerCase().includes(normalizedTitle) ||
        ruleId.toLowerCase().includes(normalizedTitle);

      if (!titleMatches) {
        return;
      }

      const associatedTeamIds = Array.from(collectRuleTeamIds(rule));
      let teamMatches = true;

      if (ruleTeamFilter === 'none') {
        teamMatches = associatedTeamIds.length === 0;
      } else if (ruleTeamFilter !== 'all') {
        teamMatches = associatedTeamIds.includes(ruleTeamFilter);
      }

      if (teamMatches) {
        ids.push(ruleId);
      }
    });

    return ids;
  }, [rules, ruleTitleFilter, ruleTeamFilter]);

  const visibleRuleIdSet = useMemo(() => new Set(visibleRuleIds), [visibleRuleIds]);

  useEffect(() => {
    if (questionTeamFilter === 'all' || questionTeamFilter === 'none') {
      return;
    }

    const availableValues = new Set(availableTeamFilterOptions.map((option) => option.value));
    if (!availableValues.has(questionTeamFilter)) {
      setQuestionTeamFilter('all');
    }
  }, [questionTeamFilter, availableTeamFilterOptions]);

  useEffect(() => {
    if (ruleTeamFilter === 'all' || ruleTeamFilter === 'none') {
      return;
    }

    const availableValues = new Set(availableTeamFilterOptions.map((option) => option.value));
    if (!availableValues.has(ruleTeamFilter)) {
      setRuleTeamFilter('all');
    }
  }, [ruleTeamFilter, availableTeamFilterOptions]);

  const normalizedProjectFilters = useMemo(
    () => normalizeProjectFilterConfig(projectFilters),
    [projectFilters]
  );

  const defaultProjectFiltersConfig = useMemo(
    () => normalizeProjectFilterConfig(resetProjectFiltersConfig()),
    []
  );

  const projectFiltersAreDefault = useMemo(
    () => JSON.stringify(normalizedProjectFilters) === JSON.stringify(defaultProjectFiltersConfig),
    [normalizedProjectFilters, defaultProjectFiltersConfig]
  );

  const filterFields = Array.isArray(normalizedProjectFilters.fields)
    ? normalizedProjectFilters.fields
    : [];

  const availableFilterQuestionOptions = useMemo(() => {
    const usedQuestionIds = new Set();
    if (Array.isArray(normalizedProjectFilters.fields)) {
      normalizedProjectFilters.fields.forEach((field) => {
        if (!field) {
          return;
        }

        const sourceId = typeof field.sourceQuestionId === 'string' && field.sourceQuestionId.trim().length > 0
          ? field.sourceQuestionId.trim()
          : field.id;

        if (sourceId) {
          usedQuestionIds.add(sourceId);
        }
      });
    }

    const options = Array.isArray(questions)
      ? questions
          .filter((question) => question && FILTER_COMPATIBLE_QUESTION_TYPES.has(question.type))
          .map((question) => ({
            value: question.id,
            label: question.question || question.id,
            disabled: usedQuestionIds.has(question.id),
            type: question.type
          }))
      : [];

    return options.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  }, [questions, normalizedProjectFilters]);

  const selectedFilterOption = useMemo(() => {
    if (!selectedFilterQuestionId) {
      return null;
    }

    return availableFilterQuestionOptions.find((option) => option.value === selectedFilterQuestionId) || null;
  }, [availableFilterQuestionOptions, selectedFilterQuestionId]);

  const canAddProjectFilter = Boolean(selectedFilterOption && !selectedFilterOption.disabled);

  const handleProjectFilterToggle = useCallback((fieldId, enabled) => {
    if (typeof setProjectFilters !== 'function') {
      return;
    }

    setProjectFilters(prev => updateProjectFilterField(prev, fieldId, { enabled }));
  }, [setProjectFilters]);

  const handleProjectFilterLabelChange = useCallback((fieldId, label) => {
    if (typeof setProjectFilters !== 'function') {
      return;
    }

    setProjectFilters(prev => updateProjectFilterField(prev, fieldId, { label }));
  }, [setProjectFilters]);

  const handleAddProjectFilter = useCallback(() => {
    if (typeof setProjectFilters !== 'function') {
      return;
    }

    const questionId = typeof selectedFilterQuestionId === 'string'
      ? selectedFilterQuestionId.trim()
      : '';

    if (questionId.length === 0) {
      return;
    }

    const question = Array.isArray(questions)
      ? questions.find((item) => item && item.id === questionId)
      : null;

    if (!question || !FILTER_COMPATIBLE_QUESTION_TYPES.has(question.type)) {
      return;
    }

    setProjectFilters((prev) => {
      const normalized = normalizeProjectFilterConfig(prev);
      const existing = Array.isArray(normalized.fields)
        ? normalized.fields.some((field) => {
            if (!field) {
              return false;
            }

            const sourceId = typeof field.sourceQuestionId === 'string' && field.sourceQuestionId.trim().length > 0
              ? field.sourceQuestionId.trim()
              : field.id;

            return sourceId === questionId;
          })
        : false;

      if (existing) {
        return normalized;
      }

      const type = question.type === 'choice' ? 'select' : 'text';
      const newField = {
        id: question.id,
        label: question.question || question.id,
        type,
        enabled: true,
        sourceQuestionId: question.id
      };

      if (type === 'select') {
        newField.emptyOptionLabel = question.id === 'teamLeadTeam' ? 'Toutes les équipes' : 'Toutes les valeurs';
      }

      const fields = Array.isArray(normalized.fields) ? [...normalized.fields, newField] : [newField];

      return {
        ...normalized,
        fields
      };
    });

    setSelectedFilterQuestionId('');
  }, [questions, selectedFilterQuestionId, setProjectFilters]);

  const handleRemoveProjectFilter = useCallback((field) => {
    if (!field || typeof setProjectFilters !== 'function') {
      return;
    }

    if (field.id === 'dateOrder') {
      return;
    }

    const label = field.label || field.id || 'filtre';
    const confirmationMessage = `Voulez-vous vraiment supprimer le filtre « ${label} » ?`;
    const shouldDelete = confirmDeletion(confirmationMessage);

    if (!shouldDelete) {
      return;
    }

    const currentFields = Array.isArray(normalizedProjectFilters.fields)
      ? normalizedProjectFilters.fields
      : [];

    const index = currentFields.findIndex((item) => item && item.id === field.id);
    if (index === -1) {
      return;
    }

    const removedField = currentFields[index];
    pushUndoEntry({
      type: 'projectFilter',
      item: removedField,
      index,
      message: `Le filtre « ${removedField.label || removedField.id || 'filtre'} » a été supprimé. Appuyez sur Ctrl+Z pour annuler.`
    });

    setProjectFilters((prev) => {
      const normalized = normalizeProjectFilterConfig(prev);
      const fields = Array.isArray(normalized.fields)
        ? normalized.fields.filter((item) => item && item.id !== field.id)
        : [];

      return {
        ...normalized,
        fields
      };
    });
  }, [confirmDeletion, normalizedProjectFilters, pushUndoEntry, setProjectFilters]);

  const handleProjectFilterDefaultSortChange = useCallback((value) => {
    if (typeof setProjectFilters !== 'function') {
      return;
    }

    const direction = value === 'asc' ? 'asc' : 'desc';
    setProjectFilters(prev => {
      const updated = updateProjectFilterField(prev, 'dateOrder', { defaultValue: direction });
      return {
        ...updated,
        sortOrder: direction
      };
    });
  }, [setProjectFilters]);

  const handleResetProjectFilters = useCallback(() => {
    if (typeof setProjectFilters !== 'function') {
      return;
    }

    setProjectFilters(resetProjectFiltersConfig());
  }, [setProjectFilters]);

  const toggleQuestionExpansion = useCallback((questionId) => {
    if (!questionId && questionId !== 0) {
      return;
    }

    const normalizedId = typeof questionId === 'string' ? questionId : String(questionId);
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedId)) {
        next.delete(normalizedId);
      } else {
        next.add(normalizedId);
      }
      return next;
    });
  }, []);

  const toggleRuleExpansion = useCallback((ruleId) => {
    if (!ruleId && ruleId !== 0) {
      return;
    }

    const normalizedId = typeof ruleId === 'string' ? ruleId : String(ruleId);
    setExpandedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedId)) {
        next.delete(normalizedId);
      } else {
        next.add(normalizedId);
      }
      return next;
    });
  }, []);

  const handleRiskWeightChange = (key, rawValue) => {
    if (typeof setRiskWeights !== 'function') {
      return;
    }

    setRiskWeights(prevWeights => {
      const base = typeof prevWeights === 'object' && prevWeights !== null
        ? { ...prevWeights }
        : {};

      const parsed = Number.parseFloat(rawValue);

      if (Number.isNaN(parsed)) {
        return prevWeights;
      }

      const sanitized = parsed < 0 ? 0 : parsed;

      if (base[key] === sanitized) {
        return prevWeights;
      }

      base[key] = sanitized;
      return base;
    });
  };

  const dataIntegrityIssues = useMemo(() => {
    const safeQuestions = Array.isArray(questions) ? questions : [];
    const safeRules = Array.isArray(rules) ? rules : [];
    const safeTeams = Array.isArray(teams) ? teams : [];

    const questionMap = new Map();
    safeQuestions.forEach((question) => {
      if (question?.id) {
        questionMap.set(question.id, question);
      }
    });

    const questionIds = new Set(questionMap.keys());

    const questionOptionMap = new Map();
    questionMap.forEach((question, id) => {
      if (Array.isArray(question?.options) && question.options.length > 0) {
        const normalizedOptions = question.options
          .map((option) => {
            if (
              typeof option === 'string' ||
              typeof option === 'number' ||
              typeof option === 'boolean'
            ) {
              return String(option);
            }
            return null;
          })
          .filter(Boolean);

        if (normalizedOptions.length > 0) {
          questionOptionMap.set(id, new Set(normalizedOptions));
        }
      }
    });

    const teamIds = new Set(
      safeTeams
        .map((team) => (team?.id ? team.id : null))
        .filter(Boolean)
    );
    const teamNameMap = new Map();
    safeTeams.forEach(team => {
      if (team?.id) {
        teamNameMap.set(team.id, team?.name || team.id);
      }
    });

    const issues = [];
    let issueIndex = 0;

    const pushIssue = ({ scope, context, message, severity = 'warning' }) => {
      issueIndex += 1;
      issues.push({
        id: `integrity-${issueIndex}`,
        scope,
        context,
        message,
        severity
      });
    };

    const formatConditionPosition = (groupIndex, conditionIndex) => {
      return `groupe ${groupIndex + 1}, condition ${conditionIndex + 1}`;
    };

    const getQuestionLabel = (questionId) => {
      const reference = questionMap.get(questionId);
      if (!reference) {
        return questionId || 'Question inconnue';
      }
      return reference.question || reference.id || questionId;
    };

    const collectInvalidOptionValues = (value, optionsSet) => {
      if (!optionsSet || optionsSet.size === 0) {
        return [];
      }

      const invalidValues = [];
      const inspectValue = (candidate) => {
        if (candidate === null || candidate === undefined) {
          return;
        }
        if (
          typeof candidate !== 'string' &&
          typeof candidate !== 'number' &&
          typeof candidate !== 'boolean'
        ) {
          return;
        }

        const normalizedCandidate = String(candidate);
        if (!optionsSet.has(normalizedCandidate)) {
          invalidValues.push(normalizedCandidate);
        }
      };

      if (Array.isArray(value)) {
        value.forEach(inspectValue);
      } else {
        inspectValue(value);
      }

      return invalidValues;
    };

    safeQuestions.forEach((question) => {
      const groups = normalizeConditionGroups(question);
      const context = `Question « ${question.question || question.id || 'Sans titre'} »`;

      groups.forEach((group, groupIndex) => {
        const conditions = Array.isArray(group?.conditions) ? group.conditions : [];

        conditions.forEach((condition, conditionIndex) => {
          if (!condition) {
            return;
          }

          const position = formatConditionPosition(groupIndex, conditionIndex);
          const targetId = condition.question;

          if (!targetId) {
            pushIssue({
              scope: 'questions',
              context,
              message: `La condition ${position} n'indique aucune question de référence. Sélectionnez une question cible ou retirez cette condition.`
            });
            return;
          }

          if (!questionIds.has(targetId)) {
            pushIssue({
              scope: 'questions',
              context,
              message: `La condition ${position} référence la question « ${targetId} » qui n'existe plus. Mettez à jour le ciblage ou supprimez cette condition.`
            });
            return;
          }

          const optionsSet = questionOptionMap.get(targetId);
          if (optionsSet && optionsSet.size > 0) {
            const invalidValues = collectInvalidOptionValues(condition.value, optionsSet);

            if (invalidValues.length > 0) {
              const formattedValues = invalidValues.map((value) => `« ${value} »`).join(', ');
              const targetLabel = getQuestionLabel(targetId);

              pushIssue({
                scope: 'questions',
                context,
                message: `La condition ${position} utilise ${formattedValues} qui ne fait pas partie des options disponibles pour « ${targetLabel} ». Ajustez la valeur attendue.`
              });
            }
          }
        });
      });
    });

    safeRules.forEach((rule) => {
      const ruleLabel = rule?.name || rule?.id || 'Règle';
      const context = `Règle « ${ruleLabel} »`;
      const groups = normalizeConditionGroups(rule, sanitizeRuleCondition);

      groups.forEach((group, groupIndex) => {
        const conditions = Array.isArray(group?.conditions) ? group.conditions : [];

        conditions.forEach((condition, conditionIndex) => {
          if (!condition) {
            return;
          }

          const position = formatConditionPosition(groupIndex, conditionIndex);

          if (condition.type === 'timing') {
            if (!condition.startQuestion) {
              pushIssue({
                scope: 'rules',
                context,
                message: `La condition temporelle ${position} ne définit pas de question de départ. Sélectionnez une question d'origine.`
              });
            } else if (!questionIds.has(condition.startQuestion)) {
              pushIssue({
                scope: 'rules',
                context,
                message: `La question de départ « ${condition.startQuestion} » utilisée dans la condition temporelle ${position} n'existe plus.`
              });
            }

            if (!condition.endQuestion) {
              pushIssue({
                scope: 'rules',
                context,
                message: `La condition temporelle ${position} ne définit pas de question d'arrivée. Sélectionnez une question de fin.`
              });
            } else if (!questionIds.has(condition.endQuestion)) {
              pushIssue({
                scope: 'rules',
                context,
                message: `La question de fin « ${condition.endQuestion} » utilisée dans la condition temporelle ${position} n'existe plus.`
              });
            }

            return;
          }

          const targetId = condition.question;

          if (!targetId) {
            pushIssue({
              scope: 'rules',
              context,
              message: `La condition ${position} n'indique aucune question de référence. Complétez la configuration ou supprimez cette condition.`
            });
            return;
          }

          if (!questionIds.has(targetId)) {
            pushIssue({
              scope: 'rules',
              context,
              message: `La condition ${position} référence la question « ${targetId} » qui n'existe plus. Mettez à jour la condition.`
            });
            return;
          }

          const optionsSet = questionOptionMap.get(targetId);
          if (optionsSet && optionsSet.size > 0) {
            const invalidValues = collectInvalidOptionValues(condition.value, optionsSet);

            if (invalidValues.length > 0) {
              const formattedValues = invalidValues.map((value) => `« ${value} »`).join(', ');
              const targetLabel = getQuestionLabel(targetId);

              pushIssue({
                scope: 'rules',
                context,
                message: `La condition ${position} utilise ${formattedValues} qui ne sont pas proposés par « ${targetLabel} ». Ajustez la valeur ou les options.`
              });
            }
          }
        });
      });

      const ruleTeams = Array.isArray(rule?.teams) ? rule.teams : [];
      ruleTeams.forEach((teamId) => {
        if (!teamId) {
          return;
        }

        if (!teamIds.has(teamId)) {
          pushIssue({
            scope: 'teams',
            context,
            message: `L'équipe « ${teamId} » n'existe plus dans le référentiel. Retirez-la de la règle ou ajoutez l'équipe correspondante.`
          });
        }
      });

      if (rule?.questions && typeof rule.questions === 'object') {
        Object.entries(rule.questions).forEach(([teamId, teamQuestions]) => {
          if (!teamIds.has(teamId)) {
            pushIssue({
              scope: 'teams',
              context,
              message: `La section d'accompagnement « ${teamId} » n'est associée à aucune équipe existante. Renommez la clé ou créez l'équipe correspondante.`
            });
            return;
          }

          const entries = Array.isArray(teamQuestions) ? teamQuestions : [];
          entries.forEach((questionEntry, questionIndex) => {
            const sanitizedEntry = sanitizeTeamQuestionEntry(questionEntry);
            const questionLabel = sanitizedEntry.text ? sanitizedEntry.text : `Question ${questionIndex + 1}`;
            const questionContext = `Règle « ${ruleLabel} » · ${teamNameMap.get(teamId) || teamId} · ${questionLabel}`;
            const timingConstraint = sanitizeRiskTimingConstraint(sanitizedEntry.timingConstraint);

            if (timingConstraint.enabled) {
              if (!timingConstraint.startQuestion) {
                pushIssue({
                  scope: 'rules',
                  context: questionContext,
                  message: `Le contrôle de délai ne définit pas de question de départ. Sélectionnez une question de début.`
                });
              } else if (!questionIds.has(timingConstraint.startQuestion)) {
                pushIssue({
                  scope: 'rules',
                  context: questionContext,
                  message: `La question de départ « ${timingConstraint.startQuestion} » utilisée pour le délai n'existe plus.`
                });
              } else {
                const startQuestion = questionMap.get(timingConstraint.startQuestion);
                if ((startQuestion?.type || 'choice') !== 'date') {
                  pushIssue({
                    scope: 'rules',
                    context: questionContext,
                    message: `La question de départ « ${timingConstraint.startQuestion} » n'est pas de type date. Choisissez une question de type date.`
                  });
                }
              }

              if (!timingConstraint.endQuestion) {
                pushIssue({
                  scope: 'rules',
                  context: questionContext,
                  message: `Le contrôle de délai ne définit pas de question d'arrivée. Sélectionnez une question de fin.`
                });
              } else if (!questionIds.has(timingConstraint.endQuestion)) {
                pushIssue({
                  scope: 'rules',
                  context: questionContext,
                  message: `La question de fin « ${timingConstraint.endQuestion} » utilisée pour le délai n'existe plus.`
                });
              } else {
                const endQuestion = questionMap.get(timingConstraint.endQuestion);
                if ((endQuestion?.type || 'choice') !== 'date') {
                  pushIssue({
                    scope: 'rules',
                    context: questionContext,
                    message: `La question de fin « ${timingConstraint.endQuestion} » n'est pas de type date. Choisissez une question de type date.`
                  });
                }
              }
            }
          });
        });
      }
    });

    return issues;
  }, [questions, rules, teams]);

  const dataIntegritySummary = useMemo(() => {
    if (!dataIntegrityIssues || dataIntegrityIssues.length === 0) {
      return [];
    }

    const labels = {
      questions: 'Questions',
      rules: 'Règles',
      teams: 'Équipes',
      general: 'Général'
    };

    const counts = dataIntegrityIssues.reduce((accumulator, issue) => {
      const key = issue.scope || 'general';
      const current = accumulator[key] || 0;
      return { ...accumulator, [key]: current + 1 };
    }, {});

    return Object.entries(counts).map(([scope, count]) => ({
      scope,
      count,
      label: labels[scope] || 'Autres'
    }));
  }, [dataIntegrityIssues]);

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

  const cloneData = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => cloneData(item));
    }
    if (value && typeof value === 'object') {
      const cloned = {};
      Object.keys(value).forEach((key) => {
        cloned[key] = cloneData(value[key]);
      });
      return cloned;
    }
    return value;
  };

  const getDuplicateId = (items, baseId, fallbackPrefix) => {
    const existingIds = new Set(items.map((item) => item.id));
    const rawBase = typeof baseId === 'string' ? baseId.trim() : '';
    const sanitizedBase = rawBase !== '' ? rawBase.replace(/\s+/g, '_') : '';

    if (sanitizedBase) {
      let candidate = `${sanitizedBase}_copy`;
      let counter = 2;

      while (existingIds.has(candidate)) {
        candidate = `${sanitizedBase}_copy${counter}`;
        counter += 1;
      }

      return candidate;
    }

    return getNextId(items, fallbackPrefix);
  };

  const addRiskLevelRule = () => {
    if (typeof setRiskLevelRules !== 'function') {
      return;
    }

    const nextId = getNextId(safeRiskLevelRules, 'risk_level_');
    const lastRule = safeRiskLevelRules[safeRiskLevelRules.length - 1];
    const baseMinimum = lastRule
      ? Math.max(
        0,
        (() => {
          const lastMax = getRuleMaxScoreValue(lastRule);
          if (lastMax !== null) {
            return lastMax + 1;
          }
          const lastMin = getRuleMinScoreValue(lastRule);
          return lastMin + 1;
        })()
      )
      : 0;

    const newRule = {
      id: nextId,
      label: 'Nouveau niveau',
      minRisks: baseMinimum,
      maxRisks: null,
      minScore: baseMinimum,
      maxScore: null,
      description: ''
    };

    setRiskLevelRules([...safeRiskLevelRules, newRule]);
    setActiveTab('riskLevels');
    setReorderAnnouncement(`Niveau de risque ajouté en position ${safeRiskLevelRules.length + 1}.`);
  };

  const updateRiskLevelRuleField = (index, field, value) => {
    if (typeof setRiskLevelRules !== 'function') {
      return;
    }

    setRiskLevelRules(prevRules => {
      const baseRules = Array.isArray(prevRules) ? [...prevRules] : [];
      if (!baseRules[index]) {
        return prevRules;
      }

      const updatedRule = { ...baseRules[index] };

      if (field === 'label') {
        updatedRule.label = value;
      } else if (field === 'description') {
        updatedRule.description = value;
      } else if (field === 'minRisks' || field === 'minScore') {
        const parsed = Number.parseFloat(value);
        const sanitized = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
        updatedRule.minRisks = sanitized;
        updatedRule.minScore = sanitized;
      } else if (field === 'maxRisks' || field === 'maxScore') {
        if (value === '' || value === null) {
          updatedRule.maxRisks = null;
          updatedRule.maxScore = null;
        } else {
          const parsed = Number.parseFloat(value);
          if (Number.isNaN(parsed)) {
            updatedRule.maxRisks = null;
            updatedRule.maxScore = null;
          } else {
            const sanitized = Math.max(0, parsed);
            updatedRule.maxRisks = sanitized;
            updatedRule.maxScore = sanitized;
          }
        }
      }

      baseRules[index] = updatedRule;
      return baseRules;
    });
  };

  const deleteRiskLevelRule = (id, index) => {
    if (typeof setRiskLevelRules !== 'function') {
      return;
    }

    if (safeRiskLevelRules.length <= 1) {
      setReorderAnnouncement('Au moins un niveau de risque doit être conservé.');
      return;
    }

    const normalizedIndex = Number.isInteger(index) && index >= 0
      ? index
      : safeRiskLevelRules.findIndex((rule) => rule?.id === id);

    if (normalizedIndex < 0 || normalizedIndex >= safeRiskLevelRules.length) {
      return;
    }

    const targetRule = safeRiskLevelRules[normalizedIndex];
    const label = targetRule?.label || targetRule?.id || `Niveau ${normalizedIndex + 1}`;

    if (!confirmDeletion(`Êtes-vous sûr de vouloir supprimer le niveau de complexité « ${label} » ? Cette action peut être annulée (Ctrl+Z).`)) {
      return;
    }

    pushUndoEntry({
      type: 'riskLevelRule',
      index: normalizedIndex,
      item: cloneData(targetRule),
      message: `Le niveau « ${label} » a été supprimé. Cliquez sur « Annuler » ou utilisez Ctrl+Z pour le restaurer.`,
    });

    setRiskLevelRules(prevRules => {
      const baseRules = Array.isArray(prevRules) ? [...prevRules] : [];
      if (normalizedIndex < 0 || normalizedIndex >= baseRules.length) {
        return baseRules;
      }
      baseRules.splice(normalizedIndex, 1);
      return baseRules;
    });

    setReorderAnnouncement(`Niveau de risque supprimé. ${Math.max(safeRiskLevelRules.length - 1, 0)} niveau(x) restant(s).`);
  };

  const moveRiskLevelRule = (fromIndex, toIndex) => {
    if (typeof setRiskLevelRules !== 'function') {
      return;
    }

    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= safeRiskLevelRules.length ||
      toIndex >= safeRiskLevelRules.length
    ) {
      return;
    }

    const movedRule = safeRiskLevelRules[fromIndex];

    setRiskLevelRules(prevRules => {
      const baseRules = Array.isArray(prevRules) ? [...prevRules] : [];
      if (
        fromIndex < 0 ||
        fromIndex >= baseRules.length ||
        toIndex < 0 ||
        toIndex >= baseRules.length
      ) {
        return prevRules;
      }

      const next = [...baseRules];
      const [extracted] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, extracted);
      return next;
    });

    if (movedRule) {
      const label = movedRule.label || movedRule.id || 'Niveau de risque';
      setReorderAnnouncement(`Le niveau « ${label} » est maintenant en position ${toIndex + 1} sur ${safeRiskLevelRules.length}.`);
    }
  };

  const formatRiskRangeLabel = (rule) => {
    const minScore = getRuleMinScoreValue(rule);
    const maxScore = getRuleMaxScoreValue(rule);

    const minLabel = formatScoreValue(minScore);
    const minUnit = getPointUnit(minScore);

    if (maxScore === null) {
      return `≥ ${minLabel} ${minUnit}`;
    }

    if (minScore === maxScore) {
      return `${minLabel} ${getPointUnit(minScore)}`;
    }

    const maxLabel = formatScoreValue(maxScore);
    return `${minLabel} à ${maxLabel} points`;
  };

  const getRiskLevelRuleIssues = (rule, index, rulesList) => {
    const issues = [];
    const min = getRuleMinScoreValue(rule);
    const max = getRuleMaxScoreValue(rule);

    if (max !== null && max < min) {
      issues.push('Le score maximal doit être supérieur ou égal au score minimal.');
    }

    if (index > 0) {
      const previous = rulesList[index - 1];
      const previousMax = getRuleMaxScoreValue(previous);

      if (previousMax === null) {
        issues.push('Le niveau précédent couvre déjà tous les scores (maximum illimité). Ajustez-le avant d’ajouter ce palier.');
      } else if (min <= previousMax) {
        issues.push(`Le score minimal doit être strictement supérieur à ${formatScoreValue(previousMax)}, le maximum du niveau précédent.`);
      }
    }

    return issues;
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
    downloadDataModule('riskLevelRules.js', 'initialRiskLevelRules', safeRiskLevelRules);
    downloadDataModule('teams.js', 'initialTeams', teams);
  };

  const tabDefinitions = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      panelId: 'backoffice-tabpanel-dashboard'
    },
    {
      id: 'filters',
      label: `Filtres d'accueil (${filterFields.length})`,
      panelId: 'backoffice-tabpanel-filters'
    },
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
      id: 'riskLevels',
      label: `Niveaux de complexité (${riskLevelRuleCount})`,
      panelId: 'backoffice-tabpanel-risk-levels'
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
    placeholder: '',
    numberUnit: '',
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
    if (newQuestion?.id) {
      setExpandedQuestionIds((prev) => {
        const next = new Set(prev);
        next.add(newQuestion.id);
        return next;
      });
    }
  };

  const addQuestionAtIndex = (targetIndex) => {
    const newQuestion = createDefaultQuestion(questions);
    const next = questions.slice();
    next.splice(targetIndex, 0, newQuestion);

    setQuestions(next);
    setEditingQuestion(newQuestion);
    setReorderAnnouncement(`Nouvelle question ajoutée en position ${targetIndex + 1} sur ${next.length}.`);
    if (newQuestion?.id) {
      setExpandedQuestionIds((prev) => {
        const updated = new Set(prev);
        updated.add(newQuestion.id);
        return updated;
      });
    }
  };

  const deleteQuestion = (id) => {
    const targetIndex = questions.findIndex((question) => question.id === id);
    if (targetIndex < 0) {
      return;
    }

    const target = questions[targetIndex];
    if (target && target.showcase) {
      return;
    }

    const label = target?.question || target?.id || 'cette question';

    if (!confirmDeletion(`Êtes-vous sûr de vouloir supprimer la question « ${label} » ? Cette action peut être annulée (Ctrl+Z).`)) {
      return;
    }

    pushUndoEntry({
      type: 'question',
      index: targetIndex,
      item: cloneData(target),
      message: `La question « ${label} » a été supprimée. Cliquez sur « Annuler » ou utilisez Ctrl+Z pour la restaurer.`,
    });

    setQuestions((prevQuestions) => prevQuestions.filter((question) => question.id !== id));
  };

  const duplicateQuestion = (id) => {
    const originalIndex = questions.findIndex((question) => question.id === id);
    if (originalIndex < 0) {
      return;
    }

    const originalQuestion = questions[originalIndex];
    const duplicateId = getDuplicateId(questions, originalQuestion?.id, 'q');
    const copiedQuestion = cloneData(originalQuestion || {});

    copiedQuestion.id = duplicateId;
    copiedQuestion.question = typeof originalQuestion?.question === 'string' && originalQuestion.question.trim() !== ''
      ? `${originalQuestion.question} (copie)`
      : `Copie de ${duplicateId}`;

    const updatedQuestions = questions.slice();
    updatedQuestions.splice(originalIndex + 1, 0, copiedQuestion);

    setQuestions(updatedQuestions);
    setEditingQuestion(copiedQuestion);
    if (copiedQuestion?.id) {
      setExpandedQuestionIds((prev) => {
        const next = new Set(prev);
        next.add(copiedQuestion.id);
        return next;
      });
    }

    const sourceLabel = originalQuestion?.id || 'question d’origine';
    setReorderAnnouncement(`La question ${duplicateId} a été créée à partir de ${sourceLabel} et placée en position ${originalIndex + 2} sur ${updatedQuestions.length}.`);
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
      risks: []
    };

    setRules([...rules, newRule]);
    setEditingRule(newRule);
    if (newRule?.id) {
      setExpandedRuleIds((prev) => {
        const next = new Set(prev);
        next.add(newRule.id);
        return next;
      });
    }
  };

  const deleteRule = (id) => {
    const targetIndex = rules.findIndex((rule) => rule.id === id);
    if (targetIndex < 0) {
      return;
    }

    const target = rules[targetIndex];
    const label = target?.name || target?.id || 'cette règle';

    if (!confirmDeletion(`Êtes-vous sûr de vouloir supprimer la règle « ${label} » ? Cette action peut être annulée (Ctrl+Z).`)) {
      return;
    }

    pushUndoEntry({
      type: 'rule',
      index: targetIndex,
      item: cloneData(target),
      message: `La règle « ${label} » a été supprimée. Cliquez sur « Annuler » ou utilisez Ctrl+Z pour la restaurer.`,
    });

    setRules((prevRules) => prevRules.filter((ruleItem) => ruleItem.id !== id));
    if (editingRule && editingRule.id === id) {
      setEditingRule(null);
    }
  };

  const duplicateRule = (id) => {
    const originalIndex = rules.findIndex((rule) => rule.id === id);
    if (originalIndex < 0) {
      return;
    }

    const originalRule = rules[originalIndex];
    const duplicateId = getDuplicateId(rules, originalRule?.id, 'rule');
    const copiedRule = cloneData(originalRule || {});

    copiedRule.id = duplicateId;
    copiedRule.name = typeof originalRule?.name === 'string' && originalRule.name.trim() !== ''
      ? `${originalRule.name} (copie)`
      : `Copie de ${duplicateId}`;
    delete copiedRule.priority;

    const updatedRules = rules.slice();
    updatedRules.splice(originalIndex + 1, 0, copiedRule);

    setRules(updatedRules);
    setEditingRule(copiedRule);
    if (copiedRule?.id) {
      setExpandedRuleIds((prev) => {
        const next = new Set(prev);
        next.add(copiedRule.id);
        return next;
      });
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
    const targetIndex = teams.findIndex((team) => team.id === id);
    if (targetIndex < 0) {
      return;
    }

    const target = teams[targetIndex];
    const label = target?.name || target?.id || 'cette équipe';

    if (!confirmDeletion(`Êtes-vous sûr de vouloir supprimer l'équipe « ${label} » ? Cette action peut être annulée (Ctrl+Z).`)) {
      return;
    }

    pushUndoEntry({
      type: 'team',
      index: targetIndex,
      item: cloneData(target),
      message: `L'équipe « ${label} » a été supprimée. Cliquez sur « Annuler » ou utilisez Ctrl+Z pour la restaurer.`,
    });

    setTeams((prevTeams) => prevTeams.filter((team) => team.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8 hv-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 hv-surface" role="region" aria-label="Back-office compliance">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-xl">
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
                onClick={handleUndo}
                disabled={!canUndo}
                title="Annuler la dernière suppression (Ctrl+Z)"
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 hv-button hv-focus-ring text-sm sm:text-base"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Annuler (Ctrl+Z)
              </button>
              <button
                type="button"
                onClick={handleDownloadDataFiles}
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg shadow-sm hover:bg-blue-50 hv-button hv-focus-ring text-sm sm:text-base"
              >
                <Download className="w-5 h-5 mr-2" />
                Télécharger les fichiers (questions, règles, équipes)
              </button>
            </div>
          </header>

          {undoMessage ? (
            <div
              className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-800"
              role="status"
              aria-live="polite"
            >
              {undoMessage}
            </div>
          ) : null}

          <section
            className="mb-6"
            aria-label="Détection des incohérences"
            aria-live="polite"
          >
            {dataIntegrityIssues.length > 0 ? (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50/80 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-yellow-900">
                        {dataIntegrityIssues.length} incohérence
                        {dataIntegrityIssues.length > 1 ? 's' : ''} détectée
                        {dataIntegrityIssues.length > 1 ? 's' : ''} dans la configuration.
                      </p>
                      {dataIntegritySummary.map((entry) => (
                        <span
                          key={entry.scope}
                          className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
                        >
                          {entry.label} · {entry.count}
                        </span>
                      ))}
                    </div>
                    <ul className="space-y-2 text-sm text-yellow-900">
                      {dataIntegrityIssues.map((issue) => (
                        <li
                          key={issue.id}
                          className="rounded-lg border border-yellow-200 bg-white/60 p-3"
                        >
                          <p className="font-medium">{issue.context}</p>
                          <p className="mt-1 leading-snug">{issue.message}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle className="w-6 h-6 text-emerald-600 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Aucune incohérence détectée dans les données de configuration.
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Les conditions, équipes et références sont alignées.
                  </p>
                </div>
              </div>
            )}
          </section>

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
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'dashboard' && (
            <section
              id="backoffice-tabpanel-dashboard"
              role="tabpanel"
              aria-labelledby="backoffice-tab-dashboard"
              className="space-y-6"
            >
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-6 text-center text-blue-700">
                <h2 className="text-2xl font-bold text-blue-900">Dashboard</h2>
                <p className="mt-2 text-sm">
                  Cette section proposera prochainement des indicateurs clés pour analyser les projets soumis.
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Revenez bientôt pour suivre vos KPIs et faciliter vos prises de décision.
                </p>
              </div>
            </section>
          )}

          {activeTab === 'filters' && (
            <section
              id="backoffice-tabpanel-filters"
              role="tabpanel"
              aria-labelledby="backoffice-tab-filters"
              className="space-y-6"
            >
              <article className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-800">Filtres de la page d'accueil</h2>
                    <p className="text-sm text-gray-600">
                      Activez, ajoutez ou personnalisez les filtres mis à disposition des chefs de projet sur l'écran d'accueil.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetProjectFilters}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors hv-button ${
                      projectFiltersAreDefault
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hv-button-primary'
                    }`}
                    disabled={projectFiltersAreDefault}
                  >
                    Réinitialiser les filtres
                  </button>
                </header>

                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/70 p-4 md:flex md:items-end md:justify-between md:gap-4">
                    <div className="flex-1 space-y-2">
                      <label htmlFor="new-filter-question" className="text-sm font-medium text-blue-900">
                        Ajouter un filtre basé sur une question
                      </label>
                      <select
                        id="new-filter-question"
                        value={selectedFilterQuestionId}
                        onChange={(event) => setSelectedFilterQuestionId(event.target.value)}
                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">Sélectionnez une question…</option>
                        {availableFilterQuestionOptions.map((option) => (
                          <option key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}{option.disabled ? ' (déjà utilisé)' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-blue-700">
                        Les champs texte et listes à choix unique du questionnaire peuvent être transformés en filtres.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProjectFilter}
                      disabled={!canAddProjectFilter}
                      className={`mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors hv-button md:mt-0 ${
                        canAddProjectFilter
                          ? 'bg-blue-600 text-white hover:bg-blue-700 hv-button-primary'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4" /> Ajouter le filtre
                    </button>
                  </div>

                  <div className="space-y-4">
                    {filterFields.length === 0 ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                        Aucun filtre n'est configuré pour le moment. Utilisez le menu ci-dessus pour en ajouter.
                      </div>
                    ) : (
                      filterFields.map((field) => {
                        const typeLabel = PROJECT_FILTER_TYPE_LABELS[field.type] || 'Paramètre';
                        const description = PROJECT_FILTER_FIELD_DESCRIPTIONS[field.id] || '';
                        const labelInputId = `project-filter-label-${field.id}`;
                        const sortDefault = field.type === 'sort' && field.defaultValue === 'asc' ? 'asc' : 'desc';
                        const sourceQuestionId = field.sourceQuestionId || field.id;
                        const sourceQuestion = Array.isArray(questions)
                          ? questions.find((question) => question && question.id === sourceQuestionId)
                          : null;
                        const sourceLabel = sourceQuestion?.question;
                        const canRemoveFilter = field.id !== 'dateOrder';

                        return (
                          <article
                            key={field.id}
                            className="border border-gray-200 rounded-xl bg-white p-5 shadow-sm hv-surface"
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                                  <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                                    {typeLabel}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-1 ${
                                      field.enabled
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {field.enabled ? 'Activé' : 'Désactivé'}
                                  </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">{field.label}</h3>
                                {description && <p className="text-sm text-gray-600">{description}</p>}
                                {sourceQuestionId && (
                                  <p className="text-xs text-gray-500">
                                    Source : <span className="font-medium">{sourceQuestionId}</span>
                                    {sourceLabel ? ` – ${sourceLabel}` : ''}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={field.enabled}
                                    onChange={(event) => handleProjectFilterToggle(field.id, event.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>Activer</span>
                                </label>
                                {canRemoveFilter && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProjectFilter(field)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 hv-button"
                                  >
                                    <Trash2 className="w-4 h-4" /> Supprimer
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <div className="flex flex-col gap-2">
                                <label htmlFor={labelInputId} className="text-sm font-medium text-gray-700">
                                  Libellé affiché
                                </label>
                                <input
                                  id={labelInputId}
                                  type="text"
                                  value={field.label}
                                  onChange={(event) => handleProjectFilterLabelChange(field.id, event.target.value)}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                                <p className="text-xs text-gray-500">
                                  Ce titre s'affiche sur la page d'accueil à côté du champ de filtre.
                                </p>
                              </div>

                              {field.type === 'sort' ? (
                                <fieldset className="flex flex-col gap-2">
                                  <legend className="text-sm font-medium text-gray-700">Ordre par défaut</legend>
                                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                      type="radio"
                                      name={`project-filter-sort-order-${field.id}`}
                                      value="desc"
                                      checked={sortDefault === 'desc'}
                                      onChange={() => handleProjectFilterDefaultSortChange('desc')}
                                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Antéchronologique (plus récents en premier)</span>
                                  </label>
                                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                      type="radio"
                                      name={`project-filter-sort-order-${field.id}`}
                                      value="asc"
                                      checked={sortDefault === 'asc'}
                                      onChange={() => handleProjectFilterDefaultSortChange('asc')}
                                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Chronologique (plus anciens en premier)</span>
                                  </label>
                                </fieldset>
                              ) : field.type === 'select' ? (
                                <div className="flex flex-col gap-2">
                                  <label
                                    htmlFor={`project-filter-empty-option-${field.id}`}
                                    className="text-sm font-medium text-gray-700"
                                  >
                                    Libellé de l'option « toutes »
                                  </label>
                                  <input
                                    id={`project-filter-empty-option-${field.id}`}
                                    type="text"
                                    value={field.emptyOptionLabel || 'Toutes les valeurs'}
                                    onChange={(event) =>
                                      setProjectFilters((prev) =>
                                        updateProjectFilterField(prev, field.id, {
                                          emptyOptionLabel: event.target.value
                                        })
                                      )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Texte affiché pour représenter l'ensemble des valeurs disponibles.
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2 text-sm text-gray-600">
                                  <span className="font-medium text-gray-700">Comportement</span>
                                  <p className="text-xs text-gray-500">
                                    Recherche plein texte sur la réponse saisie par le chef de projet.
                                  </p>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              </article>
            </section>
          )}

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
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter une question
                </button>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900">
                <p className="font-medium">Questions vitrine projet</p>
                <p className="mt-1 text-blue-800">
                  Les questions marquées «&nbsp;Vitrine projet&nbsp;» alimentent automatiquement la vitrine marketing.
                  Elles sont obligatoires pour compléter le showcase et ne peuvent pas être supprimées.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label
                      htmlFor="question-title-filter"
                      className="text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                      Filtrer par titre ou identifiant
                    </label>
                    <input
                      id="question-title-filter"
                      type="text"
                      value={questionTitleFilter}
                      onChange={(event) => setQuestionTitleFilter(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Ex. audience, q12..."
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="question-team-filter"
                      className="text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                      Filtrer par équipe impliquée
                    </label>
                    <select
                      id="question-team-filter"
                      value={questionTeamFilter}
                      onChange={(event) => setQuestionTeamFilter(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="all">Toutes les équipes</option>
                      <option value="none">Sans équipe identifiée</option>
                      {availableTeamFilterOptions.map((option) => (
                        <option key={`question-team-filter-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-1 flex items-end">
                    <p className="text-xs text-gray-500">
                      {questions.length === 0
                        ? 'Aucune question configurée.'
                        : visibleQuestionIds.length === questions.length
                          ? 'Toutes les questions sont affichées.'
                          : visibleQuestionIds.length === 0
                            ? 'Aucune question ne correspond aux filtres.'
                            : `${visibleQuestionIds.length} question${visibleQuestionIds.length > 1 ? 's' : ''} correspond${visibleQuestionIds.length > 1 ? 'ent' : ''} aux filtres.`}
                    </p>
                  </div>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                  Aucune question configurée pour le moment.
                </div>
              ) : visibleQuestionIds.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                  Aucune question ne correspond aux filtres sélectionnés.
                </div>
              ) : (
                questions.map((question, index) => {
                  if (!visibleQuestionIdSet.has(question.id)) {
                    return null;
                  }

                  const typeMeta = getQuestionTypeMeta(question.type);
                  const conditionSummary = buildConditionSummary(question, questions);
                  const guidance = question.guidance || {};
                  const tips = formatGuidanceTips(guidance);
                  const numberUnitLabel =
                    question.type === 'number' && typeof question.numberUnit === 'string'
                      ? question.numberUnit.trim()
                      : '';
                  const isShowcaseQuestion = Boolean(question && question.showcase);
                  const deleteButtonClasses = isShowcaseQuestion
                    ? 'p-2 text-gray-300 bg-gray-100 cursor-not-allowed rounded hv-button'
                    : 'p-2 text-red-600 hover:bg-red-50 rounded hv-button';
                  const deleteButtonTitle = isShowcaseQuestion
                    ? 'Cette question alimente la vitrine showcase et ne peut pas être supprimée.'
                    : `Supprimer la question ${question.id}`;
                  const questionTeams = questionTeamAssignments.get(question.id) || [];
                  const questionTeamLabels = questionTeams.map((teamId) => getTeamLabel(teamId, teams));
                  const isExpanded = expandedQuestionIds.has(question.id);
                  const detailsId = `question-details-${question.id}`;
                  const toggleLabel = isExpanded
                    ? `Masquer les détails de la question ${question.id}`
                    : `Afficher les détails de la question ${question.id}`;

                  return (
                    <React.Fragment key={question.id}>
                      <article
                        className={`border border-gray-200 rounded-xl p-6 bg-white shadow-sm hv-surface transition-shadow ${
                          dragOverIndex === index ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                        } ${
                          draggedQuestionIndex === index ? 'opacity-75' : ''
                        }`}
                        aria-label={`Question ${question.id}`}
                        onDragOver={(event) => handleDragOver(event, index)}
                        onDrop={(event) => handleDrop(event, index)}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <button
                              type="button"
                              onClick={() => toggleQuestionExpansion(question.id)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full hv-button"
                              aria-expanded={isExpanded}
                              aria-controls={detailsId}
                            >
                              <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              <span className="sr-only">{toggleLabel}</span>
                            </button>
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {question.id}
                                </span>
                                <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                  {typeMeta.label}
                                </span>
                                {isShowcaseQuestion && (
                                  <span className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded-full font-medium">
                                    Vitrine projet
                                  </span>
                                )}
                                {question.required && (
                                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">Obligatoire</span>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-gray-800">{question.question}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                <span id={`question-${question.id}-position`}>
                                  Position {index + 1} sur {questions.length}
                                </span>
                              </div>
                              {questionTeamLabels.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {questionTeamLabels.map((label) => (
                                    <span
                                      key={`${question.id}-team-${label}`}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="p-2 text-gray-500 hover:text-blue-600 rounded hv-button cursor-move"
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
                              onClick={() => duplicateQuestion(question.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded hv-button"
                              aria-label={`Dupliquer la question ${question.id}`}
                              title={`Dupliquer la question ${question.id}`}
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingQuestion(question)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded hv-button"
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
                        </div>

                        {isExpanded && (
                          <div id={detailsId} className="mt-4 space-y-6">
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>{typeMeta.description}</p>
                              {numberUnitLabel && (
                                <p className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                                  <Info className="w-4 h-4" />
                                  Unité affichée : {numberUnitLabel}
                                </p>
                              )}
                            </div>

                            {(Array.isArray(question.options) && question.options.length > 0) && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                                  <Info className="w-4 h-4 mr-2" /> Options proposées
                                </h4>
                                <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                                  {question.options.map((option, optionIndex) => (
                                    <li key={`${question.id}-option-${optionIndex}`} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                      {option}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {conditionSummary.length > 0 ? (
                              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700">
                                <h4 className="text-sm font-semibold text-blue-700 mb-3">Conditions d'affichage</h4>
                                <ol className="space-y-3">
                                  {conditionSummary.map((group) => (
                                    <li key={`${question.id}-condition-group-${group.index}`} className="space-y-2">
                                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                        Groupe {group.index} – logique {group.logic === 'OU' ? 'OU (au moins une)' : 'ET (toutes)'}
                                      </div>
                                      <ul className="space-y-1">
                                        {group.parts.map((part, partIndex) => (
                                          <li key={`${question.id}-part-${group.index}-${partIndex}`} className="flex items-baseline space-x-2">
                                            {part.connector && <span className="text-xs text-blue-500">{part.connector}</span>}
                                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-100">{part.label}</span>
                                            <span>{part.operator}</span>
                                            <span className="font-semibold text-blue-700">« {part.value} »</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">Cette question est toujours affichée.</p>
                            )}

                            {(guidance.objective || guidance.details || tips.length > 0) && (
                              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700 space-y-2">
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
                                      {tips.map((tip, tipIndex) => (
                                        <li key={`${question.id}-tip-${tipIndex}`}>{renderTextWithLinks(tip)}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
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
                            className="w-10 h-10 rounded-full border-2 border-dashed border-blue-300 text-blue-600 bg-white flex items-center justify-center shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 hv-button"
                            aria-label={`Insérer une nouvelle question après la question ${question.id}`}
                          >
                            <Plus className="w-5 h-5" />
                            <span className="sr-only">Ajouter une question à cet emplacement</span>
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })
              )}
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
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter une règle
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label
                      htmlFor="rule-title-filter"
                      className="text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                      Filtrer par titre ou identifiant
                    </label>
                    <input
                      id="rule-title-filter"
                      type="text"
                      value={ruleTitleFilter}
                      onChange={(event) => setRuleTitleFilter(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Ex. données, rule3..."
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rule-team-filter"
                      className="text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                      Filtrer par équipe impliquée
                    </label>
                    <select
                      id="rule-team-filter"
                      value={ruleTeamFilter}
                      onChange={(event) => setRuleTeamFilter(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="all">Toutes les équipes</option>
                      <option value="none">Sans équipe identifiée</option>
                      {availableTeamFilterOptions.map((option) => (
                        <option key={`rule-team-filter-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-1 flex items-end">
                    <p className="text-xs text-gray-500">
                      {rules.length === 0
                        ? 'Aucune règle métier n\'est configurée.'
                        : visibleRuleIds.length === rules.length
                          ? 'Toutes les règles sont affichées.'
                          : visibleRuleIds.length === 0
                            ? 'Aucune règle ne correspond aux filtres.'
                            : `${visibleRuleIds.length} règle${visibleRuleIds.length > 1 ? 's' : ''} correspond${visibleRuleIds.length > 1 ? 'ent' : ''} aux filtres.`}
                    </p>
                  </div>
                </div>
              </div>

              {rules.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                  Aucune règle métier n'est configurée.
                </div>
              ) : visibleRuleIds.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                  Aucune règle ne correspond aux filtres sélectionnés.
                </div>
              ) : (
                rules.map((rule) => {
                  if (!visibleRuleIdSet.has(rule.id)) {
                    return null;
                  }

                  const conditionSummary = buildRuleConditionSummary(rule, questions);
                  const risks = Array.isArray(rule.risks) ? rule.risks : [];
                  const highestRiskPriority = getHighestRiskPriority(risks);
                  const associatedTeamIds = Array.from(collectRuleTeamIds(rule));
                  const associatedTeamLabels = associatedTeamIds.map((teamId) => getTeamLabel(teamId, teams));
                  const isExpanded = expandedRuleIds.has(rule.id);
                  const detailsId = `rule-details-${rule.id}`;
                  const ruleDisplayName = typeof rule.name === 'string' && rule.name.trim() !== '' ? rule.name : rule.id;
                  const toggleLabel = isExpanded
                    ? `Masquer les détails de la règle ${ruleDisplayName}`
                    : `Afficher les détails de la règle ${ruleDisplayName}`;

                  return (
                    <article key={rule.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hv-surface">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleRuleExpansion(rule.id)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full hv-button"
                            aria-expanded={isExpanded}
                            aria-controls={detailsId}
                          >
                            <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            <span className="sr-only">{toggleLabel}</span>
                          </button>
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">{rule.id}</span>
                              <span className={`px-2 py-1 rounded-full font-semibold ${getPriorityBadgeClasses(highestRiskPriority)}`}>
                                {highestRiskPriority
                                  ? `Priorité principale : ${highestRiskPriority}`
                                  : 'Priorité non renseignée'}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">{ruleDisplayName}</h3>
                            {associatedTeamLabels.length > 0 && (
                              <div className="flex flex-wrap gap-2 text-xs">
                                {associatedTeamLabels.map((label) => (
                                  <span
                                    key={`${rule.id}-team-${label}`}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingRule(rule)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded hv-button"
                            aria-label={`Afficher la règle ${ruleDisplayName}`}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateRule(rule.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded hv-button"
                            aria-label={`Dupliquer la règle ${ruleDisplayName}`}
                            title={`Dupliquer la règle ${ruleDisplayName}`}
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRule(rule.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded hv-button"
                            aria-label={`Supprimer la règle ${ruleDisplayName}`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div id={detailsId} className="mt-4 space-y-6 text-sm text-gray-700">
                          {conditionSummary.length > 0 ? (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-blue-700 mb-3">Conditions de déclenchement</h4>
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
                            <p className="text-xs text-gray-500 italic">
                              Cette règle est toujours active (aucune condition configurée).
                            </p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-800">Équipes impliquées</h4>
                              {associatedTeamLabels.length > 0 ? (
                                <ul className="flex flex-wrap gap-2">
                                  {associatedTeamLabels.map((label) => (
                                    <li key={`${rule.id}-details-team-${label}`} className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">
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
                                  {risks.map((risk, index) => {
                                    const riskDescription = risk && risk.description ? risk.description : 'Risque non renseigné';
                                    const riskPriority = risk?.priority || 'A réaliser';
                                    const riskTeamLabel = risk?.teamId ? getTeamLabel(risk.teamId, teams) : 'Équipe non renseignée';

                                    return (
                                      <li key={`${rule.id}-risk-${index}`} className="space-y-1">
                                        <div className="flex items-start space-x-2">
                                          <span className="text-red-500 mt-1">•</span>
                                          <span>{riskDescription}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex flex-wrap gap-2 pl-4">
                                          <span className="inline-flex items-center gap-1">
                                            <strong className="font-semibold text-gray-600">Équipe :</strong>
                                            <span>{riskTeamLabel}</span>
                                          </span>
                                          <span className="inline-flex items-center gap-1">
                                            <strong className="font-semibold text-gray-600">Priorité :</strong>
                                            <span>{riskPriority}</span>
                                          </span>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-500 italic">Aucun risque documenté.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </section>
          )}

          {activeTab === 'riskLevels' && (
            <section
              id="backoffice-tabpanel-risk-levels"
              role="tabpanel"
              aria-labelledby="backoffice-tab-riskLevels"
              className="space-y-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Niveaux de risque</h2>
                  <p className="text-sm text-gray-600">
                    Ajustez les seuils utilisés pour calculer la complexité compliance affichée aux équipes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRiskLevelRule}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter un niveau
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 space-y-2">
                <p className="flex items-start gap-2">
                  <Info className="w-5 h-5 mt-0.5" />
                  <span>
                    Les niveaux sont évalués du haut vers le bas : le premier palier correspondant au score de risque total s’applique.
                  </span>
                </p>
                <p className="text-xs text-blue-700">
                  Le score de risque additionne le poids de chaque risque selon sa criticité. Laissez la borne maximale vide pour couvrir toutes les valeurs supérieures à la borne minimale.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hv-surface space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Pondération des criticités</h3>
                  <p className="text-sm text-gray-600">
                    Ajustez la valeur attribuée à chaque niveau de criticité pour recalculer le score de risque des projets.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {RISK_WEIGHT_FIELDS.map((field) => (
                    <div key={field.key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`risk-weight-${field.key}`}>
                        {field.label}
                      </label>
                      <input
                        id={`risk-weight-${field.key}`}
                        type="number"
                        min="0"
                        step="0.5"
                        value={normalizedRiskWeights[field.key] ?? 0}
                        onChange={(event) => handleRiskWeightChange(field.key, event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hv-focus-ring"
                      />
                      <p className="mt-2 text-xs text-gray-500">{field.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {riskLevelRuleCount === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                  Aucun niveau de risque n'est configuré.
                </div>
              ) : (
                <div className="space-y-4">
                  {safeRiskLevelRules.map((rule, index) => {
                    const ruleId = rule?.id || `risk-level-${index + 1}`;
                    const labelInputId = `${ruleId}-label`;
                    const minInputId = `${ruleId}-min`;
                    const maxInputId = `${ruleId}-max`;
                    const descriptionId = `${ruleId}-description`;
                    const rangeLabel = formatRiskRangeLabel(rule);
                    const issues = getRiskLevelRuleIssues(rule, index, safeRiskLevelRules);
                    const disableDelete = riskLevelRuleCount <= 1;
                    const minValue = getRuleMinScoreValue(rule);
                    const maxScoreValue = getRuleMaxScoreValue(rule);
                    const maxValue = maxScoreValue === null ? '' : maxScoreValue;

                    return (
                      <article key={ruleId} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hv-surface">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">{ruleId}</span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">{rangeLabel}</span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">Palier {index + 1}</span>
                            </div>
                            <div>
                              <label
                                className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"
                                htmlFor={labelInputId}
                              >
                                Intitulé du niveau
                              </label>
                              <input
                                id={labelInputId}
                                type="text"
                                value={rule?.label || ''}
                                onChange={(event) => updateRiskLevelRuleField(index, 'label', event.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hv-focus-ring"
                              />
                            </div>
                          </div>
                          <div className="flex items-start gap-2 self-stretch md:self-start">
                            <div className="flex flex-col gap-2" role="group" aria-label={`Réordonner le niveau ${rule?.label || index + 1}`}>
                              <button
                                type="button"
                                onClick={() => moveRiskLevelRule(index, index - 1)}
                                disabled={index === 0}
                                className="p-2 text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-100 hv-button disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label={`Monter le niveau ${rule?.label || ruleId}`}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveRiskLevelRule(index, index + 1)}
                                disabled={index === riskLevelRuleCount - 1}
                                className="p-2 text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-100 hv-button disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label={`Descendre le niveau ${rule?.label || ruleId}`}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteRiskLevelRule(ruleId, index)}
                              disabled={disableDelete}
                              className="p-2 text-red-600 hover:bg-red-50 rounded hv-button disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`Supprimer le niveau ${rule?.label || ruleId}`}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label
                              className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"
                              htmlFor={minInputId}
                            >
                              Score minimal
                            </label>
                            <input
                              id={minInputId}
                              type="number"
                              min="0"
                              step="0.5"
                              value={minValue}
                              onChange={(event) => updateRiskLevelRuleField(index, 'minScore', event.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hv-focus-ring"
                            />
                          </div>
                          <div>
                            <label
                              className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"
                              htmlFor={maxInputId}
                            >
                              Score maximal (optionnel)
                            </label>
                            <input
                              id={maxInputId}
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="Illimitée"
                              value={maxValue}
                              onChange={(event) => updateRiskLevelRuleField(index, 'maxScore', event.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hv-focus-ring"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Laisser vide pour couvrir tous les scores au-delà du minimum.
                            </p>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                              Résumé automatique
                            </span>
                            <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700">
                              {rangeLabel}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label
                            className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"
                            htmlFor={descriptionId}
                          >
                            Message de contexte
                          </label>
                          <textarea
                            id={descriptionId}
                            rows={3}
                            value={rule?.description || ''}
                            onChange={(event) => updateRiskLevelRuleField(index, 'description', event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y hv-focus-ring"
                          />
                        </div>

                        {issues.length > 0 && (
                          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 space-y-1">
                            {issues.map((issue, issueIndex) => (
                              <p key={`${ruleId}-issue-${issueIndex}`}>• {issue}</p>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
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
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 hv-button hv-button-primary w-full sm:w-auto text-sm sm:text-base"
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
                        className="text-lg font-semibold text-gray-800 border-b border-transparent focus:border-blue-600 focus:outline-none flex-1 hv-focus-ring"
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
