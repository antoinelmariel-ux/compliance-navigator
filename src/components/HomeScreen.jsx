import React, { useMemo } from '../react.js';
import {
  Plus,
  Target,
  Rocket,
  Compass,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  Eye,
  Sparkles,
  AlertTriangle,
  Edit,
  Save
} from './icons.js';

const formatDate = (isoDate) => {
  if (!isoDate) {
    return 'Date inconnue';
  }

  try {
    return new Date(isoDate).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Date inconnue';
  }
};

const complexityColors = {
  Faible: 'hv-complexity--low',
  Modérée: 'hv-complexity--moderate',
  Élevée: 'hv-complexity--high'
};

const statusStyles = {
  draft: {
    label: 'Brouillon en cours',
    className: 'hv-status-badge--draft'
  },
  submitted: {
    label: 'Synthèse finalisée',
    className: 'hv-status-badge--submitted'
  }
};

const computeProgress = (project) => {
  if (!project || typeof project.totalQuestions !== 'number' || project.totalQuestions <= 0) {
    return null;
  }

  const answeredCountRaw =
    typeof project.answeredQuestions === 'number'
      ? project.answeredQuestions
      : Math.max((project.lastQuestionIndex ?? 0) + 1, 0);

  const answeredCount = Math.min(answeredCountRaw, project.totalQuestions);

  return Math.round((answeredCount / project.totalQuestions) * 100);
};

export const HomeScreen = ({
  projects = [],
  onStartNewProject,
  onOpenProject,
  onDeleteProject,
  onShowProjectShowcase
}) => {
  const hasProjects = projects.length > 0;

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [projects]);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8 hv-home-shell hv-background">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="rounded-3xl shadow-xl p-6 sm:p-10 hv-surface hv-hero-card" role="banner">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <span className="hv-hero-chip">
                <Target className="w-4 h-4 mr-2" /> Votre copilote compliance
              </span>
              <h1 className="hv-hero-title leading-tight">
                Anticipez les besoins compliance de vos projets en quelques minutes
              </h1>
              <p className="hv-hero-subtitle leading-relaxed max-w-2xl">
                Compliance Advisor vous guide pas à pas pour qualifier votre initiative, identifier les interlocuteurs à mobiliser et sécuriser vos délais réglementaires.
              </p>
              <div className="flex flex-col sm:flex-row gap-3" role="group" aria-label="Actions principales">
                <button
                  type="button"
                  onClick={onStartNewProject}
                  className="hv-button hv-button-primary hv-button-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Créer un nouveau projet
                </button>
                {hasProjects && (
                  <button
                    type="button"
                    onClick={() => onOpenProject(sortedProjects[0]?.id)}
                    className="hv-button hv-button-ghost hv-button-lg hv-focus-ring"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Reprendre le dernier projet
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm text-gray-600">
              <div className="rounded-2xl p-4 hv-surface hv-info-tile" role="listitem">
                <p className="flex items-center">
                  <Rocket className="w-5 h-5 mr-2" /> Démarrez simplement
                </p>
                <p className="mt-2 leading-relaxed">
                  Un questionnaire dynamique pour cadrer votre projet et qualifier les impacts compliance.
                </p>
              </div>
              <div className="rounded-2xl p-4 hv-surface hv-info-tile" role="listitem">
                <p className="flex items-center">
                  <Compass className="w-5 h-5 mr-2" /> Visualisez la feuille de route
                </p>
                <p className="mt-2 leading-relaxed">
                  Une synthèse claire avec le niveau de complexité, les équipes à mobiliser et les délais recommandés.
                </p>
              </div>
              <div className="rounded-2xl p-4 hv-surface hv-info-tile" role="listitem">
                <p className="flex items-center">
                  <Users className="w-5 h-5 mr-2" /> Collaborez efficacement
                </p>
                <p className="mt-2 leading-relaxed">
                  Partagez la synthèse avec les parties prenantes pour sécuriser vos points de passage.
                </p>
              </div>
              <div className="rounded-2xl p-4 hv-surface hv-info-tile" role="listitem">
                <p className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" /> Gardez une trace
                </p>
                <p className="mt-2 leading-relaxed">
                  Retrouvez à tout moment les projets déjà soumis et mettez-les à jour si nécessaire.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="projects-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="projects-heading" className="text-2xl font-bold text-gray-900">
                Vos projets enregistrés
              </h2>
              <p className="text-sm text-gray-600">
                Accédez aux brouillons et aux synthèses finalisées pour les reprendre à tout moment.
              </p>
            </div>
            <span className="hv-badge hv-count-badge">
              <CheckCircle className="w-4 h-4 mr-2" /> {projects.length} projet{projects.length > 1 ? 's' : ''}
            </span>
          </div>

          {!hasProjects && (
            <div className="rounded-3xl p-8 text-center text-gray-600 hv-surface hv-empty-state" role="status" aria-live="polite">
              <p className="text-lg font-medium text-gray-800">Aucun projet enregistré pour le moment.</p>
              <p className="mt-2">Lancez-vous dès maintenant pour préparer votre première synthèse compliance.</p>
              <button
                type="button"
                onClick={onStartNewProject}
                className="mt-4 hv-button hv-button-primary hv-button-lg"
              >
                <Plus className="w-4 h-4 mr-2" /> Créer un projet
              </button>
            </div>
          )}

          {hasProjects && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
              {sortedProjects.map(project => {
                const complexity = project.analysis?.complexity;
                const teamsCount = project.analysis?.relevantTeams?.length ?? 0;
                const risksCount = project.analysis?.risks?.length ?? 0;
                const projectStatus = statusStyles[project.status] || statusStyles.submitted;
                const progress = computeProgress(project);
                const isDraft = project.status === 'draft';

                return (
                  <article
                    key={project.id}
                    className="rounded-2xl p-6 transition-all hv-surface hv-project-card"
                    role="listitem"
                    aria-label={`Projet ${project.projectName || 'sans nom'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                          <span>{project.projectName || 'Projet sans nom'}</span>
                          {project.isDemo && (
                            <span className="hv-badge hv-demo-badge">Projet démo</span>
                          )}
                        </h3>
                        <p className="text-sm hv-project-card__meta mt-1">
                          Dernière mise à jour : {formatDate(project.lastUpdated || project.submittedAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`hv-badge ${projectStatus.className}`.trim()}>{projectStatus.label}</span>
                        {complexity && (
                          <span className={`hv-badge ${complexityColors[complexity] || ''}`.trim()}>
                            Complexité : {complexity}
                          </span>
                        )}
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium text-gray-700">{Object.keys(project.answers || {}).length} réponse{Object.keys(project.answers || {}).length > 1 ? 's' : ''}</span>
                      </div>
                      {progress !== null && (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          <span>{progress}% du questionnaire complété</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{teamsCount} équipe{teamsCount > 1 ? 's' : ''} recommandée{teamsCount > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{risksCount} risque{risksCount > 1 ? 's' : ''} identifié{risksCount > 1 ? 's' : ''}</span>
                      </div>
                    </dl>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenProject(project.id)}
                        className={`hv-button hv-button-lg ${isDraft ? 'hv-button-primary' : 'hv-button-neutral'}`}
                      >
                        {isDraft ? <Edit className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {isDraft ? 'Continuer le questionnaire' : 'Consulter la synthèse'}
                      </button>
                      {onShowProjectShowcase && (
                        <button
                          type="button"
                          onClick={() => onShowProjectShowcase(project.id)}
                          className="hv-button hv-button-ghost hv-button-lg hv-focus-ring"
                        >
                          <Sparkles className="w-4 h-4 mr-2" /> Vitrine du projet
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
