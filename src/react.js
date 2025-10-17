const ReactGlobal = window.React;

if (!ReactGlobal) {
  throw new Error('React global not found. Assurez-vous que React est chargé avant les modules.');
}

const ReactDOMGlobal = window.ReactDOM;

export const React = ReactGlobal;
export const ReactDOM = ReactDOMGlobal;
export const { useState, useEffect, useMemo, useCallback, useRef } = ReactGlobal;

export default ReactGlobal;
