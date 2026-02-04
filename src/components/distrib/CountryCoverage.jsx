import React from '../../react.js';
import { DistribLayout } from './DistribLayout.jsx';

const statusStyles = {
  Actif: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Renouvellement: 'border-amber-200 bg-amber-50 text-amber-700',
  'Sous surveillance': 'border-red-200 bg-red-50 text-red-600'
};

export const CountryCoverage = ({ distribState, onNavigate, activeScreen, onBackToGateway }) => (
  <DistribLayout
    title="Country coverage"
    subtitle="Vision consolidée par pays avec distributeur associé et date de fin de contrat."
    activeScreen={activeScreen}
    onNavigate={onNavigate}
    onBackToGateway={onBackToGateway}
  >
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Couverture par pays</h2>
        <button
          type="button"
          onClick={() => onNavigate('distrib-country-intelligence')}
          className="text-sm font-semibold text-amber-600 hover:underline"
        >
          Accéder aux risques
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Pays</th>
              <th className="px-4 py-3">Distributeur</th>
              <th className="px-4 py-3">Fin de contrat</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {distribState.countryCoverage.map(entry => (
              <tr key={entry.country}>
                <td className="px-4 py-3 font-semibold text-gray-900">{entry.country}</td>
                <td className="px-4 py-3 text-gray-600">{entry.distributor}</td>
                <td className="px-4 py-3 text-gray-600">{entry.contractEnd}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusStyles[entry.status] || 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
        2 contrats arrivent à échéance dans les 6 prochains mois. Planifier les renouvellements.
      </div>
    </section>
  </DistribLayout>
);
