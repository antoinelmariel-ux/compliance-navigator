import React from '../../react.js';
import { DistribLayout } from './DistribLayout.jsx';

export const DistributorAudit = ({ distribState, onNavigate, activeScreen, onBackToGateway }) => (
  <DistribLayout
    title="Audits distributeurs"
    subtitle="Suivez les audits, scores et plans d’action pour sécuriser la conformité tiers."
    activeScreen={activeScreen}
    onNavigate={onNavigate}
    onBackToGateway={onBackToGateway}
  >
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        {distribState.audits.map(audit => (
          <div key={audit.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{audit.distributor}</h2>
              <span className="text-sm font-semibold text-gray-700">Score {audit.score}/100</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">Statut: {audit.status}</p>
            <p className="mt-1 text-xs text-gray-400">Prochaine revue : {audit.nextReview}</p>
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Plan d’action</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                {audit.actions.map(action => (
                  <li key={action} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
          <h2 className="text-lg font-semibold text-gray-900">Synthèse audits</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              1 audit critique nécessite un comité de validation.
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              2 plans d’action sont alignés avec la roadmap compliance.
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Checklist prochaine revue</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>Valider la preuve de formation anticorruption.</li>
            <li>Analyser l’évolution des commissions trimestrielles.</li>
            <li>Planifier un audit sur site pour Q2.</li>
          </ul>
          <button
            type="button"
            onClick={() => onNavigate('distrib-contract-briefing')}
            className="mt-4 w-full rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300"
          >
            Préparer le briefing audit
          </button>
        </div>
      </div>
    </section>
  </DistribLayout>
);
