import React, { useEffect, useMemo, useRef, useState } from '../react.js';
import { Close } from './icons.js';
import { normalizeInspirationFormConfig } from '../utils/inspirationConfig.js';

const buildInitialFormState = (config) => {
  const fields = Array.isArray(config?.fields) ? config.fields : [];
  const initialState = {};

  fields.forEach((field) => {
    if (!field) {
      return;
    }

    if (field.type === 'documents') {
      initialState[field.id] = [];
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
          url: typeof doc?.url === 'string' ? doc.url.trim() : '',
          fileName: typeof doc?.fileName === 'string' ? doc.fileName.trim() : '',
          source: typeof doc?.source === 'string' ? doc.source.trim() : '',
          mimeType: typeof doc?.mimeType === 'string' ? doc.mimeType.trim() : '',
          fileSize: Number.isFinite(doc?.fileSize) ? doc.fileSize : null,
          lastModified: Number.isFinite(doc?.lastModified) ? doc.lastModified : null
        }))
        .filter((doc) => doc.name.length > 0 || doc.url.length > 0 || doc.fileName.length > 0)
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
  project,
  formConfig,
  existingProjects = [],
  onAutosave,
  onCancel
}) => {
  const normalizedConfig = useMemo(
    () => normalizeInspirationFormConfig(formConfig),
    [formConfig]
  );
  const formTopRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);
  const [formState, setFormState] = useState(() => buildInitialFormState(normalizedConfig));

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

  useEffect(() => {
    setFormState(() => {
      const baseState = buildInitialFormState(normalizedConfig);
      const merged = { ...baseState, ...(project || {}) };

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
  }, [normalizedConfig, project?.id]);

  useEffect(() => {
    if (!project?.id || typeof onAutosave !== 'function') {
      return undefined;
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
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

      payload.visibility = payload.visibility === 'shared' ? 'shared' : 'personal';
      if (!project?.createdAt) {
        payload.createdAt = now;
      }

      onAutosave(project.id, payload);
    }, 500);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
    };
  }, [formState, normalizedConfig.fields, onAutosave, project?.createdAt, project?.id]);

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

  const handleDocumentUpload = (fieldId, files) => {
    const uploadedFiles = Array.from(files || []);
    if (uploadedFiles.length === 0) {
      return;
    }

    const uploadedDocuments = uploadedFiles.map((file) => ({
      name: file.name,
      fileName: file.name,
      mimeType: file.type || '',
      fileSize: Number.isFinite(file.size) ? file.size : null,
      lastModified: Number.isFinite(file.lastModified) ? file.lastModified : null,
      source: 'pending_sharepoint_upload',
      url: ''
    }));

    setFormState((prev) => ({
      ...prev,
      [fieldId]: [...(Array.isArray(prev[fieldId]) ? prev[fieldId] : []), ...uploadedDocuments]
    }));
  };

  const handleRemoveDocument = (fieldId, index) => {
    setFormState((prev) => {
      const nextDocuments = Array.isArray(prev[fieldId]) ? prev[fieldId].slice() : [];
      nextDocuments.splice(index, 1);
      return {
        ...prev,
        [fieldId]: nextDocuments
      };
    });
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
          onSubmit={(event) => event.preventDefault()}
          className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg"
        >
          <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            Enregistrement automatique activé : vos modifications sont sauvegardées en continu.
          </p>
          <p className="text-xs italic text-gray-400">
            Le LFB traite les données recueillies pour gérer les projets à soumettre aux équipes compliance.{' '}
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
                    </label>
                  );
                }

                if (field.id === 'labName') {
                  const placeholder = typeof field.placeholder === 'string' && field.placeholder.trim() !== ''
                    ? field.placeholder.trim()
                    : 'Nom du laboratoire';

                  return (
                    <label key={field.id} className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                      <span>{renderFieldLabel(field)}</span>
                      <input
                        type="text"
                        list="inspiration-labs"
                        value={formState.labName}
                        onChange={(event) => updateField('labName', event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder={placeholder}
                      />
                    </label>
                  );
                }

                const inputType = field.type === 'url' ? 'url' : 'text';
                const inputPlaceholder = typeof field.placeholder === 'string' && field.placeholder.trim() !== ''
                  ? field.placeholder.trim()
                  : field.type === 'url'
                    ? 'https://...'
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
                  value={formState[field.id] || ''}
                  onChange={(event) => updateField(field.id, event.target.value)}
                  className="min-h-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder={
                    typeof field.placeholder === 'string' && field.placeholder.trim() !== ''
                      ? field.placeholder.trim()
                      : field.id === 'review'
                        ? 'Ajoutez votre avis détaillé sur ce projet inspirant...'
                        : 'Saisir une description détaillée...'
                  }
                />
              </label>
            ))}

          {normalizedConfig.fields
            .filter((field) => field.enabled && field.type === 'documents')
            .map((field) => (
              <div key={field.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{renderFieldLabel(field)}</p>
                    <p className="text-xs text-gray-500">Téléversez un ou plusieurs documents.</p>
                  </div>
                </div>
                <p className="text-xs text-amber-600">
                  Les fichiers seront envoyés vers SharePoint après migration.
                </p>
                <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-6 text-center text-sm font-medium text-blue-700 hover:bg-blue-100">
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      handleDocumentUpload(field.id, event.target.files);
                      event.target.value = '';
                    }}
                  />
                  Choisir des fichiers
                </label>
                <div className="space-y-3">
                  {(formState[field.id] || []).map((doc, index) => (
                    <div
                      key={`doc-${index}`}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-700">
                          {doc.name || doc.fileName || 'Document'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.source === 'pending_sharepoint_upload'
                            ? 'En attente de dépôt SharePoint'
                            : doc.url || 'Document importé'}
                        </p>
                      </div>
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
          </div>
        </form>
      </div>
    </div>
  );
};
