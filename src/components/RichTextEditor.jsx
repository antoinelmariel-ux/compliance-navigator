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
  const linkTextInputRef = useRef(null);
  const selectionRangeRef = useRef(null);
  const selectedTextRef = useRef('');
  const [htmlValue, setHtmlValue] = useState(() => normalizeValue(value));
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    setHtmlValue(normalizeValue(value));
  }, [value]);

  useEffect(() => {
    const normalized = normalizeValue(value);
    setHtmlValue(normalized);

    if (!editorRef.current) {
      return;
    }

    const isFocused =
      typeof document !== 'undefined' && document.activeElement === editorRef.current;

    if (isFocused) {
      return;
    }

    if (editorRef.current.innerHTML !== normalized) {
      editorRef.current.innerHTML = normalized || '';
    }
  }, [value]);

  useEffect(() => {
    if (isLinkModalOpen && linkTextInputRef.current) {
      linkTextInputRef.current.focus();
    }
  }, [isLinkModalOpen]);

  const emitChange = useCallback(
    (nextValue) => {
      const sanitized = sanitizeRichText(nextValue || '');
      setHtmlValue(sanitized);
      onChange?.(sanitized);
      return sanitized;
    },
    [onChange]
  );

  const handleInput = useCallback(() => {
    emitChange(editorRef.current?.innerHTML || '');
  }, [emitChange]);

  const handleBlur = useCallback(() => {
    const sanitized = emitChange(editorRef.current?.innerHTML || '');

    if (editorRef.current && editorRef.current.innerHTML !== sanitized) {
      editorRef.current.innerHTML = sanitized || '';
    }
  }, [emitChange]);

  const handlePaste = useCallback(
    (event) => {
      if (!event?.clipboardData) {
        return;
      }

      const text = event.clipboardData.getData('text/plain');
      if (commandIsAvailable()) {
        event.preventDefault();
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
    selectionRangeRef.current =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    selectedTextRef.current = selectedText;
    setLinkText(selectedText);
    setLinkUrl('https://');
    setLinkError('');
    setIsLinkModalOpen(true);
  }, [applyCommand]);

  const handleCloseLinkModal = useCallback(() => {
    setIsLinkModalOpen(false);
    setLinkError('');
  }, []);

  const handleConfirmLink = useCallback((event) => {
    event?.preventDefault?.();

    const trimmedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setLinkError('Veuillez saisir une URL valide (https://...)');
      return;
    }

    const normalizedDisplayText = linkText.trim() || selectedTextRef.current || trimmedUrl;
    const linkHtml = `<a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer">${normalizedDisplayText}</a>`;

    if (typeof window !== 'undefined' && selectionRangeRef.current && typeof window.getSelection === 'function') {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectionRangeRef.current);
      }
    }

    applyCommand('insertHTML', linkHtml);
    setIsLinkModalOpen(false);
    setLinkError('');
  }, [applyCommand, linkText, linkUrl]);

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
          contentEditable={true}
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleBlur}
          onPaste={handlePaste}
          onKeyUp={handleInput}
          onCompositionEnd={handleInput}
          tabIndex={0}
          role="textbox"
          aria-label={ariaLabel || placeholder}
        />
      </div>
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-gray-900/50" onClick={handleCloseLinkModal} aria-hidden="true" />
          <form
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={handleConfirmLink}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-link-modal-title`}
          >
            <h3 id={`${id}-link-modal-title`} className="text-lg font-semibold text-gray-900">
              Insérer un lien
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Renseignez le texte à afficher et l’URL complète (https://).
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor={`${id}-link-text`} className="block text-sm font-medium text-gray-700">
                  Texte du lien
                </label>
                <input
                  id={`${id}-link-text`}
                  ref={linkTextInputRef}
                  type="text"
                  value={linkText}
                  onChange={(event) => setLinkText(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex : Découvrir le document"
                />
              </div>
              <div>
                <label htmlFor={`${id}-link-url`} className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <input
                  id={`${id}-link-url`}
                  type="url"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://exemple.com"
                />
                {linkError && <p className="mt-2 text-sm text-red-600">{linkError}</p>}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseLinkModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Insérer le lien
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
