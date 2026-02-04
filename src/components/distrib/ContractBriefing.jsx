import React from '../../react.js';
import { DistribLayout } from './DistribLayout.jsx';

export const ContractBriefing = ({ distribState, onNavigate, activeScreen, onBackToGateway }) => (
  <DistribLayout
    title="Contract briefing"
    subtitle="Préparez les questions clés, l’aide contextuelle et les échanges Compliance avant négociation."
    activeScreen={activeScreen}
    onNavigate={onNavigate}
    onBackToGateway={onBackToGateway}
  >
    <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
        <h2 className="text-lg font-semibold text-gray-900">Questions de cadrage</h2>
        <div className="mt-4 space-y-4">
          {distribState.contractBriefing.questions.map(question => (
            <div key={question.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">{question.label}</p>
              <p className="mt-2 text-xs text-gray-500">{question.hint}</p>
              <button
                type="button"
                onClick={() => onNavigate('distrib-contract-overview')}
                className="mt-3 text-xs font-semibold text-amber-600 hover:underline"
              >
                Voir les clauses associées →
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
          <h2 className="text-lg font-semibold text-gray-900">Aide contextuelle</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Pensez à aligner les incentives avec la politique cadeaux et hospitalité.
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              Vérifiez la présence d’une clause de résiliation pour non-conformité majeure.
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
          <h2 className="text-lg font-semibold text-gray-900">Échanges Compliance</h2>
          <div className="mt-4 space-y-3">
            {distribState.contractBriefing.complianceNotes.map(note => (
              <div key={note.message} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{note.author}</span>
                  <span>{note.time}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{note.message}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300"
          >
            Lancer un nouvel échange
          </button>
        </div>
      </div>
    </section>
  </DistribLayout>
);
