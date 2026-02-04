import React, { useMemo } from '../react.js';
import worldMap from '../data/world map.svg';
import cpi2024 from '../data/ICP 2024.json';
import {
  AlertTriangle,
  CheckCircle,
  Compass,
  FileText,
  Lock,
  Target,
  Users
} from './icons.js';
import {
  distribNavigatorPillars,
  distribNavigatorComplianceWorkflow,
  distribNavigatorContractWorkflow,
  distribNavigatorOperationalInsights
} from '../data/distribNavigator.js';

const parseScore = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const getRiskLabel = (score) => {
  if (score == null) {
    return { label: 'Donnée indisponible', tone: 'text-gray-500' };
  }
  if (score >= 70) {
    return { label: 'Risque faible', tone: 'text-emerald-600' };
  }
  if (score >= 50) {
    return { label: 'Risque modéré', tone: 'text-amber-600' };
  }
  return { label: 'Risque élevé', tone: 'text-red-600' };
};

export const DistribHomeScreen = () => {
  const { topIntegrity, priorityWatch } = useMemo(() => {
    const normalized = (Array.isArray(cpi2024) ? cpi2024 : [])
      .map((entry) => ({
        country: entry['Country / Territory'] ?? entry.country ?? 'Pays non renseigné',
        iso3: entry.ISO3 ?? entry.iso3 ?? '',
        score: parseScore(entry['CPI 2024 score'] ?? entry.score)
      }))
      .filter((entry) => entry.country);

    const scored = normalized.filter((entry) => entry.score != null);

    const topIntegrity = [...scored]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const priorityWatch = [...scored]
      .sort((a, b) => a.score - b.score)
      .slice(0, 6);

    return { topIntegrity, priorityWatch };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10">
      <header className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-indigo-700">
          <Compass className="h-4 w-4" />
          Distrib Navigator
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
          Pilotez la distribution internationale avec une gouvernance claire et collaborative.
        </h1>
        <p className="mt-4 max-w-3xl text-base text-slate-600">
          Distrib Navigator accompagne les Area Managers dans la prospection, la sélection et le
          suivi des distributeurs pharmaceutiques, avec un pilotage structuré des risques
          compliance et des décisions contractuelles.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow">
            <Users className="h-4 w-4 text-indigo-500" />
            Collaboration Area Manager & Compliance
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow">
            <Lock className="h-4 w-4 text-emerald-500" />
            Gouvernance risques intégrée
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow">
            <Target className="h-4 w-4 text-amber-500" />
            Décisions tracées & comparables
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Compass className="h-4 w-4 text-indigo-500" />
            Panorama géopolitique & corruption
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Combinez la carte monde et l’indice CPI 2024 pour hiérarchiser les pays, anticiper les
            sanctions et ajuster la prospection.
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <img
              src={worldMap}
              alt="Carte mondiale pour la prospection des distributeurs"
              className="h-64 w-full object-contain"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              Top intégrité (CPI 2024)
            </div>
            <ul className="mt-3 space-y-2 text-sm text-emerald-800">
              {topIntegrity.map((entry) => (
                <li key={`${entry.country}-${entry.iso3}`} className="flex items-center justify-between">
                  <span>{entry.country}</span>
                  <span className="font-semibold">{entry.score}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Zones prioritaires (risque élevé)
            </div>
            <ul className="mt-3 space-y-2 text-sm text-red-700">
              {priorityWatch.map((entry) => {
                const risk = getRiskLabel(entry.score);
                return (
                  <li key={`${entry.country}-${entry.iso3}`} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span>{entry.country}</span>
                      <span className="font-semibold">{entry.score}</span>
                    </div>
                    <span className={`text-xs ${risk.tone}`}>{risk.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {distribNavigatorPillars.map((pillar) => (
          <article key={pillar.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{pillar.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{pillar.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {pillar.highlights.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Users className="h-4 w-4 text-indigo-500" />
            Processus de sélection avec compliance
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Un parcours guidé avec des questions dynamiques pour comparer les distributeurs,
            consolider les notes et gérer les no-go.
          </p>
          <div className="mt-4 grid gap-3">
            {distribNavigatorComplianceWorkflow.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Étape {index + 1}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{step.title}</div>
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText className="h-4 w-4 text-indigo-500" />
            Briefing & contrats
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Préparez les contrats de distribution comme un levier stratégique de risk management.
          </p>
          <div className="mt-4 grid gap-3">
            {distribNavigatorContractWorkflow.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Focus {index + 1}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{step.title}</div>
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {distribNavigatorOperationalInsights.map((insight) => (
          <article key={insight.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{insight.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{insight.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
};
