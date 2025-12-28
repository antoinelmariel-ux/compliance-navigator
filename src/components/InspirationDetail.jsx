import React, { useEffect, useMemo, useState } from '../react.js';
import { Edit, Save, Close, Link as LinkIcon } from './icons.js';
import { normalizeInspirationFormConfig } from '../utils/inspirationConfig.js';

const formatValue = (value) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return 'Non renseigné';
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

export const InspirationDetail = ({
  project,
  formConfig,
  onBack,
  onUpdate
}) => {
  const normalizedConfig = useMemo(
    () => normalizeInspirationFormConfig(formConfig),
    [formConfig]
  );
  const [draft, setDraft] = useState(project);
  const [editingFields, setEditingFields] = useState({});

  useEffect(() => {
    setDraft(project);
    setEditingFields({});
  }, [project]);

  if (!project) {
    return null;
  }

  const fieldConfigMap = normalizedConfig.fields.reduce((acc, field) => {
    acc[field.id] = field;
    return acc;
  }, {});
  const fieldLabelMap = normalizedConfig.fields.reduce((acc, field) => {
    acc[field.id] = field.label;
    return acc;
  }, {});

  const toggleFieldEditing = (fieldId, isEditing) => {
    setEditingFields((prev) => ({ ...prev, [fieldId]: isEditing }));
  };

  const handleFieldChange = (fieldId, value) => {
    setDraft((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSaveField = (fieldId) => {
    if (typeof onUpdate !== 'function') {
      toggleFieldEditing(fieldId, false);
      return;
    }

    const nextValue = draft[fieldId];
    const updates = {
      [fieldId]: fieldId === 'documents' ? normalizeDocuments(nextValue) : nextValue,
      updatedAt: new Date().toISOString()
    };
    onUpdate(project.id, updates);
    toggleFieldEditing(fieldId, false);
  };

  const renderField = (fieldId, content) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {fieldLabelMap[fieldId] || fieldId}
          </p>
          {content}
        </div>
        <div className="flex flex-wrap gap-2">
          {editingFields[fieldId] ? (
            <>
              <button
                type="button"
                onClick={() => handleSaveField(fieldId)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(project);
                  toggleFieldEditing(fieldId, false);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                <Close className="h-4 w-4" aria-hidden="true" />
                Annuler
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => toggleFieldEditing(fieldId, true)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Edit className="h-4 w-4" aria-hidden="true" />
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const visibilityLabel = project.visibility === 'shared' ? 'Partagé' : 'Personnel';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Fiche projet inspirant</p>
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {project.labName} · {project.country}
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              <Close className="h-4 w-4" aria-hidden="true" />
              Retour
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-500">Mode de partage</p>
              <p className="text-sm font-semibold text-gray-700">{visibilityLabel}</p>
            </div>
            <div
              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 p-1"
              role="group"
              aria-label="Mode de partage"
            >
              <button
                type="button"
                onClick={() => onUpdate(project.id, { visibility: 'personal', updatedAt: new Date().toISOString() })}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  project.visibility !== 'shared'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                Personnel
              </button>
              <button
                type="button"
                onClick={() => onUpdate(project.id, { visibility: 'shared', updatedAt: new Date().toISOString() })}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  project.visibility === 'shared'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                Partagé
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {renderField(
            'title',
            editingFields.title ? (
              <input
                type="text"
                value={draft.title || ''}
                onChange={(event) => handleFieldChange('title', event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            ) : (
              <p className="mt-2 text-sm text-gray-700">{formatValue(project.title)}</p>
            )
          )}

          {renderField(
            'labName',
            editingFields.labName ? (
              <input
                type="text"
                value={draft.labName || ''}
                onChange={(event) => handleFieldChange('labName', event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            ) : (
              <p className="mt-2 text-sm text-gray-700">{formatValue(project.labName)}</p>
            )
          )}

          {renderField(
            'target',
            editingFields.target ? (
              fieldConfigMap.target?.type === 'select' ? (
                <select
                  value={draft.target || ''}
                  onChange={(event) => handleFieldChange('target', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {(fieldConfigMap.target?.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={draft.target || ''}
                  onChange={(event) => handleFieldChange('target', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              )
            ) : (
              <p className="mt-2 text-sm text-gray-700">{formatValue(project.target)}</p>
            )
          )}

          {renderField(
            'typology',
            editingFields.typology ? (
              fieldConfigMap.typology?.type === 'select' ? (
                <select
                  value={draft.typology || ''}
                  onChange={(event) => handleFieldChange('typology', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {(fieldConfigMap.typology?.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={draft.typology || ''}
                  onChange={(event) => handleFieldChange('typology', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              )
            ) : (
              <p className="mt-2 text-sm text-gray-700">{formatValue(project.typology)}</p>
            )
          )}

          {renderField(
            'therapeuticArea',
            editingFields.therapeuticArea ? (
              fieldConfigMap.therapeuticArea?.type === 'select' ? (
                <select
                  value={draft.therapeuticArea || ''}
                  onChange={(event) => handleFieldChange('therapeuticArea', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {(fieldConfigMap.therapeuticArea?.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={draft.therapeuticArea || ''}
                  onChange={(event) => handleFieldChange('therapeuticArea', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              )
            ) : (
              <p className="mt-2 text-sm text-gray-700">{formatValue(project.therapeuticArea)}</p>
            )
          )}

          {renderField(
            'country',
            editingFields.country ? (
              fieldConfigMap.country?.type === 'select' ? (
                <select
                  value={draft.country || ''}
                  onChange={(event) => handleFieldChange('country', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {(fieldConfigMap.country?.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={draft.country || ''}
                  onChange={(event) => handleFieldChange('country', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              )
            ) : (
              <p className="mt-2 text-sm text-gray-700">{formatValue(project.country)}</p>
            )
          )}

          {renderField(
            'description',
            editingFields.description ? (
              <textarea
                rows={4}
                value={draft.description || ''}
                onChange={(event) => handleFieldChange('description', event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            ) : (
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{formatValue(project.description)}</p>
            )
          )}

          {renderField(
            'link',
            editingFields.link ? (
              <input
                type="url"
                value={draft.link || ''}
                onChange={(event) => handleFieldChange('link', event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            ) : (
              project.link ? (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                  {project.link}
                </a>
              ) : (
                <p className="mt-2 text-sm text-gray-700">Non renseigné</p>
              )
            )
          )}

          {renderField(
            'documents',
            editingFields.documents ? (
              <div className="mt-2 space-y-3">
                {normalizeDocuments(draft.documents).map((doc, index) => (
                  <div key={`doc-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(event) => {
                        const nextDocs = normalizeDocuments(draft.documents);
                        nextDocs[index] = { ...doc, name: event.target.value };
                        handleFieldChange('documents', nextDocs);
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="url"
                      value={doc.url}
                      onChange={(event) => {
                        const nextDocs = normalizeDocuments(draft.documents);
                        nextDocs[index] = { ...doc, url: event.target.value };
                        handleFieldChange('documents', nextDocs);
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    handleFieldChange('documents', [
                      ...normalizeDocuments(draft.documents),
                      { name: '', url: '' }
                    ])
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Ajouter un document
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                {normalizeDocuments(project.documents).length > 0 ? (
                  normalizeDocuments(project.documents).map((doc, index) => (
                    <div key={`doc-view-${index}`} className="flex flex-col">
                      <span className="font-medium">{doc.name || 'Document'}</span>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {doc.url}
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p>Non renseigné</p>
                )}
              </div>
            )
          )}

          {renderField(
            'review',
            editingFields.review ? (
              <textarea
                rows={4}
                value={draft.review || ''}
                onChange={(event) => handleFieldChange('review', event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            ) : (
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{formatValue(project.review)}</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};
