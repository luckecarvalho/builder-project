import React, { useState } from 'react';
import { TextBlockProps } from '@/types/builder';
import TextFormattingToolbar from '../TextFormattingToolbar';
import { useTextFormatting, TextFormats, UnorderedListMarkerStyle, OrderedListStyle } from '@/hooks/useTextFormatting';
import { ValidationUtils } from '@/utils/validation';

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
  const [isRichEditMode, setIsRichEditMode] = useState(false);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Ajustar altura do textarea automaticamente quando o conteúdo mudar ou componente montar
  React.useEffect(() => {
    if (textareaRef.current && isEditing) {
      // Pequeno delay para garantir que o DOM está atualizado
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }, 0);
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          html: e.target.value,
        },
      });
    }
  };

  /** Trata Enter no textarea: continua lista na próxima linha ou sai do modo lista com 2º Enter */
  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      handleFormatChange(e.shiftKey ? 'outdent' : 'indent', undefined);
      return;
    }
    if (e.key !== 'Enter' || !textareaRef.current || !onUpdate) return;

    const textarea = textareaRef.current;
    const fullText = textarea.value ?? '';
    const cursor = textarea.selectionStart ?? 0;

    const lineStart = fullText.lastIndexOf('\n', cursor - 1) + 1;
    const lineEnd = fullText.indexOf('\n', cursor);
    const lineEndVal = lineEnd === -1 ? fullText.length : lineEnd;
    const currentLine = fullText.slice(lineStart, lineEndVal);

    const leadingSpacesMatch = currentLine.match(/^(\s*)/);
    const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[1] : '';
    const afterSpaces = currentLine.slice(leadingSpaces.length);

    // Lista com marcador (-, *, •, ◦, ▪)
    const unorderedMatch = afterSpaces.match(/^([-*•◦▪]\s+)(.*)$/);
    if (unorderedMatch) {
      e.preventDefault();
      const contentAfterPrefix = unorderedMatch[2];
      const isLineEmpty = !contentAfterPrefix.trim();
      const insert = isLineEmpty
        ? '\n'
        : `\n${leadingSpaces}${unorderedMatch[1]}`;
      const newText = fullText.slice(0, cursor) + insert + fullText.slice(cursor);
      onUpdate({ content: { ...content, html: newText } });
      const newCursor = cursor + insert.length;
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursor, newCursor);
      }, 0);
      return;
    }

    // Lista numerada (1. , 2. , etc.)
    const orderedMatch = afterSpaces.match(/^(\d+)[.)]\s+(.*)$/);
    if (orderedMatch) {
      e.preventDefault();
      const num = parseInt(orderedMatch[1], 10);
      const contentAfterPrefix = orderedMatch[2];
      const isLineEmpty = !contentAfterPrefix.trim();
      const insert = isLineEmpty
        ? '\n'
        : `\n${leadingSpaces}${num + 1}. `;
      const newText = fullText.slice(0, cursor) + insert + fullText.slice(cursor);
      onUpdate({ content: { ...content, html: newText } });
      const newCursor = cursor + insert.length;
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursor, newCursor);
      }, 0);
      return;
    }
  };

  const handleFormatChange = (format: string, value: any) => {
    // Comandos de lista e recuo: atuam diretamente nas linhas selecionadas do textarea
    if (format === 'unorderedList' || format === 'orderedList' || format === 'indent' || format === 'outdent') {
      if (!textareaRef.current || !onUpdate) return;

      const textarea = textareaRef.current;
      const fullText = textarea.value ?? '';
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;

      const lineStart = fullText.lastIndexOf('\n', start - 1) + 1;
      const nextNewline = fullText.indexOf('\n', end);
      const lineEnd = nextNewline === -1 ? fullText.length : nextNewline;

      const selectedBlock = fullText.substring(lineStart, lineEnd);
      const lines = selectedBlock.split('\n');

      let newLines = [...lines];

      const UNORDERED_MARKER_CHAR: Record<string, string> = {
        dash: '-', bullet: '•', circle: '◦', square: '▪', asterisk: '*',
      };
      const CHAR_TO_STYLE: Record<string, string> = {
        '-': 'dash', '•': 'bullet', '◦': 'circle', '▪': 'square', '*': 'asterisk',
      };
      const markerStyle = (value && typeof value === 'string' && UNORDERED_MARKER_CHAR[value]) ? value : 'dash';
      const markerChar = UNORDERED_MARKER_CHAR[markerStyle];

      const orderedStyle = (value && (value === 'decimal' || value === 'alpha')) ? value : 'decimal';
      const toAlpha = (n: number) => (n >= 1 && n <= 26) ? String.fromCharCode(96 + n) : String(n);
      const toRoman = (n: number) => {
        const map: [number, string][] = [[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']];
        let s = '';
        for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
        return s;
      };
      const orderedPrefix = (index: number) => {
        if (orderedStyle === 'decimal') return `${index}. `;
        if (orderedStyle === 'alpha') return `${toAlpha(index)}. `;
        return `${toRoman(index)}. `;
      };

      const stripListPrefix = (s: string) => s.replace(/^([-*•◦▪]\s+|\d+[.)]\s+|[a-z]+[.)]\s+)/i, '');

      const hadOrderedRegex = /^\d+[.)]\s+|^[a-z]+[.)]\s+/i;

      if (format === 'unorderedList') {
        const stripUnorderedOnly = (s: string) => s.replace(/^([-*•◦▪]\s+|\d+[.)]\s+)/, '');
        newLines = lines.map(line => {
          const leadingSpacesMatch = line.match(/^(\s*)/);
          const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[1] : '';
          const trimmed = line.slice(leadingSpaces.length);
          if (!trimmed) return line;
          const hadUnordered = /^([-*•◦▪])\s+/.exec(trimmed);
          const content = stripUnorderedOnly(trimmed);
          const currentLineStyle = hadUnordered ? CHAR_TO_STYLE[hadUnordered[1]] : undefined;
          if (hadUnordered && currentLineStyle === markerStyle) return leadingSpaces + content;
          return `${leadingSpaces}${markerChar} ${content}`;
        });
      } else if (format === 'orderedList') {
        let index = 1;
        newLines = lines.map(line => {
          const leadingSpacesMatch = line.match(/^(\s*)/);
          const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[1] : '';
          const trimmed = line.slice(leadingSpaces.length);
          if (!trimmed) return line;
          const hadOrderedMatch = trimmed.match(/^(\d+[.)]\s+|[a-z]+[.)]\s+)/i);
          const hadOrdered = !!hadOrderedMatch;
          const content = stripListPrefix(trimmed);
          // Se já é lista numerada com o MESMO estilo, desliga; se for estilo diferente, troca
          if (hadOrdered) {
            const prefix = hadOrderedMatch![1];
            const isDecimal = /^\d+[.)]\s+/.test(prefix);
            const currentStyle: 'decimal' | 'alpha' = isDecimal ? 'decimal' : 'alpha';
            if (currentStyle === orderedStyle) return leadingSpaces + content;
          }
          const prefix = orderedPrefix(index);
          index += 1;
          return `${leadingSpaces}${prefix}${content}`;
        });
      } else if (format === 'indent') {
        // Adiciona recuo de dois espaços em cada linha
        newLines = lines.map(line => `  ${line}`);
      } else if (format === 'outdent') {
        // Remove um nível de recuo (até 2 espaços ou um tab) de cada linha
        newLines = lines.map(line => line.replace(/^(\t| {1,2})/, ''));
      }

      const newBlock = newLines.join('\n');
      const newFullText = fullText.slice(0, lineStart) + newBlock + fullText.slice(lineEnd);

      onUpdate({
        content: {
          ...content,
          html: newFullText,
        },
      });

      // Tentar manter a seleção cobrindo o mesmo bloco de linhas
      const lengthDiff = newBlock.length - selectedBlock.length;
      const newStart = start;
      const newEnd = end + lengthDiff;

      setTimeout(() => {
        if (!textareaRef.current) return;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }, 0);

      const hasUnordered = newLines.some(l => /^\s*[-*•◦▪]\s+/.test(l));
      const hasOrdered = newLines.some(l => hadOrderedRegex.test(l.replace(/^\s*/, '')));
      const detectOrderedStyleFromLines = (): OrderedListStyle | undefined => {
        const first = newLines.find(l => hadOrderedRegex.test(l.replace(/^\s*/, '')));
        if (!first) return undefined;
        const t = first.replace(/^\s*/, '');
        if (/^\d+[.)]\s+/.test(t)) return 'decimal';
        if (/^[a-z]+[.)]\s+/.test(t)) return 'alpha';
        return 'decimal';
      };
      const nextFormats: TextFormats = {
        ...formats,
        listMarkerStyle: (format === 'unorderedList' && hasUnordered ? markerStyle : undefined) as UnorderedListMarkerStyle | undefined,
        orderedListActive: hasOrdered,
        orderedListStyle: hasOrdered ? (format === 'orderedList' ? orderedStyle : detectOrderedStyleFromLines()) : undefined,
      };
      if (format === 'unorderedList' && !hasUnordered) nextFormats.listMarkerStyle = undefined;
      if (format === 'orderedList' && !hasOrdered) nextFormats.orderedListActive = false;
      setFormats(nextFormats);
      globalFormattingToolbar?.show({
        isVisible: true,
        onFormatChange: handleFormatChange,
        onClose: () => globalFormattingToolbar.hide(),
        currentFormats: nextFormats,
      });
      return;
    }

    const newFormats = {
      ...formats,
      [format]: value
    };
    setFormats(newFormats);
    
    // Se houver texto selecionado, aplicar apenas na seleção (modo HTML ou texto simples)
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart ?? 0;
      const end = textareaRef.current.selectionEnd ?? 0;
      const hasSelection = end > start;

      if (hasSelection && (format === 'fontSize' || format === 'color' || format === 'backgroundColor')) {
        // Se estiver em modo HTML, usar wrapSelectionWithStyle
        if (isRichEditMode && allowHtml) {
          const styleObj: Record<string, string> = {};
          if (format === 'fontSize') styleObj['font-size'] = `${value}px`;
          if (format === 'color') styleObj['color'] = value;
          if (format === 'backgroundColor') styleObj['background-color'] = value;
          const applied = wrapSelectionWithStyle(styleObj);
          if (applied) return; // já aplicado na seleção
        }
        // Se estiver em modo texto simples, converter para HTML e aplicar
        else if (!isRichEditMode) {
          // Ativar modo HTML temporariamente e aplicar estilo
          const textarea = textareaRef.current;
          const selectedText = textarea.value.substring(start, end);
          const styleObj: Record<string, string> = {};
          if (format === 'fontSize') styleObj['font-size'] = `${value}px`;
          if (format === 'color') styleObj['color'] = value;
          if (format === 'backgroundColor') styleObj['background-color'] = value;
          
          const styleString = Object.entries(styleObj)
            .filter(([_, v]) => v !== undefined && v !== '')
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ');
          
          const spanOpen = `<span style="${styleString}">`;
          const spanClose = `</span>`;
          const currentHtml = html || textarea.value;
          const newHtml = currentHtml.substring(0, start) + spanOpen + selectedText + spanClose + currentHtml.substring(end);
          
          if (onUpdate) {
            onUpdate({
              content: {
                ...content,
                html: newHtml,
                allowHtml: true, // Ativar HTML para manter formatação
              },
            });
            // Ativar modo HTML para mostrar a formatação
            setIsRichEditMode(true);
          }
          
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              textareaRef.current.setSelectionRange(start + spanOpen.length, start + spanOpen.length + selectedText.length);
            }
          }, 0);
          return;
        }
      }
    }

    // Persistir como estilo do bloco (aplica ao texto inteiro)
    if (onUpdate) {
      const updatedStyle: any = {
        ...style,
        typography: {
          ...style?.typography,
        },
        colors: {
          ...style?.colors,
        }
      };

      if (format === 'fontSize') {
        updatedStyle.typography.fontSize = value;
      } else if (format === 'align') {
        updatedStyle.typography.textAlign = value;
      } else if (format === 'color') {
        updatedStyle.typography.color = value;
        updatedStyle.colors.text = value;
      } else if (format === 'backgroundColor') {
        updatedStyle.colors.background = value;
      } else if (format === 'bold') {
        updatedStyle.typography.fontWeight = value ? 'bold' : 'normal';
      } else if (format === 'italic') {
        updatedStyle.typography.fontStyle = value ? 'italic' : 'normal';
      } else if (format === 'underline') {
        updatedStyle.typography.textDecoration = value ? 'underline' : 'none';
      }

      onUpdate({ style: updatedStyle });
    }
  };

  const getStyleFromFormats = (formats: TextFormats): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (formats.bold) style.fontWeight = 'bold';
    if (formats.italic) style.fontStyle = 'italic';
    if (formats.underline) style.textDecoration = 'underline';
    if (formats.fontSize) style.fontSize = `${formats.fontSize}px`;
    if (formats.color) style.color = formats.color;
    if (formats.backgroundColor) style.backgroundColor = formats.backgroundColor;
    if (formats.align) {
      switch (formats.align) {
        case 'left':
          style.textAlign = 'left';
          break;
        case 'center':
          style.textAlign = 'center';
          break;
        case 'right':
          style.textAlign = 'right';
          break;
        case 'justify':
          style.textAlign = 'justify';
          break;
      }
    }

    return style;
  };

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdate) {
      const sanitizedHtml = ValidationUtils.sanitizeHtml(e.target.value, allowLinks);
      onUpdate({
        content: {
          ...content,
          html: sanitizedHtml,
        },
      });
    }
  };

  // Envolve seleção com <span style="..."> para aplicar estilos parciais no modo HTML
  const wrapSelectionWithStyle = (styleObj: Record<string, string>) => {
    const textarea = textareaRef.current;
    if (!textarea) return false;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    if (end <= start) return false; // sem seleção

    const selected = html.substring(start, end);
    const styleString = Object.entries(styleObj)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');

    const spanOpen = `<span style="${styleString}">`;
    const spanClose = `</span>`;
    const newHtml = html.substring(0, start) + spanOpen + selected + spanClose + html.substring(end);

    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          html: newHtml,
        },
      });
    }

    // restaurar seleção dentro do novo span
    setTimeout(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start + spanOpen.length, start + spanOpen.length + selected.length);
    }, 0);

    return true;
  };

  // Heurística simples: extrai estilos do <span style="..."> imediatamente anterior ao caret/seleção
  const extractFormatsFromSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const caret = textarea.selectionStart ?? 0;
    const before = html.lastIndexOf('<span', caret);
    const afterOpen = before >= 0 ? html.indexOf('>', before) : -1;
    const afterClose = caret >= 0 ? html.indexOf('</span>', caret) : -1;
    if (before >= 0 && afterOpen > before && (afterClose === -1 || afterClose > caret)) {
      const openTag = html.substring(before, afterOpen + 1);
      const styleMatch = openTag.match(/style\s*=\s*"([^"]*)"/i);
      if (styleMatch && styleMatch[1]) {
        const stylePairs = styleMatch[1].split(';').map(s => s.trim()).filter(Boolean);
        const styleMap: Record<string, string> = {};
        stylePairs.forEach(pair => {
          const [k, v] = pair.split(':').map(s => s.trim());
          if (k && v) styleMap[k.toLowerCase()] = v;
        });
        const nextFormats: Partial<TextFormats> = {};
        if (styleMap['color']) nextFormats.color = styleMap['color'];
        if (styleMap['background-color']) nextFormats.backgroundColor = styleMap['background-color'];
        if (styleMap['font-size']) {
          const num = parseInt(styleMap['font-size']);
          if (!isNaN(num)) nextFormats.fontSize = num;
        }
        setFormats(prev => ({ ...prev, ...nextFormats }));
      }
    }
  };

  const toggleFormat = (tag: string) => {
    if (!onUpdate) return;

    const textarea = document.getElementById(`text-edit-${block.props.id}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let newHtml = html;
    if (selectedText) {
      const formattedText = `<${tag}>${selectedText}</${tag}>`;
      newHtml = html.substring(0, start) + formattedText + html.substring(end);
    } else {
      newHtml = html + `<${tag}></${tag}>`;
    }

    onUpdate({
      content: {
        ...content,
        html: newHtml,
      },
    });

    // Restaurar foco e seleção
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + `<${tag}>`.length, start + `<${tag}>`.length + selectedText.length);
      } else {
        textarea.setSelectionRange(start + `<${tag}>`.length, start + `</${tag}>`.length);
      }
    }, 0);
  };

  // Usar useEffect para sincronizar formatos quando o estilo do bloco mudar
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
    setFormats(prev => ({ ...prev, ...newFormats }));
  }, [style?.typography?.fontSize, style?.typography?.color, style?.colors?.text, style?.colors?.background, style?.typography?.textAlign]);

  const textStyle: React.CSSProperties = {
    fontSize: formats.fontSize ? `${formats.fontSize}px` : (style?.typography?.fontSize ? `${style.typography.fontSize}px` : undefined),
    fontWeight: style?.typography?.fontWeight,
    fontFamily: style?.typography?.fontFamily,
    lineHeight: style?.typography?.lineHeight,
    color: formats.color || style?.typography?.color || style?.colors?.text,
    backgroundColor: formats.backgroundColor || style?.colors?.background,
    textAlign: formats.align || style?.typography?.textAlign || 'left',
    margin: 0,
    padding: 0,
  };

  if (isEditing) {
    return (
      <div
        className={`relative group ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        onClick={onSelect}
      >
        {/* Controles de edição */}
        {isSelected && (
          <div className="absolute -top-12 left-0 flex items-center space-x-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
            {/* Controles de formatação */}
            {allowHtml && (
              <>
                <div className="h-4 w-px bg-gray-300" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFormat('strong');
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                  title="Negrito"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFormat('em');
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                  title="Itálico"
                >
                  <em>I</em>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFormat('u');
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                  title="Sublinhado"
                >
                  <u>S</u>
                </button>
              </>
            )}

            <div className="h-4 w-px bg-gray-300" />

            {/* Contador de caracteres */}
            {maxChars && (
              <span className="text-xs text-gray-500">
                {html.length}/{maxChars}
              </span>
            )}
          </div>
        )}

        {/* Área de edição - sempre exibe texto sem tags HTML */}
        <div className="relative">
          <textarea
            id={`text-edit-${block.props.id}`}
            ref={textareaRef}
            value={typeof html === 'string' ? html.replace(/<[^>]*>/g, '') : ''}
            onChange={handleTextChange}
            onKeyDown={handleTextAreaKeyDown}
            onFocus={() => {
              if (!globalFormattingToolbar) return;
              // Detectar marcador/lista da linha atual para mostrar botão ativo na toolbar
              const detectListState = () => {
                const ta = textareaRef.current;
                if (!ta) return formats;
                const v = ta.value ?? '';
                const pos = ta.selectionStart ?? 0;
                const lineStart = v.lastIndexOf('\n', pos - 1) + 1;
                const lineEnd = v.indexOf('\n', pos);
                const lineEndVal = lineEnd === -1 ? v.length : lineEnd;
                const line = v.slice(lineStart, lineEndVal);
                const afterSpaces = line.replace(/^\s*/, '');
                const unordMatch = afterSpaces.match(/^([-*•◦▪])\s+/);
                const ordDecimal = afterSpaces.match(/^(\d+)[.)]\s+/);
                const ordAlpha = afterSpaces.match(/^([a-z]+)[.)]\s+/);
                const listMarkerStyleMap: Record<string, 'dash' | 'bullet' | 'circle' | 'square' | 'asterisk'> = {
                  '-': 'dash', '•': 'bullet', '◦': 'circle', '▪': 'square', '*': 'asterisk',
                };
                if (unordMatch) {
                  return { ...formats, listMarkerStyle: listMarkerStyleMap[unordMatch[1]] ?? 'dash', orderedListActive: false, orderedListStyle: undefined };
                }
                if (ordDecimal) {
                  return { ...formats, listMarkerStyle: undefined, orderedListActive: true, orderedListStyle: 'decimal' as const };
                }
                if (ordAlpha) {
                  return { ...formats, listMarkerStyle: undefined, orderedListActive: true, orderedListStyle: 'alpha' as const };
                }
                return { ...formats, listMarkerStyle: undefined, orderedListActive: false, orderedListStyle: undefined };
              };
              const currentFormatsToShow = detectListState();
              setFormats(prev => ({ ...prev, ...currentFormatsToShow }));
              globalFormattingToolbar.show({
                isVisible: true,
                onFormatChange: handleFormatChange,
                onClose: () => globalFormattingToolbar.hide(),
                currentFormats: currentFormatsToShow,
              });
            }}
            onBlur={() => {
              if (globalFormattingToolbar) {
                globalFormattingToolbar.hide();
              }
            }}
            placeholder="Digite seu texto..."
            className="w-full bg-transparent border-none outline-none resize-none overflow-hidden"
            style={{...textStyle, ...getStyleFromFormats(formats)}}
            maxLength={maxChars}
            onClick={(e) => e.stopPropagation()}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        </div>
      </div>
    );
  }

  // Renderização em modo visualização
  if (allowHtml) {
    return (
      <div
        className={isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
        style={{...textStyle, ...getStyleFromFormats(formats)}}
        onClick={onSelect}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <p
      className={isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
      style={{...textStyle, ...getStyleFromFormats(formats)}}
      onClick={onSelect}
    >
      {html}
    </p>
  );
};

export default TextBlock;

