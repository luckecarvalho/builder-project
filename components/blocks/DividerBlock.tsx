import React from 'react';
import { DividerBlockProps } from '@/types/builder';

interface DividerBlockComponentProps {
  block: { props: DividerBlockProps };
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<DividerBlockProps>) => void;
  onSelect?: () => void;
}

const DividerBlock: React.FC<DividerBlockComponentProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onSelect,
}) => {
  const { content } = block.props;
  const { type, thickness, color, spacing, direction } = content;

  const handleTypeChange = (newType: 'line' | 'space') => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          type: newType,
        },
      });
    }
  };

  const handleThicknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          thickness: parseInt(e.target.value) || 1,
        },
      });
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          color: e.target.value,
        },
      });
    }
  };

  const handleSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          spacing: parseInt(e.target.value) || 20,
        },
      });
    }
  };

  const handleDirectionChange = (newDirection: 'horizontal' | 'vertical') => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          direction: newDirection,
        },
      });
    }
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
            {/* Tipo */}
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as 'line' | 'space')}
              className="px-2 py-1 text-xs border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="line">Linha</option>
              <option value="space">Espaço</option>
            </select>

            {/* Direção (apenas para linha) */}
            {type === 'line' && (
              <select
                value={direction}
                onChange={(e) => handleDirectionChange(e.target.value as 'horizontal' | 'vertical')}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            )}

            {/* Espessura (apenas para linha) */}
            {type === 'line' && (
              <div className="flex items-center space-x-1">
                <label className="text-xs text-gray-600">Espessura:</label>
                <input
                  type="number"
                  value={thickness}
                  onChange={handleThicknessChange}
                  min="1"
                  max="10"
                  className="w-12 px-1 py-1 text-xs border border-gray-300 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Cor (apenas para linha) */}
            {type === 'line' && (
              <div className="flex items-center space-x-1">
                <label className="text-xs text-gray-600">Cor:</label>
                <input
                  type="color"
                  value={color}
                  onChange={handleColorChange}
                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Espaçamento */}
            <div className="flex items-center space-x-1">
              <label className="text-xs text-gray-600">Espaço:</label>
              <input
                type="number"
                value={spacing}
                onChange={handleSpacingChange}
                min="0"
                max="100"
                className="w-12 px-1 py-1 text-xs border border-gray-300 rounded"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
        )}

        {/* Preview do divisor */}
        {type === 'line' ? (
          direction === 'horizontal' ? (
            <hr
              className="border-none"
              style={{
                height: `${thickness}px`,
                backgroundColor: color,
                margin: `${spacing}px 0`,
              }}
            />
          ) : (
            <div
              className="inline-block"
              style={{
                width: `${thickness}px`,
                backgroundColor: color,
                margin: `0 ${spacing}px`,
                height: '100px',
              }}
            />
          )
        ) : (
          <div
            style={{
              height: `${spacing}px`,
            }}
          />
        )}
      </div>
    );
  }

  // Renderização em modo visualização
  if (type === 'line') {
    if (direction === 'horizontal') {
      return (
        <hr
          className={`border-none ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
          style={{
            height: `${thickness}px`,
            backgroundColor: color,
            margin: `${spacing}px 0`,
          }}
          onClick={onSelect}
        />
      );
    } else {
      return (
        <div
          className={`inline-block ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
          style={{
            width: `${thickness}px`,
            backgroundColor: color,
            margin: `0 ${spacing}px`,
            height: '100px',
          }}
          onClick={onSelect}
        />
      );
    }
  } else {
    return (
      <div
        className={isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
        style={{
          height: `${spacing}px`,
        }}
        onClick={onSelect}
      />
    );
  }
};

export default DividerBlock;

