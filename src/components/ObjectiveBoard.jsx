import React, { useCallback, useEffect, useMemo, useRef, useState } from '../react.js';

const BOARD_COLUMNS = ['Objectif', 'Moyen', 'Résultat'];

const cloneState = (state) => ({
  nodes: state.nodes.map((node) => ({ ...node })),
  links: state.links.map((link) => ({ ...link }))
});

const createInitialState = () => ({
  nodes: [
    {
      id: 'node-1',
      column: 'Objectif',
      title: '',
      collapsed: false,
      tag: ''
    }
  ],
  links: []
});

export const ObjectiveBoard = ({ moyenTags = [] }) => {
  const [state, setState] = useState(() => createInitialState());
  const [linkingFrom, setLinkingFrom] = useState(null);
  const undoStackRef = useRef([]);

  const pushUndoState = useCallback((previous) => {
    undoStackRef.current = [...undoStackRef.current, cloneState(previous)].slice(-50);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) {
      return;
    }

    const previous = undoStackRef.current.pop();
    setState(previous);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const addNode = useCallback((column) => {
    setState((previous) => {
      const next = cloneState(previous);
      pushUndoState(previous);

      const nextIndex = next.nodes.length + 1;
      next.nodes.push({
        id: `node-${nextIndex}`,
        column,
        title: '',
        collapsed: false,
        tag: ''
      });

      return next;
    });
  }, [pushUndoState]);

  const updateNodeField = useCallback((nodeId, field, value) => {
    setState((previous) => {
      const next = cloneState(previous);
      const nodeIndex = next.nodes.findIndex((entry) => entry.id === nodeId);

      if (nodeIndex === -1) {
        return previous;
      }

      pushUndoState(previous);
      const currentValue = next.nodes[nodeIndex][field];
      const resolvedValue = typeof value === 'function' ? value(currentValue) : value;
      next.nodes[nodeIndex] = { ...next.nodes[nodeIndex], [field]: resolvedValue };
      return next;
    });
  }, [pushUndoState]);

  const toggleCollapse = useCallback((nodeId) => {
    updateNodeField(nodeId, 'collapsed', (prev) => !prev);
  }, [updateNodeField]);

  const startLinking = useCallback((event, nodeId) => {
    if (event?.target?.closest('input, textarea, select, button')) {
      return;
    }
    setLinkingFrom(nodeId);
  }, []);

  const completeLinking = useCallback((event, targetId) => {
    if (event?.target?.closest('input, textarea, select, button')) {
      return;
    }

    setState((previous) => {
      if (!linkingFrom || linkingFrom === targetId) {
        return previous;
      }

      const exists = previous.links.some((link) => link.from === linkingFrom && link.to === targetId);
      if (exists) {
        return previous;
      }

      const next = cloneState(previous);
      pushUndoState(previous);
      next.links.push({ id: `link-${next.links.length + 1}`, from: linkingFrom, to: targetId });
      return next;
    });

    setLinkingFrom(null);
  }, [linkingFrom, pushUndoState]);

  const cancelLinking = useCallback(() => setLinkingFrom(null), []);

  const collapsedAncestors = useMemo(() => {
    const map = new Map();

    const visit = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);

      const parentLinks = state.links.filter((link) => link.to === nodeId);
      for (const link of parentLinks) {
        const parent = state.nodes.find((node) => node.id === link.from);
        if (!parent) continue;

        if (parent.collapsed || visit(parent.id, visited)) {
          map.set(nodeId, true);
          return true;
        }
      }

      map.set(nodeId, false);
      return false;
    };

    state.nodes.forEach((node) => visit(node.id));
    return map;
  }, [state.links, state.nodes]);

  const isHidden = useCallback((nodeId) => collapsedAncestors.get(nodeId), [collapsedAncestors]);

  const visibleNodes = useMemo(
    () => state.nodes.filter((node) => !isHidden(node.id)),
    [isHidden, state.nodes]
  );

  const visibleLinks = useMemo(
    () => state.links.filter((link) => !isHidden(link.from) && !isHidden(link.to)),
    [isHidden, state.links]
  );

  const nodesByColumn = useMemo(() => {
    const buckets = new Map();
    BOARD_COLUMNS.forEach((column) => buckets.set(column, []));
    visibleNodes.forEach((node) => {
      const target = buckets.get(node.column) || [];
      target.push(node);
      buckets.set(node.column, target);
    });
    return buckets;
  }, [visibleNodes]);

  const outgoingMap = useMemo(() => {
    const map = new Map();
    visibleLinks.forEach((link) => {
      const entries = map.get(link.from) || [];
      entries.push(link.to);
      map.set(link.from, entries);
    });
    return map;
  }, [visibleLinks]);

  return (
    <section
      aria-labelledby="objective-board-title"
      className="space-y-4 rounded-3xl border border-indigo-100 bg-white/80 p-6 shadow-sm"
      onMouseLeave={cancelLinking}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Cartographie rapide</p>
          <h2 id="objective-board-title" className="text-2xl font-bold text-gray-900">
            Chaîne Objectif → Moyens → Résultats
          </h2>
          <p className="text-sm text-gray-600">
            Créez des noeuds, reliez-les en maintenant le clic gauche et utilisez Ctrl+Z pour annuler.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setState(createInitialState())}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            disabled={undoStackRef.current.length === 0}
          >
            Ctrl+Z · Annuler
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {BOARD_COLUMNS.map((column) => {
          const columnNodes = nodesByColumn.get(column) || [];
          const placeholderId = `objective-board-column-${column}`;

          return (
            <div key={column} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{column}</h3>
                  <p className="text-xs text-gray-500">Branche {column.toLowerCase()} du scénario.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addNode(column)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  + Ajouter
                </button>
              </div>

              <div className="space-y-3" id={placeholderId}>
                {columnNodes.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                    Aucun noeud pour le moment. Cliquez sur « Ajouter » pour commencer.
                  </p>
                ) : (
                  columnNodes.map((node) => {
                    const outgoingTargets = outgoingMap.get(node.id) || [];
                    const isLinkingStart = linkingFrom === node.id;

                    return (
                      <article
                        key={node.id}
                        className={`space-y-2 rounded-xl border px-3 py-3 shadow-sm transition ${
                          isLinkingStart
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-indigo-200'
                        }`}
                        onMouseDown={(event) => startLinking(event, node.id)}
                        onMouseUp={(event) => completeLinking(event, node.id)}
                        role="group"
                        aria-label={`Noeud ${column}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Titre du noeud
                            </label>
                            <input
                              type="text"
                              value={node.title}
                              placeholder={`Nouvel ${column.toLowerCase()}`}
                              onChange={(event) => updateNodeField(node.id, 'title', event.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleCollapse(node.id)}
                            className="mt-6 inline-flex items-center rounded-full border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            aria-pressed={node.collapsed}
                          >
                            {node.collapsed ? 'Déplier' : 'Replier'}
                          </button>
                        </div>

                        {node.column === 'Moyen' && (
                          <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tag associé</label>
                            <select
                              value={node.tag || ''}
                              onChange={(event) => updateNodeField(node.id, 'tag', event.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                              <option value="">Aucun tag</option>
                              {moyenTags.map((tag) => (
                                <option key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden="true" /> Sortie
                          </span>
                          {isLinkingStart && <span className="text-indigo-700">Reliez à un autre noeud…</span>}
                        </div>

                        {outgoingTargets.length > 0 && !node.collapsed ? (
                          <div className="space-y-1 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800">
                            <p className="font-semibold">Branche vers :</p>
                            <ul className="flex flex-wrap gap-2">
                              {outgoingTargets.map((targetId) => {
                                const target = state.nodes.find((item) => item.id === targetId);
                                const label = target?.title?.trim() || target?.column || targetId;
                                return (
                                  <li
                                    key={`${node.id}-${targetId}`}
                                    className="rounded-full bg-white px-3 py-1 font-medium shadow-sm"
                                  >
                                    {label}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : node.collapsed ? (
                          <p className="text-xs text-gray-500">Branche repliée.</p>
                        ) : (
                          <p className="text-xs text-gray-500">Aucune liaison sortante pour le moment.</p>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
