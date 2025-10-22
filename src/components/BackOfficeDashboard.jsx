import React, { useMemo, useState } from '../react.js';

const TIME_FILTER_OPTIONS = [
  {
    id: 'all',
    label: 'Toute la période',
    computeRange: () => null
  },
  {
    id: '30d',
    label: '30 derniers jours',
    computeRange: () => {
      const end = endOfDay(new Date());
      const start = startOfDay(addDays(end, -29));
      return { start, end };
    }
  },
  {
    id: '90d',
    label: '90 derniers jours',
    computeRange: () => {
      const end = endOfDay(new Date());
      const start = startOfDay(addDays(end, -89));
      return { start, end };
    }
  },
  {
    id: '12m',
    label: '12 derniers mois',
    computeRange: () => {
      const end = endOfDay(new Date());
      const start = startOfDay(addMonths(end, -11));
      return { start, end };
    }
  },
  {
    id: 'custom',
    label: 'Plage personnalisée',
    computeRange: () => null
  }
];

const CHART_COLORS = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#17becf'
];

const numberFormatter = new Intl.NumberFormat('fr-FR');
const decimalFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0
});

const averageFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0
});

const formatDays = (value) => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return `${decimalFormatter.format(value)} jour${Math.abs(value - 1) < 0.001 ? '' : 's'}`;
};

const startOfDay = (date) => {
  const clone = new Date(date.getTime());
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const endOfDay = (date) => {
  const clone = new Date(date.getTime());
  clone.setHours(23, 59, 59, 999);
  return clone;
};

const addDays = (referenceDate, amount) => {
  const clone = new Date(referenceDate.getTime());
  clone.setDate(clone.getDate() + amount);
  return clone;
};

const addMonths = (referenceDate, amount) => {
  const clone = new Date(referenceDate.getTime());
  clone.setMonth(clone.getMonth() + amount);
  return clone;
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const getProjectGeneratedAt = (project) => {
  const candidates = [
    project?.generatedAt,
    project?.metadata?.generatedAt,
    project?.submittedAt,
    project?.lastUpdated
  ];

  for (const candidate of candidates) {
    const parsed = parseDate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
};

const getLeadTeamsFromProject = (project) => {
  const rawValue = project?.answers?.teamLeadTeam;

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }

  if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
    return [rawValue.trim()];
  }

  return [];
};

const getLaunchDate = (project) => {
  const answers = project?.answers || {};
  return parseDate(answers.launchDate || answers.projectLaunchDate);
};

const PieChart = ({ data, colors = CHART_COLORS, size = 180, strokeWidth = 26, title }) => {
  const total = data.reduce((sum, item) => sum + Math.max(item.value, 0), 0);

  if (total <= 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center text-sm text-gray-500">
        <span role="img" aria-label="Aucune donnée">📊</span>
        <p>Aucune donnée exploitable pour ce graphique.</p>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={title || 'Répartition'}
      >
        <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
          <circle
            r={radius}
            fill="transparent"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {data.map((item, index) => {
            const value = Math.max(item.value, 0);
            if (value <= 0) {
              return null;
            }
            const segmentLength = (value / total) * circumference;
            const dashArray = `${segmentLength} ${circumference}`;
            const element = (
              <circle
                key={item.id || item.label || index}
                r={radius}
                fill="transparent"
                stroke={colors[index % colors.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={-cumulative}
                strokeLinecap="butt"
              />
            );
            cumulative += segmentLength;
            return element;
          })}
        </g>
      </svg>
      <div className="grid w-full gap-2 text-sm">
        {data.map((item, index) => {
          const value = Math.max(item.value, 0);
          if (value <= 0) {
            return null;
          }
          const percentage = (value / total) * 100;
          return (
            <div
              key={item.id || item.label || index}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/70 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-8 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                  aria-hidden="true"
                />
                <span className="font-medium text-gray-700">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {numberFormatter.format(value)} · {decimalFormatter.format(percentage)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BarChart = ({
  data,
  valueFormatter = (value) => numberFormatter.format(value),
  unitSuffix = '',
  colors = CHART_COLORS,
  emptyLabel = 'Aucune donnée à afficher'
}) => {
  const cleanedData = data.filter((entry) => Number.isFinite(entry.value) && entry.value > 0);
  const maxValue = cleanedData.reduce((max, entry) => Math.max(max, entry.value), 0);

  if (cleanedData.length === 0 || maxValue <= 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center text-sm text-gray-500">
        <span role="img" aria-label="Aucune donnée">📉</span>
        <p>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cleanedData.map((entry, index) => {
        const percentage = Math.max((entry.value / maxValue) * 100, 4);
        return (
          <div key={entry.id || entry.label || index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{entry.label}</span>
              <span className="font-semibold text-gray-900">
                {valueFormatter(entry.value)}{unitSuffix}
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors[index % colors.length]
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const buildTeamOptions = (projects = []) => {
  const counts = new Map();
  projects.forEach((project) => {
    const teams = getLeadTeamsFromProject(project);
    if (teams.length === 0) {
      counts.set('not_set', (counts.get('not_set') || 0) + 1);
      return;
    }
    teams.forEach((team) => {
      counts.set(team, (counts.get(team) || 0) + 1);
    });
  });

  if (!counts.has('not_set')) {
    counts.set('not_set', 0);
  }

  const entries = Array.from(counts.entries()).map(([id, count]) => ({
    id,
    label: id === 'not_set' ? 'Équipe non renseignée' : id,
    count
  }));

  entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return entries;
};

const formatDateRangeSummary = (range, fallbackLabel) => {
  if (!range) {
    return fallbackLabel;
  }

  const formatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
  return `${formatter.format(range.start)} – ${formatter.format(range.end)}`;
};

export const BackOfficeDashboard = ({ projects = [], teams = [] }) => {
  const [selectedLeadTeam, setSelectedLeadTeam] = useState('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const sanitizedProjects = useMemo(
    () => (Array.isArray(projects) ? projects.filter((project) => !(project && project.isDemo)) : []),
    [projects]
  );

  const teamOptions = useMemo(() => buildTeamOptions(sanitizedProjects), [sanitizedProjects]);
  const timeOption = useMemo(
    () => TIME_FILTER_OPTIONS.find((option) => option.id === selectedTimeFilter) || TIME_FILTER_OPTIONS[0],
    [selectedTimeFilter]
  );

  const computedRange = useMemo(() => {
    if (timeOption.id === 'custom') {
      const start = customStart ? startOfDay(new Date(customStart)) : null;
      const end = customEnd ? endOfDay(new Date(customEnd)) : null;

      if (start && end && start > end) {
        return null;
      }

      if (!start && !end) {
        return null;
      }

      return {
        start: start || startOfDay(addDays(end || new Date(), -29)),
        end: end || endOfDay(new Date())
      };
    }

    return timeOption.computeRange ? timeOption.computeRange() : null;
  }, [timeOption, customStart, customEnd]);

  const filteredProjects = useMemo(() => {
    const list = sanitizedProjects;

    return list.filter((project) => {
      if (!project) {
        return false;
      }

      if (selectedLeadTeam !== 'all') {
        const teamsForProject = getLeadTeamsFromProject(project);
        const target = selectedLeadTeam === 'not_set' ? teamsForProject.length === 0 : teamsForProject.includes(selectedLeadTeam);
        if (!target) {
          return false;
        }
      }

      if (computedRange) {
        const generatedAt = getProjectGeneratedAt(project);
        if (!generatedAt) {
          return false;
        }

        if (generatedAt < computedRange.start || generatedAt > computedRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [sanitizedProjects, selectedLeadTeam, computedRange]);

  const leadTeamDistribution = useMemo(() => {
    const counts = new Map();
    filteredProjects.forEach((project) => {
      const teamsForProject = getLeadTeamsFromProject(project);
      if (teamsForProject.length === 0) {
        counts.set('Équipe non renseignée', (counts.get('Équipe non renseignée') || 0) + 1);
        return;
      }
      teamsForProject.forEach((team) => {
        counts.set(team, (counts.get(team) || 0) + 1);
      });
    });

    const entries = Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
    entries.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    return {
      total: entries.reduce((sum, entry) => sum + entry.value, 0),
      entries
    };
  }, [filteredProjects]);

  const averageDelay = useMemo(() => {
    let totalDays = 0;
    let count = 0;

    filteredProjects.forEach((project) => {
      const submissionDate = getProjectGeneratedAt(project) || parseDate(project?.submittedAt);
      const launchDate = getLaunchDate(project);

      if (!submissionDate || !launchDate) {
        return;
      }

      const diffInMs = launchDate.getTime() - submissionDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (!Number.isFinite(diffInDays)) {
        return;
      }

      const sanitized = Math.max(diffInDays, 0);
      totalDays += sanitized;
      count += 1;
    });

    return {
      average: count > 0 ? totalDays / count : 0,
      count
    };
  }, [filteredProjects]);

  const riskSeverityAverages = useMemo(() => {
    const totals = new Map();

    filteredProjects.forEach((project) => {
      const risks = Array.isArray(project?.analysis?.risks) ? project.analysis.risks : [];
      if (risks.length === 0) {
        return;
      }
      risks.forEach((risk) => {
        const rawLevel = typeof risk?.level === 'string' && risk.level.trim().length > 0 ? risk.level.trim() : 'Non classé';
        const normalizedLevel = rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1);
        totals.set(normalizedLevel, (totals.get(normalizedLevel) || 0) + 1);
      });
    });

    const entries = Array.from(totals.entries()).map(([label, totalRisks]) => ({
      id: label,
      label,
      totalRisks,
      value: filteredProjects.length > 0 ? totalRisks / filteredProjects.length : 0
    }));

    entries.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    return {
      entries
    };
  }, [filteredProjects]);

  const riskLevelDistribution = useMemo(() => {
    const counts = new Map();
    filteredProjects.forEach((project) => {
      const complexity = typeof project?.analysis?.complexity === 'string' && project.analysis.complexity.trim().length > 0
        ? project.analysis.complexity.trim()
        : 'Non évalué';
      counts.set(complexity, (counts.get(complexity) || 0) + 1);
    });

    const entries = Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
    entries.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    return {
      total: entries.reduce((sum, entry) => sum + entry.value, 0),
      entries
    };
  }, [filteredProjects]);

  const solicitationsByTeam = useMemo(() => {
    const counts = new Map();
    const teamNames = new Map(
      Array.isArray(teams)
        ? teams.map((team) => [team.id, team.name || team.id])
        : []
    );

    filteredProjects.forEach((project) => {
      const collected = new Set();
      const risks = Array.isArray(project?.analysis?.risks) ? project.analysis.risks : [];
      risks.forEach((risk) => {
        if (typeof risk?.teamId === 'string' && risk.teamId) {
          collected.add(risk.teamId);
        }
        if (Array.isArray(risk?.teams)) {
          risk.teams.forEach((teamId) => {
            if (typeof teamId === 'string' && teamId) {
              collected.add(teamId);
            }
          });
        }
      });

      const analysisTeams = Array.isArray(project?.analysis?.teams) ? project.analysis.teams : [];
      analysisTeams.forEach((teamId) => {
        if (typeof teamId === 'string' && teamId) {
          collected.add(teamId);
        }
      });

      collected.forEach((teamId) => {
        counts.set(teamId, (counts.get(teamId) || 0) + 1);
      });
    });

    const entries = Array.from(counts.entries()).map(([teamId, value]) => ({
      id: teamId,
      label: teamNames.get(teamId) || teamId,
      value
    }));

    entries.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    return {
      total: entries.reduce((sum, entry) => sum + entry.value, 0),
      entries
    };
  }, [filteredProjects, teams]);

  const leadTeamFilterLabel = useMemo(() => {
    if (selectedLeadTeam === 'all') {
      return 'Toutes les équipes';
    }
    if (selectedLeadTeam === 'not_set') {
      return 'Équipe non renseignée';
    }
    return selectedLeadTeam;
  }, [selectedLeadTeam]);

  const effectiveRangeLabel = useMemo(() => {
    if (timeOption.id === 'custom') {
      if (!customStart && !customEnd) {
        return 'Intervalle personnalisé';
      }
      return formatDateRangeSummary(computedRange, 'Intervalle personnalisé');
    }
    return timeOption.label;
  }, [timeOption, customStart, customEnd, computedRange]);

  const totalObservedRisks = useMemo(
    () => riskSeverityAverages.entries.reduce((sum, entry) => sum + entry.totalRisks, 0),
    [riskSeverityAverages.entries]
  );

  return (
    <article className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-600">
          Analysez en un coup d'œil vos projets soumis : filtrez par équipe lead et période pour prendre des décisions éclairées.
        </p>
      </header>

      <section aria-label="Filtres du tableau de bord" className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="dashboard-lead-team-filter" className="text-sm font-medium text-gray-700">
              Filtrer par équipe lead
            </label>
            <select
              id="dashboard-lead-team-filter"
              value={selectedLeadTeam}
              onChange={(event) => setSelectedLeadTeam(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">Toutes les équipes ({numberFormatter.format(sanitizedProjects.length)})</option>
              <option value="not_set">Équipe non renseignée ({numberFormatter.format(teamOptions.find((option) => option.id === 'not_set')?.count || 0)})</option>
              {teamOptions
                .filter((option) => option.id !== 'not_set')
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} ({numberFormatter.format(option.count)})
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="dashboard-time-filter" className="text-sm font-medium text-gray-700">
              Période d'analyse
            </label>
            <select
              id="dashboard-time-filter"
              value={selectedTimeFilter}
              onChange={(event) => setSelectedTimeFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {TIME_FILTER_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {timeOption.id === 'custom' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="dashboard-custom-start" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date de début
              </label>
              <input
                id="dashboard-custom-start"
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                max={customEnd || undefined}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="dashboard-custom-end" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date de fin
              </label>
              <input
                id="dashboard-custom-end"
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                min={customStart || undefined}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Filtres actifs
          </span>
          <span>
            {numberFormatter.format(filteredProjects.length)} projet{filteredProjects.length > 1 ? 's' : ''} · {leadTeamFilterLabel} · {effectiveRangeLabel}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <p className="text-sm font-medium text-blue-800">Nombre de projets soumis</p>
          <p className="mt-3 text-4xl font-bold text-blue-900">
            {numberFormatter.format(filteredProjects.length)}
          </p>
          <p className="mt-2 text-xs text-blue-700">
            Sur un total de {numberFormatter.format(sanitizedProjects.length)} projets importés.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
          <p className="text-sm font-medium text-emerald-800">Délai moyen entre soumission et lancement cible</p>
          <p className="mt-3 text-3xl font-bold text-emerald-900">
            {formatDays(averageDelay.average)}
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            Basé sur {numberFormatter.format(averageDelay.count)} projet{averageDelay.count > 1 ? 's' : ''} disposant des deux dates.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Répartition des projets">
        <article className="rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-inner">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Répartition des projets par équipe lead</h3>
            <p className="text-sm text-gray-500">Visualisez le poids relatif de chaque équipe dans les projets qualifiés.</p>
          </header>
          <PieChart
            data={leadTeamDistribution.entries}
            title="Répartition des projets par équipe lead"
          />
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-inner">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Répartition par niveau de risque</h3>
            <p className="text-sm text-gray-500">Classement issu de la pondération des risques détectés par les règles métier.</p>
          </header>
          <PieChart
            data={riskLevelDistribution.entries}
            title="Répartition par niveau de risque"
          />
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Analyse des risques">
        <article className="rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-inner">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Nombre moyen de risques par gravité</h3>
            <p className="text-sm text-gray-500">
              Moyenne calculée sur l'ensemble des projets filtrés (même si aucun risque n'est détecté sur un projet donné).
            </p>
          </header>
          <BarChart
            data={riskSeverityAverages.entries.map((entry) => ({
              ...entry,
              value: entry.value,
              label: entry.label,
              totalRisks: entry.totalRisks
            }))}
            valueFormatter={(value) => averageFormatter.format(value)}
            unitSuffix=" risque(s)/projet"
            emptyLabel="Aucun risque n'a été identifié sur la période filtrée."
          />
          {riskSeverityAverages.entries.length > 0 && (
            <p className="mt-4 text-xs text-gray-500">
              Total observé : {numberFormatter.format(totalObservedRisks)} risque{totalObservedRisks > 1 ? 's' : ''} sur {numberFormatter.format(filteredProjects.length)} projet{filteredProjects.length > 1 ? 's' : ''}.
            </p>
          )}
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-inner">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Nombre de sollicitations par équipe compliance</h3>
            <p className="text-sm text-gray-500">
              Compte le nombre de projets nécessitant l'intervention de chaque équipe compliance.
            </p>
          </header>
          <BarChart
            data={solicitationsByTeam.entries}
            unitSuffix=" projet(s)"
            emptyLabel="Aucune sollicitation compliance sur les filtres sélectionnés."
          />
        </article>
      </section>
    </article>
  );
};

