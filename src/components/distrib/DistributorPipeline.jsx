import React from '../../react.js';
import { DistribLayout } from './DistribLayout.jsx';

const statusBadgeStyles = {
  Sourcing: 'border-slate-200 bg-slate-50 text-slate-600',
  Qualification: 'border-amber-200 bg-amber-50 text-amber-700',
  Négociation: 'border-blue-200 bg-blue-50 text-blue-700',
  Signature: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Audit: 'border-red-200 bg-red-50 text-red-700'
};

export const DistributorPipeline = ({ distribState, onNavigate, activeScreen, onBackToGateway }) => (
  <DistribLayout
    title="Distributor pipeline"
    subtitle="Suivi des distributeurs, statuts, scores et signaux de risque pour arbitrer les prochains jalons."
    activeScreen={activeScreen}
    onNavigate={onNavigate}
    onBackToGateway={onBackToGateway}
  >
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Liste distributeurs</h2>
          <button
            type="button"
            onClick={() => onNavigate('distrib-evaluation')}
            className="text-sm font-semibold text-amber-600 hover:underline"
          >
            Lancer une évaluation
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Distributeur</th>
                <th className="px-4 py-3">Pays</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">No-go</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {distribState.distributors.map(distributor => (
                <tr key={distributor.id}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{distributor.name}</td>
                  <td className="px-4 py-3 text-gray-600">{distributor.country}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        statusBadgeStyles[distributor.status] || 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      {distributor.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{distributor.score}/100</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        distributor.noGo
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {distributor.noGo ? 'No-go' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
          <h2 className="text-lg font-semibold text-gray-900">Scores & signaux</h2>
          <div className="mt-4 space-y-3">
            {distribState.distributors.map(distributor => (
              <div key={distributor.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{distributor.name}</p>
                  <span className="text-sm font-semibold text-gray-700">{distributor.score}/100</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Risque: {distributor.riskLevel} · Compliance owner: {distributor.complianceOwner}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-amber-800">Décisions rapides</h3>
          <ul className="mt-3 space-y-2 text-xs text-amber-700">
            <li>Prioriser l’audit Alpine Partners (score &lt; 65).</li>
            <li>Valider les clauses anticorruption avant signature Nordic Gate.</li>
            <li>Activer le comparatif multi-distributeurs pour le comité.</li>
          </ul>
        </div>
      </div>
    </section>
  </DistribLayout>
);
