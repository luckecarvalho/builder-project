import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
} from 'lucide-react';

/** Estilos de marcador para lista não ordenada (compatível com TextBlock) */
export type UnorderedListMarkerStyle = 'dash' | 'bullet' | 'circle' | 'square' | 'asterisk';

/** Estilo da lista numerada */
export type OrderedListStyle = 'decimal' | 'alpha';

interface TextFormattingToolbarProps {
  onFormatChange: (format: string, value?: any) => void;
  onClose: () => void;
  currentFormats?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    listMarkerStyle?: UnorderedListMarkerStyle;
    orderedListActive?: boolean;
    orderedListStyle?: OrderedListStyle;
  };
}

const UNORDERED_MARKER_OPTIONS: { id: UnorderedListMarkerStyle; char: string; label: string }[] = [
  { id: 'dash', char: '-', label: 'Traço' },
  { id: 'bullet', char: '•', label: 'Bullet' },
  { id: 'circle', char: '◦', label: 'Círculo' },
  { id: 'square', char: '▪', label: 'Quadrado' },
  { id: 'asterisk', char: '*', label: 'Asterisco' },
];

const ORDERED_STYLE_OPTIONS: { id: OrderedListStyle; label: string; sample: string }[] = [
  { id: 'decimal', label: 'Numeração (1, 2, 3)', sample: '1. 2. 3.' },
  { id: 'alpha', label: 'Alfabética (a, b, c)', sample: 'a. b. c.' },
];

const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({
  onFormatChange,
  onClose,
  currentFormats = {}
}) => {
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
  const colors = [
    '#000000', '#333333', '#666666', '#999999', '#cccccc',
    '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#00ccff',
    '#0066ff', '#6600ff', '#ff00ff', '#ff0066', '#ffffff'
  ];

  const [isFontColorOpen, setIsFontColorOpen] = React.useState(false);
  const [isBgColorOpen, setIsBgColorOpen] = React.useState(false);
  const [isFontSizeOpen, setIsFontSizeOpen] = React.useState(false);
  const [listDropdownOpen, setListDropdownOpen] = React.useState<'unordered' | 'ordered' | null>(null);
  const [isAlignDropdownOpen, setIsAlignDropdownOpen] = React.useState(false);

  const handleFontSizeChange = (size: number) => {
    onFormatChange('fontSize', size);
  };

  const handleColorChange = (color: string) => {
    onFormatChange('color', color);
  };

  const handleBackgroundColorChange = (color: string) => {
    onFormatChange('backgroundColor', color);
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right' | 'justify') => {
    onFormatChange('align', align);
    setIsAlignDropdownOpen(false);
  };

  const currentAlign = currentFormats.align ?? 'left';
  const AlignIcon = currentAlign === 'center' ? AlignCenter : currentAlign === 'right' ? AlignRight : currentAlign === 'justify' ? AlignJustify : AlignLeft;

  const handleUnorderedMarkerStyle = (style: UnorderedListMarkerStyle) => {
    onFormatChange('unorderedList', style);
    setListDropdownOpen(null);
  };

  const handleOrderedStyle = (style: OrderedListStyle) => {
    onFormatChange('orderedList', style);
    setListDropdownOpen(null);
  };

  const currentMarkerOption = UNORDERED_MARKER_OPTIONS.find(o => o.id === currentFormats.listMarkerStyle) ?? UNORDERED_MARKER_OPTIONS[0];
  const currentOrderedOption = ORDERED_STYLE_OPTIONS.find(o => o.id === (currentFormats.orderedListStyle ?? 'decimal')) ?? ORDERED_STYLE_OPTIONS[0];

  const handleIndentChange = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      onFormatChange('indent');
    } else {
      onFormatChange('outdent');
    }
  };

  const toggleFormat = (format: 'bold' | 'italic' | 'underline') => {
    onFormatChange(format, !currentFormats[format]);
  };

  return (
    <div
      className="bg-white border-b border-gray-200 px-4 py-3"
      role="toolbar"
      onMouseDown={(e) => {
        // Impede que o clique na barra roube o foco do campo em edição
        e.preventDefault();
      }}
    >

      {/* Controles de Formatação */}
      <div className="flex items-center space-x-6">
        {/* Grupo: Estilos de Fonte */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500 font-medium mr-2">Estilo:</span>
          <button
            onClick={() => toggleFormat('bold')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              currentFormats.bold ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFormat('italic')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              currentFormats.italic ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFormat('underline')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              currentFormats.underline ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Sublinhado"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300"></div>

        {/* Grupo: Listas (cada um com ícone + dropdown) e Recuo */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500 font-medium mr-2">Lista:</span>

          {/* Lista com marcadores (bullet) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setListDropdownOpen(listDropdownOpen === 'unordered' ? null : 'unordered')}
              className={`flex items-center rounded hover:bg-gray-100 transition-colors border border-transparent ${
                currentFormats.listMarkerStyle ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
              title="Lista com marcadores"
            >
              <span className="p-2 flex items-center justify-center">
                <List className="w-4 h-4" />
              </span>
              <span className="pr-1.5 flex items-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {listDropdownOpen === 'unordered' && (
              <div
                className="absolute z-20 mt-1 left-0 top-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[10rem]"
                onMouseDown={(e) => e.preventDefault()}
              >
                {UNORDERED_MARKER_OPTIONS.map(({ id, char, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleUnorderedMarkerStyle(id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      currentFormats.listMarkerStyle === id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span className="w-5 text-center text-base">{char}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3) Lista numerada */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setListDropdownOpen(listDropdownOpen === 'ordered' ? null : 'ordered')}
              className={`flex items-center rounded hover:bg-gray-100 transition-colors border border-transparent ${
                currentFormats.orderedListActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
              title="Lista numerada"
            >
              <span className="p-2 flex items-center justify-center">
                <ListOrdered className="w-4 h-4" />
              </span>
              <span className="pr-1.5 flex items-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {listDropdownOpen === 'ordered' && (
              <div
                className="absolute z-20 mt-1 left-0 top-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[12rem]"
                onMouseDown={(e) => e.preventDefault()}
              >
                {ORDERED_STYLE_OPTIONS.map(({ id, label, sample }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleOrderedStyle(id)}
                    className={`w-full flex flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      (currentFormats.orderedListStyle ?? 'decimal') === id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-xs text-gray-500">{sample}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleIndentChange('in')}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="Aumentar recuo"
          >
            <Indent className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleIndentChange('out')}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="Diminuir recuo"
          >
            <Outdent className="w-4 h-4" />
          </button>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300"></div>

        {/* Grupo: Alinhamento (dropdown) */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500 font-medium mr-2">Alinhar:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAlignDropdownOpen(!isAlignDropdownOpen)}
              className={`flex items-center rounded hover:bg-gray-100 transition-colors border border-transparent ${
                currentFormats.align ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
              title="Alinhamento"
            >
              <span className="p-2 flex items-center justify-center">
                <AlignIcon className="w-4 h-4" />
              </span>
              <span className="pr-1.5 flex items-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {isAlignDropdownOpen && (
              <div
                className="absolute z-20 mt-1 left-0 top-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[10rem]"
                onMouseDown={(e) => e.preventDefault()}
              >
                {[
                  { id: 'left' as const, label: 'Esquerda', Icon: AlignLeft },
                  { id: 'center' as const, label: 'Centro', Icon: AlignCenter },
                  { id: 'right' as const, label: 'Direita', Icon: AlignRight },
                  { id: 'justify' as const, label: 'Justificado', Icon: AlignJustify },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleAlignChange(id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      currentFormats.align === id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300"></div>

        {/* Grupo: Tamanho da Fonte (dropdown customizado para não roubar foco do editor) */}
        <div className="relative flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium">Tamanho:</span>
          <button
            type="button"
            onClick={() => setIsFontSizeOpen(!isFontSizeOpen)}
            className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 min-w-[4rem]"
            title="Tamanho da fonte"
          >
            <span className="text-gray-700">{currentFormats.fontSize || 16}px</span>
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isFontSizeOpen && (
            <div
              className="absolute z-20 mt-2 left-0 top-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[5rem]"
              onMouseDown={(e) => e.preventDefault()}
            >
              {fontSizes.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    handleFontSizeChange(size);
                    setIsFontSizeOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${
                    (currentFormats.fontSize || 16) === size ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300"></div>

        {/* Grupo: Cor da Fonte (Dropdown) */}
        <div className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsFontColorOpen(!isFontColorOpen)}
            className="flex items-center gap-2 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            title="Cor da fonte"
          >
            <span className="text-gray-600">Cor</span>
            <span
              className="inline-block w-4 h-4 rounded border"
              style={{ backgroundColor: currentFormats.color || '#000000' }}
            />
          </button>
          {isFontColorOpen && (
            <div
              className="absolute z-20 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-8 gap-1 mb-3">
                {colors.map(color => (
                  <button
                    key={`font-${color}`}
                    onClick={() => { handleColorChange(color); setIsFontColorOpen(false); }}
                    className={`w-6 h-6 rounded border ${currentFormats.color === color ? 'border-blue-500' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                    title={`Cor: ${color}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Personalizada:</span>
                <input
                  type="color"
                  value={currentFormats.color || '#000000'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  title="Escolher cor personalizada"
                />
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300"></div>

        {/* Grupo: Cor de Fundo da Fonte (Dropdown) */}
        <div className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsBgColorOpen(!isBgColorOpen)}
            className="flex items-center gap-2 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            title="Cor de fundo"
          >
            <span className="text-gray-600">Fundo</span>
            <span
              className="inline-block w-4 h-4 rounded border"
              style={{ backgroundColor: currentFormats.backgroundColor || '#ffffff' }}
            />
          </button>
          {isBgColorOpen && (
            <div
              className="absolute z-20 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-8 gap-1 mb-3">
                {colors.map(color => (
                  <button
                    key={`bg-${color}`}
                    onClick={() => { handleBackgroundColorChange(color); setIsBgColorOpen(false); }}
                    className={`w-6 h-6 rounded border ${currentFormats.backgroundColor === color ? 'border-blue-500' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                    title={`Fundo: ${color}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Personalizada:</span>
                <input
                  type="color"
                  value={currentFormats.backgroundColor || '#ffffff'}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  title="Escolher cor de fundo personalizada"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextFormattingToolbar;
