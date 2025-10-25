(function (global) {
  if (!global.Babel) {
    throw new Error('Babel doit être chargé avant le module loader.');
  }

  const moduleCache = Object.create(null);
  const LOCAL_STORAGE_NAMESPACE = 'module-cache:';
  const CACHE_VERSION = '1';

  const isAbsoluteUrl = url => /^(?:[a-z]+:)?\/\//i.test(url);

  const supportsLocalStorage = (() => {
    try {
      const { localStorage } = global;
      if (!localStorage) {
        return false;
      }

      const testKey = `${LOCAL_STORAGE_NAMESPACE}__test__`;
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  })();

  const readCacheRecord = (url, sourceHash) => {
    if (!supportsLocalStorage) {
      return null;
    }

    try {
      const serialized = global.localStorage.getItem(`${LOCAL_STORAGE_NAMESPACE}${url}`);
      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized);
      if (!parsed || parsed.version !== CACHE_VERSION || parsed.hash !== sourceHash) {
        return null;
      }

      return typeof parsed.code === 'string' ? parsed.code : null;
    } catch (error) {
      return null;
    }
  };

  const writeCacheRecord = (url, sourceHash, code) => {
    if (!supportsLocalStorage) {
      return;
    }

    try {
      const payload = {
        version: CACHE_VERSION,
        hash: sourceHash,
        code
      };
      global.localStorage.setItem(`${LOCAL_STORAGE_NAMESPACE}${url}`, JSON.stringify(payload));
    } catch (error) {
      try {
        global.localStorage.removeItem(`${LOCAL_STORAGE_NAMESPACE}${url}`);
      } catch (cleanupError) {
        // no-op
      }
    }
  };

  const computeSourceHash = (source) => {
    if (typeof source !== 'string' || source.length === 0) {
      return '0';
    }

    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
    }

    return `${CACHE_VERSION}:${hash.toString(16)}`;
  };

  const fetchSourceSync = url => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);

    if (xhr.status >= 400 || xhr.status === 0) {
      throw new Error(`Impossible de charger le module "${url}" (statut ${xhr.status}).`);
    }

    return xhr.responseText;
  };

  const transformSource = (url, source) => {
    const sourceHash = computeSourceHash(source);
    const cached = readCacheRecord(url, sourceHash);
    if (cached) {
      return cached;
    }

    const transformed = global.Babel.transform(source, {
      presets: [
        [
          'env',
          {
            modules: 'commonjs',
            exclude: ['transform-regenerator', 'transform-async-to-generator']
          }
        ],
        'react'
      ],
      sourceType: 'module'
    }).code;

    if (typeof transformed === 'string' && transformed.length > 0) {
      writeCacheRecord(url, sourceHash, transformed);
    }

    return transformed;
  };

  const normalizeUrl = (specifier, baseUrl) => {
    if (isAbsoluteUrl(specifier)) {
      return specifier;
    }

    const resolvedUrl = new URL(specifier, baseUrl);
    return resolvedUrl.href;
  };

  const loadModule = url => {
    if (moduleCache[url]) {
      return moduleCache[url].exports;
    }

    const source = fetchSourceSync(url);
    const transformed = transformSource(url, source);

    const module = { exports: {} };
    moduleCache[url] = module;

    const dirname = url.slice(0, url.lastIndexOf('/') + 1) || url;

    const localRequire = specifier => {
      const childUrl = normalizeUrl(specifier, dirname);
      return loadModule(childUrl);
    };

    const factory = new Function('require', 'module', 'exports', 'global',
      `${transformed}\n//# sourceURL=${url}`
    );

    try {
      factory(localRequire, module, module.exports, global);
    } catch (error) {
      delete moduleCache[url];
      throw error;
    }

    return module.exports;
  };

  global.ModuleLoader = {
    import(modulePath) {
      const entryUrl = normalizeUrl(modulePath, global.location.href);
      return loadModule(entryUrl);
    }
  };
})(window);
