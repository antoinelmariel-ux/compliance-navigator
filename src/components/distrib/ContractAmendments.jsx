import React from '../../react.js';
import { DistribLayout } from './DistribLayout.jsx';

const statusStyles = {
  'À valider': 'border-amber-200 bg-amber-50 text-amber-700',
  'En négociation': 'border-blue-200 bg-blue-50 text-blue-700',
  'Signé': 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

export const ContractAmendments = ({ distribState, onNavigate, activeScreen, onBackToGateway }) => (
  <DistribLayout
    title="Suivi des avenants"
    subtitle="Pilotez les modifications contractuelles, leur statut et les validations requises."
    activeScreen={activeScreen}
    onNavigate={onNavigate}
    onBackToGateway={onBackToGateway}
  >
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Avenants actifs</h2>
        <button
          type="button"
          onClick={() => onNavigate('distrib-contract-briefing')}
          className="text-sm font-semibold text-amber-600 hover:underline"
        >
          Préparer un briefing
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Avenant</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Mise à jour</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {distribState.amendments.map(amendment => (
              <tr key={amendment.id}>
                <td className="px-4 py-3 font-semibold text-gray-900">{amendment.title}</td>
                <td className="px-4 py-3 text-gray-600">{amendment.owner}</td>
                <td className="px-4 py-3 text-gray-600">{amendment.updatedAt}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusStyles[amendment.status] || 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {amendment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </DistribLayout>
);
