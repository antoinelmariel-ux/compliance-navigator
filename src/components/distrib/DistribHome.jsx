import React from '../../react.js';
import { DistribLayout, distribNavItems } from './DistribLayout.jsx';

const StatCard = ({ label, value, hint }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hv-surface">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

const StageChip = ({ label, count }) => (
  <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
    <span className="text-sm font-semibold text-amber-800">{label}</span>
    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-amber-700">
      {count}
    </span>
  </div>
);

export const DistribHome = ({ distribState, onNavigate, activeScreen, onBackToGateway }) => (
  <DistribLayout
    title="Tableau de bord distrib"
    subtitle="Suivez le pipeline distributeurs, les risques pays et les décisions contractuelles clés."
    activeScreen={activeScreen}
    onNavigate={onNavigate}
    onBackToGateway={onBackToGateway}
  >
    <section className="grid gap-4 md:grid-cols-4">
      <StatCard
        label="Distributeurs actifs"
        value={distribState.summary.activeDistributors}
        hint="Sous contrat et en suivi."
      />
      <StatCard
        label="Pays couverts"
        value={distribState.summary.countriesCovered}
        hint="Priorités compliance incluses."
      />
      <StatCard
        label="Audits en cours"
        value={distribState.summary.auditsInProgress}
        hint="Plans d’action ouverts."
      />
      <StatCard
        label="Contrats à renouveler"
        value={distribState.summary.contractsExpiring}
        hint="Fin de contrat < 6 mois."
      />
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pipeline distributeurs</h2>
          <button
            type="button"
            onClick={() => onNavigate('distrib-pipeline')}
            className="text-sm font-semibold text-amber-600 hover:underline"
          >
            Voir le détail
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {distribState.pipelineStages.map(stage => (
            <StageChip key={stage.id} label={stage.label} count={stage.count} />
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
          Dernière mise à jour : aujourd’hui à 09:30 · 2 nouveaux dossiers à qualifier.
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Countries à risque</h2>
          <button
            type="button"
            onClick={() => onNavigate('distrib-country-intelligence')}
            className="text-sm font-semibold text-amber-600 hover:underline"
          >
            Intelligence pays
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {distribState.countryIntelligence.map(country => (
            <li
              key={country.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{country.name}</p>
                <p className="text-xs text-gray-500">{country.keyRegulations.join(' · ')}</p>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {country.riskLevel}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Comparaison multi-distributeurs</h2>
          <button
            type="button"
            onClick={() => onNavigate('distrib-pipeline')}
            className="text-sm font-semibold text-amber-600 hover:underline"
          >
            Gérer les scores
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Distributeur</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Couverture</th>
                <th className="px-4 py-3">No-go</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {distribState.comparisons.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.score}/100</td>
                  <td className="px-4 py-3 text-gray-600">{item.coverage}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        item.noGo
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {item.noGo ? 'No-go' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Activez le mode comparaison pour aligner les scores compliance et commerciaux.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Accès rapide</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {distribNavItems
            .filter(item => item.id !== 'distrib-home')
            .map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-amber-200 hover:text-amber-700"
              >
                <span>{item.label}</span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
        </div>
      </div>
    </section>
  </DistribLayout>
);
