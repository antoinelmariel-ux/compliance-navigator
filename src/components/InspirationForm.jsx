import React, { useMemo, useState } from '../react.js';
import { Plus, Save, Close } from './icons.js';
import { normalizeInspirationFormConfig } from '../utils/inspirationConfig.js';

const buildInitialFormState = () => ({
  title: '',
  labName: '',
  target: '',
  typology: '',
  therapeuticArea: '',
  country: '',
  description: '',
  link: '',
  documents: [{ name: '', url: '' }],
  review: ''
});

const normalizeDocuments = (documents) =>
  Array.isArray(documents)
    ? documents
        .map((doc) => ({
          name: typeof doc?.name === 'string' ? doc.name.trim() : '',
          url: typeof doc?.url === 'string' ? doc.url.trim() : ''
        }))
        .filter((doc) => doc.name.length > 0 || doc.url.length > 0)
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
  const [formState, setFormState] = useState(buildInitialFormState);
  const [errors, setErrors] = useState({});

  const labSuggestions = useMemo(() => {
    const suggestions = new Set();
    existingProjects.forEach((project) => {
      const name = typeof project?.labName === 'string' ? project.labName.trim() : '';
      if (name.length > 0) {
        suggestions.add(name);
      }
    });
    return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [existingProjects]);

  const updateField = (fieldId, value) => {
    setFormState((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleDocumentChange = (index, key, value) => {
    setFormState((prev) => {
      const nextDocuments = Array.isArray(prev.documents) ? prev.documents.slice() : [];
      const target = nextDocuments[index] || { name: '', url: '' };
      nextDocuments[index] = { ...target, [key]: value };
      return { ...prev, documents: nextDocuments };
    });
  };

  const handleAddDocument = () => {
    setFormState((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), { name: '', url: '' }]
    }));
  };

  const handleRemoveDocument = (index) => {
    setFormState((prev) => {
      const nextDocuments = Array.isArray(prev.documents) ? prev.documents.slice() : [];
      nextDocuments.splice(index, 1);
      return { ...prev, documents: nextDocuments.length > 0 ? nextDocuments : [{ name: '', url: '' }] };
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

      if (typeof value === 'string' && value.trim().length === 0) {
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
    const payload = {
      title: formState.title.trim(),
      labName: formState.labName.trim(),
      target: formState.target,
      typology: formState.typology,
      therapeuticArea: formState.therapeuticArea,
      country: formState.country,
      description: formState.description.trim(),
      link: formState.link.trim(),
      documents: normalizeDocuments(formState.documents),
      review: formState.review.trim(),
      visibility: 'personal',
      createdAt: now,
      updatedAt: now
    };

    if (typeof onSubmit === 'function') {
      onSubmit(payload);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Nouvel exemple inspirant
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Questionnaire projet inspiration</h1>
            <p className="mt-2 text-sm text-gray-600">
              Documentez un projet inspirant issu d'un autre laboratoire afin d'enrichir la base d'exemples.
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {normalizedConfig.fields
              .filter((field) => field.enabled && field.type !== 'long_text' && field.type !== 'documents')
              .map((field) => {
                if (field.type === 'select') {
                  return (
                    <label key={field.id} className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                      <span>{renderFieldLabel(field)}</span>
                      <select
                        value={formState[field.id] || ''}
                        onChange={(event) => updateField(field.id, event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">Sélectionner...</option>
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

                if (field.id === 'labName') {
                  return (
                    <label key={field.id} className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                      <span>{renderFieldLabel(field)}</span>
                      <input
                        type="text"
                        list="inspiration-labs"
                        value={formState.labName}
                        onChange={(event) => updateField('labName', event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Nom du laboratoire"
                      />
                      {errors[field.id] && <span className="text-xs text-red-600">{errors[field.id]}</span>}
                    </label>
                  );
                }

                const inputType = field.type === 'url' ? 'url' : 'text';

                return (
                  <label key={field.id} className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                    <span>{renderFieldLabel(field)}</span>
                    <input
                      type={inputType}
                      value={formState[field.id] || ''}
                      onChange={(event) => updateField(field.id, event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder={field.type === 'url' ? 'https://...' : ''}
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
                <textarea
                  rows={5}
                  value={formState[field.id] || ''}
                  onChange={(event) => updateField(field.id, event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Saisir une description détaillée..."
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
                    onClick={handleAddDocument}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-3">
                  {(formState.documents || []).map((doc, index) => (
                    <div
                      key={`doc-${index}`}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <input
                        type="text"
                        value={doc.name}
                        onChange={(event) => handleDocumentChange(index, 'name', event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Nom du document"
                      />
                      <input
                        type="url"
                        value={doc.url}
                        onChange={(event) => handleDocumentChange(index, 'url', event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(index)}
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

          <datalist id="inspiration-labs">
            {labSuggestions.map((suggestion) => (
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
              Enregistrer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
