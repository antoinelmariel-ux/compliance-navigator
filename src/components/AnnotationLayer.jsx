import React, { useEffect, useMemo, useRef } from '../react.js';
import { Close, Pause, Play, Save, Upload } from './icons.js';

const STATUS_BADGE = {
  active: 'bg-emerald-500 text-white',
  paused: 'bg-amber-500 text-white'
};

export const AnnotationLayer = ({
  isActive = false,
  isPaused = false,
  notes = [],
  activeContextId = '',
  sourceColors = {},
  projectName = '',
  autoFocusNoteId = null,
  onTogglePause,
  onRequestSave,
  onRequestLoad,
  onNoteChange,
  onNoteRemove,
  onAutoFocusComplete
}) => {
  const visibleNotes = useMemo(
    () => notes.filter(note => note && note.contextId === activeContextId),
    [activeContextId, notes]
  );

  const textareaRefs = useRef(new Map());

  const registerTextareaRef = (noteId) => (node) => {
    if (!noteId) {
      return;
    }

    if (node) {
      textareaRefs.current.set(noteId, node);
    } else {
      textareaRefs.current.delete(noteId);
    }
  };

  useEffect(() => {
    if (!autoFocusNoteId) {
      return;
    }

    const target = textareaRefs.current.get(autoFocusNoteId);
    if (target && typeof target.focus === 'function') {
      target.focus();
      if (typeof target.setSelectionRange === 'function') {
        const length = target.value?.length ?? 0;
        target.setSelectionRange(length, length);
      }
      if (typeof onAutoFocusComplete === 'function') {
        onAutoFocusComplete(autoFocusNoteId);
      }
    }
  }, [autoFocusNoteId, onAutoFocusComplete]);

  if (!isActive) {
    return null;
  }

  return (
    <React.Fragment>
      <div className="fixed top-0 inset-x-0 z-[140]" data-annotation-ui="true">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="mt-2 rounded-b-xl bg-white border border-slate-200 text-slate-900 shadow-2xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-800">
              <span className="font-semibold">Mode annotation</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                isPaused ? STATUS_BADGE.paused : STATUS_BADGE.active
              }`}>
                <span className="w-2 h-2 rounded-full bg-white" aria-hidden="true" />
                {isPaused ? 'En pause' : 'Actif'}
              </span>
              {projectName ? (
                <span className="text-xs text-slate-600">Projet : {projectName}</span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRequestSave}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={onRequestLoad}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Upload className="h-4 w-4" />
                Charger
              </button>
              <button
                type="button"
                onClick={onTogglePause}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Relancer' : 'Mettre en pause'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 z-[130] pointer-events-none">
        {visibleNotes.map(note => {
          const clampedX = Math.min(Math.max(note.x, 0), 1);
          const clampedY = Math.min(Math.max(note.y, 0), 1);
          const left = `${clampedX * 100}%`;
          const top = `${clampedY * 100}%`;
          const label = note.sourceId && note.sourceId !== 'session' ? note.sourceId : 'Annotation';
          const color = note.color || sourceColors[label] || '#fbbf24';

          return (
            <div
              key={note.id}
              className="absolute"
              style={{ left, top, transform: 'translate(-50%, -50%)' }}
              data-annotation-ui="true"
            >
              <div
                className="pointer-events-auto w-64 max-w-xs rounded-2xl shadow-2xl ring-1 ring-black/10 backdrop-blur overflow-hidden border border-black/5"
                style={{
                  background: `linear-gradient(160deg, ${color}f0 0%, ${color}d0 45%, #fffbea 100%)`
                }}
              >
                <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-900 bg-white/70 backdrop-blur-sm border-b border-black/5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-900/70" aria-hidden="true" />
                    <span className="truncate" title={label}>
                      {label}
                    </span>
                  </div>
                  {onNoteRemove ? (
                    <button
                      type="button"
                      onClick={() => onNoteRemove(note.id)}
                      className="rounded-md p-1.5 text-slate-800 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
                      aria-label="Supprimer le sticky note"
                    >
                      <Close className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="px-3 pb-3 pt-2">
                  <textarea
                    value={note.text || ''}
                    onChange={(event) => onNoteChange && onNoteChange(note.id, event.target.value)}
                    ref={registerTextareaRef(note.id)}
                    className="w-full resize-none rounded-xl border border-black/5 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-800/70"
                    rows={3}
                    placeholder="Ajoutez votre commentaire"
                    data-annotation-ui="true"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
};
