export const sanitizeFileName = (value, fallback = 'projet-compliance') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  let normalized = value.trim();
  if (normalized.length === 0) {
    return fallback;
  }

  try {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (error) {
    normalized = normalized.replace(/[^\w\s-]/g, '');
  }

  const sanitized = normalized
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return sanitized.length > 0 ? sanitized : fallback;
};

export const getTeamPriority = (analysis, teamId) => {
  if (!analysis) {
    return 'A réaliser';
  }

  const priorityWeights = {
    'A réaliser': 1,
    'A anticiper': 2,
    'A particulièrement anticiper': 3
  };

  const getWeight = (priority) => priorityWeights[priority] || 0;

  const risks = Array.isArray(analysis.risks) ? analysis.risks : [];
  let bestPriority = 'A réaliser';

  risks.forEach(risk => {
    const associatedTeams = new Set();

    if (risk?.teamId) {
      associatedTeams.add(risk.teamId);
    }

    if (Array.isArray(risk?.teams)) {
      risk.teams.forEach(team => associatedTeams.add(team));
    }

    if (!associatedTeams.has(teamId)) {
      return;
    }

    const riskPriority = risk?.priority || 'A réaliser';
    if (getWeight(riskPriority) > getWeight(bestPriority)) {
      bestPriority = riskPriority;
    }
  });

  return bestPriority;
};

export const buildProjectExport = ({ projectName, answers } = {}) => {
  const normalizedAnswers =
    answers && typeof answers === 'object' ? answers : {};

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    project: {
      name: projectName || 'Projet sans nom',
      answers: normalizedAnswers
    }
  };
};

export const downloadProjectJson = (projectData, { projectName } = {}) => {
  let jsonString = '';
  let inferredName = projectName;

  if (typeof projectData === 'string') {
    jsonString = projectData;
  } else if (projectData) {
    inferredName = inferredName || projectData?.project?.name;
    try {
      jsonString = JSON.stringify(projectData, null, 2);
    } catch (error) {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('[projectExport] Impossible de sérialiser le projet :', error);
      }
      jsonString = JSON.stringify(
        {
          version: 1,
          project: {
            name: projectData?.project?.name || 'Projet sans nom',
            answers: {}
          }
        },
        null,
        2
      );
    }
  }

  if (!jsonString) {
    return false;
  }

  const fileNameBase = sanitizeFileName(inferredName || 'Projet compliance');
  const fileName = `${fileNameBase}.json`;

  if (
    typeof document === 'undefined'
    || typeof URL === 'undefined'
    || typeof URL.createObjectURL !== 'function'
    || typeof Blob === 'undefined'
  ) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[projectExport] Environnement incompatible avec le téléchargement de fichiers.');
    }
    return false;
  }

  try {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => {
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    }, 0);
    return true;
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[projectExport] Téléchargement du projet impossible :', error);
    }
    return false;
  }
};

export const exportProjectToFile = ({ projectName, answers } = {}) => {
  const exportPayload = buildProjectExport({
    projectName,
    answers
  });

  return downloadProjectJson(exportPayload, { projectName });
};
