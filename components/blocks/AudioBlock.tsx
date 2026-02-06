import React, { useState, useRef } from 'react';
import { AudioBlockProps } from '@/types/builder';
import { Play, Pause, Volume2, Download } from 'lucide-react';

interface AudioBlockComponentProps {
  block: { props: AudioBlockProps };
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<AudioBlockProps>) => void;
  onSelect?: () => void;
}

const AudioBlock: React.FC<AudioBlockComponentProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onSelect,
}) => {
  const { content } = block.props;
  const { src, title, controls, transcript } = content;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (src) {
      const link = document.createElement('a');
      link.href = src;
      link.download = title || 'audio';
      link.click();
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
          <div className="absolute -top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
            <p className="text-xs text-gray-600">
              Configure as propriedades no painel lateral
            </p>
          </div>
        )}

        {/* Preview do áudio */}
        <div className="relative">
          {src ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {/* Debug info */}
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <strong>Debug:</strong> src={src ? 'presente' : 'ausente'}, title={title || 'sem título'}
              </div>
              
              {/* Player de áudio */}
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                  className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {title || 'Áudio sem título'}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTime(currentTime)}
                    </span>
                    <span className="text-xs text-gray-400">/</span>
                    <span className="text-xs text-gray-500">
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Barra de progresso */}
              <div className="mb-3">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Controle de volume */}
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Elemento de áudio oculto */}
              <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg" style={{ minHeight: '200px' }}>
              <div className="text-center">
                <Volume2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium">Nenhum áudio selecionado</p>
                <p className="text-xs text-gray-400 mt-1">
                  Configure o áudio no painel lateral
                </p>
              </div>
            </div>
          )}

          {/* Avisos de validação */}
          {isSelected && (
            <div className="mt-2 space-y-1">
              {!src && (
                <p className="text-xs text-red-600">⚠️ Arquivo de áudio é obrigatório</p>
              )}
              {!title && (
                <p className="text-xs text-yellow-600">⚠️ Título recomendado para acessibilidade</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderização em modo visualização
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 text-gray-500 rounded-lg ${
          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
        }`}
        style={{ minHeight: '100px' }}
        onClick={onSelect}
      >
        <div className="text-center">
          <Volume2 className="w-8 h-8 mx-auto mb-1 text-gray-400" />
          <p className="text-xs">Áudio não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
      }`}
      onClick={onSelect}
    >
      {/* Player de áudio */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={handlePlayPause}
          className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">
            {title || 'Áudio sem título'}
          </h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-xs text-gray-500">
              {formatTime(duration)}
            </span>
          </div>
        </div>

      </div>

      {/* Barra de progresso */}
      <div className="mb-3">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Controle de volume */}
      <div className="flex items-center space-x-2">
        <Volume2 className="w-4 h-4 text-gray-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Elemento de áudio oculto */}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default AudioBlock;
