import React, { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { TextBlockProps } from '@/types/builder';
import { TextFormats, UnorderedListMarkerStyle, OrderedListStyle } from '@/hooks/useTextFormatting';
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

interface TextBlockComponentProps {
  block: { props: TextBlockProps };
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<TextBlockProps>) => void;
  onSelect?: () => void;
  globalFormattingToolbar?: {
    show: (toolbar: {
      isVisible: boolean;
      onFormatChange: (format: string, value: any) => void;
      onClose: () => void;
      currentFormats: any;
    }) => void;
    hide: () => void;
  };
}

const TEXT_BLOCK_PLACEHOLDER = 'Digite seu texto aqui...';

function isHtmlStoredEmpty(h: unknown): boolean {
  if (typeof h !== 'string' || !h.trim()) return true;
  const plain = ValidationUtils.stripHtmlTags(h).trim();
  if (!plain) return true;
  if (plain === TEXT_BLOCK_PLACEHOLDER) return true;
  return false;
}

const TextBlock: React.FC<TextBlockComponentProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onSelect,
  globalFormattingToolbar,
}) => {
  const { content, style } = block.props;
  const { html, maxChars, allowHtml, allowLinks } = content;
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastSavedHtmlRef = useRef<string | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Guardar seleção apenas quando o foco está no editor (evita sobrescrever ao clicar na toolbar)
  useEffect(() => {
    if (!isEditing) return;
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
  }, [isEditing]);

  // Sincronizar conteúdo externo (ex.: undo) para o contentEditable; evita sobrescrever edição local
  useEffect(() => {
    if (!isEditing) {
      // Ao ir para Preview o contentEditable desmonta; ao voltar, o ref novo estaria vazio
      // mas lastSavedHtmlRef ainda igualaria a `html` e o efeito pularia a hidratação.
      lastSavedHtmlRef.current = null;
      return;
    }
    const incoming = typeof html === 'string' ? html : '';
    const effectiveIncoming = isHtmlStoredEmpty(incoming) ? '' : incoming;
    if (lastSavedHtmlRef.current === effectiveIncoming) return;
    const editor = editorRef.current;
    if (editor) {
      if (effectiveIncoming === '') {
        editor.innerHTML = '<br>';
      } else {
        editor.innerHTML = incoming;
      }
      lastSavedHtmlRef.current = effectiveIncoming;
    }
  }, [html, isEditing]);
  
  // Inicializar formatos a partir do estilo persistido
  const [formats, setFormats] = useState<TextFormats>(() => {
    const initialFormats: TextFormats = {};
    if (style?.typography?.fontSize) {
      initialFormats.fontSize = typeof style.typography.fontSize === 'number' 
        ? style.typography.fontSize 
        : parseInt(String(style.typography.fontSize).replace('px', ''));
    }
    if (style?.typography?.color || style?.colors?.text) {
      initialFormats.color = style.typography?.color || style?.colors?.text;
    }
    if (style?.colors?.background) {
      initialFormats.backgroundColor = style.colors.background;
    }
    if (style?.typography?.textAlign) {
      initialFormats.align = style.typography.textAlign as 'left' | 'center' | 'right' | 'justify';
    }
    return initialFormats;
  });

  // Remove quaisquer tags HTML e normaliza o placeholder antigo para string vazia
  const normalizePlainText = (raw: unknown): string => {
    if (typeof raw !== 'string') return '';
    const noTags = raw.replace(/<\/?[^>]+(>|$)/g, '');
    const trimmed = noTags.trim();
    if (trimmed === '' || trimmed === TEXT_BLOCK_PLACEHOLDER) {
      return '';
    }
    return noTags;
  };

  const handleFormatChangeRef = useRef<(format: string, value?: any) => void>(() => {});

  const saveContentFromEditor = useCallback((opts?: { flush?: boolean }) => {
    const editor = editorRef.current;
    if (!editor || !onUpdate) return;
    let raw = editor.innerHTML ?? '';
    const plainTrim = ValidationUtils.stripHtmlTags(raw).trim();
    if (plainTrim === '' || plainTrim === TEXT_BLOCK_PLACEHOLDER) {
      raw = '';
      editor.innerHTML = '<br>';
    }
    const sanitized = raw === '' ? '' : ValidationUtils.sanitizeHtml(raw, allowLinks);
    lastSavedHtmlRef.current = sanitized;
    const payload = { content: { ...content, html: sanitized, allowHtml: true } };
    if (opts?.flush) {
      flushSync(() => {
        onUpdate(payload);
      });
    } else {
      onUpdate(payload);
    }
  }, [onUpdate, content, allowLinks]);

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
        if (!ed || !onUpdate) return false;
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
        if (!applyToSelection(() => {
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
        })) {
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

      const newFormats = ({
        ...formats,
        [format]: value,
      }) as TextFormats;
      setFormats(newFormats);

      if (onUpdate) {
        const updatedStyle: any = {
          ...style,
          typography: {
            ...style?.typography,
            textAlign: style?.typography?.textAlign || formats.align || 'left',
          },
          colors: {
            ...style?.colors,
          },
        };

        if (format === 'align') {
          updatedStyle.typography.textAlign = value;
        }

        onUpdate({ style: updatedStyle });
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
    [formats, globalFormattingToolbar, onUpdate, saveContentFromEditor, refreshToolbarFormatsFromSelection, style]
  );

  useEffect(() => {
    handleFormatChangeRef.current = handleFormatChange;
  }, [handleFormatChange]);

  // Para o contentEditable, NÃO aplicar color/fontSize/backgroundColor/alinhamento vindos de `formats`
  // (estado da toolbar/seleção): isso herdaria no texto inteiro e sobrescreveria o HTML parcial.
  // Só defaults do bloco (`style`) no wrapper; formatação parcial fica só no HTML.
  const blockDefaultEditorStyle: React.CSSProperties = {
    fontSize: style?.typography?.fontSize
      ? `${typeof style.typography.fontSize === 'number' ? style.typography.fontSize : parseInt(String(style.typography.fontSize).replace('px', ''), 10)}px`
      : undefined,
    fontWeight: style?.typography?.fontWeight,
    fontFamily: style?.typography?.fontFamily,
    lineHeight: style?.typography?.lineHeight,
    color: style?.typography?.color || style?.colors?.text,
    backgroundColor: style?.colors?.background,
    textAlign: style?.typography?.textAlign as React.CSSProperties['textAlign'],
    margin: 0,
    padding: 0,
  };

  const editorBaseStyle: React.CSSProperties = {
    ...blockDefaultEditorStyle,
  };
  delete editorBaseStyle.fontWeight;
  delete editorBaseStyle.fontStyle;
  delete (editorBaseStyle as { textDecoration?: string }).textDecoration;

  React.useEffect(() => {
    const newFormats: TextFormats = {};
    if (style?.typography?.fontSize) {
      const fontSize = typeof style.typography.fontSize === 'number' 
        ? style.typography.fontSize 
        : parseInt(String(style.typography.fontSize).replace('px', ''));
      if (!isNaN(fontSize)) newFormats.fontSize = fontSize;
    }
    if (style?.typography?.color || style?.colors?.text) {
      newFormats.color = style.typography?.color || style?.colors?.text;
    }
    if (style?.colors?.background) {
      newFormats.backgroundColor = style.colors.background;
    }
    if (style?.typography?.textAlign) {
      newFormats.align = style.typography.textAlign as 'left' | 'center' | 'right' | 'justify';
    }
    setFormats((prev) => ({ ...prev, ...newFormats }) as TextFormats);
  }, [style?.typography?.fontSize, style?.typography?.color, style?.colors?.text, style?.colors?.background, style?.typography?.textAlign]);

  const previewWrapperStyle: React.CSSProperties = {
    ...blockDefaultEditorStyle,
  };

  if (isEditing) {
    const currentText = normalizePlainText(html);
    const showPlaceholderOverlay = isHtmlStoredEmpty(html) && !editorFocused;

    return (
      <div
        className={`relative group ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
        onClick={onSelect}
      >
        {isSelected && maxChars && (
          <div className="absolute -top-12 left-0 flex items-center space-x-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
            <span className="text-xs text-gray-500">
              {currentText.length}/{maxChars}
            </span>
          </div>
        )}

        <div className="relative min-h-[1.5em]">
          {showPlaceholderOverlay && (
            <span
              className="pointer-events-none absolute inset-0 z-[2] flex items-start whitespace-pre-wrap text-gray-400 select-none"
              aria-hidden
            >
              {TEXT_BLOCK_PLACEHOLDER}
            </span>
          )}
          <div
            ref={editorRef}
            id={`text-edit-${block.props.id}`}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Editar texto"
            aria-placeholder={isHtmlStoredEmpty(html) ? TEXT_BLOCK_PLACEHOLDER : undefined}
            className="builder-rich-html relative z-[1] min-h-[1.5em] w-full bg-transparent border-none outline-none whitespace-pre-wrap"
            style={editorBaseStyle}
            onInput={() => {
              saveContentFromEditor();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                handleFormatChange(e.shiftKey ? 'outdent' : 'indent', undefined);
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
              if (globalFormattingToolbar) {
                globalFormattingToolbar.hide();
              }
            }}
          />
        </div>
      </div>
    );
  }

  const rawHtml = typeof html === 'string' ? html : '';
  const safeHtml = ValidationUtils.sanitizeHtml(rawHtml, allowLinks);
  const plainVisible = ValidationUtils.stripHtmlTags(rawHtml).trim();
  const hasMediaWithoutPlainText =
    plainVisible === '' && /<(img|video|audio|iframe|svg)\b/i.test(safeHtml);
  const showPlaceholder = plainVisible === '' && !hasMediaWithoutPlainText;

  return (
    <div
      className={`builder-rich-html ${isSelected ? 'ring-2 ring-indigo-500' : ''} whitespace-pre-wrap`}
      style={previewWrapperStyle}
      onClick={onSelect}
    >
      {!showPlaceholder ? (
        <div
          className="m-0 p-0 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <p className="m-0 p-0 text-gray-400">{TEXT_BLOCK_PLACEHOLDER}</p>
      )}
    </div>
  );
};

export default TextBlock;

