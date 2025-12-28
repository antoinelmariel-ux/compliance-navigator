import React from '../react.js';

const URL_REGEX = /(https?:\/\/[^\s<]+)/gi;
const TRAILING_PUNCTUATION_REGEX = /[)\]\}.,;!?]+$/;
const ALLOWED_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a']);

const ensureAllowedAnchor = (node) => {
  if (!node || node.nodeName?.toLowerCase() !== 'a') {
    return;
  }

  const href = node.getAttribute('href') || '';
  const isHttpLink = /^https?:\/\//i.test(href);

  if (!isHttpLink) {
    node.removeAttribute('href');
  } else {
    node.setAttribute('href', href);
  }

  node.setAttribute('target', '_blank');
  node.setAttribute('rel', 'noopener noreferrer');

  Array.from(node.attributes || []).forEach(attribute => {
    const name = attribute?.name?.toLowerCase();
    if (!['href', 'target', 'rel'].includes(name)) {
      node.removeAttribute(attribute.name);
    }
  });
};

const linkifyTextNode = (node, documentContext) => {
  if (!node || node.nodeType !== 3) {
    return;
  }

  const textContent = node.textContent || '';
  const matches = Array.from(textContent.matchAll(URL_REGEX));

  if (matches.length === 0) {
    return;
  }

  const fragment = documentContext.createDocumentFragment();
  let lastIndex = 0;

  matches.forEach(match => {
    const fullMatch = match[0];
    const offset = match.index ?? 0;

    if (offset > lastIndex) {
      fragment.appendChild(documentContext.createTextNode(textContent.slice(lastIndex, offset)));
    }

    let url = fullMatch;
    const trailingMatch = url.match(TRAILING_PUNCTUATION_REGEX);
    let trailing = '';

    if (trailingMatch) {
      url = url.slice(0, -trailingMatch[0].length);
      trailing = trailingMatch[0];
    }

    const anchor = documentContext.createElement('a');
    anchor.textContent = url;
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    fragment.appendChild(anchor);

    if (trailing) {
      fragment.appendChild(documentContext.createTextNode(trailing));
    }

    lastIndex = offset + fullMatch.length;
  });

  if (lastIndex < textContent.length) {
    fragment.appendChild(documentContext.createTextNode(textContent.slice(lastIndex)));
  }

  node.replaceWith(fragment);
};

const sanitizeNode = (node, documentContext) => {
  if (!node) {
    return;
  }

  const nodeType = node.nodeType;

  if (nodeType === 3) {
    linkifyTextNode(node, documentContext);
    return;
  }

  if (nodeType !== 1) {
    node.remove();
    return;
  }

  const tagName = node.nodeName?.toLowerCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    const parent = node.parentNode;
    if (!parent) {
      return;
    }

    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
    return;
  }

  if (tagName === 'a') {
    ensureAllowedAnchor(node);
  } else {
    Array.from(node.attributes || []).forEach(attribute => {
      node.removeAttribute(attribute.name);
    });
  }

  Array.from(node.childNodes || []).forEach(child => sanitizeNode(child, documentContext));
};

export const sanitizeRichText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return '';
  }

  if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
    return trimmed;
  }

  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString('<div></div>', 'text/html');
  const container = parsedDocument.createElement('div');
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  const normalizedInput = hasHtmlTags
    ? trimmed
    : trimmed.replace(/\r\n/g, '\n').split('\n').join('<br />');

  container.innerHTML = normalizedInput;

  Array.from(container.childNodes || []).forEach(child => sanitizeNode(child, parsedDocument));

  return container.innerHTML;
};

export const renderRichText = (value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  const sanitizedHtml = sanitizeRichText(value);

  if (!sanitizedHtml) {
    return '';
  }

  return <span className="hv-richtext" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};
