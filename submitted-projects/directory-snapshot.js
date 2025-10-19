(function (global) {
  if (!global || typeof global !== 'object') {
    return;
  }

  const existingSnapshot = global.__COMPLIANCE_NAVIGATOR_SUBMITTED_PROJECTS__;
  const existingFiles = Array.isArray(existingSnapshot && existingSnapshot.files)
    ? existingSnapshot.files.filter(item => typeof item === 'string')
    : [];

  const KNOWN_JSON_FILES = [
    'Vies-Reliees.json'
  ];

  const mergedFiles = Array.from(
    new Set(
      [...existingFiles, ...KNOWN_JSON_FILES].map(file =>
        typeof file === 'string' ? file.trim() : ''
      ).filter(Boolean)
    )
  );

  const payloads =
    existingSnapshot && existingSnapshot.payloads && typeof existingSnapshot.payloads === 'object'
      ? existingSnapshot.payloads
      : {};

  global.__COMPLIANCE_NAVIGATOR_SUBMITTED_PROJECTS__ = {
    files: mergedFiles,
    payloads
  };
})(typeof window !== 'undefined' ? window : this);
