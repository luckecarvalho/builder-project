import React, { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { BlockProps } from '@/types/builder';
import { TextFormats, OrderedListStyle } from '@/hooks/useTextFormatting';
import { ValidationUtils } from '@/utils/validation';
import {
  removeUnderlineFromSelection,
  restoreRangeInRoot,
  ensureCommandState,
  computeRichTextToolbarFormats,
  wrapCurrentRangeWithSpanStyle,
  applyUnorderedListMarkerAtSelection,
  applyOrderedListStyleAtSelection,
  isUnorderedListMarkerValue,
  applyFontSizePxToRange,
  ensureSelectionInsideEditor,
} from '@/utils/richTextSelection';

export type RichTextToolbar = {
  show: (toolbar: {
    isVisible: boolean;
    onFormatChange: (format: string, value: any) => void;
    onClose: () => void;
    currentFormats: any;
  }) => void;
  hide: () => void;
};

export interface RichTextEditableFieldProps {
  html: string;
  onHtmlChange: (next: string) => void;
  /** Editor visível (foco de edição inline) */
  isActive: boolean;
  /** Permite clicar para ativar edição (modo builder) */
  builderEditMode: boolean;
  onRequestActivate?: () => void;
  onRequestDeactivate?: () => void;
  blockStyle?: BlockProps['style'];
  allowLinks?: boolean;
  placeholder: string;
  /** Plain texts que, após strip de tags, contam como vazio (placeholders legados). */
  treatAsEmptyPlain?: string[];
  globalFormattingToolbar?: RichTextToolbar;
  isSelected?: boolean;
  onSelect?: () => void;
  maxChars?: number;
  displayClassName?: string;
  editorClassName?: string;
  stopClickPropagation?: boolean;
  /** Enter (sem Shift) finaliza edição (títulos curtos em abas/carrossel). */
  singleLine?: boolean;
  /** Não persiste tipografia no `style` do bloco pai (campos aninhados). */
  persistBlockTypography?: boolean;
  onUpdateBlockStyle?: (style: BlockProps['style']) => void;
  ariaLabel?: string;
}

function looksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

function plainTextToRichHtml(raw: string): string {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  const esc = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return `<p>${esc.replace(/\r\n/g, '\n').split('\n').join('<br>')}</p>`;
}

function normalizeIncomingForEditor(incoming: string): string {
  if (!incoming.trim()) return '';
  if (looksLikeHtml(incoming)) return incoming;
  return plainTextToRichHtml(incoming);
}

function isStoredEmpty(html: unknown, treatAsEmptyPlain: string[]): boolean {
  if (typeof html !== 'string' || !html.trim()) return true;
  const plain = ValidationUtils.stripHtmlTags(html).trim();
  if (!plain) return true;
  return treatAsEmptyPlain.some((p) => plain === p);
}

const RichTextEditableField: React.FC<RichTextEditableFieldProps> = ({
  html,
  onHtmlChange,
  isActive,
  builderEditMode,
  onRequestActivate,
  onRequestDeactivate,
  blockStyle,
  allowLinks = false,
  placeholder,
  treatAsEmptyPlain = [],
  globalFormattingToolbar,
  isSelected = false,
  onSelect,
  maxChars,
  displayClassName = '',
  editorClassName = '',
  stopClickPropagation = false,
  singleLine = false,
  persistBlockTypography = false,
  onUpdateBlockStyle,
  ariaLabel = 'Editar texto',
}) => {
  const [editorFocused, setEditorFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastSavedHtmlRef = useRef<string | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const handleFormatChangeRef = useRef<(format: string, value?: any) => void>(() => {});

  const treatEmptyKey = (treatAsEmptyPlain ?? []).join('\u0001');

  useEffect(() => {
    if (!isActive) return;
    const editor = editorRef.current;
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editor) return;
      if (document.activeElement !== editor) return;
      const range = sel.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        try {
          savedSelectionRef.current = range.cloneRange();
        } catch {
          savedSelectionRef.current = null;
        }
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      lastSavedHtmlRef.current = null;
      return;
    }
    const incoming = typeof html === 'string' ? html : '';
    const effectiveIncoming = isStoredEmpty(incoming, treatAsEmptyPlain ?? []) ? '' : incoming;
    if (lastSavedHtmlRef.current === effectiveIncoming) return;
    const editor = editorRef.current;
    if (editor) {
      const normalized = effectiveIncoming === '' ? '' : normalizeIncomingForEditor(incoming);
      editor.innerHTML = normalized === '' ? '<br>' : normalized;
      lastSavedHtmlRef.current = effectiveIncoming;
    }
  }, [html, isActive, treatEmptyKey]);

  const [formats, setFormats] = useState<TextFormats>(() => {
    const initialFormats: TextFormats = {};
    if (blockStyle?.typography?.fontSize) {
      initialFormats.fontSize =
        typeof blockStyle.typography.fontSize === 'number'
          ? blockStyle.typography.fontSize
          : parseInt(String(blockStyle.typography.fontSize).replace('px', ''), 10);
    }
    if (blockStyle?.typography?.color || blockStyle?.colors?.text) {
      initialFormats.color = blockStyle.typography?.color || blockStyle.colors?.text;
    }
    if (blockStyle?.colors?.background) {
      initialFormats.backgroundColor = blockStyle.colors.background;
    }
    if (blockStyle?.typography?.textAlign) {
      initialFormats.align = blockStyle.typography.textAlign as 'left' | 'center' | 'right' | 'justify';
    }
    return initialFormats;
  });

  const saveContentFromEditor = useCallback(
    (opts?: { flush?: boolean }) => {
      const editor = editorRef.current;
      if (!editor) return;
      let raw = editor.innerHTML ?? '';
      const plainTrim = ValidationUtils.stripHtmlTags(raw).trim();
      if (plainTrim === '' || (treatAsEmptyPlain ?? []).some((p) => plainTrim === p)) {
        raw = '';
        editor.innerHTML = '<br>';
      }
      const sanitized = raw === '' ? '' : ValidationUtils.sanitizeHtml(raw, allowLinks);
      lastSavedHtmlRef.current = sanitized;
      if (opts?.flush) {
        flushSync(() => {
          onHtmlChange(sanitized);
        });
      } else {
        onHtmlChange(sanitized);
      }
    },
    [onHtmlChange, allowLinks, treatEmptyKey]
  );

  const refreshToolbarFormatsFromSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const fromDom = computeRichTextToolbarFormats(editor);
    if (!fromDom) return;

    setFormats(fromDom);
    globalFormattingToolbar?.show({
      isVisible: true,
      onFormatChange: (f, v) => handleFormatChangeRef.current(f, v),
      onClose: () => globalFormattingToolbar.hide(),
      currentFormats: fromDom,
    });
  }, [globalFormattingToolbar]);

  const handleFormatChange = useCallback(
    (format: string, value: any) => {
      const applyToSelection = (fn: () => void | boolean, opts?: { requireNonCollapsed?: boolean }) => {
        const ed = editorRef.current;
        if (!ed) return false;
        ed.focus();
        void ed.offsetWidth;
        let restored = restoreRangeInRoot(savedSelectionRef.current, ed);
        if (!restored) {
          const selNow = window.getSelection();
          if (
            selNow?.rangeCount &&
            ed.contains(selNow.getRangeAt(0).commonAncestorContainer)
          ) {
            restored = true;
          }
        }
        const selPre = window.getSelection();
        if (selPre?.rangeCount) {
          try {
            const r0 = selPre.getRangeAt(0);
            if (!ed.contains(r0.commonAncestorContainer)) {
              ensureSelectionInsideEditor(ed);
            }
          } catch {
            ensureSelectionInsideEditor(ed);
          }
        } else {
          ensureSelectionInsideEditor(ed);
        }
        const sel = window.getSelection();
        if (opts?.requireNonCollapsed) {
          if (!sel || sel.rangeCount === 0) return false;
          const r = sel.getRangeAt(0);
          if (r.collapsed) return false;
          if (!ed.contains(r.commonAncestorContainer)) return false;
        }
        const applied = fn();
        if (applied === false) return false;
        saveContentFromEditor();
        queueMicrotask(() => refreshToolbarFormatsFromSelection());
        return true;
      };

      const orderedStyle: OrderedListStyle =
        value === 'alpha' || value === 'decimal' ? value : 'decimal';

      if (format === 'unorderedList' || format === 'orderedList' || format === 'indent' || format === 'outdent') {
        if (
          !applyToSelection(() => {
            const root = editorRef.current;
            if (!root) return;
            if (format === 'unorderedList') {
              const marker = isUnorderedListMarkerValue(value) ? value : 'bullet';
              applyUnorderedListMarkerAtSelection(root, marker);
            } else if (format === 'orderedList') {
              applyOrderedListStyleAtSelection(root, orderedStyle);
            } else if (format === 'indent') {
              document.execCommand('indent', false);
            } else {
              document.execCommand('outdent', false);
            }
          })
        ) {
          return;
        }
        return;
      }

      if (format === 'bold') {
        if (applyToSelection(() => ensureCommandState('bold', !!value))) return;
      }
      if (format === 'italic') {
        if (applyToSelection(() => ensureCommandState('italic', !!value))) return;
      }
      if (format === 'underline') {
        if (
          applyToSelection(() => {
            const ed = editorRef.current;
            if (!ed) return;
            if (!value) {
              removeUnderlineFromSelection(ed);
            }
            ensureCommandState('underline', !!value);
          })
        ) {
          return;
        }
      }

      if (format === 'align' && value) {
        if (
          applyToSelection(() => {
            const map: Record<string, string> = {
              left: 'justifyLeft',
              center: 'justifyCenter',
              right: 'justifyRight',
              justify: 'justifyFull',
            };
            const cmd = map[value as string];
            if (cmd) document.execCommand(cmd, false);
          })
        ) {
          return;
        }
      }

      if (format === 'fontSize' && value != null) {
        const px = typeof value === 'number' ? value : parseInt(String(value), 10);
        if (
          !Number.isNaN(px) &&
          applyToSelection(
            () => {
              const ed = editorRef.current;
              if (!ed) return false;
              return applyFontSizePxToRange(ed, px);
            },
            { requireNonCollapsed: true }
          )
        ) {
          return;
        }
      }

      if (format === 'color' && typeof value === 'string') {
        if (
          applyToSelection(
            () => {
              try {
                document.execCommand('foreColor', false, value);
              } catch {
                wrapCurrentRangeWithSpanStyle({ color: value });
              }
            },
            { requireNonCollapsed: true }
          )
        ) {
          return;
        }
      }

      if (format === 'backgroundColor' && typeof value === 'string') {
        if (
          applyToSelection(
            () => {
              try {
                document.execCommand('hiliteColor', false, value);
              } catch {
                try {
                  document.execCommand('backColor', false, value);
                } catch {
                  wrapCurrentRangeWithSpanStyle({ backgroundColor: value });
                }
              }
            },
            { requireNonCollapsed: true }
          )
        ) {
          return;
        }
      }

      const newFormats: TextFormats = {
        ...formats,
        [format]: value,
      };
      setFormats(newFormats);

      if (persistBlockTypography && (onUpdateBlockStyle || format === 'align')) {
        const updatedStyle: BlockProps['style'] = {
          ...blockStyle,
          typography: {
            ...blockStyle?.typography,
            textAlign: blockStyle?.typography?.textAlign || formats.align || 'left',
          },
          colors: {
            ...blockStyle?.colors,
          },
        };

        if (format === 'align') {
          (updatedStyle.typography as Record<string, unknown>).textAlign = value;
        }

        onUpdateBlockStyle?.(updatedStyle);
      }

      if (globalFormattingToolbar) {
        globalFormattingToolbar.show({
          isVisible: true,
          onFormatChange: (f, v) => handleFormatChangeRef.current(f, v),
          onClose: () => globalFormattingToolbar.hide(),
          currentFormats: newFormats,
        });
      }
    },
    [
      formats,
      globalFormattingToolbar,
      saveContentFromEditor,
      refreshToolbarFormatsFromSelection,
      blockStyle,
      persistBlockTypography,
      onUpdateBlockStyle,
    ]
  );

  useEffect(() => {
    handleFormatChangeRef.current = handleFormatChange;
  }, [handleFormatChange]);

  React.useEffect(() => {
    const newFormats: TextFormats = {};
    if (blockStyle?.typography?.fontSize) {
      const fontSize =
        typeof blockStyle.typography.fontSize === 'number'
          ? blockStyle.typography.fontSize
          : parseInt(String(blockStyle.typography.fontSize).replace('px', ''), 10);
      if (!Number.isNaN(fontSize)) newFormats.fontSize = fontSize;
    }
    if (blockStyle?.typography?.color || blockStyle?.colors?.text) {
      newFormats.color = blockStyle.typography?.color || blockStyle.colors?.text;
    }
    if (blockStyle?.colors?.background) {
      newFormats.backgroundColor = blockStyle.colors.background;
    }
    if (blockStyle?.typography?.textAlign) {
      newFormats.align = blockStyle.typography.textAlign as 'left' | 'center' | 'right' | 'justify';
    }
    if (blockStyle?.typography?.fontWeight) {
      newFormats.bold = blockStyle.typography.fontWeight === 'bold';
    }
    if (blockStyle?.typography?.fontStyle) {
      newFormats.italic = blockStyle.typography.fontStyle === 'italic';
    }
    if (blockStyle?.typography?.textDecoration) {
      newFormats.underline = blockStyle.typography.textDecoration === 'underline';
    }
    setFormats((prev) => ({ ...prev, ...newFormats }));
  }, [
    blockStyle?.typography?.fontSize,
    blockStyle?.typography?.color,
    blockStyle?.colors?.text,
    blockStyle?.colors?.background,
    blockStyle?.typography?.textAlign,
    blockStyle?.typography?.fontWeight,
    blockStyle?.typography?.fontStyle,
    blockStyle?.typography?.textDecoration,
  ]);

  const blockDefaultEditorStyle: React.CSSProperties = {
    fontSize: blockStyle?.typography?.fontSize
      ? `${typeof blockStyle.typography.fontSize === 'number' ? blockStyle.typography.fontSize : parseInt(String(blockStyle.typography.fontSize).replace('px', ''), 10)}px`
      : undefined,
    fontWeight: blockStyle?.typography?.fontWeight,
    fontFamily: blockStyle?.typography?.fontFamily,
    lineHeight: blockStyle?.typography?.lineHeight,
    color: blockStyle?.typography?.color || blockStyle?.colors?.text,
    backgroundColor: blockStyle?.colors?.background,
    textAlign: blockStyle?.typography?.textAlign as React.CSSProperties['textAlign'],
    margin: 0,
    padding: 0,
  };

  const editorBaseStyle: React.CSSProperties = {
    ...blockDefaultEditorStyle,
  };
  delete editorBaseStyle.fontWeight;
  delete editorBaseStyle.fontStyle;
  delete (editorBaseStyle as { textDecoration?: string }).textDecoration;

  const previewWrapperStyle: React.CSSProperties = {
    ...blockDefaultEditorStyle,
  };

  const normalizePlainForCounter = (raw: unknown): string => {
    if (typeof raw !== 'string') return '';
    const noTags = raw.replace(/<\/?[^>]+(>|$)/g, '');
    const trimmed = noTags.trim();
    if (!trimmed || (treatAsEmptyPlain ?? []).some((p) => trimmed === p)) return '';
    return noTags;
  };

  const rawHtml = typeof html === 'string' ? html : '';
  const safeHtml = ValidationUtils.sanitizeHtml(rawHtml, allowLinks);
  const plainVisible = ValidationUtils.stripHtmlTags(rawHtml).trim();
  const hasMediaWithoutPlainText =
    plainVisible === '' && /<(img|video|audio|iframe|svg)\b/i.test(safeHtml);
  const showPlaceholder =
    isStoredEmpty(rawHtml, treatAsEmptyPlain ?? []) && !hasMediaWithoutPlainText;

  if (isActive) {
    const currentText = normalizePlainForCounter(html);
    const showPlaceholderOverlay = isStoredEmpty(html, treatAsEmptyPlain ?? []) && !editorFocused;

    return (
      <div
        className={`relative ${displayClassName}`}
        onClick={stopClickPropagation ? (e) => e.stopPropagation() : undefined}
      >
        {maxChars != null && maxChars > 0 && (
          <div className="absolute -top-6 right-0 text-[10px] text-gray-400 z-[3]">
            {currentText.length}/{maxChars}
          </div>
        )}
        <div className="relative min-h-[1.25em]">
          {showPlaceholderOverlay && (
            <span
              className="pointer-events-none absolute inset-0 z-[2] flex items-start whitespace-pre-wrap text-gray-400 select-none"
              aria-hidden
            >
              {placeholder}
            </span>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline={!singleLine}
            aria-label={ariaLabel}
            aria-placeholder={isStoredEmpty(html, treatAsEmptyPlain ?? []) ? placeholder : undefined}
            className={`builder-rich-html relative z-[1] min-h-[1.25em] w-full bg-transparent border-none outline-none whitespace-pre-wrap ${editorClassName}`}
            style={editorBaseStyle}
            onInput={() => saveContentFromEditor()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                saveContentFromEditor({ flush: true });
                globalFormattingToolbar?.hide();
                onRequestDeactivate?.();
                return;
              }
              if (singleLine && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLElement).blur();
                return;
              }
              if (e.key === 'Tab') {
                e.preventDefault();
                handleFormatChangeRef.current(e.shiftKey ? 'outdent' : 'indent', undefined);
              }
            }}
            onMouseUp={() => {
              const ed = editorRef.current;
              const sel = window.getSelection();
              if (
                ed &&
                sel?.rangeCount &&
                ed.contains(sel.getRangeAt(0).commonAncestorContainer)
              ) {
                try {
                  savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                } catch {
                  savedSelectionRef.current = null;
                }
              }
              refreshToolbarFormatsFromSelection();
            }}
            onKeyUp={() => refreshToolbarFormatsFromSelection()}
            onFocus={() => {
              setEditorFocused(true);
              if (globalFormattingToolbar) {
                globalFormattingToolbar.show({
                  isVisible: true,
                  onFormatChange: (f, v) => handleFormatChangeRef.current(f, v),
                  onClose: () => globalFormattingToolbar.hide(),
                  currentFormats: formats,
                });
              }
              queueMicrotask(() => refreshToolbarFormatsFromSelection());
            }}
            onBlur={() => {
              saveContentFromEditor({ flush: true });
              setEditorFocused(false);
              globalFormattingToolbar?.hide();
              onRequestDeactivate?.();
            }}
          />
        </div>
      </div>
    );
  }

  if (!builderEditMode) {
    return (
      <div
        className={`builder-rich-html whitespace-pre-wrap ${displayClassName}`}
        style={previewWrapperStyle}
        onClick={onSelect}
      >
        {!showPlaceholder ? (
          <div className="m-0 p-0 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: safeHtml }} />
        ) : (
          <p className="m-0 p-0 text-gray-400">{placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`builder-rich-html whitespace-pre-wrap ${isSelected ? 'ring-1 ring-indigo-300 rounded' : ''} ${displayClassName}`}
      style={previewWrapperStyle}
      onClick={(e) => {
        if (stopClickPropagation) e.stopPropagation();
        onSelect?.();
        onRequestActivate?.();
      }}
    >
      {!showPlaceholder ? (
        <div
          className={`m-0 p-0 whitespace-pre-wrap ${builderEditMode ? 'cursor-text' : ''}`}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <p className={`m-0 p-0 text-gray-400 ${builderEditMode ? 'cursor-text' : ''}`}>{placeholder}</p>
      )}
    </div>
  );
};

export default RichTextEditableField;
