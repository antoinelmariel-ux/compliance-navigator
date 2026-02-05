import React, { useCallback, useEffect, useMemo, useRef, useState } from '../react.js';
import { ChevronLeft, Compass } from './icons.js';
import icpScores from '../data/ICP 2024.json';
import { countryVisionData } from '../data/countryVision.js';

const WORLD_MAP_URL = './src/data/world-map.svg';
const ICP_SCORE_KEY = 'CPI 2024 score';
const CONTRACT_FILL_COLOR = '#2563eb';
const INFO_FILL_COLOR = '#f5e7d3';

const formatDate = (isoDate) => {
  if (!isoDate) {
    return 'Date inconnue';
  }

  try {
    return new Date(isoDate).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Date inconnue';
  }
};

const icpScoreByIso3 = new Map(
  icpScores.map((entry) => [entry.ISO3, Number(entry[ICP_SCORE_KEY])])
);

const getCorruptionRiskLabel = (score) => {
  if (!Number.isFinite(score)) {
    return 'Indice non disponible';
  }

  if (score >= 70) {
    return 'Faible';
  }

  if (score >= 50) {
    return 'Modéré';
  }

  if (score >= 30) {
    return 'Élevé';
  }

  return 'Très élevé';
};

export const CountryVisionScreen = ({ onBack }) => {
  const mapObjectRef = useRef(null);
  const mapClickHandlerRef = useRef(null);
  const mapInteractionRef = useRef({ cleanup: null });
  const mapBaseViewBoxRef = useRef(null);
  const mapViewBoxRef = useRef(null);
  const mapZoomRef = useRef(1);

  const defaultCountry = countryVisionData[0];
  const [selectedCountryId, setSelectedCountryId] = useState(defaultCountry?.id || '');
  const [selectedCountryLabel, setSelectedCountryLabel] = useState(defaultCountry?.name || '');

  const countryStatusById = useMemo(
    () => new Map(countryVisionData.map((country) => [country.id, Boolean(country.contract)])),
    []
  );

  const selectedCountry = useMemo(
    () => countryVisionData.find((entry) => entry.id === selectedCountryId),
    [selectedCountryId]
  );
  const selectedCountryName = selectedCountry?.name || selectedCountryLabel || 'Pays sélectionné';
  const selectedCpiScore = selectedCountry?.iso3
    ? icpScoreByIso3.get(selectedCountry.iso3)
    : undefined;
  const selectedCorruptionRisk = getCorruptionRiskLabel(selectedCpiScore);

  const handleCountrySelect = useCallback((countryId, label) => {
    if (!countryId) {
      return;
    }
    setSelectedCountryId(countryId);
    if (label) {
      setSelectedCountryLabel(label);
    }
  }, []);

  const applyMapStyles = useCallback(() => {
    const svgDocument = mapObjectRef.current?.contentDocument;
    if (!svgDocument) {
      return;
    }

    svgDocument.querySelectorAll('path').forEach((path) => {
      const countryId = path.getAttribute('id');
      const hasContract = countryId ? countryStatusById.get(countryId) : undefined;
      const hasInfo = countryId ? countryStatusById.has(countryId) : false;
      const baseFill = hasContract
        ? CONTRACT_FILL_COLOR
        : hasInfo
          ? INFO_FILL_COLOR
          : '';

      path.style.fill = baseFill;

      if (countryId === selectedCountryId) {
        path.style.stroke = '#1d4ed8';
        path.style.strokeWidth = '0.8';
      } else {
        path.style.stroke = '';
        path.style.strokeWidth = '';
      }
    });
  }, [countryStatusById, selectedCountryId]);

  const handleMapObjectLoad = useCallback(() => {
    const svgDocument = mapObjectRef.current?.contentDocument;
    if (!svgDocument) {
      return;
    }

    const svgElement = svgDocument.querySelector('svg');
    if (!svgElement) {
      return;
    }

    if (mapInteractionRef.current.cleanup) {
      mapInteractionRef.current.cleanup();
      mapInteractionRef.current.cleanup = null;
    }

    if (mapClickHandlerRef.current) {
      svgElement.removeEventListener('click', mapClickHandlerRef.current);
    }

    const getBaseViewBox = () => {
      const rawViewBox = svgElement.getAttribute('viewBox');
      if (rawViewBox) {
        const parts = rawViewBox.split(/\s+|,/).map(Number).filter(Number.isFinite);
        if (parts.length === 4) {
          return parts;
        }
      }

      const width = Number(svgElement.getAttribute('width'));
      const height = Number(svgElement.getAttribute('height'));

      if (Number.isFinite(width) && Number.isFinite(height)) {
        return [0, 0, width, height];
      }

      try {
        const bbox = svgElement.getBBox();
        return [bbox.x, bbox.y, bbox.width, bbox.height];
      } catch (error) {
        return null;
      }
    };

    const baseViewBox = getBaseViewBox();
    if (!baseViewBox) {
      return;
    }

    const applyViewBox = (nextViewBox) => {
      const serialized = nextViewBox.map(value => value.toFixed(4)).join(' ');
      svgElement.setAttribute('viewBox', serialized);
      mapViewBoxRef.current = nextViewBox;
    };

    mapBaseViewBoxRef.current = baseViewBox;
    mapZoomRef.current = 1;
    applyViewBox(baseViewBox.slice());

    const clickHandler = (event) => {
      const path = event.target?.closest?.('path');
      if (!path) {
        return;
      }
      const countryId = path.getAttribute('id');
      const countryName = path.getAttribute('name');
      handleCountrySelect(countryId, countryName);
    };

    mapClickHandlerRef.current = clickHandler;
    svgElement.addEventListener('click', clickHandler);
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgElement.style.width = '100%';
    svgElement.style.height = '100%';
    svgElement.style.display = 'block';
    svgElement.style.cursor = 'grab';
    svgElement.style.userSelect = 'none';
    svgElement.style.touchAction = 'none';

    const panState = {
      isPanning: false,
      startX: 0,
      startY: 0,
      startViewBox: null
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const handleWheel = (event) => {
      event.preventDefault();
      if (!mapBaseViewBoxRef.current || !mapViewBoxRef.current) {
        return;
      }

      const baseBox = mapBaseViewBoxRef.current;
      const currentBox = mapViewBoxRef.current;
      const rect = svgElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const direction = event.deltaY > 0 ? 1 : -1;
      const zoomStep = direction > 0 ? 1.1 : 0.9;
      const minZoom = 1;
      const maxZoom = 6;
      const nextZoom = clamp(mapZoomRef.current * zoomStep, minZoom, maxZoom);

      const zoomRatio = nextZoom / mapZoomRef.current;
      if (zoomRatio === 1) {
        return;
      }

      const offsetX = (event.clientX - rect.left) / rect.width;
      const offsetY = (event.clientY - rect.top) / rect.height;
      const nextWidth = baseBox[2] / nextZoom;
      const nextHeight = baseBox[3] / nextZoom;
      const focusX = currentBox[0] + currentBox[2] * offsetX;
      const focusY = currentBox[1] + currentBox[3] * offsetY;

      const nextX = focusX - nextWidth * offsetX;
      const nextY = focusY - nextHeight * offsetY;

      mapZoomRef.current = nextZoom;
      applyViewBox([nextX, nextY, nextWidth, nextHeight]);
    };

    const handleMouseDown = (event) => {
      if (event.button !== 0 || !mapViewBoxRef.current) {
        return;
      }
      panState.isPanning = true;
      panState.startX = event.clientX;
      panState.startY = event.clientY;
      panState.startViewBox = mapViewBoxRef.current.slice();
      svgElement.style.cursor = 'grabbing';
    };

    const handleMouseMove = (event) => {
      if (!panState.isPanning || !panState.startViewBox) {
        return;
      }
      const rect = svgElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      const dx = ((event.clientX - panState.startX) / rect.width) * panState.startViewBox[2];
      const dy = ((event.clientY - panState.startY) / rect.height) * panState.startViewBox[3];
      applyViewBox([
        panState.startViewBox[0] - dx,
        panState.startViewBox[1] - dy,
        panState.startViewBox[2],
        panState.startViewBox[3]
      ]);
    };

    const handleMouseUp = () => {
      if (panState.isPanning) {
        panState.isPanning = false;
        panState.startViewBox = null;
        svgElement.style.cursor = 'grab';
      }
    };

    svgElement.addEventListener('wheel', handleWheel, { passive: false });
    svgElement.addEventListener('mousedown', handleMouseDown);
    svgElement.addEventListener('mousemove', handleMouseMove);
    svgElement.addEventListener('mouseup', handleMouseUp);
    svgElement.addEventListener('mouseleave', handleMouseUp);

    svgElement.querySelectorAll('path').forEach((path) => {
      path.style.cursor = 'pointer';
      path.style.transition = 'fill 0.2s ease, stroke 0.2s ease';
    });

    mapInteractionRef.current.cleanup = () => {
      svgElement.removeEventListener('wheel', handleWheel);
      svgElement.removeEventListener('mousedown', handleMouseDown);
      svgElement.removeEventListener('mousemove', handleMouseMove);
      svgElement.removeEventListener('mouseup', handleMouseUp);
      svgElement.removeEventListener('mouseleave', handleMouseUp);
    };

    applyMapStyles();
  }, [applyMapStyles, handleCountrySelect]);

  useEffect(() => {
    applyMapStyles();
  }, [applyMapStyles]);

  useEffect(() => () => {
    const svgDocument = mapObjectRef.current?.contentDocument;
    const svgElement = svgDocument?.querySelector('svg');
    if (svgElement && mapClickHandlerRef.current) {
      svgElement.removeEventListener('click', mapClickHandlerRef.current);
    }
    if (mapInteractionRef.current.cleanup) {
      mapInteractionRef.current.cleanup();
      mapInteractionRef.current.cleanup = null;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8 sm:px-8 hv-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl sm:p-10 hv-surface">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Vision pays
              </span>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Cartographie mondiale des enjeux pays
              </h1>
              <p className="max-w-3xl text-sm text-gray-600">
                Cliquez sur un pays pour afficher les informations clés : contexte géopolitique, sanctions économiques,
                réglementation pharmaceutique et risque de corruption basé sur l’indice de perception de la corruption
                (ICP 2024).
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Retour à l’accueil
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CONTRACT_FILL_COLOR }} />
              Pays avec contrat
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: INFO_FILL_COLOR }} />
              Pays avec informations
            </span>
          </div>
        </header>

        <section
          aria-labelledby="vision-pays-title"
          className="space-y-8 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl sm:p-10 hv-surface"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span id="vision-pays-title">Carte interactive</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
                <object
                  ref={mapObjectRef}
                  data={WORLD_MAP_URL}
                  type="image/svg+xml"
                  className="h-[360px] w-full sm:h-[520px] md:h-[620px]"
                  aria-label="Carte du monde interactive"
                  onLoad={handleMapObjectLoad}
                >
                  Votre navigateur ne prend pas en charge l’affichage de la carte.
                </object>
              </div>
              <div className="flex flex-wrap gap-2">
                {countryVisionData.map((country) => (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => handleCountrySelect(country.id, country.name)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                      selectedCountryId === country.id
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Pays sélectionné
                </p>
                <h2 className="mt-2 text-xl font-bold text-gray-900">{selectedCountryName}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Cliquez sur la carte pour mettre à jour la fiche.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Situation géopolitique
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {selectedCountry?.geopolitical || 'Aucune donnée disponible pour ce pays.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Risque de corruption
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {Number.isFinite(selectedCpiScore)
                      ? `Indice ICP 2024 : ${selectedCpiScore}/100 · Risque ${selectedCorruptionRisk.toLowerCase()}`
                      : selectedCorruptionRisk}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sanctions économiques
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {selectedCountry?.sanctions || 'Aucune donnée disponible pour ce pays.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Réglementation pharmaceutique clef
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {selectedCountry?.pharma || 'Aucune donnée disponible pour ce pays.'}
                  </p>
                </div>
              </div>

              {selectedCountry?.contract && (
                <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Contrat en cours
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedCountry.contract.partnerName}
                    </p>
                    <p className="text-sm text-gray-700">
                      Fin de contrat :{' '}
                      {formatDate(selectedCountry.contract.endDate)}
                    </p>
                    <a
                      href={selectedCountry.contract.partnerUrl}
                      className="text-sm font-semibold text-emerald-700 underline hover:text-emerald-800"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir le contrat
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
