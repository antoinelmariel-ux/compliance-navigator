import React, { useEffect, useMemo, useRef, useState } from '../react.js';
import { Close, Edit, Pause, Play, Save, Upload } from './icons.js';

const clamp01 = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
};

const escapeAttributeValue = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }

  return value.replace(/"/g, '\\"');
};

const STATUS_BADGE = {
  active: 'bg-emerald-500 text-white',
  paused: 'bg-amber-500 text-white'
};

export const AnnotationLayer = ({
  isActive = false,
  isPaused = false,
  isEditing = false,
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
  const [, setLayoutVersion] = useState(0);
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleLayoutRefresh = () => {
      setLayoutVersion(previous => previous + 1);
    };

    window.addEventListener('resize', handleLayoutRefresh);
    window.addEventListener('scroll', handleLayoutRefresh, true);

    return () => {
      window.removeEventListener('resize', handleLayoutRefresh);
      window.removeEventListener('scroll', handleLayoutRefresh, true);
    };
  }, []);

  const getAnnotationAnchor = (note) => {
    if (typeof document === 'undefined' || !note?.sectionId) {
      return null;
    }

    const escapedSectionId = escapeAttributeValue(note.sectionId);

    if (escapedSectionId && isEditing) {
      const editAnchor = document.querySelector(`[data-annotation-target-section="${escapedSectionId}"]`);
      if (editAnchor) {
        return editAnchor;
      }
    }

    if (escapedSectionId) {
      const displayAnchor = document.querySelector(`[data-showcase-section="${escapedSectionId}"]`);
      if (displayAnchor) {
        return displayAnchor;
      }
    }

    return null;
  };

  const computeNotePosition = (note) => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth || 1 : 1;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight || 1 : 1;
    const anchor = getAnnotationAnchor(note);

    if (anchor && typeof anchor.getBoundingClientRect === 'function') {
      const rect = anchor.getBoundingClientRect();
      const relativeX = clamp01(note?.sectionX ?? note?.x ?? 0.5);
      const relativeY = clamp01(note?.sectionY ?? note?.y ?? 0.5);

      return {
        left: rect.left + rect.width * relativeX,
        top: rect.top + rect.height * relativeY
      };
    }

    const fallbackX = clamp01(note?.x ?? 0.5);
    const fallbackY = clamp01(note?.y ?? 0.5);

    return {
      left: fallbackX * viewportWidth,
      top: fallbackY * viewportHeight
    };
  };

  if (!isActive) {
    return null;
  }

  return (
    <React.Fragment>
      <div className="fixed top-0 inset-x-0 z-[260]" data-annotation-ui="true">
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

      <div className="annotation-sticky-layer" data-annotation-ui="true">
        {visibleNotes.map((note, index) => {
          const position = computeNotePosition(note);
          const label = note.sourceId && note.sourceId !== 'session' ? note.sourceId : `#${index + 1}`;
          const color = note.color || sourceColors[label] || '#fbbf24';

          return (
            <div
              key={note.id}
              className="annotation-sticky"
              style={{ left: `${position.left}px`, top: `${position.top}px` }}
              data-annotation-ui="true"
            >
              <div
                className="pointer-events-auto w-64 max-w-xs rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.18)] border border-yellow-200 ring-1 ring-black/5"
                style={{
                  background: `linear-gradient(160deg, ${color || '#fef3c7'} 0%, #fff9d9 60%, #fff7cc 100%)`
                }}
              >
                <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-amber-900/80">
                  <span className="tracking-tight">{label}</span>
                  {onNoteRemove ? (
                    <button
                      type="button"
                      onClick={() => onNoteRemove(note.id)}
                      className="rounded-md p-1.5 text-amber-900/80 transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800/60"
                      aria-label="Supprimer le sticky note"
                    >
                      <Close className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="px-3 pb-3 pt-1">
                  <textarea
                    value={note.text || ''}
                    onChange={(event) => onNoteChange && onNoteChange(note.id, event.target.value)}
                    ref={registerTextareaRef(note.id)}
                    className="w-full resize-none border-none bg-transparent px-1 py-2 text-[15px] leading-relaxed text-amber-900/90 placeholder:text-amber-700/50 focus:outline-none focus:ring-0"
                    rows={4}
                    placeholder="Ajoutez votre remarque ici..."
                    data-annotation-ui="true"
                  />
                  <div className="flex justify-end pr-1 text-amber-900/50">
                    <Edit className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
};
