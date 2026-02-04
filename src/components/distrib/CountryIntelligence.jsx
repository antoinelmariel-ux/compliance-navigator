import React from '../../react.js';
import { DistribLayout } from './DistribLayout.jsx';

const RiskBadge = ({ level }) => {
  const styles = {
    Faible: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Modéré: 'border-amber-200 bg-amber-50 text-amber-700',
    Élevé: 'border-red-200 bg-red-50 text-red-700'
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[level] || 'border-gray-200 bg-gray-50 text-gray-600'}`}>
      {level}
    </span>
  );
};

export const CountryIntelligence = ({ distribState, onNavigate, activeScreen, onBackToGateway }) => (
  <DistribLayout
    title="Country intelligence"
    subtitle="Cartographie des risques pays et réglementations critiques pour cadrer les décisions de distribution."
    activeScreen={activeScreen}
    onNavigate={onNavigate}
    onBackToGateway={onBackToGateway}
  >
    <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Carte des risques</h2>
          <button
            type="button"
            onClick={() => onNavigate('distrib-country-coverage')}
            className="text-sm font-semibold text-amber-600 hover:underline"
          >
            Couverture pays
          </button>
        </div>
        <div className="mt-4 flex h-64 items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100">
          <div className="text-center">
            <p className="text-sm font-semibold text-amber-700">Carte pays interactive</p>
            <p className="text-xs text-amber-600">Filtres risques · sanctions · data privacy</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {distribState.countryIntelligence.map(country => (
            <div key={country.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{country.name}</p>
                <RiskBadge level={country.riskLevel} />
              </div>
              <p className="mt-2 text-xs text-gray-500">Contrat jusqu’au {country.contractEnd}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
        <h2 className="text-lg font-semibold text-gray-900">Réglementations clés</h2>
        <div className="mt-4 space-y-4">
          {distribState.countryIntelligence.map(country => (
            <div key={country.id} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{country.name}</p>
                <RiskBadge level={country.riskLevel} />
              </div>
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                {country.keyRegulations.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                Priorités: {country.priorities.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </DistribLayout>
);
