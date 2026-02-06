import React from 'react';
import { HeadingBlockProps } from '@/types/builder';
import TextFormattingToolbar from '../TextFormattingToolbar';
import { useTextFormatting, TextFormats } from '@/hooks/useTextFormatting';

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
  
  const [isEditingText, setIsEditingText] = React.useState(false);
  const [showFormattingToolbar, setShowFormattingToolbar] = React.useState(false);
  
  // Inicializar formatos a partir do estilo persistido
  const [formats, setFormats] = React.useState<TextFormats>(() => {
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
    if (style?.typography?.textAlign || alignment) {
      initialFormats.align = (style?.typography?.textAlign || alignment) as 'left' | 'center' | 'right' | 'justify';
    }
    return initialFormats;
  });

  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          text: e.target.value,
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
    
    // Persistir as mudanças no estilo do bloco
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

      // Atualizar propriedades específicas baseadas no formato
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
    if (style?.typography?.textAlign || alignment) {
      newFormats.align = (style?.typography?.textAlign || alignment) as 'left' | 'center' | 'right' | 'justify';
    }
    setFormats(prev => ({ ...prev, ...newFormats }));
  }, [style?.typography?.fontSize, style?.typography?.color, style?.colors?.text, style?.colors?.background, style?.typography?.textAlign, alignment]);

  const headingStyle: React.CSSProperties = {
    fontSize: formats.fontSize ? `${formats.fontSize}px` : (style?.typography?.fontSize ? `${style.typography.fontSize}px` : undefined),
    fontWeight: style?.typography?.fontWeight || 'bold',
    fontFamily: style?.typography?.fontFamily,
    lineHeight: style?.typography?.lineHeight,
    color: formats.color || style?.typography?.color || style?.colors?.text,
    backgroundColor: formats.backgroundColor || style?.colors?.background,
    textAlign: formats.align || alignment || style?.typography?.textAlign || 'left',
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
          <div className="absolute -top-10 left-0 flex items-center space-x-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
            {/* Nível do heading */}
            <select
              value={level}
              onChange={(e) => handleLevelChange(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
              <option value={4}>H4</option>
              <option value={5}>H5</option>
              <option value={6}>H6</option>
            </select>

            {/* Alinhamento */}
            <div className="flex border border-gray-300 rounded">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAlignmentChange('left');
                }}
                className={`px-2 py-1 text-xs ${alignment === 'left' ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                title="Alinhar à esquerda"
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAlignmentChange('center');
                }}
                className={`px-2 py-1 text-xs ${alignment === 'center' ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                title="Centralizar"
              >
                ↔
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAlignmentChange('right');
                }}
                className={`px-2 py-1 text-xs ${alignment === 'right' ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                title="Alinhar à direita"
              >
                →
              </button>
            </div>

            {/* Contador de caracteres */}
            {content.maxChars && (
              <span className="text-xs text-gray-500">
                {text.length}/{content.maxChars}
              </span>
            )}
          </div>
        )}

        {/* Input de edição */}
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            onFocus={() => {
              setIsEditingText(true);
              if (globalFormattingToolbar) {
                globalFormattingToolbar.show({
                  isVisible: true,
                  onFormatChange: handleFormatChange,
                  onClose: () => {
                    globalFormattingToolbar.hide();
                    setIsEditingText(false);
                  },
                  currentFormats: formats
                });
              }
            }}
            onBlur={() => {
              setIsEditingText(false);
              if (globalFormattingToolbar) {
                globalFormattingToolbar.hide();
              }
            }}
            placeholder="Digite o título..."
            className="w-full bg-transparent border-none outline-none resize-none"
            style={{...headingStyle, ...getStyleFromFormats(formats)}}
            maxLength={content.maxChars}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  }

  return (
    <HeadingTag
      style={{...headingStyle, ...getStyleFromFormats(formats)}}
      className={isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
      onClick={onSelect}
    >
      {text}
    </HeadingTag>
  );
};

export default HeadingBlock;
