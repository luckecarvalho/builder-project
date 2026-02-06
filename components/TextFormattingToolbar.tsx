import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Type,
  Palette,
  Minus,
  Plus
} from 'lucide-react';

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
  };
}

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

        {/* Grupo: Alinhamento */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500 font-medium mr-2">Alinhar:</span>
          <button
            onClick={() => handleAlignChange('left')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              currentFormats.align === 'left' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAlignChange('center')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              currentFormats.align === 'center' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Centralizar"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAlignChange('right')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              currentFormats.align === 'right' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Alinhar à direita"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAlignChange('justify')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              currentFormats.align === 'justify' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Justificar"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300"></div>

        {/* Grupo: Tamanho da Fonte */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium">Tamanho:</span>
          <select
            value={currentFormats.fontSize || 16}
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
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
