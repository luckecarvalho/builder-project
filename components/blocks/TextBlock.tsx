import React, { useState } from 'react';
import { TextBlockProps } from '@/types/builder';
import TextFormattingToolbar from '../TextFormattingToolbar';
import { useTextFormatting, TextFormats } from '@/hooks/useTextFormatting';
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

  const handleFormatChange = (format: string, value: any) => {
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
            {/* Botão para alternar modo */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRichEditMode(!isRichEditMode);
              }}
              className={`px-2 py-1 text-xs border rounded ${
                isRichEditMode ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-100 border-gray-300'
              }`}
              title={isRichEditMode ? 'Modo texto simples' : 'Modo HTML'}
            >
              {isRichEditMode ? 'Texto' : 'HTML'}
            </button>

            {/* Controles de formatação (apenas no modo HTML) */}
            {isRichEditMode && allowHtml && (
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

        {/* Área de edição */}
        <div className="relative">
          {isRichEditMode ? (
            <textarea
              id={`text-edit-${block.props.id}`}
              ref={textareaRef}
              value={html}
              onChange={handleHtmlChange}
              onFocus={() => {
                if (globalFormattingToolbar) {
                  globalFormattingToolbar.show({
                    isVisible: true,
                    onFormatChange: handleFormatChange,
                    onClose: () => globalFormattingToolbar.hide(),
                    currentFormats: formats
                  });
                }
              }}
              onSelect={() => {
                // atualizar toolbar com estilos da seleção
                extractFormatsFromSelection();
              }}
              onBlur={() => {
                if (globalFormattingToolbar) {
                  globalFormattingToolbar.hide();
                }
              }}
              placeholder="Digite seu texto HTML..."
              className="w-full min-h-[100px] bg-transparent border-none outline-none resize-none"
              style={{...textStyle, ...getStyleFromFormats(formats)}}
              maxLength={maxChars}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <textarea
              id={`text-edit-${block.props.id}`}
              ref={textareaRef}
              value={html.replace(/<[^>]*>/g, '')} // Remove HTML tags para modo texto simples
              onChange={handleTextChange}
              onFocus={() => {
                if (globalFormattingToolbar) {
                  globalFormattingToolbar.show({
                    isVisible: true,
                    onFormatChange: handleFormatChange,
                    onClose: () => globalFormattingToolbar.hide(),
                    currentFormats: formats
                  });
                }
              }}
              onBlur={() => {
                if (globalFormattingToolbar) {
                  globalFormattingToolbar.hide();
                }
              }}
              placeholder="Digite seu texto..."
              className="w-full min-h-[100px] bg-transparent border-none outline-none resize-none"
              style={{...textStyle, ...getStyleFromFormats(formats)}}
              maxLength={maxChars}
              onClick={(e) => e.stopPropagation()}
            />
          )}
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

