import { graphConfig, isGraphRuntimeReady } from '../config/graphConfig.js';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const MSAL_BROWSER_CDN = 'https://alcdn.msauth.net/browser/2.39.0/js/msal-browser.min.js';

let msalLoadPromise = null;
let msalClient = null;

const isWindowAvailable = typeof window !== 'undefined';

const ensureMsalLibrary = async () => {
  if (!isWindowAvailable) {
    throw new Error('Microsoft Graph n’est pas disponible côté serveur.');
  }

  if (window.msal && window.msal.PublicClientApplication) {
    return window.msal;
  }

  if (!msalLoadPromise) {
    msalLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-msal-browser="true"]');

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.msal), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Échec du chargement MSAL Browser.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = MSAL_BROWSER_CDN;
      script.async = true;
      script.dataset.msalBrowser = 'true';
      script.addEventListener('load', () => resolve(window.msal), { once: true });
      script.addEventListener('error', () => reject(new Error('Échec du chargement MSAL Browser.')), { once: true });
      document.head.appendChild(script);
    });
  }

  return msalLoadPromise;
};

const buildMsalConfig = () => ({
  auth: {
    clientId: graphConfig.clientId,
    authority: `https://login.microsoftonline.com/${graphConfig.tenantId}`,
    redirectUri: graphConfig.redirectUri
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
});

const getMsalClient = async () => {
  if (!isGraphRuntimeReady()) {
    throw new Error('Configuration Graph incomplète: renseignez tenantId/clientId/siteId dans src/config/graphConfig.js.');
  }

  if (msalClient) {
    return msalClient;
  }

  const msal = await ensureMsalLibrary();
  if (!msal || !msal.PublicClientApplication) {
    throw new Error('MSAL Browser est indisponible après chargement.');
  }

  msalClient = new msal.PublicClientApplication(buildMsalConfig());
  await msalClient.handleRedirectPromise().catch(() => null);
  return msalClient;
};

const getPrimaryAccount = async () => {
  const client = await getMsalClient();
  const accounts = client.getAllAccounts();

  if (accounts.length > 0) {
    return accounts[0];
  }

  const loginResponse = await client.loginPopup({ scopes: graphConfig.scopes });
  return loginResponse?.account || null;
};

export const getGraphAccessToken = async (scopes = graphConfig.scopes) => {
  const client = await getMsalClient();
  const account = await getPrimaryAccount();

  if (!account) {
    throw new Error('Impossible de récupérer un compte Microsoft connecté.');
  }

  try {
    const silentResult = await client.acquireTokenSilent({
      account,
      scopes
    });
    return silentResult.accessToken;
  } catch (silentError) {
    const interactiveResult = await client.acquireTokenPopup({
      account,
      scopes
    });
    return interactiveResult.accessToken;
  }
};

export const graphRequest = async (path, { method = 'GET', body, headers = {}, scopes } = {}) => {
  const token = await getGraphAccessToken(scopes);
  const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let details = '';
    try {
      const payload = await response.json();
      details = payload?.error?.message || '';
    } catch (error) {
      details = await response.text();
    }

    throw new Error(`Graph ${method} ${path} a échoué (${response.status}). ${details}`.trim());
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const getGraphCurrentUser = async () => graphRequest('/me');

export const graphSetup = {
  GRAPH_BASE_URL,
  isGraphRuntimeReady
};
