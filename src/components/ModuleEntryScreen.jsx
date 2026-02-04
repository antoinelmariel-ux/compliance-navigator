import React from '../react.js';
import { Rocket, Target, Users, Sparkles, ChevronRight } from './icons.js';

export const ModuleEntryScreen = ({ onSelectProject, onSelectDistrib }) => (
  <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 via-white to-white">
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
          <Sparkles className="h-4 w-4" />
          Sélectionnez votre espace de pilotage
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
          Bienvenue sur la plateforme Navigator
        </h1>
        <p className="mt-4 text-base text-slate-600">
          Choisissez l’univers qui correspond à votre mission. Project Navigator reste inchangé,
          tandis que Distrib Navigator vous accompagne dans la sélection et la gouvernance des
          distributeurs pharmaceutiques.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:w-[560px]">
        <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Rocket className="h-4 w-4" />
              Project Navigator
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Accédez à vos projets existants, vos synthèses et l’ensemble des workflows déjà
              en place.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-500" />
                Gestion de portefeuille projets
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" />
                Collaboration multi-équipes
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={onSelectProject}
            className="mt-6 inline-flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ouvrir Project Navigator
            <ChevronRight className="h-4 w-4" />
          </button>
        </article>

        <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <Sparkles className="h-4 w-4" />
              Distrib Navigator
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Pilotez vos stratégies de distribution internationale, la sélection des partenaires
              et le suivi compliance.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-500" />
                Prospection & scoring des distributeurs
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                Gouvernance Area Manager & Compliance
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={onSelectDistrib}
            className="mt-6 inline-flex items-center justify-between rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Ouvrir Distrib Navigator
            <ChevronRight className="h-4 w-4" />
          </button>
        </article>
      </div>
    </section>
  </div>
);
