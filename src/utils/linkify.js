import React from '../react.js';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const TRAILING_PUNCTUATION_REGEX = /[)\]\}.,;!?]+$/;

export const renderTextWithLinks = (text) => {
  if (typeof text !== 'string' || text.length === 0) {
    return text;
  }

  const matches = Array.from(text.matchAll(URL_REGEX));

  if (matches.length === 0) {
    return text;
  }

  const elements = [];
  let lastIndex = 0;

  matches.forEach((match, matchIdx) => {
    const fullMatch = match[0];
    const offset = match.index ?? 0;

    if (offset > lastIndex) {
      elements.push(text.slice(lastIndex, offset));
    }

    let url = fullMatch;
    const trailingMatch = url.match(TRAILING_PUNCTUATION_REGEX);
    let trailing = '';

    if (trailingMatch) {
      url = url.slice(0, -trailingMatch[0].length);
      trailing = trailingMatch[0];
    }

    elements.push(
      <a
        key={`link-${offset}-${matchIdx}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        {url}
      </a>
    );

    if (trailing) {
      elements.push(trailing);
    }

    lastIndex = offset + fullMatch.length;
  });

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
};
