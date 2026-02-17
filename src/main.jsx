import React from './react.js';
import { ReactDOM } from './react.js';
import { App } from './App.jsx';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error('Erreur d\'affichage détectée :', error);
    }
  }

  handleRefresh = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 p-6 text-gray-900 sm:p-10">
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-sm hv-surface">
            <h1 className="text-lg font-semibold text-red-700">Affichage interrompu</h1>
            <p className="mt-3 text-sm text-gray-600">
              Une erreur est survenue pendant le chargement de l’application. Vous pouvez relancer
              l’affichage avec le bouton ci-dessous.
            </p>
            <button
              type="button"
              onClick={this.handleRefresh}
              className="mt-5 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Recharger l’application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (rootElement && ReactDOM) {
  if (typeof ReactDOM.createRoot === 'function') {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    );
  } else if (typeof ReactDOM.render === 'function') {
    ReactDOM.render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
      rootElement
    );
  } else {
    console.error('Aucune méthode de rendu ReactDOM disponible.');
  }
}
