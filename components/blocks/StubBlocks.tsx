import React from 'react';
import { BlockProps } from '@/types/builder';
import { ValidationUtils } from '@/utils/validation';
import TextFormattingToolbar from '../TextFormattingToolbar';
import { useTextFormatting, TextFormats, getStyleFromFormats } from '@/hooks/useTextFormatting';
import { AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignStartVertical, AlignCenterVertical, AlignEndVertical } from 'lucide-react';

interface StubBlockProps {
  block: { props: BlockProps };
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<BlockProps>) => void;
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

// Componentes stub para blocos não implementados ainda

const cellStyleKey = (row: number, col: number) => `${row}-${col}`;

export const TableBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true, globalFormattingToolbar }) => {
  const headers: string[] = (block.props as any)?.content?.headers || ['Coluna 1'];
  const rows: string[][] = (block.props as any)?.content?.rows || [['']];
  const format: 'basic' | 'striped' | 'bordered' = (block.props as any)?.content?.format || 'basic';
  const borderRows: boolean = (block.props as any)?.content?.borderRows !== false;
  const borderColumns: boolean = (block.props as any)?.content?.borderColumns !== false;
  const borderOuter: boolean = (block.props as any)?.content?.borderOuter !== false;
  const cellStyles: Record<string, TextFormats> = (block.props as any)?.content?.cellStyles || {};
  
  const [editingCell, setEditingCell] = React.useState<{row: number, col: number} | null>(null);
  const [editingValue, setEditingValue] = React.useState('');

  const updateContent = (field: string, value: any) => {
    if (!onUpdate) return;
    onUpdate({
      content: {
        ...block.props.content,
        [field]: value,
      },
    });
  };

  const cellStylesRef = React.useRef(cellStyles);
  cellStylesRef.current = cellStyles;

  const showToolbarForCell = React.useCallback((row: number, col: number) => {
    if (!globalFormattingToolbar || !isEditing) return;
    const key = cellStyleKey(row, col);
    const currentFormats = cellStylesRef.current[key] || {};
    const handleFormatChange = (formatName: string, value: any) => {
      const latest = cellStylesRef.current;
      const next = { ...(latest[key] || {}) };
      if (formatName === 'bold' || formatName === 'italic' || formatName === 'underline') {
        next[formatName] = value;
      } else if (formatName === 'align' || formatName === 'fontSize' || formatName === 'color' || formatName === 'backgroundColor') {
        (next as any)[formatName] = value;
      }
      updateContent('cellStyles', { ...latest, [key]: next });
      globalFormattingToolbar.show({
        isVisible: true,
        onFormatChange: handleFormatChange,
        onClose: () => globalFormattingToolbar.hide(),
        currentFormats: next,
      });
    };
    globalFormattingToolbar.show({
      isVisible: true,
      onFormatChange: handleFormatChange,
      onClose: () => globalFormattingToolbar.hide(),
      currentFormats,
    });
  }, [globalFormattingToolbar, isEditing, updateContent]);

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    updateContent('headers', newHeaders);
  };

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = rows.map(r => [...r]);
    newRows[rowIdx][colIdx] = value;
    updateContent('rows', newRows);
  };

  const startEditing = (row: number, col: number, currentValue: string) => {
    if (!isEditing) return;
    setEditingCell({ row, col });
    setEditingValue(currentValue);
  };

  const finishEditing = () => {
    if (!editingCell) return;
    
    if (editingCell.row === -1) {
      // Editando cabeçalho
      updateHeader(editingCell.col, editingValue);
    } else {
      // Editando célula
      updateCell(editingCell.row, editingCell.col, editingValue);
    }
    
    setEditingCell(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditingValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      finishEditing();
      
      if (editingCell) {
        const { row, col } = editingCell;
        if (row === -1) {
          // Navegar entre cabeçalhos
          if (e.shiftKey) {
            if (col > 0) startEditing(-1, col - 1, headers[col - 1] || '');
          } else {
            if (col < headers.length - 1) startEditing(-1, col + 1, headers[col + 1] || '');
          }
        } else {
          // Navegar entre células
          if (e.shiftKey) {
            if (col > 0) {
              startEditing(row, col - 1, rows[row][col - 1] || '');
            } else if (row > 0) {
              startEditing(row - 1, headers.length - 1, rows[row - 1][headers.length - 1] || '');
            }
          } else {
            if (col < headers.length - 1) {
              startEditing(row, col + 1, rows[row][col + 1] || '');
            } else if (row < rows.length - 1) {
              startEditing(row + 1, 0, rows[row + 1][0] || '');
            }
          }
        }
      }
    }
  };

  // Construir classes CSS baseadas nas configurações de borda
  const tableClass = `min-w-full rounded-lg ${
    borderOuter ? 'border border-gray-300' : ''
  } ${format === 'striped' && borderRows ? 'divide-y divide-gray-200' : ''}`;

  const thClass = `px-4 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-50 ${
    borderRows ? 'border-b border-gray-300' : ''
  } ${borderColumns ? 'border-r border-gray-200' : ''} ${
    isEditing ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
  }`;

  const tdClass = `px-4 py-2 text-sm text-gray-700 ${
    borderRows ? 'border-t border-gray-200' : ''
  } ${borderColumns ? 'border-r border-gray-200' : ''} ${
    isEditing ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
  }`;

  const tbodyClass = `${
    format === 'striped' && !borderRows ? 'divide-y divide-gray-100' : ''
  }`;

  return (
    <div
      className={`p-4 rounded-lg bg-white ${
        isEditing 
          ? `border-2 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 border-indigo-300' : 'border-gray-200'}`
          : 'border-0'
      }`}
      onClick={isEditing ? onSelect : undefined}
    >
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr>
              {headers.map((h, colIdx) => (
                <th 
                  key={colIdx} 
                  className={thClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(-1, colIdx, h || `Coluna ${colIdx + 1}`);
                  }}
                >
                  {editingCell?.row === -1 && editingCell?.col === colIdx ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onFocus={() => showToolbarForCell(-1, colIdx)}
                      onBlur={() => {
                        if (globalFormattingToolbar) globalFormattingToolbar.hide();
                        finishEditing();
                      }}
                      onKeyDown={handleKeyDown}
                      style={getStyleFromFormats(cellStyles[cellStyleKey(-1, colIdx)] || {})}
                      className="w-full bg-transparent border-none outline-none text-xs font-semibold text-gray-700"
                      autoFocus
                    />
                  ) : (
                    <span style={getStyleFromFormats(cellStyles[cellStyleKey(-1, colIdx)] || {})}>
                      {h || `Coluna ${colIdx + 1}`}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={format === 'striped' && rowIdx % 2 === 1 ? 'bg-gray-50' : ''}>
                {headers.map((_, colIdx) => (
                  <td 
                    key={colIdx} 
                    className={tdClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(rowIdx, colIdx, row[colIdx] || '');
                    }}
                  >
                    {editingCell?.row === rowIdx && editingCell?.col === colIdx ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onFocus={() => showToolbarForCell(rowIdx, colIdx)}
                        onBlur={() => {
                          if (globalFormattingToolbar) globalFormattingToolbar.hide();
                          finishEditing();
                        }}
                        onKeyDown={handleKeyDown}
                        style={getStyleFromFormats(cellStyles[cellStyleKey(rowIdx, colIdx)] || {})}
                        className="w-full bg-transparent border-none outline-none text-sm text-gray-700"
                        autoFocus
                      />
                    ) : (
                      <span style={getStyleFromFormats(cellStyles[cellStyleKey(rowIdx, colIdx)] || {})}>
                        {row[colIdx] || ''}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Clique nas células para editar • Configure estrutura no painel de propriedades
        </div>
      )}
    </div>
  );
};

export const BadgeBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, isEditing = true }) => {
  const content = (block.props as any)?.content || {};
  const src = content.src || '';
  const alt = content.alt || '';
  const badgeSize: React.CSSProperties = { width: 70, height: 70, borderRadius: '100%' };

  return (
    <div
      className={`inline-block ${isEditing ? 'p-1' : ''} ${
        isEditing
          ? `border-2 border-dashed border-gray-300 rounded-full ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
          : ''
      }`}
      onClick={isEditing ? onSelect : undefined}
    >
      {src ? (
        <div
          className={`overflow-hidden border-2 border-white shadow-md mb-2 ${
            isEditing ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400' : ''
          }`}
          style={badgeSize}
          onClick={isEditing ? (e) => e.stopPropagation() : undefined}
        >
          <img
            src={src}
            alt={alt || 'Selo'}
            className="w-full h-full object-cover"
            style={{ borderRadius: '100%' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div
          className={`border-2 border-dashed border-gray-400 bg-gray-100 flex flex-col items-center justify-center ${
            isEditing ? 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50' : ''
          }`}
          style={badgeSize}
          onClick={isEditing ? (e) => e.stopPropagation() : undefined}
        >
          {isEditing ? (
            <>
              <svg className="w-5 h-5 text-gray-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs text-gray-500 font-medium">70x70</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export const CarouselBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true, globalFormattingToolbar }) => {
  const items = block.props?.content?.items || [];
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [editingField, setEditingField] = React.useState<{cardIndex: number, field: string} | null>(null);
  const [showFormattingToolbar, setShowFormattingToolbar] = React.useState<{cardIndex: number, field: string} | null>(null);
  const [imageUploadError, setImageUploadError] = React.useState<Record<string, string | null>>({});
  
  // Estados de formatação para cada campo editável
  const [titleFormats, setTitleFormats] = React.useState<Record<number, TextFormats>>({});
  const [textFormats, setTextFormats] = React.useState<Record<number, TextFormats>>({});
  
  // Configurações do carrossel
  const showArrows = block.props?.content?.showArrows !== false;
  const showDots = block.props?.content?.showDots !== false;
  const cardsPerView = 3; // Quantos cards mostrar por vez
  const totalSlides = Math.ceil(items.length / cardsPerView);

  // Ao reduzir a quantidade de slides, voltar para o último step válido para não deixar todos os cards sumindo
  React.useEffect(() => {
    const maxSlide = Math.max(0, totalSlides - 1);
    setCurrentSlide((prev) => (prev > maxSlide ? maxSlide : prev));
  }, [totalSlides]);

  if (items.length === 0) {
    return (
  <div
    className={`p-4 rounded-lg text-center ${
      isEditing 
        ? `border-2 border-dashed border-gray-300 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
        : ''
    }`}
    onClick={isEditing ? onSelect : undefined}
  >
    <div className="text-gray-500">
      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <p className="text-sm font-medium">Carrossel</p>
          <p className="text-xs text-gray-400">Selecione para configurar os slides</p>
    </div>
  </div>
);
  }

  // Função para navegar entre slides
  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide(index);
  };

  // Calcular quais cards mostrar
  const startIndex = currentSlide * cardsPerView;
  const visibleCards = items.slice(startIndex, startIndex + cardsPerView);

  const updateItem = (index: number, field: string, value: any) => {
    if (!onUpdate) return;
    
    const newItems = [...items];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newItems[index] = {
        ...newItems[index],
        [parent]: {
          ...newItems[index][parent],
          [child]: value,
        },
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
    }
    
    onUpdate({
      content: {
        ...block.props.content,
        items: newItems,
      },
    });
  };

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar arquivo
      const validation = ValidationUtils.validateImageFile(file);
      if (!validation.isValid) {
        setImageUploadError({
          ...imageUploadError,
          [index]: validation.error || 'Erro ao validar imagem'
        });
        event.target.value = '';
        return;
      }

      // Limpar erro anterior
      setImageUploadError({
        ...imageUploadError,
        [index]: null
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          updateItem(index, 'image.src', e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleBadgeUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar apenas formato, não tamanho
      const validation = ValidationUtils.validateBadgeImageFile(file);
      if (!validation.isValid) {
        setImageUploadError({
          ...imageUploadError,
          [`badge-${index}`]: validation.error || 'Erro ao validar imagem'
        });
        event.target.value = '';
        return;
      }

      // Limpar erro anterior
      setImageUploadError({
        ...imageUploadError,
        [`badge-${index}`]: null
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          updateItem(index, 'badge.src', e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const toggleFeature = (index: number, feature: 'image' | 'badge') => {
    if (!onUpdate) return;
    
    const newItems = [...items];
    if (feature === 'image') {
      if (newItems[index].image) {
        delete newItems[index].image;
      } else {
        newItems[index].image = { src: '', alt: '' };
      }
    } else if (feature === 'badge') {
      if (newItems[index].badge) {
        delete newItems[index].badge;
      } else {
        newItems[index].badge = { src: '', alt: '' };
      }
    }
    
    onUpdate({
      content: {
        ...block.props.content,
        items: newItems,
      },
    });
  };

  // Funções para gerenciar formatação
  const handleFormatChange = (format: string, value: any) => {
    if (!showFormattingToolbar) return;
    
    const { cardIndex, field } = showFormattingToolbar;
    
    if (field === 'title') {
      setTitleFormats(prev => ({
        ...prev,
        [cardIndex]: {
          ...prev[cardIndex],
          [format]: value
        }
      }));
    } else if (field === 'text') {
      setTextFormats(prev => ({
        ...prev,
        [cardIndex]: {
          ...prev[cardIndex],
          [format]: value
        }
      }));
    }
  };

  const showGlobalToolbar = (cardIndex: number, field: string) => {
    if (!globalFormattingToolbar) return;
    
    const currentFormats = getFormatsForField(cardIndex, field);
    
    globalFormattingToolbar.show({
      isVisible: true,
      onFormatChange: handleFormatChange,
      onClose: () => {
        globalFormattingToolbar.hide();
        setShowFormattingToolbar(null);
      },
      currentFormats
    });
    
    setShowFormattingToolbar({ cardIndex, field });
  };

  const hideGlobalToolbar = () => {
    if (globalFormattingToolbar) {
      globalFormattingToolbar.hide();
    }
    setShowFormattingToolbar(null);
  };

  const getFormatsForField = (cardIndex: number, field: string): TextFormats => {
    if (field === 'title') {
      return titleFormats[cardIndex] || {};
    } else if (field === 'text') {
      return textFormats[cardIndex] || {};
    }
    return {};
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

  return (
    <div
      className={`relative rounded-lg bg-white ${
        isEditing 
          ? `border-2 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 border-indigo-300' : 'border-gray-200'}`
          : 'border-0'
      }`}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Header do Carrossel - Só aparece em modo de edição */}
      {isEditing && (
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Carrossel de Slides</span>
          </div>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
            {items.length} {items.length === 1 ? 'slide' : 'slides'}
          </span>
        </div>
      )}

      {/* Cards em Grade Horizontal */}
      <div className="relative p-4">
        <div className="grid grid-cols-3 gap-4">
          {visibleCards.map((item: any, index: number) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={actualIndex}
                className={`relative bg-white rounded-lg transition-all shadow-sm hover:shadow-md ${
                  isEditing 
                    ? 'border-2 border-dashed hover:border-indigo-300 border-gray-300'
                    : 'border-0'
                }`}
                style={{ overflow: 'visible' }}
                onClick={isEditing ? (e) => e.stopPropagation() : undefined}
              >
                {/* Conteúdo do Card */}
                <div className="p-6 h-full flex flex-col relative">
                  {/* Imagem - Só exibe se habilitada */}
                  {item.image && (
                    <div className="mb-3 relative">
                      {item.image.src ? (
                        <img
                          src={item.image.src}
                          alt={item.image.alt || ''}
                          className={`w-full h-40 object-cover rounded-lg transition-opacity ${
                            isEditing ? 'cursor-pointer hover:opacity-80' : ''
                          }`}
                          onClick={isEditing ? (e) => {
                            e.stopPropagation();
                            setEditingField({cardIndex: actualIndex, field: 'image'});
                          } : undefined}
                          title={isEditing ? "Clique para configurar imagem" : undefined}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div 
                          className={`w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 transition-colors ${
                            isEditing ? 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50' : ''
                          }`}
                          onClick={isEditing ? (e) => {
                            e.stopPropagation();
                            setEditingField({cardIndex: actualIndex, field: 'image'});
                          } : undefined}
                          title={isEditing ? "Clique para adicionar imagem" : undefined}
                        >
                          <div className="text-center">
                            <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-xs text-gray-400">Clique para adicionar</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Selo - Metade sobre a imagem (quando há imagem), metade sobre o texto */}
                  {item.badge && item.image && (
                    <div className="absolute" style={{ top: 'calc(160px + 12px - 35px)', right: '24px', zIndex: 10 }} key={`badge-with-image-${actualIndex}`}>
                      {item.badge.src ? (
                        <div 
                          className={`overflow-hidden border-2 border-white shadow-lg ${
                            isEditing ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400' : ''
                          }`}
                          style={{ width: '70px', height: '70px', borderRadius: '100%' }}
                          onClick={isEditing ? (e) => {
                            e.stopPropagation();
                            setEditingField({cardIndex: actualIndex, field: 'badge'});
                          } : undefined}
                          title={isEditing ? "Clique para configurar selo" : undefined}
                        >
                          <img
                            src={item.badge.src}
                            alt={item.badge.alt || 'Selo'}
                            className="w-full h-full object-cover"
                            style={{ borderRadius: '100%' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div 
                          className={`border-2 border-dashed border-gray-400 bg-gray-100 flex flex-col items-center justify-center ${
                            isEditing ? 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50' : ''
                          }`}
                          style={{ width: '70px', height: '70px', borderRadius: '100%' }}
                          onClick={isEditing ? (e) => {
                            e.stopPropagation();
                            setEditingField({cardIndex: actualIndex, field: 'badge'});
                          } : undefined}
                          title={isEditing ? "Clique para adicionar selo" : undefined}
                        >
                          <svg className="w-5 h-5 text-gray-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-xs text-gray-500 font-medium">70x70</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Título */}
                  <div className="mb-2 relative">
                    {isEditing && editingField?.cardIndex === actualIndex && editingField?.field === 'title' ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => updateItem(actualIndex, 'title', e.target.value)}
                          onBlur={() => {
                            setEditingField(null);
                            hideGlobalToolbar();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingField(null);
                              hideGlobalToolbar();
                            }
                          }}
                          onFocus={() => showGlobalToolbar(actualIndex, 'title')}
                          placeholder="Novo Título"
                          className="w-full text-sm font-bold bg-transparent border-none outline-none"
                          style={getStyleFromFormats(getFormatsForField(actualIndex, 'title'))}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h3 
                        className={`text-base font-semibold text-gray-900 break-words ${
                          isEditing ? 'cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors' : ''
                        }`}
                        style={getStyleFromFormats(getFormatsForField(actualIndex, 'title'))}
                        onClick={isEditing ? (e) => {
                          e.stopPropagation();
                          setEditingField({cardIndex: actualIndex, field: 'title'});
                        } : undefined}
                        title={isEditing ? "Clique para editar" : undefined}
                      >
                        {item.title || 'Novo Título'}
                      </h3>
                    )}
                  </div>

                  {/* Texto */}
                  <div className="flex-1 relative">
                    {isEditing && editingField?.cardIndex === actualIndex && editingField?.field === 'text' ? (
                      <div className="relative">
                        <textarea
                          value={item.text || ''}
                          onChange={(e) => {
                            updateItem(actualIndex, 'text', e.target.value);
                            // Ajustar altura automaticamente
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                          }}
                          onBlur={() => {
                            setEditingField(null);
                            hideGlobalToolbar();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              setEditingField(null);
                              hideGlobalToolbar();
                            }
                          }}
                          onFocus={(e) => {
                            showGlobalToolbar(actualIndex, 'text');
                            // Ajustar altura ao focar
                            const target = e.target as HTMLTextAreaElement;
                            setTimeout(() => {
                              target.style.height = 'auto';
                              target.style.height = `${target.scrollHeight}px`;
                            }, 0);
                          }}
                          placeholder="Digite seu texto aqui..."
                          className="w-full text-xs bg-transparent border-none outline-none resize-none overflow-hidden"
                          style={getStyleFromFormats(getFormatsForField(actualIndex, 'text'))}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <p 
                        className={`text-sm text-gray-600 break-words ${
                          isEditing ? 'cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors' : ''
                        }`}
                        style={getStyleFromFormats(getFormatsForField(actualIndex, 'text'))}
                        onClick={isEditing ? (e) => {
                          e.stopPropagation();
                          setEditingField({cardIndex: actualIndex, field: 'text'});
                        } : undefined}
                        title={isEditing ? "Clique para editar" : undefined}
                      >
                        {item.text || 'Digite seu texto aqui...'}
                      </p>
                    )}
                    
                    {/* Selo sem imagem do card - Exibido no canto inferior direito do texto */}
                    {!item.image && item.badge && (
                      <div className="absolute bottom-0 right-0 z-10" key={`badge-no-image-${actualIndex}`}>
                        {item.badge.src ? (
                          <div 
                            className={`overflow-hidden border-2 border-white shadow-lg ${
                              isEditing ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400' : ''
                            }`}
                            style={{ width: '70px', height: '70px', borderRadius: '100%' }}
                            onClick={isEditing ? (e) => {
                              e.stopPropagation();
                              setEditingField({cardIndex: actualIndex, field: 'badge'});
                            } : undefined}
                            title={isEditing ? "Clique para configurar selo" : undefined}
                          >
                            <img
                              src={item.badge.src}
                              alt={item.badge.alt || 'Selo'}
                              className="w-full h-full object-cover"
                              style={{ borderRadius: '100%' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div 
                            className={`border-2 border-dashed border-gray-400 bg-gray-100 flex flex-col items-center justify-center ${
                              isEditing ? 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50' : ''
                            }`}
                            style={{ width: '70px', height: '70px', borderRadius: '100%' }}
                            onClick={isEditing ? (e) => {
                              e.stopPropagation();
                              setEditingField({cardIndex: actualIndex, field: 'badge'});
                            } : undefined}
                            title={isEditing ? "Clique para adicionar selo" : undefined}
                          >
                            <svg className="w-5 h-5 text-gray-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-xs text-gray-500 font-medium">70x70</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Painel de Edição de Imagem - Só aparece em modo de edição */}
                {isEditing && editingField?.cardIndex === actualIndex && editingField?.field === 'image' && (
                  <div className="absolute inset-0 bg-white border-2 border-blue-400 rounded-lg z-10 p-3">
                    <div className="space-y-3 h-full overflow-y-auto">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Configurar Imagem
                      </h4>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Texto Alternativo
                        </label>
                        <input
                          type="text"
                          value={item.image?.alt || ''}
                          onChange={(e) => updateItem(actualIndex, 'image.alt', e.target.value)}
                          placeholder="Descrição da imagem"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Upload de Imagem
                        </label>
                        <label className={`w-full px-2 py-1.5 text-xs border-2 border-dashed rounded transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          imageUploadError[actualIndex]
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}>
                          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-gray-600">Selecionar Arquivo</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={(e) => handleImageUpload(actualIndex, e)}
                            className="hidden"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </label>
                        {imageUploadError[actualIndex] && (
                          <p className="mt-1 text-xs text-red-600">{imageUploadError[actualIndex]}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Formatos: .jpg, .jpeg, .png, .gif, .webp | Qualquer tamanho (será redimensionado para 70x70px)
                        </p>
                      </div>

                      {item.image?.src && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Preview:</p>
                          <img
                            src={item.image.src}
                            alt={item.image.alt || ''}
                            className="w-full h-20 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField(null);
                          }}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1.5 px-2 rounded transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField(null);
                          }}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5 px-2 rounded transition-colors"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Painel de Edição de Selo - Só aparece em modo de edição */}
                {isEditing && editingField?.cardIndex === actualIndex && editingField?.field === 'badge' && (
                  <div className="absolute inset-0 bg-white border-2 border-green-400 rounded-lg z-10 p-3">
                    <div className="space-y-3 h-full overflow-y-auto">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Configurar Selo
                      </h4>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Texto Alternativo do Selo
                        </label>
                        <input
                          type="text"
                          value={item.badge?.alt || ''}
                          onChange={(e) => updateItem(actualIndex, 'badge.alt', e.target.value)}
                          placeholder="Descrição do selo"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Upload de Imagem do Selo
                        </label>
                        <label className={`w-full px-2 py-1.5 text-xs border-2 border-dashed rounded transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          imageUploadError[`badge-${actualIndex}`]
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                        }`}>
                          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-gray-600">Selecionar Arquivo</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={(e) => handleBadgeUpload(actualIndex, e)}
                            className="hidden"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </label>
                        {imageUploadError[`badge-${actualIndex}`] && (
                          <p className="mt-1 text-xs text-red-600">{imageUploadError[`badge-${actualIndex}`]}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Formatos: .jpg, .jpeg, .png, .gif, .webp | Qualquer tamanho (será redimensionado para 70x70px)
                        </p>
                      </div>

                      {item.badge?.src && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Preview do Selo (70x70px):</p>
                          <div className="overflow-hidden border-2 border-gray-300 mx-auto" style={{ width: '70px', height: '70px', borderRadius: '100%' }}>
                            <img
                              src={item.badge.src}
                              alt={item.badge.alt || 'Preview do selo'}
                              className="w-full h-full object-cover"
                              style={{ borderRadius: '100%' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField(null);
                          }}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1.5 px-2 rounded transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField(null);
                          }}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1.5 px-2 rounded transition-colors"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navegação do Carrossel */}
        {items.length > cardsPerView && (
          <>
            {/* Setas de navegação */}
            {showArrows && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors z-20"
                  aria-label="Slide anterior"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors z-20"
                  aria-label="Próximo slide"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Indicadores (dots) */}
            {showDots && totalSlides > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => goToSlide(index, e)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-indigo-600 w-6'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Ir para slide ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Indicador de slide */}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
              {currentSlide + 1} / {totalSlides}
            </div>
          </>
        )}
      </div>

      {/* Footer com dica - Só aparece em modo de edição */}
      {isEditing && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Clique nos textos para editar • Clique na imagem/selo para configurar
          </p>
        </div>
      )}
    </div>
  );
};

export const TabsBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true }) => {
  const tabs = (block.props as any)?.content?.tabs || [
    { title: 'Aba 1', content: 'Conteúdo da aba 1' },
    { title: 'Aba 2', content: 'Conteúdo da aba 2' }
  ];
  const activeTab = (block.props as any)?.content?.activeTab || 0;
  const borderOuter: boolean = (block.props as any)?.content?.borderOuter !== false;
  
  const [editingTab, setEditingTab] = React.useState<{tabIndex: number, field: 'title' | 'content'} | null>(null);
  const [editingValue, setEditingValue] = React.useState('');

  const updateContent = (field: string, value: any) => {
    if (!onUpdate) return;
    onUpdate({
      content: {
        ...block.props.content,
        [field]: value,
      },
    });
  };

  const updateTab = (tabIndex: number, field: 'title' | 'content', value: string) => {
    const newTabs = [...tabs];
    newTabs[tabIndex] = {
      ...newTabs[tabIndex],
      [field]: value,
    };
    updateContent('tabs', newTabs);
  };

  const setActiveTab = (index: number) => {
    updateContent('activeTab', index);
  };

  const startEditing = (tabIndex: number, field: 'title' | 'content', currentValue: string) => {
    if (!isEditing) return;
    setEditingTab({ tabIndex, field });
    setEditingValue(currentValue);
  };

  const finishEditing = () => {
    if (!editingTab) return;
    updateTab(editingTab.tabIndex, editingTab.field, editingValue);
    setEditingTab(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingTab(null);
      setEditingValue('');
    }
  };

  return (
    <div
      className={`bg-white rounded-lg ${
        borderOuter ? 'border border-gray-300' : ''
      } ${
        isEditing 
          ? `${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
          : ''
      }`}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Header das Abas */}
      <div className={`flex border-b border-gray-200 bg-gray-50 ${
        borderOuter ? 'rounded-t-lg' : ''
      }`}>
        {tabs.map((tab: any, index: number) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab(index);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {editingTab?.tabIndex === index && editingTab?.field === 'title' ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none text-sm font-medium text-center"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={isEditing ? 'cursor-pointer' : ''}
                onClick={isEditing ? (e) => {
                  e.stopPropagation();
                  startEditing(index, 'title', tab.title);
                } : undefined}
              >
                {tab.title || `Aba ${index + 1}`}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="p-6 min-h-[200px]">
        {tabs[activeTab] && (
          <div>
            {editingTab?.tabIndex === activeTab && editingTab?.field === 'content' ? (
              <textarea
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none text-sm text-gray-700 resize-none"
                rows={6}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className={isEditing ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : ''}
                onClick={isEditing ? (e) => {
                  e.stopPropagation();
                  startEditing(activeTab, 'content', tabs[activeTab].content || '');
                } : undefined}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {tabs[activeTab].title || `Aba ${activeTab + 1}`}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {tabs[activeTab].content || 'Clique para editar o conteúdo desta aba...'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className={`px-4 py-2 bg-gray-50 border-t border-gray-200 ${
          borderOuter ? 'rounded-b-lg' : ''
        }`}>
          <p className="text-xs text-gray-500 text-center">
            Clique nos títulos e conteúdo para editar • Configure quantidade no painel de propriedades
          </p>
        </div>
      )}
    </div>
  );
};

export const AccordionBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true }) => {
  const items = (block.props as any)?.content?.items || [
    { title: 'Accordion 1', content: 'Conteúdo do accordion 1', isOpen: false },
    { title: 'Accordion 2', content: 'Conteúdo do accordion 2', isOpen: false }
  ];
  const borderOuter: boolean = (block.props as any)?.content?.borderOuter !== false;
  
  const [editingItem, setEditingItem] = React.useState<{itemIndex: number, field: 'title' | 'content'} | null>(null);
  const [editingValue, setEditingValue] = React.useState('');

  const updateContent = (field: string, value: any) => {
    if (!onUpdate) return;
    onUpdate({
      content: {
        ...block.props.content,
        [field]: value,
      },
    });
  };

  const updateItem = (itemIndex: number, field: 'title' | 'content' | 'isOpen', value: any) => {
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      [field]: value,
    };
    updateContent('items', newItems);
  };

  const toggleItem = (index: number) => {
    updateItem(index, 'isOpen', !items[index].isOpen);
  };

  const startEditing = (itemIndex: number, field: 'title' | 'content', currentValue: string) => {
    if (!isEditing) return;
    setEditingItem({ itemIndex, field });
    setEditingValue(currentValue);
  };

  const finishEditing = () => {
    if (!editingItem) return;
    updateItem(editingItem.itemIndex, editingItem.field, editingValue);
    setEditingItem(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingItem(null);
      setEditingValue('');
    }
  };

  return (
    <div
      className={`bg-white ${
        borderOuter ? 'border border-gray-300 rounded-lg' : ''
      } ${
        isEditing 
          ? `${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
          : ''
      }`}
      onClick={isEditing ? onSelect : undefined}
    >
      {items.map((item: any, index: number) => (
        <div key={index} className={`${
          borderOuter ? '' : 'border border-gray-300 rounded-lg mb-2'
        } ${index < items.length - 1 && !borderOuter ? 'mb-2' : ''}`}>
          {/* Header do Accordion */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleItem(index);
            }}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
              isEditing ? 'hover:bg-gray-50' : ''
            } ${
              borderOuter && index < items.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <div className="flex-1">
              {editingItem?.itemIndex === index && editingItem?.field === 'title' ? (
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-900"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={`text-sm font-semibold text-gray-900 ${
                    isEditing ? 'cursor-pointer' : ''
                  }`}
                  onClick={isEditing ? (e) => {
                    e.stopPropagation();
                    startEditing(index, 'title', item.title);
                  } : undefined}
                >
                  {item.title || `Accordion ${index + 1}`}
                </span>
              )}
            </div>
            
            {/* Ícone de chevron */}
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${
                item.isOpen ? 'rotate-180' : ''
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Conteúdo do Accordion */}
          {item.isOpen && (
            <div className={`px-4 pb-4 ${
              borderOuter && index < items.length - 1 ? 'border-b border-gray-200' : ''
            }`}>
              {editingItem?.itemIndex === index && editingItem?.field === 'content' ? (
                <textarea
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none outline-none text-sm text-gray-700 resize-none"
                  rows={4}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  className={`text-sm text-gray-700 ${
                    isEditing ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : ''
                  }`}
                  onClick={isEditing ? (e) => {
                    e.stopPropagation();
                    startEditing(index, 'content', item.content || '');
                  } : undefined}
                >
                  {item.content || 'Clique para editar o conteúdo deste accordion...'}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {isEditing && (
        <div className={`px-4 py-2 bg-gray-50 ${
          borderOuter ? 'rounded-b-lg' : 'rounded-lg mt-2'
        }`}>
          <p className="text-xs text-gray-500 text-center">
            Clique nos títulos e conteúdo para editar • Configure quantidade no painel de propriedades
          </p>
        </div>
      )}
    </div>
  );
};

export const ContainerBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true }) => {
  const content = (block.props as any)?.content || {};
  const blocks = content.blocks || [];
  const alignment = content.alignment || 'left';
  const alignmentVertical = content.alignmentVertical || 'top';
  const [showAlignmentDropdown, setShowAlignmentDropdown] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAlignmentDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.container-alignment-dropdown')) {
          setShowAlignmentDropdown(false);
        }
      }
    };

    if (showAlignmentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAlignmentDropdown]);

  const updateAlignment = (newAlignment: 'left' | 'center' | 'right' | 'justify') => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          alignment: newAlignment,
        },
      });
    }
    setShowAlignmentDropdown(false);
  };

  const updateAlignmentVertical = (newVal: 'top' | 'center' | 'bottom') => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          alignmentVertical: newVal,
        },
      });
    }
    setShowAlignmentDropdown(false);
  };

  return (
    <div
      className={`p-4 rounded-lg relative flex flex-col min-h-[120px] ${
        isEditing 
          ? `border-2 border-dashed border-gray-300 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
          : ''
      }`}
      onClick={isEditing ? onSelect : undefined}
      style={{
        textAlign: alignment,
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignment === 'center' ? 'center' : 
                    alignment === 'right' ? 'flex-end' : 
                    alignment === 'justify' ? 'stretch' : 'flex-start',
        justifyContent: alignmentVertical === 'center' ? 'center' : 
                       alignmentVertical === 'bottom' ? 'flex-end' : 'flex-start',
        minHeight: (alignmentVertical === 'center' || alignmentVertical === 'bottom') ? 200 : undefined
      }}
    >
      {/* Botão de Alinhamento - Só aparece quando há componentes */}
      {isEditing && blocks.length > 0 && (
        <div className="absolute -top-2 -right-2 container-alignment-dropdown">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAlignmentDropdown(!showAlignmentDropdown);
              }}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
              title="Alinhamento"
            >
              {alignment === 'center' ? <AlignCenterVertical className="w-3 h-3" /> :
               alignment === 'right' ? <AlignEndVertical className="w-3 h-3" /> :
               <AlignStartVertical className="w-3 h-3" />}
            </button>
            {showAlignmentDropdown && (
              <div
                className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-60 p-2 flex flex-col gap-2"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Horizontal: Esquerda | Centro | Direita — ícones verticais (linhas) */}
                <div className="flex rounded-md overflow-hidden border border-gray-200 bg-gray-100 p-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAlignment('left');
                    }}
                    className={`p-1.5 ${alignment === 'left' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Alinhar à esquerda"
                  >
                    <AlignStartVertical className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAlignment('center');
                    }}
                    className={`p-1.5 ${alignment === 'center' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Centralizar horizontalmente"
                  >
                    <AlignCenterVertical className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAlignment('right');
                    }}
                    className={`p-1.5 ${alignment === 'right' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Alinhar à direita"
                  >
                    <AlignEndVertical className="w-4 h-4" />
                  </button>
                </div>
                {/* Vertical: Topo | Centro | Base — ícones horizontais (linhas) */}
                <div className="flex rounded-md overflow-hidden border border-gray-200 bg-gray-100 p-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAlignmentVertical('top');
                    }}
                    className={`p-1.5 ${alignmentVertical === 'top' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Alinhar ao topo"
                  >
                    <AlignStartHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAlignmentVertical('center');
                    }}
                    className={`p-1.5 ${alignmentVertical === 'center' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Centralizar verticalmente"
                  >
                    <AlignCenterHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAlignmentVertical('bottom');
                    }}
                    className={`p-1.5 ${alignmentVertical === 'bottom' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Alinhar à base"
                  >
                    <AlignEndHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {blocks.length === 0 ? (
        <div className="text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-sm font-medium">Container</p>
          <p className="text-xs text-gray-400">Adicione componentes para começar</p>
        </div>
      ) : (
        <div className="text-gray-500">
          <p className="text-sm font-medium">Container</p>
          <p className="text-xs text-gray-400">{blocks.length} {blocks.length === 1 ? 'componente' : 'componentes'}</p>
        </div>
      )}
    </div>
  );
};

export const ModalBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true }) => {
  const trigger = (block.props as any)?.content?.trigger || {
    type: 'button',
    content: {
      label: 'Abrir Modal',
      url: '#',
      type: 'internal',
      size: 'medium',
      variant: 'primary',
    },
  };

  // Alinhamento do botão: layout.alignment ou content.alignment (edição e preview)
  const alignment = (block.props as any)?.layout?.alignment ?? (block.props as any)?.content?.alignment ?? 'left';

  const modalData = (block.props as any)?.content?.modalData || {
    title: 'Título do Modal',
    text: 'Conteúdo do modal...',
    hasImage: false,
    imageUrl: '',
    imageAlt: '',
  };
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTrigger, setEditingTrigger] = React.useState(false);
  const [triggerValue, setTriggerValue] = React.useState(trigger.content.label || 'Abrir Modal');

  const updateContent = (field: string, value: any) => {
    if (!onUpdate) return;
    onUpdate({
      content: {
        ...block.props.content,
        [field]: value,
      },
    });
  };

  const updateTriggerLabel = (label: string) => {
    const newTrigger = {
      ...trigger,
      content: {
        ...trigger.content,
        label,
      },
    };
    updateContent('trigger', newTrigger);
  };

  const finishEditingTrigger = () => {
    updateTriggerLabel(triggerValue);
    setEditingTrigger(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditingTrigger();
    } else if (e.key === 'Escape') {
      setTriggerValue(trigger.content.label || 'Abrir Modal');
      setEditingTrigger(false);
    }
  };

  return (
    <>
      <div
        className={`${
          isEditing 
            ? `border-2 border-dashed border-gray-300 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
            : ''
        }`}
        onClick={isEditing ? onSelect : undefined}
      >
        {/* Botão Trigger - container alinhado (edição e preview) */}
        <div
          className="w-full"
          style={{
            display: 'flex',
            justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          {editingTrigger ? (
            <input
              type="text"
              value={triggerValue}
              onChange={(e) => setTriggerValue(e.target.value)}
              onBlur={finishEditingTrigger}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) {
                  setEditingTrigger(true);
                } else {
                  setIsModalOpen(true);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                trigger.content.variant === 'primary'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : trigger.content.variant === 'secondary'
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
              } ${
                trigger.content.size === 'small' ? 'text-sm px-3 py-1' :
                trigger.content.size === 'large' ? 'text-lg px-6 py-3' :
                'text-base px-4 py-2'
              }`}
            >
              {trigger.content.label || 'Abrir Modal'}
            </button>
          )}
        </div>

        {isEditing && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 text-center">
              Clique no botão para editar • Clique fora para selecionar o componente
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{modalData.title || 'Modal'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4">
              {/* Imagem do Modal */}
              {modalData.hasImage && modalData.imageUrl && (
                <div className="mb-4">
                  <img
                    src={modalData.imageUrl}
                    alt={modalData.imageAlt || 'Imagem do modal'}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Texto do Modal */}
              <div className="text-gray-700 whitespace-pre-wrap">
                {modalData.text || 'Conteúdo do modal...'}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const QuizMultipleChoiceBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true }) => {
  const question = (block.props as any)?.content?.question || 'Qual é a resposta correta?';
  const alternatives = (block.props as any)?.content?.alternatives || [
    { text: 'Alternativa 1', isCorrect: false },
    { text: 'Alternativa 2', isCorrect: true },
  ];
  const feedbacks = (block.props as any)?.content?.feedbacks || [
    { text: 'Resposta incorreta!', type: 'incorrect' },
    { text: 'Parabéns! Resposta correta!', type: 'correct' },
  ];
  const showFeedback = (block.props as any)?.content?.showFeedback !== false;
  const blockNavigation = (block.props as any)?.content?.blockNavigation === true;

  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [showResult, setShowResult] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState(false);
  const [editingAlternative, setEditingAlternative] = React.useState<number | null>(null);
  const [questionValue, setQuestionValue] = React.useState(question);
  const [alternativeValues, setAlternativeValues] = React.useState(alternatives.map((alt: any) => alt.text));

  const updateContent = (field: string, value: any) => {
    if (!onUpdate) return;
    onUpdate({
      content: {
        ...block.props.content,
        [field]: value,
      },
    });
  };

  const updateQuestion = (newQuestion: string) => {
    updateContent('question', newQuestion);
    setEditingQuestion(false);
  };

  const updateAlternative = (index: number, text: string) => {
    const newAlternatives = [...alternatives];
    newAlternatives[index] = { ...newAlternatives[index], text };
    updateContent('alternatives', newAlternatives);
    setEditingAlternative(null);
  };

  const toggleCorrectAnswer = (index: number) => {
    const newAlternatives = [...alternatives];
    newAlternatives[index] = { ...newAlternatives[index], isCorrect: !newAlternatives[index].isCorrect };
    updateContent('alternatives', newAlternatives);
  };

  const handleAnswerSelect = (index: number) => {
    if (isEditing) return;
    setSelectedAnswer(index);
    setShowResult(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'question' | 'alternative', index?: number) => {
    if (e.key === 'Enter') {
      if (type === 'question') {
        updateQuestion(questionValue);
      } else if (type === 'alternative' && index !== undefined) {
        updateAlternative(index, alternativeValues[index]);
      }
    } else if (e.key === 'Escape') {
      if (type === 'question') {
        setQuestionValue(question);
        setEditingQuestion(false);
      } else if (type === 'alternative' && index !== undefined) {
        setAlternativeValues((prev: string[]) => {
          const newValues = [...prev];
          newValues[index] = alternatives[index].text;
          return newValues;
        });
        setEditingAlternative(null);
      }
    }
  };

  const isCorrect = selectedAnswer !== null && alternatives[selectedAnswer]?.isCorrect;

  return (
    <div
      className={`p-6 rounded-lg border ${
        isEditing 
          ? `border-2 border-dashed border-gray-300 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
          : 'border-gray-200 bg-white'
      }`}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Pergunta */}
      <div className="mb-6">
        {editingQuestion ? (
          <input
            type="text"
            value={questionValue}
            onChange={(e) => setQuestionValue(e.target.value)}
            onBlur={() => updateQuestion(questionValue)}
            onKeyDown={(e) => handleKeyDown(e, 'question')}
            className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className={`text-lg font-semibold text-gray-900 ${
              isEditing ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : ''
            }`}
            onClick={isEditing ? (e) => {
              e.stopPropagation();
              setEditingQuestion(true);
            } : undefined}
          >
            {question}
          </h3>
        )}
      </div>

      {/* Alternativas */}
      <div className="space-y-3">
        {alternatives.map((alternative: any, index: number) => (
          <div key={index} className="flex items-center space-x-3">
            {editingAlternative === index ? (
              <input
                type="text"
                value={alternativeValues[index]}
                onChange={(e) => {
                  const newValues = [...alternativeValues];
                  newValues[index] = e.target.value;
                  setAlternativeValues(newValues);
                }}
                onBlur={() => updateAlternative(index, alternativeValues[index])}
                onKeyDown={(e) => handleKeyDown(e, 'alternative', index)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditing) {
                    setEditingAlternative(index);
                  } else {
                    handleAnswerSelect(index);
                  }
                }}
                className={`flex-1 text-left px-4 py-3 rounded-lg border transition-colors ${
                  isEditing
                    ? 'border-gray-300 hover:bg-gray-50'
                    : selectedAnswer === index
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{alternative.text}</span>
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCorrectAnswer(index);
                      }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        alternative.isCorrect
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {alternative.isCorrect && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Feedback */}
      {showResult && showFeedback && (
        <div className={`mt-4 p-4 rounded-lg ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            isCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {isCorrect ? feedbacks[1]?.text : feedbacks[0]?.text}
          </p>
        </div>
      )}

      {/* Dicas de edição */}
      {isEditing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            Clique na pergunta e alternativas para editar • Marque a resposta correta • Configure no painel de propriedades
          </p>
        </div>
      )}
    </div>
  );
};

export const QuizTrueFalseBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true }) => {
  const question = (block.props as any)?.content?.question || 'Esta afirmação é verdadeira ou falsa?';
  const correctAnswer = (block.props as any)?.content?.correctAnswer || true;
  const feedbacks = (block.props as any)?.content?.feedbacks || [
    { text: 'Resposta incorreta!', type: 'incorrect' },
    { text: 'Parabéns! Resposta correta!', type: 'correct' },
  ];
  const showFeedback = (block.props as any)?.content?.showFeedback !== false;

  const [selectedAnswer, setSelectedAnswer] = React.useState<boolean | null>(null);
  const [showResult, setShowResult] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState(false);
  const [questionValue, setQuestionValue] = React.useState(question);

  const updateContent = (field: string, value: any) => {
    if (!onUpdate) return;
    onUpdate({
      content: {
        ...block.props.content,
        [field]: value,
      },
    });
  };

  const updateQuestion = (newQuestion: string) => {
    updateContent('question', newQuestion);
    setEditingQuestion(false);
  };

  const updateCorrectAnswer = (answer: boolean) => {
    updateContent('correctAnswer', answer);
  };

  const handleAnswerSelect = (answer: boolean) => {
    if (isEditing) return;
    setSelectedAnswer(answer);
    setShowResult(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateQuestion(questionValue);
    } else if (e.key === 'Escape') {
      setQuestionValue(question);
      setEditingQuestion(false);
    }
  };

  const isCorrect = selectedAnswer !== null && selectedAnswer === correctAnswer;

  return (
    <div
      className={`p-6 rounded-lg border ${
        isEditing 
          ? `border-2 border-dashed border-gray-300 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
          : 'border-gray-200 bg-white'
      }`}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Pergunta */}
      <div className="mb-6">
        {editingQuestion ? (
          <input
            type="text"
            value={questionValue}
            onChange={(e) => setQuestionValue(e.target.value)}
            onBlur={() => updateQuestion(questionValue)}
            onKeyDown={handleKeyDown}
            className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className={`text-lg font-semibold text-gray-900 ${
              isEditing ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : ''
            }`}
            onClick={isEditing ? (e) => {
              e.stopPropagation();
              setEditingQuestion(true);
            } : undefined}
          >
            {question}
          </h3>
        )}
      </div>

      {/* Opções Verdadeiro/Falso */}
      <div className="flex space-x-4 justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isEditing) {
              updateCorrectAnswer(true);
            } else {
              handleAnswerSelect(true);
            }
          }}
          className={`px-8 py-4 rounded-lg border-2 font-semibold transition-colors ${
            isEditing
              ? correctAnswer
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 hover:bg-gray-50'
              : selectedAnswer === true
              ? isCorrect
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Verdadeiro</span>
          </div>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isEditing) {
              updateCorrectAnswer(false);
            } else {
              handleAnswerSelect(false);
            }
          }}
          className={`px-8 py-4 rounded-lg border-2 font-semibold transition-colors ${
            isEditing
              ? !correctAnswer
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 hover:bg-gray-50'
              : selectedAnswer === false
              ? isCorrect
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Falso</span>
          </div>
        </button>
      </div>

      {/* Feedback */}
      {showResult && showFeedback && (
        <div className={`mt-6 p-4 rounded-lg ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium text-center ${
            isCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {isCorrect ? feedbacks[1]?.text : feedbacks[0]?.text}
          </p>
        </div>
      )}

      {/* Dicas de edição */}
      {isEditing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            Clique na pergunta para editar • Clique em Verdadeiro/Falso para definir a resposta correta • Configure no painel de propriedades
          </p>
        </div>
      )}
    </div>
  );
};

export const QuizEnumerationBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true }) => {
  const question = (block.props as any)?.content?.question || 'Enumere os itens solicitados:';
  const items = (block.props as any)?.content?.items || [
    'Item 1',
    'Item 2',
    'Item 3',
  ];
  const feedbacks = (block.props as any)?.content?.feedbacks || [
    { text: 'Alguns itens estão incorretos!', type: 'incorrect' },
    { text: 'Parabéns! Todos os itens estão corretos!', type: 'correct' },
  ];
  const showFeedback = (block.props as any)?.content?.showFeedback !== false;

  const [userAnswers, setUserAnswers] = React.useState<string[]>([]);
  const [showResult, setShowResult] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<number | null>(null);
  const [questionValue, setQuestionValue] = React.useState(question);
  const [itemValues, setItemValues] = React.useState(items);

  const updateContent = (field: string, value: any) => {
    if (!onUpdate) return;
    onUpdate({
      content: {
        ...block.props.content,
        [field]: value,
      },
    });
  };

  const updateQuestion = (newQuestion: string) => {
    updateContent('question', newQuestion);
    setEditingQuestion(false);
  };

  const updateItem = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index] = text;
    updateContent('items', newItems);
    setEditingItem(null);
  };

  const addItem = () => {
    const newItems = [...items, `Item ${items.length + 1}`];
    updateContent('items', newItems);
  };

  const removeItem = (index: number) => {
      if (items.length <= 1) return;
      const newItems = items.filter((_: any, i: number) => i !== index);
    updateContent('items', newItems);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (isEditing) return;
    setShowResult(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'question' | 'item', index?: number) => {
    if (e.key === 'Enter') {
      if (type === 'question') {
        updateQuestion(questionValue);
      } else if (type === 'item' && index !== undefined) {
        updateItem(index, itemValues[index]);
      }
    } else if (e.key === 'Escape') {
      if (type === 'question') {
        setQuestionValue(question);
        setEditingQuestion(false);
      } else if (type === 'item' && index !== undefined) {
        setItemValues((prev: string[]) => {
          const newValues = [...prev];
          newValues[index] = items[index];
          return newValues;
        });
        setEditingItem(null);
      }
    }
  };

  const isCorrect = userAnswers.length > 0 && userAnswers.every((answer, index) => 
    answer.toLowerCase().trim() === items[index]?.toLowerCase().trim()
  );

  return (
    <div
      className={`p-6 rounded-lg border ${
        isEditing 
          ? `border-2 border-dashed border-gray-300 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
          : 'border-gray-200 bg-white'
      }`}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Pergunta */}
      <div className="mb-6">
        {editingQuestion ? (
          <input
            type="text"
            value={questionValue}
            onChange={(e) => setQuestionValue(e.target.value)}
            onBlur={() => updateQuestion(questionValue)}
            onKeyDown={(e) => handleKeyDown(e, 'question')}
            className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className={`text-lg font-semibold text-gray-900 ${
              isEditing ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : ''
            }`}
            onClick={isEditing ? (e) => {
              e.stopPropagation();
              setEditingQuestion(true);
            } : undefined}
          >
            {question}
          </h3>
        )}
      </div>

      {/* Lista de itens para enumeração */}
      {isEditing && (
        <div className="mb-6">
          <div className="space-y-2">
            {items.map((item: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                {editingItem === index ? (
                  <input
                    type="text"
                    value={itemValues[index]}
                    onChange={(e) => {
                      const newValues = [...itemValues];
                      newValues[index] = e.target.value;
                      setItemValues(newValues);
                    }}
                    onBlur={() => updateItem(index, itemValues[index])}
                    onKeyDown={(e) => handleKeyDown(e, 'item', index)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span
                      className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(index);
                      }}
                    >
                      {item}
                    </span>
                    {items.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(index);
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addItem();
            }}
            className="mt-3 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200"
          >
            + Adicionar item
          </button>
        </div>
      )}

      {/* Campos de resposta (modo não-edição) */}
      {!isEditing && (
        <div className="space-y-3">
          {items.map((item: string, index: number) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <input
                type="text"
                value={userAnswers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder={`Digite o item ${index + 1}...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <button
            onClick={handleSubmit}
            className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Verificar Resposta
          </button>
        </div>
      )}

      {/* Feedback */}
      {showResult && showFeedback && (
        <div className={`mt-4 p-4 rounded-lg ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            isCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {isCorrect ? feedbacks[1]?.text : feedbacks[0]?.text}
          </p>
        </div>
      )}

      {/* Dicas de edição */}
      {isEditing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            Clique na pergunta e itens para editar • Adicione/remova itens • Configure no painel de propriedades
          </p>
        </div>
      )}
    </div>
  );
};

export const QuizEssayBlock: React.FC<StubBlockProps> = ({ block, isSelected, onSelect, onUpdate, isEditing = true }) => {
  const question = (block.props as any)?.content?.question || 'Escreva sua resposta dissertativa:';
  const minWords = (block.props as any)?.content?.minWords || 50;
  const maxWords = (block.props as any)?.content?.maxWords || 500;
  const placeholder = (block.props as any)?.content?.placeholder || 'Digite sua resposta aqui...';
  const showWordCount = (block.props as any)?.content?.showWordCount !== false;

  const [userAnswer, setUserAnswer] = React.useState('');
  const [editingQuestion, setEditingQuestion] = React.useState(false);
  const [questionValue, setQuestionValue] = React.useState(question);

  const updateContent = (field: string, value: any) => {
    if (!onUpdate) return;
    onUpdate({
      content: {
        ...block.props.content,
        [field]: value,
      },
    });
  };

  const updateQuestion = (newQuestion: string) => {
    updateContent('question', newQuestion);
    setEditingQuestion(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateQuestion(questionValue);
    } else if (e.key === 'Escape') {
      setQuestionValue(question);
      setEditingQuestion(false);
    }
  };

  const wordCount = userAnswer.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isWordCountValid = wordCount >= minWords && wordCount <= maxWords;

  return (
    <div
      className={`p-6 rounded-lg border ${
        isEditing 
          ? `border-2 border-dashed border-gray-300 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`
          : 'border-gray-200 bg-white'
      }`}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Pergunta */}
      <div className="mb-6">
        {editingQuestion ? (
          <input
            type="text"
            value={questionValue}
            onChange={(e) => setQuestionValue(e.target.value)}
            onBlur={() => updateQuestion(questionValue)}
            onKeyDown={handleKeyDown}
            className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className={`text-lg font-semibold text-gray-900 ${
              isEditing ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : ''
            }`}
            onClick={isEditing ? (e) => {
              e.stopPropagation();
              setEditingQuestion(true);
            } : undefined}
          >
            {question}
          </h3>
        )}
      </div>

      {/* Instruções de palavras */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Instruções:</strong> Sua resposta deve ter entre <span className="font-semibold text-indigo-600">{minWords}</span> e <span className="font-semibold text-indigo-600">{maxWords}</span> palavras.
        </p>
      </div>

      {/* Campo de texto */}
      <div className="mb-4">
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-48 px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            isEditing ? 'border-gray-300' : 'border-gray-300'
          }`}
          disabled={isEditing}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Contador de palavras */}
      {showWordCount && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Palavras:</span>
            <span className={`text-sm font-medium ${
              isWordCountValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {wordCount}
            </span>
            <span className="text-sm text-gray-500">
              / {minWords}-{maxWords}
            </span>
          </div>
          {!isWordCountValid && wordCount > 0 && (
            <div className="text-xs text-red-600">
              {wordCount < minWords 
                ? `Mínimo: ${minWords} palavras` 
                : `Máximo: ${maxWords} palavras`
              }
            </div>
          )}
        </div>
      )}

      {/* Barra de progresso */}
      {showWordCount && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isWordCountValid ? 'bg-green-500' : 'bg-indigo-500'
              }`}
              style={{ 
                width: `${Math.min(100, (wordCount / maxWords) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Dicas de edição */}
      {isEditing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            Clique na pergunta para editar • Configure limites de palavras no painel de propriedades
          </p>
        </div>
      )}
    </div>
  );
};
