import React from './react.js';
import { ReactDOM } from './react.js';
import { App } from './App.jsx';

const rootElement = document.getElementById('root');

if (rootElement && ReactDOM) {
  if (typeof ReactDOM.createRoot === 'function') {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  } else if (typeof ReactDOM.render === 'function') {
    ReactDOM.render(<App />, rootElement);
  } else {
    console.error('Aucune méthode de rendu ReactDOM disponible.');
  }
}
