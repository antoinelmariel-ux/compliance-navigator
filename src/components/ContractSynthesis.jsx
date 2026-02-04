import React, { useMemo, useState } from '../react.js';
import {
  contractClauseSummaries,
  contractComplianceComments,
  contractPreviewSections
} from '../data/contractSynthesis.js';

const formatAnswer = (value) => {
  if (Array.isArray(value)) {
    const formatted = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .join(', ');
    return formatted.length > 0 ? formatted : 'Non renseigné';
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }

  return 'Non renseigné';
};

const statusStyles = {
  Validé: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'À clarifier': 'border-amber-200 bg-amber-50 text-amber-700',
  Recommandation: 'border-blue-200 bg-blue-50 text-blue-700'
};

export const ContractSynthesis = ({ answers, onBack }) => {
  const [activeTab, setActiveTab] = useState('summary');

  const summaryCards = useMemo(() => ([
    {
      label: 'Partenaire pressenti',
      value: formatAnswer(answers?.contractPartner)
    },
    {
      label: 'Territoire',
      value: formatAnswer(answers?.contractTerritory)
    },
    {
      label: 'Produits concernés',
      value: formatAnswer(answers?.contractProducts)
    },
    {
      label: 'Durée envisagée',
      value: formatAnswer(answers?.contractDuration)
    },
    {
      label: 'Date de démarrage cible',
      value: formatAnswer(answers?.contractStartDate)
    }
  ]), [answers]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Synthèse contrat
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            Synthèse du dossier de contractualisation
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Retrouvez les commentaires compliance et la vue synthétique du contrat avant partage.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Retour à l’accueil
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'summary', label: 'Synthèse' },
            { id: 'contract', label: 'Contrat' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'summary' ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {card.label}
                </p>
                <p className="mt-2 text-base font-semibold text-gray-800">
                  {card.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Commentaires des équipes compliance
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Synthèse recueillie avant préparation du contrat final.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Dernière mise à jour : aujourd’hui 09:45
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {contractComplianceComments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{comment.team}</p>
                      <p className="text-xs text-gray-500">Référent : {comment.owner}</p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        statusStyles[comment.status] || 'border-gray-200 bg-gray-100 text-gray-600'
                      }`}
                    >
                      {comment.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">
                    {comment.comment}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              Synthèse par grande clause
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Vue rapide pour sécuriser les points clés du contrat avant validation.
            </p>
            <div className="mt-5 space-y-4">
              {contractClauseSummaries.map((clause) => (
                <div key={clause.id} className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-800">{clause.title}</p>
                  <p className="mt-2 text-sm text-gray-600">{clause.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Aperçu du contrat</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Extrait consolidé pour revue rapide.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700"
              >
                Télécharger la version PDF
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {contractPreviewSections.map((section) => (
                <div key={section.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800">{section.title}</p>
                  <p className="mt-2 text-sm text-gray-600">{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
