const cloneDeep = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
};

const normalizeStatus = (status) => {
  if (status === 'submitted' || status === 'Submitted') {
    return 'Submitted';
  }
  return 'Draft';
};

export class ConflictError extends Error {
  constructor(message, serverRecord) {
    super(message);
    this.name = 'ConflictError';
    this.serverRecord = serverRecord;
  }
}

const DEFAULT_PROJECTS = [
  {
    ProjectId: 'proj-001',
    Title: 'Projet Hémostase 2026',
    Status: 'Draft',
    OwnerEmail: 'chef.projet@entreprise.com',
    CurrentEditorEmail: 'chef.projet@entreprise.com',
    AnswersJson: {},
    AnalysisJson: {},
    ProgressAnswered: 0,
    ProgressTotal: 42,
    SubmissionDate: null,
    LastAutosaveAt: '2026-01-10T09:20:00.000Z',
    RowVersion: 1,
    CreatedByEmail: 'chef.projet@entreprise.com',
    UpdatedByEmail: 'chef.projet@entreprise.com'
  }
];

const toProjectEntry = (item) => {
  const answers = item?.AnswersJson && typeof item.AnswersJson === 'object' ? item.AnswersJson : {};
  const analysis = item?.AnalysisJson && typeof item.AnalysisJson === 'object' ? item.AnalysisJson : null;

  return {
    id: item.ProjectId,
    projectName: item.Title || 'Projet sans nom',
    status: item.Status === 'Submitted' ? 'submitted' : 'draft',
    answers,
    analysis,
    answeredQuestions: Number(item.ProgressAnswered) || 0,
    totalQuestions: Number(item.ProgressTotal) || 0,
    lastUpdated: item.LastAutosaveAt || new Date().toISOString(),
    submittedAt: item.SubmissionDate || null,
    ownerEmail: item.OwnerEmail || '',
    rowVersion: Number(item.RowVersion) || 1,
    lastModifiedBy: item.UpdatedByEmail || item.CreatedByEmail || ''
  };
};

const toListItem = (project, userEmail) => ({
  ProjectId: project.id,
  Title: project.projectName || 'Projet sans nom',
  Status: normalizeStatus(project.status),
  OwnerEmail: project.ownerEmail || userEmail || '',
  CurrentEditorEmail: userEmail || project.ownerEmail || '',
  AnswersJson: cloneDeep(project.answers || {}),
  AnalysisJson: cloneDeep(project.analysis || {}),
  ProgressAnswered: Number(project.answeredQuestions) || 0,
  ProgressTotal: Number(project.totalQuestions) || 0,
  SubmissionDate: project.status === 'submitted' ? project.submittedAt || new Date().toISOString() : null,
  LastAutosaveAt: new Date().toISOString(),
  RowVersion: Number(project.rowVersion) || 1,
  CreatedByEmail: project.ownerEmail || userEmail || '',
  UpdatedByEmail: userEmail || ''
});

class MockSharePointProvider {
  constructor() {
    this.projects = new Map();
    DEFAULT_PROJECTS.forEach((item) => {
      if (item?.ProjectId) {
        this.projects.set(item.ProjectId, cloneDeep(item));
      }
    });
  }

  async listProjects() {
    return Array.from(this.projects.values()).map(toProjectEntry);
  }

  async upsertProject(project, { expectedRowVersion, userEmail } = {}) {
    if (!project?.id) {
      throw new Error('Projet invalide: id manquant');
    }

    const existing = this.projects.get(project.id);
    if (existing) {
      const currentVersion = Number(existing.RowVersion) || 1;
      if (typeof expectedRowVersion === 'number' && expectedRowVersion > 0 && expectedRowVersion !== currentVersion) {
        throw new ConflictError('Conflit de version détecté.', toProjectEntry(existing));
      }
    }

    const nextVersion = existing ? (Number(existing.RowVersion) || 1) + 1 : 1;
    const nextItem = {
      ...toListItem(project, userEmail),
      RowVersion: nextVersion
    };

    this.projects.set(project.id, nextItem);

    const savedProject = toProjectEntry(nextItem);
    return {
      project: savedProject,
      etag: `W/"${savedProject.id}-${savedProject.rowVersion}"`,
      updatedAt: savedProject.lastUpdated,
      updatedBy: savedProject.lastModifiedBy
    };
  }
}

export class GraphDataProvider {
  async listProjects() {
    throw new Error('GraphDataProvider non configuré: clés API Microsoft Graph requises.');
  }

  async upsertProject() {
    throw new Error('GraphDataProvider non configuré: clés API Microsoft Graph requises.');
  }
}

export const dataProvider = new MockSharePointProvider();
