import React from '../../react.js';

const NAV_ITEMS = [
  { id: 'distrib-home', label: 'Accueil' },
  { id: 'distrib-country-intelligence', label: 'Country intelligence' },
  { id: 'distrib-pipeline', label: 'Pipeline' },
  { id: 'distrib-evaluation', label: 'Évaluation' },
  { id: 'distrib-contract-briefing', label: 'Briefing contrat' },
  { id: 'distrib-contract-amendments', label: 'Avenants' },
  { id: 'distrib-contract-overview', label: 'Clauses' },
  { id: 'distrib-audit', label: 'Audits' },
  { id: 'distrib-country-coverage', label: 'Couverture pays' }
];

export const DistribLayout = ({
  title,
  subtitle,
  activeScreen,
  onNavigate,
  onBackToGateway,
  children
}) => (
  <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
          Distrib Navigator
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-2 max-w-3xl text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onBackToGateway}
            className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:border-amber-300 hover:text-amber-800"
          >
            Retour au portail
          </button>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2">
        {NAV_ITEMS.map(item => {
          const isActive = item.id === activeScreen;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                isActive
                  ? 'border-amber-300 bg-amber-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:text-amber-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
    {children}
  </section>
);

export const distribNavItems = NAV_ITEMS;
