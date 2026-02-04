import React, { useMemo } from '../react.js';
import { CheckCircle, ChevronLeft, Compass, Users } from './icons.js';

const normalizeInspirationFieldValues = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }

  return [];
};

const getPartnerLabel = (partner) => {
  const name = typeof partner?.contactName === 'string' ? partner.contactName.trim() : '';
  return name || 'Partenaire non renseigné';
};

const getPartnerCountryLabel = (partner) => {
  const countries = normalizeInspirationFieldValues(partner?.countries);
  return countries.join(', ') || 'Pays non renseignés';
};

const sortPartners = (partners, sortKey) => {
  const sorted = partners.slice();
  sorted.sort((a, b) => {
    const aName = getPartnerLabel(a).toLowerCase();
    const bName = getPartnerLabel(b).toLowerCase();
    if (sortKey === 'country') {
      const aCountry = getPartnerCountryLabel(a).toLowerCase();
      const bCountry = getPartnerCountryLabel(b).toLowerCase();
      const countryCompare = aCountry.localeCompare(bCountry, 'fr');
      if (countryCompare !== 0) {
        return countryCompare;
      }
    }
    return aName.localeCompare(bName, 'fr');
  });
  return sorted;
};

export const PartnerComparisonGallery = ({
  partners = [],
  selectedPartnerIds = [],
  sortKey = 'name',
  onSortChange,
  onSelectionChange,
  onCompare,
  onBack
}) => {
  const sanitizedPartners = useMemo(
    () =>
      Array.isArray(partners)
        ? partners.filter((partner) => partner && typeof partner.id === 'string')
        : [],
    [partners]
  );

  const sortedPartners = useMemo(
    () => sortPartners(sanitizedPartners, sortKey),
    [sanitizedPartners, sortKey]
  );

  const selectionSet = useMemo(
    () => new Set(selectedPartnerIds.filter((id) => typeof id === 'string')),
    [selectedPartnerIds]
  );

  const selectedCount = selectionSet.size;

  const handleTogglePartner = (partnerId) => {
    if (!partnerId) return;
    const nextSelection = new Set(selectionSet);
    if (nextSelection.has(partnerId)) {
      nextSelection.delete(partnerId);
    } else {
      nextSelection.add(partnerId);
    }
    onSelectionChange?.(Array.from(nextSelection));
  };

  const handleSelectAll = () => {
    const allIds = sortedPartners.map((partner) => partner.id);
    onSelectionChange?.(allIds);
  };

  const handleClearSelection = () => {
    onSelectionChange?.([]);
  };

  const canCompare = selectedCount >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8 sm:px-8 hv-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl hv-surface">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Users className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Comparer les partenaires
                </p>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sélectionnez les partenaires à comparer
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour à l’accueil
            </button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <CheckCircle className="h-4 w-4" />
                {selectedCount} partenaire{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Tout désélectionner
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-gray-600" htmlFor="partner-sort">
                Trier par
              </label>
              <select
                id="partner-sort"
                value={sortKey}
                onChange={(event) => onSortChange?.(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Nom</option>
                <option value="country">Pays</option>
              </select>
              <button
                type="button"
                onClick={onCompare}
                disabled={!canCompare}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  canCompare
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Comparer
              </button>
            </div>
          </div>
          {!canCompare && (
            <p className="text-xs text-gray-500">
              Sélectionnez au moins deux partenaires pour lancer la comparaison.
            </p>
          )}
        </header>

        {sortedPartners.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center text-gray-600">
            <p className="text-lg font-semibold text-gray-800">Aucun partenaire disponible.</p>
            <p className="mt-2 text-sm">
              Ajoutez des prospects pour lancer une comparaison entre partenaires.
            </p>
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Galerie partenaires">
            {sortedPartners.map((partner) => {
              const isSelected = selectionSet.has(partner.id);
              const countriesLabel = getPartnerCountryLabel(partner);
              const roleLabel =
                typeof partner.role === 'string' && partner.role.trim().length > 0
                  ? partner.role
                  : 'Rôle non renseigné';
              const situationLabel =
                typeof partner.situation === 'string' && partner.situation.trim().length > 0
                  ? partner.situation
                  : 'Situation non renseignée';

              return (
                <article
                  key={partner.id}
                  className={`rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg ${
                    isSelected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                  role="listitem"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{getPartnerLabel(partner)}</h3>
                      <p className="text-sm text-gray-500">{roleLabel}</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTogglePartner(partner.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Sélectionner ${getPartnerLabel(partner)}`}
                      />
                      Sélectionner
                    </label>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4" />
                      <span>{countriesLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>{situationLabel}</span>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => handleTogglePartner(partner.id)}
                    className={`mt-5 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-blue-200 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {isSelected ? 'Retirer' : 'Ajouter à la comparaison'}
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};
