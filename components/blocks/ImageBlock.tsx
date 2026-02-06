import React, { useState } from 'react';
import { ImageBlockProps } from '@/types/builder';
import { ValidationUtils } from '@/utils/validation';

interface ImageBlockComponentProps {
  block: { props: ImageBlockProps };
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<ImageBlockProps>) => void;
  onSelect?: () => void;
}

const ImageBlock: React.FC<ImageBlockComponentProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onSelect,
}) => {
  const { content, style } = block.props;
  const { src, alt, width, height, lazyLoad, recommendedSize } = content;
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          src: e.target.value,
        },
      });
    }
    setImageError(false);
  };

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          alt: e.target.value,
        },
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar arquivo
      const validation = ValidationUtils.validateImageFile(file);
      if (!validation.isValid) {
        setUploadError(validation.error || 'Erro ao validar imagem');
        e.target.value = '';
        return;
      }

      // Limpar erro anterior
      setUploadError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (onUpdate && event.target?.result) {
          onUpdate({
            content: {
              ...content,
              src: event.target.result as string,
            },
          });
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const imageStyle: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    maxWidth: '100%',
    borderRadius: style?.effects?.borderRadius ? `${style.effects.borderRadius}px` : undefined,
    boxShadow: style?.effects?.shadow,
    opacity: style?.effects?.opacity,
  };

  if (isEditing) {
    return (
      <div
        className={`relative group ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        onClick={onSelect}
      >
        {/* Controles de edição */}
        {isSelected && (
          <div className="absolute -top-12 left-0 flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 max-w-md">
            {/* Input de URL */}
            <input
              type="url"
              value={src}
              onChange={handleSrcChange}
              placeholder="URL da imagem..."
              className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Upload de arquivo */}
            <div className="flex flex-col">
              <label className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 border border-indigo-300 rounded cursor-pointer hover:bg-indigo-200">
                Upload
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  onClick={(e) => e.stopPropagation()}
                />
              </label>
              {uploadError && (
                <p className="mt-1 text-xs text-red-600 max-w-xs">{uploadError}</p>
              )}
            </div>

            {/* Input de alt text */}
            <input
              type="text"
              value={alt}
              onChange={handleAltChange}
              placeholder="Texto alternativo..."
              className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Dimensões recomendadas */}
            {recommendedSize && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {recommendedSize.width}×{recommendedSize.height}px
              </span>
            )}
          </div>
        )}

        {/* Preview da imagem */}
        <div className="relative">
          {src && !imageError ? (
            <img
              src={src}
              alt={alt}
              style={imageStyle}
              className="block"
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading={lazyLoad ? 'lazy' : 'eager'}
            />
          ) : (
            <div
              className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500"
              style={{ minHeight: '200px', ...imageStyle }}
            >
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">
                  {imageError ? 'Erro ao carregar imagem' : 'Nenhuma imagem selecionada'}
                </p>
                {src && imageError && (
                  <p className="text-xs text-red-500 mt-1">
                    Verifique se a URL está correta
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Indicador de carregamento */}
          {src && !imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Aviso de acessibilidade */}
          {!alt && isSelected && (
            <div className="absolute bottom-2 left-2 right-2 bg-yellow-100 border border-yellow-300 rounded p-2">
              <p className="text-xs text-yellow-800">
                ⚠️ Texto alternativo é obrigatório para acessibilidade
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderização em modo visualização
  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 text-gray-500 ${
          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
        }`}
        style={{ minHeight: '100px', ...imageStyle }}
        onClick={onSelect}
      >
        <div className="text-center">
          <svg
            className="w-8 h-8 mx-auto mb-1 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs">Imagem não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={imageStyle}
      className={`block ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
      loading={lazyLoad ? 'lazy' : 'eager'}
      onClick={onSelect}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
};

export default ImageBlock;

