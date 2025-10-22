(function (global) {
  if (!global.Babel) {
    throw new Error('Babel doit être chargé avant le module loader.');
  }

  const moduleCache = Object.create(null);

  const isAbsoluteUrl = url => /^(?:[a-z]+:)?\/\//i.test(url);

  const fetchSourceSync = url => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);

    if (xhr.status >= 400 || xhr.status === 0) {
      throw new Error(`Impossible de charger le module "${url}" (statut ${xhr.status}).`);
    }

    return xhr.responseText;
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
