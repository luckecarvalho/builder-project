import React, { useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { HeadingBlockProps } from '@/types/builder';
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

interface HeadingBlockComponentProps {
  block: { props: HeadingBlockProps };
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<HeadingBlockProps>) => void;
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

const HeadingBlock: React.FC<HeadingBlockComponentProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onSelect,
  globalFormattingToolbar,
}) => {
  const { content, style } = block.props;
  const { level, text, alignment } = content;

  const editorRef = useRef<HTMLSpanElement | null>(null);
  const lastSavedTextRef = useRef<string | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const handleFormatChangeRef = useRef<(format: string, value?: any) => void>(() => {});

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

  useEffect(() => {
    if (!isEditing) {
      lastSavedTextRef.current = null;
      return;
    }
    const incoming = typeof text === 'string' ? text : '';
    const editor = editorRef.current;
    if (!editor) return;

    const plainIncoming = ValidationUtils.stripHtmlTags(incoming).trim();
    const targetHtml = plainIncoming === '' ? '<br>' : incoming;

    const htmlRaw = editor.innerHTML ?? '';
    const domPlain = ValidationUtils.stripHtmlTags(htmlRaw).replace(/\u200b/g, '').trim();
    const domHasMedia = /<(img|video|audio|iframe|svg)\b/i.test(htmlRaw);
    const isDomVisuallyEmpty =
      (domPlain === '' && !domHasMedia) || /^<br\s*\/?>$/i.test(htmlRaw.trim());

    // Ao mudar o nível (Hn), o elemento host muda e o <span> é recriado vazio: não pode saltar
    // só porque lastSaved coincide com `text` — é preciso repor o HTML a partir das props.
    if (lastSavedTextRef.current === incoming && !isDomVisuallyEmpty) return;

    editor.innerHTML = targetHtml;
    lastSavedTextRef.current = incoming;
  }, [text, isEditing, level]);

  const [formats, setFormats] = React.useState<TextFormats>(() => {
    const initialFormats: TextFormats = {};
    if (style?.typography?.fontSize) {
      initialFormats.fontSize =
        typeof style.typography.fontSize === 'number'
          ? style.typography.fontSize
          : parseInt(String(style.typography.fontSize).replace('px', ''), 10);
    }
    if (style?.typography?.color || style?.colors?.text) {
      initialFormats.color = style.typography?.color || style.colors?.text;
    }
    if (style?.colors?.background) {
      initialFormats.backgroundColor = style.colors.background;
    }
    if (style?.typography?.textAlign || alignment) {
      initialFormats.align = (style?.typography?.textAlign || alignment) as
        | 'left'
        | 'center'
        | 'right'
        | 'justify';
    }
    if (style?.typography?.fontWeight) {
      initialFormats.bold = style.typography.fontWeight === 'bold';
    }
    if (style?.typography?.fontStyle) {
      initialFormats.italic = style.typography.fontStyle === 'italic';
    }
    if (style?.typography?.textDecoration) {
      initialFormats.underline = style.typography.textDecoration === 'underline';
    }
    return initialFormats;
  });

  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  const saveContentFromEditor = useCallback((opts?: { flush?: boolean }) => {
    const editor = editorRef.current;
    if (!editor || !onUpdate) return;
    let raw = editor.innerHTML ?? '';
    if (ValidationUtils.stripHtmlTags(raw).trim() === '') {
      raw = '';
      editor.innerHTML = '<br>';
    }
    const sanitized = raw === '' ? '' : ValidationUtils.sanitizeHtml(raw, true);
    lastSavedTextRef.current = sanitized;
    const payload = {
      content: {
        ...content,
        text: sanitized,
      },
    };
    if (opts?.flush) {
      flushSync(() => {
        onUpdate(payload);
      });
    } else {
      onUpdate(payload);
    }
  }, [onUpdate, content]);

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

      const newFormats: TextFormats = {
        ...formats,
        [format]: value,
      };
      setFormats(newFormats);

      if (onUpdate) {
        const updatedStyle: Record<string, unknown> = {
          ...style,
          typography: {
            ...style?.typography,
            textAlign: style?.typography?.textAlign || alignment || 'left',
          },
          colors: {
            ...style?.colors,
          },
        };

        if (format === 'align') {
          (updatedStyle.typography as Record<string, unknown>).textAlign = value;
        }

        onUpdate({ style: updatedStyle as NonNullable<HeadingBlockProps['style']> });
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
    [formats, globalFormattingToolbar, onUpdate, saveContentFromEditor, refreshToolbarFormatsFromSelection, style, alignment, content]
  );

  useEffect(() => {
    handleFormatChangeRef.current = handleFormatChange;
  }, [handleFormatChange]);

  React.useEffect(() => {
    const newFormats: TextFormats = {};
    if (style?.typography?.fontSize) {
      const fontSize =
        typeof style.typography.fontSize === 'number'
          ? style.typography.fontSize
          : parseInt(String(style.typography.fontSize).replace('px', ''), 10);
      if (!Number.isNaN(fontSize)) newFormats.fontSize = fontSize;
    }
    if (style?.typography?.color || style?.colors?.text) {
      newFormats.color = style.typography?.color || style.colors?.text;
    }
    if (style?.colors?.background) {
      newFormats.backgroundColor = style.colors.background;
    }
    if (style?.typography?.textAlign || alignment) {
      newFormats.align = (style?.typography?.textAlign || alignment) as
        | 'left'
        | 'center'
        | 'right'
        | 'justify';
    }
    if (style?.typography?.fontWeight) {
      newFormats.bold = style.typography.fontWeight === 'bold';
    }
    if (style?.typography?.fontStyle) {
      newFormats.italic = style.typography.fontStyle === 'italic';
    }
    if (style?.typography?.textDecoration) {
      newFormats.underline = style.typography.textDecoration === 'underline';
    }
    setFormats((prev) => ({ ...prev, ...newFormats }));
  }, [
    style?.typography?.fontSize,
    style?.typography?.color,
    style?.colors?.text,
    style?.colors?.background,
    style?.typography?.textAlign,
    style?.typography?.fontWeight,
    style?.typography?.fontStyle,
    style?.typography?.textDecoration,
    alignment,
  ]);

  const headingTypography: React.CSSProperties = {
    fontSize: style?.typography?.fontSize
      ? `${typeof style.typography.fontSize === 'number' ? style.typography.fontSize : parseInt(String(style.typography.fontSize).replace('px', ''), 10)}px`
      : undefined,
    fontWeight: style?.typography?.fontWeight || 'bold',
    fontFamily: style?.typography?.fontFamily,
    lineHeight: style?.typography?.lineHeight,
    color: style?.typography?.color || style?.colors?.text,
    backgroundColor: style?.colors?.background,
    textAlign: alignment || style?.typography?.textAlign || 'left',
    margin: 0,
    padding: 0,
  };

  const editorInnerStyle: React.CSSProperties = {
    ...headingTypography,
  };
  delete editorInnerStyle.fontWeight;
  delete editorInnerStyle.textAlign;

  const handleAlignmentChange = (newAlignment: 'left' | 'center' | 'right') => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          alignment: newAlignment,
        },
      });
    }
  };

  const handleLevelChange = (newLevel: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          level: newLevel,
        },
      });
    }
  };

  const rawText = typeof text === 'string' ? text : '';
  const safeHtml = ValidationUtils.sanitizeHtml(rawText, true);
  const headingPlainTrimmed = ValidationUtils.stripHtmlTags(rawText).trim();
  const plainLen = headingPlainTrimmed.length;
  const hasMediaWithoutPlainText =
    headingPlainTrimmed.length === 0 && /<(img|video|audio|iframe|svg)\b/i.test(safeHtml);
  const showPreviewPlaceholder = headingPlainTrimmed.length === 0 && !hasMediaWithoutPlainText;

  if (isEditing) {
    return (
      <div
        className={`relative group flex flex-col gap-2 min-w-0 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        onClick={onSelect}
      >
        

        <HeadingTag
          className="outline-none"
          style={headingTypography}
          onClick={(e) => e.stopPropagation()}
        >
          <span
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            className="builder-rich-html outline-none w-full inline-block min-h-[1em]"
            style={editorInnerStyle}
            onInput={() => saveContentFromEditor()}
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
              if (globalFormattingToolbar) {
                globalFormattingToolbar.hide();
              }
            }}
          />
        </HeadingTag>
      </div>
    );
  }

  if (showPreviewPlaceholder) {
    return (
      <HeadingTag
        style={headingTypography}
        className={isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
        onClick={onSelect}
      >
        <span className="text-gray-400">Digite o título...</span>
      </HeadingTag>
    );
  }

  return (
    <HeadingTag
      style={headingTypography}
      className={`builder-rich-html ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
      onClick={onSelect}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

export default HeadingBlock;
