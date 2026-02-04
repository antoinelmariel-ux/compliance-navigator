import React, { useEffect, useMemo, useRef, useState } from '../react.js';
import { Plus, Save, Close } from './icons.js';
import { normalizeInspirationFormConfig } from '../utils/inspirationConfig.js';
import { RichTextEditor } from './RichTextEditor.jsx';

const buildInitialFormState = (config) => {
  const fields = Array.isArray(config?.fields) ? config.fields : [];
  const initialState = {};

  fields.forEach((field) => {
    if (!field) {
      return;
    }

    if (field.type === 'documents') {
      initialState[field.id] = [{ name: '', url: '' }];
      return;
    }

    if (field.type === 'multi_select') {
      initialState[field.id] = [];
      return;
    }

    initialState[field.id] = '';
  });

  return initialState;
};

const normalizeDocuments = (documents) =>
  Array.isArray(documents)
    ? documents
        .map((doc) => ({
          name: typeof doc?.name === 'string' ? doc.name.trim() : '',
          url: typeof doc?.url === 'string' ? doc.url.trim() : ''
        }))
        .filter((doc) => doc.name.length > 0 || doc.url.length > 0)
    : [];

const normalizeMultiSelect = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : [];

const renderFieldLabel = (field) => {
  if (!field) {
    return '';
  }

  return field.required ? `${field.label} *` : field.label;
};

export const InspirationForm = ({
  formConfig,
  existingProjects = [],
  onSubmit,
  onCancel
}) => {
  const normalizedConfig = useMemo(
    () => normalizeInspirationFormConfig(formConfig),
    [formConfig]
  );
  const formTopRef = useRef(null);
  const [formState, setFormState] = useState(() => buildInitialFormState(normalizedConfig));
  const [errors, setErrors] = useState({});

  const contactSuggestions = useMemo(() => {
    const suggestions = new Set();
    existingProjects.forEach((project) => {
      const name = typeof project?.contactName === 'string' ? project.contactName.trim() : '';
      if (name.length > 0) {
        suggestions.add(name);
      }
    });
    return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [existingProjects]);

  useEffect(() => {
    setFormState((prev) => {
      const baseState = buildInitialFormState(normalizedConfig);
      const merged = { ...baseState, ...prev };

      normalizedConfig.fields.forEach((field) => {
        if (field.type !== 'documents') {
          if (field.type === 'multi_select' && !Array.isArray(merged[field.id])) {
            merged[field.id] = baseState[field.id];
          }
          return;
        }

        if (!Array.isArray(merged[field.id]) || merged[field.id].length === 0) {
          merged[field.id] = baseState[field.id];
        }
      });

      return merged;
    });
  }, [normalizedConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const focusTarget = formTopRef.current;
    const scrollToTop = () => {
      if (!focusTarget) {
        return;
      }

      if (typeof focusTarget.scrollIntoView === 'function') {
        focusTarget.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      } else if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      if (typeof focusTarget.focus === 'function') {
        focusTarget.focus({ preventScroll: true });
      }
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(scrollToTop);
      return;
    }

    scrollToTop();
  }, []);

  const updateField = (fieldId, value) => {
    setFormState((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleDocumentChange = (fieldId, index, key, value) => {
    setFormState((prev) => {
      const nextDocuments = Array.isArray(prev[fieldId]) ? prev[fieldId].slice() : [];
      const target = nextDocuments[index] || { name: '', url: '' };
      nextDocuments[index] = { ...target, [key]: value };
      return { ...prev, [fieldId]: nextDocuments };
    });
  };

  const handleAddDocument = (fieldId) => {
    setFormState((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), { name: '', url: '' }]
    }));
  };

  const handleRemoveDocument = (fieldId, index) => {
    setFormState((prev) => {
      const nextDocuments = Array.isArray(prev[fieldId]) ? prev[fieldId].slice() : [];
      nextDocuments.splice(index, 1);
      return {
        ...prev,
        [fieldId]: nextDocuments.length > 0 ? nextDocuments : [{ name: '', url: '' }]
      };
    });
  };

  const validate = () => {
    const nextErrors = {};

    normalizedConfig.fields.forEach((field) => {
      if (!field.enabled || !field.required) {
        return;
      }

      const value = formState[field.id];
      if (field.type === 'documents') {
        const normalizedDocs = normalizeDocuments(value);
        if (normalizedDocs.length === 0) {
          nextErrors[field.id] = 'Veuillez renseigner au moins un document.';
        }
        return;
      }

      if (field.type === 'multi_select') {
        const normalizedSelections = normalizeMultiSelect(value);
        if (normalizedSelections.length === 0) {
          nextErrors[field.id] = 'Veuillez sélectionner au moins une option.';
        }
        return;
      }

      if (value == null || (typeof value === 'string' && value.trim().length === 0)) {
        nextErrors[field.id] = 'Ce champ est requis.';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const now = new Date().toISOString();
    const payload = normalizedConfig.fields.reduce((acc, field) => {
      if (!field.enabled) {
        return acc;
      }

      if (field.type === 'documents') {
        acc[field.id] = normalizeDocuments(formState[field.id]);
        return acc;
      }

      if (field.type === 'multi_select') {
        acc[field.id] = normalizeMultiSelect(formState[field.id]);
        return acc;
      }

      const value = formState[field.id];
      if (typeof value === 'string') {
        acc[field.id] = value.trim();
        return acc;
      }

      acc[field.id] = value ?? '';
      return acc;
    }, {});

    payload.visibility = 'personal';
    payload.createdAt = now;
    payload.updatedAt = now;

    if (typeof onSubmit === 'function') {
      onSubmit(payload);
    }
  };

  return (
    <div
      ref={formTopRef}
      tabIndex={-1}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8 sm:px-8 focus:outline-none"
    >
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Nouveau prospect
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Fiche prospect</h1>
            <p className="mt-2 text-sm text-gray-600">
              Documentez les partenaires potentiels afin de structurer votre prospection internationale.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Close className="h-4 w-4" aria-hidden="true" />
            Retour
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg"
        >
          <p className="text-xs italic text-gray-400">
            Distrib Navigator traite les données recueillies pour suivre vos prospects à l'international.{' '}
            <a
              href="./mentions-legales.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-500"
            >
              En savoir plus sur vos données et vos droits
            </a>
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {normalizedConfig.fields
              .filter((field) => field.enabled && field.type !== 'long_text' && field.type !== 'documents')
              .map((field) => {
                if (field.type === 'select') {
                  const emptyOptionLabel = typeof field.placeholder === 'string' && field.placeholder.trim() !== ''
                    ? field.placeholder.trim()
                    : 'Sélectionner...';

                  return (
                    <label key={field.id} className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                      <span>{renderFieldLabel(field)}</span>
                      <select
                        value={formState[field.id] || ''}
                        onChange={(event) => updateField(field.id, event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">{emptyOptionLabel}</option>
                        {(field.options || []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors[field.id] && <span className="text-xs text-red-600">{errors[field.id]}</span>}
                    </label>
                  );
                }

                if (field.type === 'multi_select') {
                  const selectedValues = Array.isArray(formState[field.id]) ? formState[field.id] : [];
                  return (
                    <label key={field.id} className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                      <span>{renderFieldLabel(field)}</span>
                      <select
                        multiple
                        value={selectedValues}
                        onChange={(event) =>
                          updateField(
                            field.id,
                            Array.from(event.target.selectedOptions).map((option) => option.value)
                          )}
                        className="min-h-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {(field.options || []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors[field.id] && <span className="text-xs text-red-600">{errors[field.id]}</span>}
                    </label>
                  );
                }

                if (field.id === 'contactName') {
                  const placeholder = typeof field.placeholder === 'string' && field.placeholder.trim() !== ''
                    ? field.placeholder.trim()
                    : 'Prénom Nom';

                  return (
                    <label key={field.id} className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                      <span>{renderFieldLabel(field)}</span>
                      <input
                        type="text"
                        list="prospect-contacts"
                        value={formState.contactName}
                        onChange={(event) => updateField('contactName', event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder={placeholder}
                      />
                      {errors[field.id] && <span className="text-xs text-red-600">{errors[field.id]}</span>}
                    </label>
                  );
                }

                const inputType = field.type === 'url'
                  ? 'url'
                  : field.type === 'email'
                    ? 'email'
                    : 'text';
                const inputPlaceholder = typeof field.placeholder === 'string' && field.placeholder.trim() !== ''
                  ? field.placeholder.trim()
                  : field.type === 'url'
                    ? 'https://...'
                    : field.type === 'email'
                      ? 'contact@distributeur.com'
                    : '';

                return (
                  <label key={field.id} className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                    <span>{renderFieldLabel(field)}</span>
                    <input
                      type={inputType}
                      value={formState[field.id] || ''}
                      onChange={(event) => updateField(field.id, event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder={inputPlaceholder}
                    />
                    {errors[field.id] && <span className="text-xs text-red-600">{errors[field.id]}</span>}
                  </label>
                );
              })}
          </div>

          {normalizedConfig.fields
            .filter((field) => field.enabled && field.type === 'long_text')
            .map((field) => (
              <label key={field.id} className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                <span>{renderFieldLabel(field)}</span>
                <RichTextEditor
                  id={`inspiration-${field.id}`}
                  value={formState[field.id] || ''}
                  onChange={(value) => updateField(field.id, value)}
                  ariaLabel={`${field.label} (édition riche)`}
                  placeholder={
                    typeof field.placeholder === 'string' && field.placeholder.trim() !== ''
                        ? field.placeholder.trim()
                        : field.id === 'review'
                        ? 'Ajoutez votre avis détaillé sur ce partenaire potentiel...'
                        : 'Saisir un commentaire détaillé...'
                    }
                  compact
                />
                {errors[field.id] && <span className="text-xs text-red-600">{errors[field.id]}</span>}
              </label>
            ))}

          {normalizedConfig.fields
            .filter((field) => field.enabled && field.type === 'documents')
            .map((field) => (
              <div key={field.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{renderFieldLabel(field)}</p>
                    <p className="text-xs text-gray-500">
                      Ajoutez plusieurs documents (nom + URL).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddDocument(field.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Ajouter
                  </button>
                </div>
                <p className="text-xs text-amber-600">
                  Les fichiers doivent bien être partagés aux collaborateurs LFB.
                </p>
                <div className="space-y-3">
                  {(formState[field.id] || []).map((doc, index) => (
                    <div
                      key={`doc-${index}`}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <input
                        type="text"
                        value={doc.name}
                        onChange={(event) => handleDocumentChange(field.id, index, 'name', event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Nom du document"
                      />
                      <input
                        type="url"
                        value={doc.url}
                        onChange={(event) => handleDocumentChange(field.id, index, 'url', event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(field.id, index)}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
                {errors[field.id] && <span className="text-xs text-red-600">{errors[field.id]}</span>}
              </div>
            ))}

          <datalist id="prospect-contacts">
            {contactSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Enregistrer le prospect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
