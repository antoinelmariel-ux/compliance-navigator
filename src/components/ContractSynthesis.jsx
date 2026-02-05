import React, { useEffect, useMemo, useState } from '../react.js';
import { AlertTriangle, Edit, Eye, Plus } from './icons.js';
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

const actionPlanStatusStyles = {
  'Non démarré': 'border-gray-200 bg-gray-100 text-gray-600',
  'En cours': 'border-amber-200 bg-amber-50 text-amber-700',
  Finalisé: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

const availableTabs = ['summary', 'contract', 'action-plans'];

const resolveInitialTab = (value) =>
  availableTabs.includes(value) ? value : 'summary';

export const ContractSynthesis = ({ answers, onBack, initialTab = 'summary' }) => {
  const [activeTab, setActiveTab] = useState(() => resolveInitialTab(initialTab));

  useEffect(() => {
    setActiveTab(resolveInitialTab(initialTab));
  }, [initialTab]);

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

  const actionPlans = useMemo(() => ([
    {
      id: 'plan-1',
      title: 'Revoir la clause de pénalité logistique',
      description:
        'Aligner les pénalités sur les standards locaux et valider la faisabilité côté supply.',
      dueDate: '2024-05-20',
      status: 'Non démarré',
      owner: 'Claire Moreau'
    },
    {
      id: 'plan-2',
      title: 'Mettre à jour l’annexe conformité',
      description:
        'Intégrer les nouvelles obligations ESG et obtenir la validation du département compliance.',
      dueDate: '2024-09-12',
      status: 'En cours',
      owner: 'Sébastien Leroy'
    },
    {
      id: 'plan-3',
      title: 'Finaliser le plan de formation distributeur',
      description:
        'Confirmer le planning de formation produit avec l’équipe commerciale et préparer les supports.',
      dueDate: '2024-03-18',
      status: 'Finalisé',
      owner: 'Nora Haddad'
    }
  ]), []);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const formatActionPlanDate = (value) => {
    if (!value) {
      return 'Date inconnue';
    }
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) {
      return 'Date inconnue';
    }
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isActionPlanOverdue = (plan) => {
    if (!plan?.dueDate || plan.status === 'Finalisé') {
      return false;
    }
    const dueDate = new Date(plan.dueDate);
    if (!Number.isFinite(dueDate.getTime())) {
      return false;
    }
    return dueDate < today;
  };

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
            { id: 'contract', label: 'Contrat' },
            { id: 'action-plans', label: 'Plans d’action' }
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
      ) : activeTab === 'contract' ? (
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
      ) : (
        <section className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Plans d’action</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Créez et suivez les plans d’action associés au contrat.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Créer un plan d’action
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-700">Intitulé</span>
                <input
                  type="text"
                  placeholder="Ex. Réviser les clauses de pénalité"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-700">Propriétaire</span>
                <input
                  type="text"
                  placeholder="Ex. Claire Moreau"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-700">Date limite</span>
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-700">État</span>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option>Non démarré</option>
                  <option>En cours</option>
                  <option>Finalisé</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-700 md:col-span-2">
                <span className="font-semibold text-gray-700">Description</span>
                <textarea
                  rows="3"
                  placeholder="Décrivez le plan d’action attendu..."
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Plans d’action en cours</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Suivi des plans d’action actifs et à venir.
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {actionPlans.length} plans suivis
              </span>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Intitulé</th>
                    <th className="px-4 py-3">Date limite</th>
                    <th className="px-4 py-3">État</th>
                    <th className="px-4 py-3">Propriétaire</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {actionPlans.map((plan) => {
                    const isOverdue = isActionPlanOverdue(plan);
                    return (
                      <tr key={plan.id} className="text-gray-700">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <span
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600"
                                aria-label="Date limite dépassée"
                              >
                                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                              </span>
                            )}
                            <span className="font-semibold text-gray-800">{plan.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{formatActionPlanDate(plan.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              actionPlanStatusStyles[plan.status] || 'border-gray-200 bg-gray-100 text-gray-600'
                            }`}
                          >
                            {plan.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{plan.owner}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              title={plan.description}
                              aria-label={`Voir la description pour ${plan.title}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Modifier ${plan.title}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
