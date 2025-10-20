import React from '../react.js';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const TRAILING_PUNCTUATION_REGEX = /[)\]\}.,;!?]+$/;

export const renderTextWithLinks = (text) => {
  if (typeof text !== 'string' || text.length === 0) {
    return text;
  }

  const elements = [];
  let lastIndex = 0;

  text.replace(URL_REGEX, (match, offset) => {
    if (offset > lastIndex) {
      elements.push(text.slice(lastIndex, offset));
    }

    let url = match;
    const trailingMatch = url.match(TRAILING_PUNCTUATION_REGEX);
    let trailing = '';

    if (trailingMatch) {
      url = url.slice(0, -trailingMatch[0].length);
      trailing = trailingMatch[0];
    }

    elements.push(
      <a
        key={`link-${offset}`}
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

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex === 0) {
    return text;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
};
