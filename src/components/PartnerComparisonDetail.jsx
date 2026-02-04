import React, { useMemo } from '../react.js';
import { CheckCircle, ChevronLeft, Users } from './icons.js';

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

const getPartnerCompanyLabel = (partner) => {
  const name = typeof partner?.companyName === 'string' ? partner.companyName.trim() : '';
  if (name) {
    return name;
  }
  const fallback = typeof partner?.contactName === 'string' ? partner.contactName.trim() : '';
  return fallback || 'Entreprise non renseignée';
};

const getPartnerContactLabel = (partner) => {
  const name = typeof partner?.contactName === 'string' ? partner.contactName.trim() : '';
  return name || 'Contact non renseigné';
};

const getPartnerCountryLabel = (partner) => {
  const countries = normalizeInspirationFieldValues(partner?.countries);
  return countries.join(', ') || 'Pays non renseignés';
};

const getPartnerRoleLabel = (partner) => {
  const role = typeof partner?.role === 'string' ? partner.role.trim() : '';
  return role || 'Rôle non renseigné';
};

const getPartnerSituationLabel = (partner) => {
  const situation = typeof partner?.situation === 'string' ? partner.situation.trim() : '';
  return situation || 'Situation non renseignée';
};

const getPartnerReviewLabel = (partner) => {
  const review = typeof partner?.review === 'string' ? partner.review.trim() : '';
  return review || 'Aucune note disponible';
};

export const PartnerComparisonDetail = ({
  partners = [],
  preferredPartnerId = '',
  comment = '',
  onPreferredPartnerChange,
  onCommentChange,
  onBack
}) => {
  const rows = useMemo(
    () => [
      { label: 'Entreprise', value: getPartnerCompanyLabel },
      { label: 'Contact', value: getPartnerContactLabel },
      { label: 'Rôle', value: getPartnerRoleLabel },
      { label: 'Pays', value: getPartnerCountryLabel },
      { label: 'Situation', value: getPartnerSituationLabel },
      { label: 'Notes', value: getPartnerReviewLabel }
    ],
    []
  );

  const gridTemplate = `minmax(200px, 240px) repeat(${partners.length}, minmax(220px, 1fr))`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8 sm:px-8 hv-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl hv-surface">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Users className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Comparateur partenaires
                </p>
                <h1 className="text-2xl font-bold text-gray-900">
                  Comparez et choisissez votre partenaire
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Modifier la sélection
            </button>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <CheckCircle className="h-4 w-4" />
            {partners.length} partenaire{partners.length > 1 ? 's' : ''} comparé{partners.length > 1 ? 's' : ''}
          </div>
        </header>

        {partners.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center text-gray-600">
            <p className="text-lg font-semibold text-gray-800">Aucun partenaire à comparer.</p>
            <p className="mt-2 text-sm">
              Revenez à la sélection pour choisir des partenaires.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour à la sélection
            </button>
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
              <h2 className="text-lg font-semibold text-gray-900">Préférence</h2>
              <p className="mt-1 text-sm text-gray-500">
                Sélectionnez votre partenaire préféré puis indiquez le rationnel.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                  <label
                    key={partner.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700"
                  >
                    <input
                      type="radio"
                      name="preferred-partner"
                      value={partner.id}
                      checked={preferredPartnerId === partner.id}
                      onChange={() => onPreferredPartnerChange?.(partner.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    {getPartnerCompanyLabel(partner)}
                  </label>
                ))}
              </div>
              <div className="mt-5">
                <label className="text-sm font-medium text-gray-700" htmlFor="partner-rationale">
                  Commentaire sur votre choix
                </label>
                <textarea
                  id="partner-rationale"
                  value={comment}
                  onChange={(event) => onCommentChange?.(event.target.value)}
                  rows={4}
                  placeholder="Expliquez ce qui a motivé votre sélection."
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hv-surface">
              <h2 className="text-lg font-semibold text-gray-900">Comparatif</h2>
              <p className="mt-1 text-sm text-gray-500">
                Comparez facilement chaque partenaire, comme dans un comparateur de produits.
              </p>
              <div className="mt-6 overflow-x-auto">
                <div className="grid gap-2" style={{ gridTemplateColumns: gridTemplate }}>
                  <div />
                  {partners.map((partner) => (
                    <div
                      key={partner.id}
                      className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
                    >
                      {getPartnerCompanyLabel(partner)}
                    </div>
                  ))}
                  {rows.map((row) => (
                    <React.Fragment key={row.label}>
                      <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                        {row.label}
                      </div>
                      {partners.map((partner) => (
                        <div
                          key={`${row.label}-${partner.id}`}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"
                        >
                          {row.value(partner)}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
