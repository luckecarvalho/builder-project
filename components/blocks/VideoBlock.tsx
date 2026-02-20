import React, { useState } from 'react';
import { VideoBlockProps } from '@/types/builder';
import { ValidationUtils } from '@/utils/validation';

interface VideoBlockComponentProps {
  block: { props: VideoBlockProps };
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<VideoBlockProps>) => void;
  onSelect?: () => void;
}

const VideoBlock: React.FC<VideoBlockComponentProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onSelect,
}) => {
  const { content } = block.props;
  const { url, type, title, autoplay, controls, subtitles, description } = content;
  const [videoError, setVideoError] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          url: e.target.value,
        },
      });
    }
    setVideoError(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          title: e.target.value,
        },
      });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          description: e.target.value,
        },
      });
    }
  };

  const handleTypeChange = (newType: 'youtube' | 'vimeo' | 'url') => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          type: newType,
        },
      });
    }
  };

  const handleAutoplayChange = (checked: boolean) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          autoplay: checked,
        },
      });
    }
  };

  const handleControlsChange = (checked: boolean) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...content,
          controls: checked,
        },
      });
    }
  };

  const getEmbedUrl = () => {
    if (!url) return null;

    switch (type) {
      case 'youtube':
        const youtubeId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (!youtubeId) return null;
        return `https://www.youtube.com/embed/${youtubeId}?${autoplay ? 'autoplay=1&' : ''}${!controls ? 'controls=0&' : ''}`;
      
      case 'vimeo':
        const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
        if (!vimeoId) return null;
        return `https://player.vimeo.com/video/${vimeoId}?${autoplay ? 'autoplay=1&' : ''}${!controls ? 'controls=0&' : ''}`;
      
      case 'url':
        return url;
      
      default:
        return null;
    }
  };

  const embedUrl = getEmbedUrl();
  const isValidUrl = ValidationUtils.validateUrl(url, ['http', 'https']);

  if (isEditing) {
    return (
      <div
        className={`relative group ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        onClick={onSelect}
      >
        {/* Controles de edição */}
        {isSelected && (
          <div className="absolute -top-20 left-0 flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 max-w-2xl">
            {/* URL */}
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="URL do vídeo (YouTube, Vimeo ou direto)..."
              className={`flex-1 min-w-0 px-2 py-1 text-xs border rounded ${
                isValidUrl ? 'border-gray-300' : 'border-red-300 bg-red-50'
              }`}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Tipo */}
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as 'youtube' | 'vimeo' | 'url')}
              className="px-2 py-1 text-xs border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="url">URL Direta</option>
            </select>

            {/* Título */}
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Título do vídeo..."
              className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Controles */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={autoplay}
                  onChange={(e) => handleAutoplayChange(e.target.checked)}
                  className="mr-1"
                  onClick={(e) => e.stopPropagation()}
                />
                Auto
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={controls}
                  onChange={(e) => handleControlsChange(e.target.checked)}
                  className="mr-1"
                  onClick={(e) => e.stopPropagation()}
                />
                Controles
              </label>
            </div>
          </div>
        )}


        {/* Preview do vídeo */}
        <div className="relative">
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                title={title}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg" style={{ minHeight: '200px' }}>
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
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm">
                  {url ? 'Erro ao carregar vídeo' : 'Nenhum vídeo selecionado'}
                </p>
                {url && (
                  <p className="text-xs text-red-500 mt-1">
                    Verifique se a URL está correta
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Avisos de validação */}
          {isSelected && (
            <div className="mt-2 space-y-1">
              {!url && (
                <p className="text-xs text-red-600">⚠️ URL do vídeo é obrigatória</p>
              )}
              {url && !isValidUrl && (
                <p className="text-xs text-red-600">⚠️ URL inválida</p>
              )}
              {!title && (
                <p className="text-xs text-red-600">⚠️ Título é obrigatório</p>
              )}
              {!description && (
                <p className="text-xs text-red-600">⚠️ Descrição é obrigatória para acessibilidade</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderização em modo visualização
  if (!embedUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 text-gray-500 rounded-lg ${
          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
        }`}
        style={{ minHeight: '200px' }}
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
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs">Vídeo não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
      style={{ paddingBottom: '56.25%' }}
      onClick={onSelect}
    >
      <iframe
        src={embedUrl}
        title={title}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoBlock;

