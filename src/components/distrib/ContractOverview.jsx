import React from '../../react.js';
import { DistribLayout } from './DistribLayout.jsx';

export const ContractOverview = ({ distribState, onNavigate, activeScreen, onBackToGateway }) => (
  <DistribLayout
    title="Vue d’ensemble du contrat"
    subtitle="Retrouvez les clauses par thème et accédez rapidement aux sections sensibles."
    activeScreen={activeScreen}
    onNavigate={onNavigate}
    onBackToGateway={onBackToGateway}
  >
    <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6">
        {distribState.contractOverview.map(section => (
          <div key={section.theme} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{section.theme}</h2>
              <button
                type="button"
                className="text-sm font-semibold text-amber-600 hover:underline"
              >
                Accéder aux clauses
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {section.clauses.map(clause => (
                <span
                  key={clause}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600"
                >
                  {clause}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
          <h2 className="text-lg font-semibold text-gray-900">Accès rapide</h2>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('distrib-contract-briefing')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-amber-200 hover:text-amber-700"
            >
              Préparer un briefing contrat
            </button>
            <button
              type="button"
              onClick={() => onNavigate('distrib-contract-amendments')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-amber-200 hover:text-amber-700"
            >
              Suivre les avenants actifs
            </button>
            <button
              type="button"
              onClick={() => onNavigate('distrib-audit')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-amber-200 hover:text-amber-700"
            >
              Planifier un audit compliance
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-emerald-800">Clause critique détectée</h3>
          <p className="mt-2 text-xs text-emerald-700">
            Le seuil de résiliation doit être revu pour la zone MENA avant la signature.
          </p>
        </div>
      </div>
    </section>
  </DistribLayout>
);
