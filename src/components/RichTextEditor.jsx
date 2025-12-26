import React, { useCallback, useEffect, useMemo, useRef, useState } from '../react.js';
import { sanitizeRichText } from '../utils/richText.js';

const BUTTON_BASE_CLASSES =
  'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';

const commandIsAvailable = () => typeof document !== 'undefined' && typeof document.execCommand === 'function';

const normalizeValue = (value) => (typeof value === 'string' ? value : '');

export const RichTextEditor = ({
  id,
  value,
  onChange,
  placeholder = 'Commencez votre saisie (texte riche et liens autorisés)',
  compact = false,
  ariaLabel
}) => {
  const editorRef = useRef(null);
  const [htmlValue, setHtmlValue] = useState(() => normalizeValue(value));

  useEffect(() => {
    setHtmlValue(normalizeValue(value));
  }, [value]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== htmlValue) {
      editorRef.current.innerHTML = htmlValue || '';
    }
  }, [htmlValue]);

  const emitChange = useCallback(
    (nextValue) => {
      const sanitized = sanitizeRichText(nextValue || '');
      setHtmlValue(sanitized);
      onChange?.(sanitized);
    },
    [onChange]
  );

  const handleInput = useCallback(() => {
    emitChange(editorRef.current?.innerHTML || '');
  }, [emitChange]);

  const handlePaste = useCallback(
    (event) => {
      if (!event?.clipboardData) {
        return;
      }

      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      if (commandIsAvailable()) {
        document.execCommand('insertText', false, text);
        handleInput();
      }
    },
    [handleInput]
  );

  const applyCommand = useCallback(
    (command, argument = null) => {
      if (!commandIsAvailable()) {
        return;
      }

      document.execCommand(command, false, argument);
      handleInput();
    },
    [handleInput]
  );

  const handleAddLink = useCallback(() => {
    if (typeof window === 'undefined' || !commandIsAvailable()) {
      return;
    }

    const selection = typeof window.getSelection === 'function' ? window.getSelection() : null;
    const selectedText = selection?.toString() || '';
    const displayText = window.prompt('Texte à afficher pour le lien', selectedText);

    if (displayText === null) {
      return;
    }

    const url = window.prompt('Lien HTML à insérer (https://...)', 'https://');
    if (!url) {
      return;
    }

    const trimmedUrl = url.trim();
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      if (typeof window.alert === 'function') {
        window.alert('Veuillez saisir une URL valide (https://...)');
      }
      return;
    }

    const normalizedDisplayText = displayText?.trim() || selectedText || trimmedUrl;
    const linkHtml = `<a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer">${normalizedDisplayText}</a>`;
    applyCommand('insertHTML', linkHtml);
  }, [applyCommand]);

  const minHeight = useMemo(() => (compact ? 120 : 180), [compact]);
  const showPlaceholder = !htmlValue;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={BUTTON_BASE_CLASSES} onClick={() => applyCommand('bold')}>
          <span className="font-semibold">G</span>
          <span className="sr-only">Mettre en gras</span>
        </button>
        <button type="button" className={BUTTON_BASE_CLASSES} onClick={() => applyCommand('italic')}>
          <span className="italic">I</span>
          <span className="sr-only">Italique</span>
        </button>
        <button type="button" className={BUTTON_BASE_CLASSES} onClick={() => applyCommand('underline')}>
          <span className="underline">U</span>
          <span className="sr-only">Souligner</span>
        </button>
        <button type="button" className={BUTTON_BASE_CLASSES} onClick={() => applyCommand('insertUnorderedList')}>
          <span aria-hidden="true">• • •</span>
          <span className="sr-only">Liste à puces</span>
        </button>
        <button type="button" className={BUTTON_BASE_CLASSES} onClick={handleAddLink}>
          <span aria-hidden="true">🔗</span>
          <span className="sr-only">Insérer un lien</span>
        </button>
        <button type="button" className={BUTTON_BASE_CLASSES} onClick={() => applyCommand('removeFormat')}>
          <span aria-hidden="true">⟲</span>
          <span className="sr-only">Nettoyer la mise en forme</span>
        </button>
      </div>
      <div className="relative">
        {showPlaceholder && (
          <div className="pointer-events-none absolute inset-0 px-4 py-3 text-sm text-gray-400 select-none leading-relaxed">
            {placeholder}
          </div>
        )}
        <div
          id={id}
          ref={editorRef}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] prose prose-sm max-w-none hv-focus-ring"
          style={{ minHeight }}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          onPaste={handlePaste}
          role="textbox"
          aria-label={ariaLabel || placeholder}
        />
      </div>
    </div>
  );
};
