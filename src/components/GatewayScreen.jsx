import React from '../react.js';

export const GatewayScreen = ({ onSelectProjectNavigator, onSelectDistribNavigator }) => (
  <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        Portail de navigation
      </p>
      <h1 className="text-3xl font-semibold text-gray-900">Choisissez votre espace</h1>
      <p className="max-w-2xl text-sm text-gray-500">
        Sélectionnez le parcours adapté à votre mission pour accéder rapidement aux outils de
        qualification réglementaire.
      </p>
    </header>

    <div className="grid gap-6 md:grid-cols-2">
      <button
        type="button"
        onClick={onSelectProjectNavigator}
        className="group flex h-full flex-col items-start gap-4 rounded-2xl border border-blue-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
      >
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          Project Navigator
        </span>
        <h2 className="text-xl font-semibold text-gray-900">Accès aux projets compliance</h2>
        <p className="text-sm text-gray-500">
          Accédez aux projets, questionnaires et synthèses existants sans perturber le parcours
          actuel.
        </p>
        <span className="text-sm font-semibold text-blue-600 group-hover:underline">
          Ouvrir l’espace Project Navigator →
        </span>
      </button>

      <button
        type="button"
        onClick={onSelectDistribNavigator}
        className="group flex h-full flex-col items-start gap-4 rounded-2xl border border-amber-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
      >
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
          Distrib Navigator
        </span>
        <h2 className="text-xl font-semibold text-gray-900">Nouveau flux distributeurs</h2>
        <p className="text-sm text-gray-500">
          Lancez le nouveau parcours distrib pour cadrer rapidement les besoins de mise en
          conformité.
        </p>
        <span className="text-sm font-semibold text-amber-600 group-hover:underline">
          Ouvrir l’espace Distrib Navigator →
        </span>
      </button>
    </div>
  </section>
);
