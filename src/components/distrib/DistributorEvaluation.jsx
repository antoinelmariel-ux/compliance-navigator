import React from '../../react.js';
import { DistribLayout } from './DistribLayout.jsx';

const statusStyles = {
  'Validé': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'En revue': 'border-amber-200 bg-amber-50 text-amber-700',
  'À compléter': 'border-red-200 bg-red-50 text-red-600'
};

const ProgressBar = ({ value }) => (
  <div className="h-2 w-full rounded-full bg-gray-100">
    <div
      className="h-full rounded-full bg-amber-500"
      style={{ width: `${Math.round(value * 100)}%` }}
    />
  </div>
);

export const DistributorEvaluation = ({ distribState, onNavigate, activeScreen, onBackToGateway }) => (
  <DistribLayout
    title="Distributor evaluation"
    subtitle="Questionnaire dynamique pour l’Area Manager et la Compliance afin de cadrer les risques tiers."
    activeScreen={activeScreen}
    onNavigate={onNavigate}
    onBackToGateway={onBackToGateway}
  >
    <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6">
        {distribState.evaluationWorkstreams.map(stream => (
          <div key={stream.role} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{stream.role}</h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {Math.round(stream.progress * 100)}% complété
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar value={stream.progress} />
            </div>
            <ul className="mt-4 space-y-3">
              {stream.questions.map(question => (
                <li key={question.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{question.label}</p>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        statusStyles[question.status] || 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      {question.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{question.help}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
          <h2 className="text-lg font-semibold text-gray-900">Synthèse dynamique</h2>
          <p className="mt-2 text-sm text-gray-500">
            Les réponses alimentent automatiquement la matrice de risque et les alertes de contrat.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              2 questions compliance requièrent une validation Legal avant signature.
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Les objectifs commerciaux sont alignés avec la capacité terrain déclarée.
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Prochaines actions</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>Envoyer la checklist de preuves AML à Nordic Gate.</li>
            <li>Planifier un call compliance avec Alpine Partners.</li>
            <li>Mettre à jour la scoring matrix après validation Area Manager.</li>
          </ul>
        </div>
      </div>
    </section>
  </DistribLayout>
);
