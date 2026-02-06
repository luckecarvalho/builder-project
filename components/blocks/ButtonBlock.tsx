import React from 'react';
import { ButtonBlockProps } from '@/types/builder';
import { ValidationUtils } from '@/utils/validation';

interface ButtonBlockComponentProps {
  block: { props: ButtonBlockProps };
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<ButtonBlockProps>) => void;
  onSelect?: () => void;
}

const ButtonBlock: React.FC<ButtonBlockComponentProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onSelect,
}) => {
  const { content, style } = block.props;
  const { label, url, type, icon, size, variant } = content;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          label: e.target.value,
        },
      });
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          url: e.target.value,
        },
      });
    }
  };

  const handleTypeChange = (newType: 'internal' | 'external') => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          type: newType,
        },
      });
    }
  };

  const handleSizeChange = (newSize: 'small' | 'medium' | 'large') => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          size: newSize,
        },
      });
    }
  };

  const handleVariantChange = (newVariant: 'primary' | 'secondary' | 'outline' | 'ghost') => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          variant: newVariant,
        },
      });
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-sm';
      case 'large':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'outline':
        return 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white';
      case 'ghost':
        return 'text-indigo-600 hover:bg-indigo-50';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    }
  };

  const buttonClasses = `
    inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
    ${getSizeClasses()}
    ${getVariantClasses()}
    ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
  `.trim();

  const isValidUrl = ValidationUtils.validateUrl(url, ['http', 'https', 'mailto', 'tel']);

  if (isEditing) {
    return (
      <div
        className={`relative group ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        onClick={onSelect}
      >
        {/* Controles de edição */}
        {isSelected && (
          <div className="absolute -top-16 left-0 flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 max-w-lg">
            {/* Label */}
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              placeholder="Texto do botão..."
              className="px-2 py-1 text-xs border border-gray-300 rounded min-w-0"
              onClick={(e) => e.stopPropagation()}
            />

            {/* URL */}
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder="URL..."
              className={`flex-1 min-w-0 px-2 py-1 text-xs border rounded ${
                isValidUrl ? 'border-gray-300' : 'border-red-300 bg-red-50'
              }`}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Tipo */}
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as 'internal' | 'external')}
              className="px-2 py-1 text-xs border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="internal">Interno</option>
              <option value="external">Externo</option>
            </select>

            {/* Tamanho */}
            <select
              value={size}
              onChange={(e) => handleSizeChange(e.target.value as 'small' | 'medium' | 'large')}
              className="px-2 py-1 text-xs border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="small">Pequeno</option>
              <option value="medium">Médio</option>
              <option value="large">Grande</option>
            </select>

            {/* Variante */}
            <select
              value={variant}
              onChange={(e) => handleVariantChange(e.target.value as 'primary' | 'secondary' | 'outline' | 'ghost')}
              className="px-2 py-1 text-xs border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="primary">Primário</option>
              <option value="secondary">Secundário</option>
              <option value="outline">Outline</option>
              <option value="ghost">Ghost</option>
            </select>
          </div>
        )}

        {/* Preview do botão */}
        <button
          className={buttonClasses}
          disabled
          onClick={(e) => e.preventDefault()}
        >
          {icon && <span className="mr-2">{icon}</span>}
          {label || 'Botão'}
        </button>

        {/* Avisos de validação */}
        {isSelected && (
          <div className="mt-2 space-y-1">
            {!label && (
              <p className="text-xs text-red-600">⚠️ Texto do botão é obrigatório</p>
            )}
            {!url && (
              <p className="text-xs text-red-600">⚠️ URL é obrigatória</p>
            )}
            {url && !isValidUrl && (
              <p className="text-xs text-red-600">⚠️ URL inválida</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Renderização em modo visualização
  const handleClick = (e: React.MouseEvent) => {
    if (type === 'external') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Para links internos, você pode implementar navegação do seu roteador
      console.log('Navegando para:', url);
    }
    e.preventDefault();
  };

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
};

export default ButtonBlock;

