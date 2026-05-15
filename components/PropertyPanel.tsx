'use client'

import React, { useRef, useState } from 'react';
import { BlockProps } from '@/types/builder';
import { ValidationUtils, IMAGE_INTERACTION_POINT_TEXT_MAX_CHARS } from '@/utils/validation';
import { X, Type, Image, Play, MousePointer, Minus, Volume2, CreditCard, List, Table, Award, RotateCcw, Folder, ChevronDown, Box, Star, Square, CheckSquare, CheckCircle, ListOrdered, Edit3, Clipboard, ArrowRight, Grid3X3, Zap, Palette, Code, Plus } from 'lucide-react';

interface PropertyPanelProps {
  block: BlockProps;
  isPreview?: boolean;
  validationErrors?: { field: string; message: string; value?: any }[];
  onUpdate: (updates: Partial<BlockProps>) => void;
  onClose: () => void;
}

const AccordionItemImageUpload: React.FC<{
  itemIndex: number;
  item: any;
  items: any[];
  updateContent: (field: string, value: any) => void;
  validationErrors: { field: string; message: string; value?: any }[];
}> = ({ itemIndex, item, items, updateContent, validationErrors }) => {
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = ValidationUtils.validateImageFile(file);
      if (!validation.isValid) {
        setLocalError(validation.error || 'Erro ao validar imagem');
        event.target.value = '';
        return;
      }
      setLocalError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const newItems = [...items];
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          image: {
            ...(newItems[itemIndex].image || {}),
            src: e.target?.result ?? '',
          },
        };
        updateContent('items', newItems);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const hasValidationError = validationErrors.some(
    (err) => typeof err.field === 'string' && err.field === `content.items[${itemIndex}].image.src`
  );

  const effectiveError = localError || (hasValidationError ? 'Imagem do item é obrigatória' : null);

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 transition-colors ${
          effectiveError
            ? 'bg-white text-red-700 border border-red-500 focus:ring-red-500 hover:bg-red-50'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>Selecionar imagem do item</span>
      </button>
      {effectiveError && (
        <p className="mt-1 text-xs text-red-600">{effectiveError}</p>
      )}
      {item.image?.src && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Preview</p>
          <div className="w-[120px] h-[80px] rounded-md overflow-hidden border border-gray-200 shadow-sm">
            <img
              src={item.image.src}
              alt={item.image.alt || `Imagem do item ${itemIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({ block, isPreview = false, validationErrors = [], onUpdate, onClose }) => {
  const { type, content, style, layout, accessibility } = block;
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [modalImageUploadError, setModalImageUploadError] = useState<string | null>(null);
  const [badgeUploadError, setBadgeUploadError] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const badgeFileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [accordionSelectedItem, setAccordionSelectedItem] = useState<number>(0);
  const [tabsSelectedIndex, setTabsSelectedIndex] = useState<number>(0);
  const [carouselSelectedCard, setCarouselSelectedCard] = useState<number>(0);

  const hasError = (fieldPath: string) => {
    return validationErrors.some(err => err.field === fieldPath);
  };

  const getErrorMessage = (fieldPath: string) =>
    validationErrors.find((err) => err.field === fieldPath)?.message;

  const getBlockIcon = () => {
    switch (type) {
      case 'heading': return <Type className="w-5 h-5" />;
      case 'text': return <Type className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Play className="w-5 h-5" />;
      case 'button': return <MousePointer className="w-5 h-5" />;
      case 'divider': return <Minus className="w-5 h-5" />;
      case 'audio': return <Volume2 className="w-5 h-5" />;
      case 'card': return <CreditCard className="w-5 h-5" />;
      case 'list': return <List className="w-5 h-5" />;
      case 'table': return <Table className="w-5 h-5" />;
      case 'badge': return <Award className="w-5 h-5" />;
      case 'carousel': return <RotateCcw className="w-5 h-5" />;
      case 'tabs': return <Folder className="w-5 h-5" />;
      case 'accordion': return <ChevronDown className="w-5 h-5" />;
      case 'container': return <Box className="w-5 h-5" />;
      case 'icon': return <Star className="w-5 h-5" />;
      case 'modal': return <Square className="w-5 h-5" />;
      case 'quiz-multiple-choice': return <CheckSquare className="w-5 h-5" />;
      case 'quiz-true-false': return <CheckCircle className="w-5 h-5" />;
      case 'quiz-enumeration': return <ListOrdered className="w-5 h-5" />;
      case 'quiz-essay': return <Edit3 className="w-5 h-5" />;
      case 'quiz-simulation': return <Clipboard className="w-5 h-5" />;
      case 'embed': return <Code className="w-5 h-5" />;
      default: return <Type className="w-5 h-5" />;
    }
  };

  const getBlockName = () => {
    switch (type) {
      case 'heading': return 'Título';
      case 'text': return 'Texto';
      case 'image': return 'Imagem';
      case 'video': return 'Vídeo';
      case 'button': return 'Botão';
      case 'divider': return 'Separador';
      case 'audio': return 'Áudio';
      case 'card': return 'Cartão';
      case 'list': return 'Lista';
      case 'table': return 'Tabela';
      case 'badge': return 'Selo';
      case 'carousel': return 'Carrossel';
      case 'tabs': return 'Abas';
      case 'accordion': return 'Accordion';
      case 'container': return 'Container';
      case 'icon': return 'Ícone';
      case 'modal': return 'Modal';
      case 'quiz-multiple-choice': return 'Múltipla Escolha';
      case 'quiz-true-false': return 'Verdadeiro/Falso';
      case 'quiz-enumeration': return 'Enumeração';
      case 'quiz-essay': return 'Dissertativo';
      case 'quiz-simulation': return 'Simulado';
      case 'embed': return 'Embed';
      default: return 'Componente';
    }
  };

  const updateContent = (field: string, value: any) => {
    onUpdate({
      content: {
        ...content,
        [field]: value,
      },
    });
  };

  const updateStyle = (field: string, value: any) => {
    onUpdate({
      style: {
        ...style,
        [field]: value,
      },
    });
  };

  const renderHeadingProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nível do Título
        </label>
        <select
          value={content.level || 2}
          onChange={(e) => updateContent('level', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={1}>H1 - Título Principal</option>
          <option value={2}>H2 - Subtítulo</option>
          <option value={3}>H3 - Seção</option>
          <option value={4}>H4 - Subseção</option>
          <option value={5}>H5 - Item</option>
          <option value={6}>H6 - Subitem</option>
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${
          hasError('content.text') ? 'text-red-600' : 'text-gray-700'
        }`}>
          Texto do Título*
        </label>
        <input
          type="text"
          value={content.text || ''}
          onChange={(e) => updateContent('text', e.target.value)}
          placeholder="Digite o título..."
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            hasError('content.text')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-indigo-500'
          }`}
          maxLength={content.maxChars || 100}
        />
        {content.maxChars && (
          <p className="text-xs text-gray-500 mt-1">
            {(content.text || '').length}/{content.maxChars} caracteres
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alinhamento
        </label>
        <div className="flex space-x-2">
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              onClick={() => {
                // Atualizar tanto content.alignment quanto layout.alignment para refletir visualmente
                onUpdate({
                  content: {
                    ...content,
                    alignment: align,
                  },
                  layout: {
                    ...layout,
                    alignment: align as 'left' | 'center' | 'right',
                  },
                });
              }}
              className={`flex-1 py-2 px-3 text-sm rounded-md border ${
                (content.alignment || layout?.alignment || 'left') === align
                  ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {align === 'left' && '←'}
              {align === 'center' && '↔'}
              {align === 'right' && '→'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Limite de Caracteres
        </label>
        <input
          type="number"
          value={content.maxChars || 100}
          onChange={(e) => updateContent('maxChars', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="1"
          max="500"
        />
      </div>
    </div>
  );

  const renderTextProperties = () => (
    <div className="space-y-4">
      <div>
        <label className={`block text-sm font-medium mb-1 ${
          hasError('content.html') ? 'text-red-600' : 'text-gray-700'
        }`}>
          Conteúdo do Texto*
        </label>
        <textarea
          value={typeof content.html === 'string' ? content.html.replace(/<[^>]*>/g, '') : (content.html || '')}
          onChange={(e) => updateContent('html', e.target.value)}
          placeholder="Digite seu texto..."
          rows={6}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            hasError('content.html')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-indigo-500'
          }`}
          maxLength={content.maxChars || 1000}
        />
        {content.maxChars && (
          <p className="text-xs text-gray-500 mt-1">
            {(typeof content.html === 'string' ? content.html.replace(/<[^>]*>/g, '') : content.html || '').length}/{content.maxChars} caracteres
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Limite de Caracteres
        </label>
        <input
          type="number"
          value={content.maxChars || 1000}
          onChange={(e) => updateContent('maxChars', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="1"
          max="5000"
        />
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={content.allowHtml || false}
            onChange={(e) => updateContent('allowHtml', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Permitir HTML</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={content.allowLinks || false}
            onChange={(e) => updateContent('allowLinks', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Permitir Links</span>
        </label>
      </div>
    </div>
  );

  const handleImageBlockUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar arquivo
      const validation = ValidationUtils.validateImageFile(file);
      if (!validation.isValid) {
        setImageUploadError(validation.error || 'Erro ao validar imagem');
        event.target.value = '';
        return;
      }

      // Limpar erro anterior
      setImageUploadError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        updateContent('src', e.target?.result ?? '');
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleBadgeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Usar mesma validação do componente de imagem
      const validation = ValidationUtils.validateImageFile(file);
      if (!validation.isValid) {
        setBadgeUploadError(validation.error || 'Erro ao validar imagem');
        event.target.value = '';
        return;
      }
      setBadgeUploadError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        updateContent('src', e.target?.result ?? '');
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const renderBadgeProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload da imagem do selo
        </label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          ref={badgeFileInputRef}
          onChange={handleBadgeUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => badgeFileInputRef.current?.click()}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 transition-colors ${
            ((!content.src && validationErrors.length > 0) || hasError('content.src') || badgeUploadError)
              ? 'bg-white text-red-700 border border-red-500 focus:ring-red-500 hover:bg-red-50'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>Selecionar imagem do selo</span>
        </button>
        {badgeUploadError && (
          <p className="mt-1 text-xs text-red-600">{badgeUploadError}</p>
        )}
        {!content.src && validationErrors.length > 0 && !badgeUploadError && (
          <p className="mt-1 text-xs text-red-600">Imagem do selo é obrigatória</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Selo exibido em 70×70px, formato circular. Formatos: .jpg, .jpeg, .png, .gif, .webp
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Texto alternativo
        </label>
        <input
          type="text"
          value={content.alt || ''}
          onChange={(e) => updateContent('alt', e.target.value)}
          placeholder="Descrição do selo para acessibilidade..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {content.src && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
          <div className="w-[70px] h-[70px] rounded-full overflow-hidden border-2 border-white shadow-lg">
            <img
              src={content.src}
              alt={content.alt || 'Preview do selo'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderImageProperties = () => {
    const points = content.interactionPoints || [];
    const activePointId = content.interactionActivePointId;

    const addInteractionPoint = () => {
      if (points.length >= 10) return;
      const newPoints = [
        ...points,
        {
          id: `point-${Date.now()}-${points.length + 1}`,
          x: 50,
          y: 50,
          text: '',
        },
      ];
      // Atualizar pontos e habilitar interação em uma única atualização
      onUpdate({
        content: {
          ...content,
          interactionPoints: newPoints,
          interactionEnabled: true,
        },
      });
    };

    const updatePointText = (index: number, text: string) => {
      const newPoints = [...points];
      newPoints[index] = {
        ...newPoints[index],
        text: text.slice(0, IMAGE_INTERACTION_POINT_TEXT_MAX_CHARS),
      };
      updateContent('interactionPoints', newPoints);
    };

    const removePoint = (index: number) => {
      const newPoints = points.filter((_p: any, i: number) => i !== index);

      let nextActiveId = activePointId;
      const removedPoint = points[index];
      if (removedPoint && removedPoint.id === activePointId) {
        nextActiveId = newPoints[0]?.id;
      }

      onUpdate({
        content: {
          ...content,
          interactionPoints: newPoints,
          interactionActivePointId: nextActiveId,
        },
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload de Imagem*
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            ref={imageFileInputRef}
            onChange={handleImageBlockUpload}
            className="hidden"
          />
          <button
            onClick={() => imageFileInputRef.current?.click()}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 transition-colors ${
              hasError('content.src') || imageUploadError
                ? 'bg-white text-red-700 border border-red-500 focus:ring-red-500 hover:bg-red-50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Selecionar Imagem</span>
          </button>
          {imageUploadError && (
            <p className="mt-1 text-xs text-red-600">{imageUploadError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Formatos: .jpg, .jpeg, .png, .gif, .webp | Tamanho máx.: 500 KB / 1024 KB (GIF)
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${
            hasError('content.alt') ? 'text-red-600' : 'text-gray-700'
          }`}>
            Texto Alternativo*
          </label>
          <textarea
            value={content.alt || ''}
            onChange={(e) => updateContent('alt', e.target.value)}
            placeholder="Descrição da imagem para acessibilidade..."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              hasError('content.alt')
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-indigo-500'
            }`}
            rows={3}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Importante para acessibilidade e SEO
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Largura (px)
            </label>
            <input
              type="number"
              value={content.width || ''}
              onChange={(e) => updateContent('width', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Auto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Altura (px)
            </label>
            <input
              type="number"
              value={content.height || ''}
              onChange={(e) => updateContent('height', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Auto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Pontos de interação */}
        <div className="pt-3 border-t border-gray-200 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Pontos de interação</h4>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Habilitar pontos de interação</p>
                <p className="text-xs text-gray-500">
                  Adiciona pontos clicáveis sobre a imagem • Cada ponto exibe um texto em modal no preview.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={content.interactionEnabled || false}
                onChange={(e) => updateContent('interactionEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {content.interactionEnabled && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Gerenciar pontos ({points.length}/10)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addInteractionPoint}
                    disabled={points.length >= 10}
                    className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-50 disabled:text-gray-300 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <p className="text-xs text-gray-500">
                    Clique para adicionar um novo ponto no centro da imagem.
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Texto de cada ponto: no máximo {IMAGE_INTERACTION_POINT_TEXT_MAX_CHARS} caracteres.
                </p>
              </div>

              {points.length > 0 && (
                <div className="space-y-2">
                  {points.map((point: any, index: number) => {
                    const isActive = activePointId ? activePointId === point.id : index === 0;
                    return (
                      <div
                        key={point.id || index}
                        onClick={() =>
                          onUpdate({
                            content: {
                              ...content,
                              interactionActivePointId: point.id,
                            },
                          })
                        }
                        className={`w-full text-left border rounded-md p-2 transition-colors cursor-pointer ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-medium ${
                            hasError(`content.interactionPoints[${index}].text`)
                              ? 'text-red-600'
                              : 'text-gray-700'
                          }`}
                        >
                          Ponto {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePoint(index);
                          }}
                          className="text-xs text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                      <textarea
                        value={point.text ?? ''}
                        onChange={(e) => updatePointText(index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => {
                          e.stopPropagation();
                          onUpdate({
                            content: {
                              ...content,
                              interactionActivePointId: point.id,
                            },
                          });
                        }}
                        className={`w-full px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-1 ${
                          hasError(`content.interactionPoints[${index}].text`)
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-indigo-500'
                        }`}
                        rows={2}
                        maxLength={IMAGE_INTERACTION_POINT_TEXT_MAX_CHARS}
                        placeholder="Novo ponto de interação"
                      />
                      <p
                        className={`mt-1 text-xs text-right ${
                          (point.text ?? '').length >= IMAGE_INTERACTION_POINT_TEXT_MAX_CHARS
                            ? 'text-amber-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {(point.text ?? '').length}/{IMAGE_INTERACTION_POINT_TEXT_MAX_CHARS} caracteres
                      </p>
                      {hasError(`content.interactionPoints[${index}].text`) && (
                        <p className="mt-1 text-xs text-red-600">
                          {getErrorMessage(`content.interactionPoints[${index}].text`)}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-gray-500">
                        A posição do ponto é ajustada arrastando-o diretamente sobre a imagem.
                      </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderButtonProperties = () => (
    <div className="space-y-4">
      <div>
        <label className={`block text-sm font-medium mb-1 ${
          hasError('content.label') ? 'text-red-600' : 'text-gray-700'
        }`}>
          Texto do Botão*
        </label>
        <input
          type="text"
          value={content.label || ''}
          onChange={(e) => updateContent('label', e.target.value)}
          placeholder="Clique aqui"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            hasError('content.label')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-indigo-500'
          }`}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${
          hasError('content.url') ? 'text-red-600' : 'text-gray-700'
        }`}>
          URL do Link*
        </label>
        <input
          type="url"
          value={content.url || ''}
          onChange={(e) => updateContent('url', e.target.value)}
          placeholder="https://exemplo.com ou #"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            hasError('content.url')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-indigo-500'
          }`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Link
        </label>
        <select
          value={content.type || 'internal'}
          onChange={(e) => updateContent('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="internal">Interno</option>
          <option value="external">Externo</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tamanho
        </label>
        <select
          value={content.size || 'medium'}
          onChange={(e) => updateContent('size', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="small">Pequeno</option>
          <option value="medium">Médio</option>
          <option value="large">Grande</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Variante
        </label>
        <select
          value={content.variant || 'primary'}
          onChange={(e) => updateContent('variant', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="primary">Primário</option>
          <option value="secondary">Secundário</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>
    </div>
  );

  const renderVideoProperties = () => (
    <div className="space-y-4">
      <div>
        <label className={`block text-sm font-medium mb-1 ${
          hasError('content.url') ? 'text-red-600' : 'text-gray-700'
        }`}>
          URL do Vídeo*
        </label>
        <input
          type="url"
          value={content.url || ''}
          onChange={(e) => updateContent('url', e.target.value)}
          placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            hasError('content.url')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-indigo-500'
          }`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Vídeo
        </label>
        <select
          value={content.type || 'youtube'}
          onChange={(e) => updateContent('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="youtube">YouTube</option>
          <option value="vimeo">Vimeo</option>
          <option value="url">URL Direta</option>
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${
          hasError('content.title') ? 'text-red-600' : 'text-gray-700'
        }`}>
          Título do Vídeo*
        </label>
        <input
          type="text"
          value={content.title || ''}
          onChange={(e) => updateContent('title', e.target.value)}
          placeholder="Título do vídeo..."
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            hasError('content.title')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-indigo-500'
          }`}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${
          hasError('content.description') ? 'text-red-600' : 'text-gray-700'
        }`}>
          Descrição*
        </label>
        <textarea
          value={content.description || ''}
          onChange={(e) => updateContent('description', e.target.value)}
          placeholder="Descrição do vídeo para acessibilidade..."
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            hasError('content.description')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-indigo-500'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Importante para acessibilidade
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={content.autoplay || false}
            onChange={(e) => updateContent('autoplay', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Autoplay</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={content.controls !== false}
            onChange={(e) => updateContent('controls', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Mostrar Controles</span>
        </label>
      </div>
    </div>
  );

  const renderEmbedProperties = () => {
    const iframeCode = content.iframe || '';

    // Extrai width/height atuais do código do iframe (se houver)
    let iframeWidth = '';
    let iframeHeight = '';

    if (typeof document !== 'undefined' && iframeCode && iframeCode.includes('<iframe')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = iframeCode;
      const iframeEl = wrapper.querySelector('iframe') as HTMLIFrameElement | null;
      if (iframeEl) {
        iframeWidth = iframeEl.getAttribute('width') || (iframeEl.style.width || '');
        iframeHeight = iframeEl.getAttribute('height') || (iframeEl.style.height || '');
      }
    }

    const handleIframeChange = (value: string) => {
      updateContent('iframe', value);
    };

    const updateIframeSize = (dimension: 'width' | 'height', value: string) => {
      const code = content.iframe || '';

      if (typeof document === 'undefined') {
        updateContent('iframe', code);
        return;
      }

      const hasIframeTag = code.includes('<iframe');
      const wrapper = document.createElement('div');
      wrapper.innerHTML = hasIframeTag ? code : (code.trim() ? `<iframe src="${code.trim()}"></iframe>` : '<iframe></iframe>');

      const iframeEl = wrapper.querySelector('iframe') as HTMLIFrameElement | null;
      if (!iframeEl) {
        updateContent('iframe', code);
        return;
      }

      if (dimension === 'width') {
        if (value) {
          iframeEl.setAttribute('width', value);
        } else {
          iframeEl.removeAttribute('width');
          iframeEl.style.width = '';
        }
      } else {
        if (value) {
          iframeEl.setAttribute('height', value);
        } else {
          iframeEl.removeAttribute('height');
          iframeEl.style.height = '';
        }
      }

      const newCode = wrapper.innerHTML;
      updateContent('iframe', newCode);
    };

    return (
      <div className="space-y-4">
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              hasError('content.iframe') ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            Código do iframe*
          </label>
          <textarea
            value={content.iframe || ''}
            onChange={(e) => handleIframeChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              hasError('content.iframe')
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-indigo-500'
            }`}
            rows={5}
            placeholder='<iframe src="..."></iframe>'
          />
          <p className="mt-1 text-xs text-gray-500">
            Cole aqui o código do iframe fornecido pelo H5P ou outro serviço de embed.
          </p>
        </div>

        {/* Controles de tamanho */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Largura (width)
            </label>
            <input
              type="text"
              value={iframeWidth}
              onChange={(e) => updateIframeSize('width', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ex: 1090"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Altura (height)
            </label>
            <input
              type="text"
              value={iframeHeight}
              onChange={(e) => updateIframeSize('height', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ex: 615"
            />
          </div>
        </div>

      </div>
    );
  };

  const renderTableProperties = () => {
    const headers: string[] = content.headers || ['Coluna 1'];
    const rows: string[][] = content.rows || [['']];

    const setHeaders = (newHeaders: string[]) => updateContent('headers', newHeaders);
    const setRows = (newRows: string[][]) => updateContent('rows', newRows);

    const updateColumnCount = (count: number) => {
      if (count < 1) return;
      
      const newHeaders = [...headers];
      const newRows = rows.map(row => [...row]);
      
      if (count > headers.length) {
        // Adicionar colunas
        for (let i = headers.length; i < count; i++) {
          newHeaders.push(`Coluna ${i + 1}`);
          newRows.forEach(row => row.push(''));
        }
      } else if (count < headers.length) {
        // Remover colunas do final
        newHeaders.splice(count);
        newRows.forEach(row => row.splice(count));
      }
      
      // Atualizar ambos de uma vez
      onUpdate({
        content: {
          ...content,
          headers: newHeaders,
          rows: newRows,
        },
      });
    };

    const updateRowCount = (count: number) => {
      if (count < 1) return;
      
      const newRows = [...rows];
      
      if (count > rows.length) {
        // Adicionar linhas
        for (let i = rows.length; i < count; i++) {
          newRows.push(Array.from({ length: headers.length }, () => ''));
        }
      } else if (count < rows.length) {
        // Remover linhas do final
        newRows.splice(count);
      }
      
      // Atualizar diretamente
      onUpdate({
        content: {
          ...content,
          rows: newRows,
        },
      });
    };

    return (
      <div className="space-y-4">
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs text-indigo-800">
            💡 <strong>Dica:</strong> Configure a estrutura da tabela aqui e edite o conteúdo clicando diretamente nas células.
          </p>
        </div>

        {/* Formato */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
          <select
            value={content.format || 'basic'}
            onChange={(e) => updateContent('format', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="basic">Básico</option>
            <option value="striped">Zebrado</option>
            <option value="bordered">Com bordas</option>
          </select>
        </div>

        {/* Configurações de Bordas */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Bordas</label>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Bordas entre linhas
              </label>
              <p className="text-xs text-gray-500">Linhas horizontais</p>
            </div>
            <input
              type="checkbox"
              checked={content.borderRows !== false}
              onChange={(e) => updateContent('borderRows', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Bordas entre colunas
              </label>
              <p className="text-xs text-gray-500">Linhas verticais</p>
            </div>
            <input
              type="checkbox"
              checked={content.borderColumns !== false}
              onChange={(e) => updateContent('borderColumns', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Borda externa
              </label>
              <p className="text-xs text-gray-500">Contorno da tabela</p>
            </div>
            <input
              type="checkbox"
              checked={content.borderOuter !== false}
              onChange={(e) => updateContent('borderOuter', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Quantidade de Colunas */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quantidade de Colunas
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateColumnCount(headers.length - 1)}
              disabled={headers.length <= 1}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              min="1"
              max="10"
              value={headers.length}
              onChange={(e) => updateColumnCount(parseInt(e.target.value) || 1)}
              className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => updateColumnCount(headers.length + 1)}
              disabled={headers.length >= 10}
              className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-50 disabled:text-gray-300 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {headers.length} {headers.length === 1 ? 'coluna' : 'colunas'} (máx: 10)
          </p>
        </div>

        {/* Quantidade de Linhas */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quantidade de Linhas
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateRowCount(rows.length - 1)}
              disabled={rows.length <= 1}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              min="1"
              max="20"
              value={rows.length}
              onChange={(e) => updateRowCount(parseInt(e.target.value) || 1)}
              className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => updateRowCount(rows.length + 1)}
              disabled={rows.length >= 20}
              className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-50 disabled:text-gray-300 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {rows.length} {rows.length === 1 ? 'linha' : 'linhas'} (máx: 20)
          </p>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Como editar:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Clique nos cabeçalhos para renomear</li>
            <li>• Clique nas células para editar o conteúdo</li>
            <li>• Use Tab para navegar entre células</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderDividerProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo
        </label>
        <select
          value={content.type || 'line'}
          onChange={(e) => updateContent('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="line">Linha</option>
          <option value="space">Espaço</option>
        </select>
      </div>

      {content.type === 'line' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direção
            </label>
            <select
              value={content.direction || 'horizontal'}
              onChange={(e) => updateContent('direction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Espessura (px)
            </label>
            <input
              type="number"
              value={content.thickness || 1}
              onChange={(e) => updateContent('thickness', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor
            </label>
            <input
              type="color"
              value={content.color || '#e5e7eb'}
              onChange={(e) => updateContent('color', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Espaçamento (px)
        </label>
        <input
          type="number"
          value={content.spacing || 20}
          onChange={(e) => updateContent('spacing', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="0"
          max="100"
        />
      </div>
    </div>
  );

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('audio/')) {
        alert('Por favor, selecione um arquivo de áudio válido.');
        return;
      }

      // Validar tamanho (máximo 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 50MB');
        return;
      }

      setIsAudioLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const audioSrc = event.target.result as string;
          const audioTitle = file.name.replace(/\.[^/.]+$/, "");
          
          // Atualizar ambos os campos em uma única operação
          onUpdate({
            content: {
              ...content,
              src: audioSrc,
              title: audioTitle,
            },
          });
        }
        setIsAudioLoading(false);
      };
      reader.onerror = () => {
        alert('Erro ao carregar o arquivo de áudio.');
        setIsAudioLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderAudioProperties = () => {

    return (
      <div className="space-y-4">
        <div>
        <label className={`block text-sm font-medium mb-1 ${
          hasError('content.src') ? 'text-red-600' : 'text-gray-700'
        }`}>
          Upload de Áudio*
        </label>
          <input
            ref={audioFileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioFileUpload}
            className="hidden"
          />
          <button
            onClick={() => audioFileInputRef.current?.click()}
            disabled={isAudioLoading}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              hasError('content.src')
                ? 'bg-white text-red-700 border border-red-500 focus:ring-red-500 hover:bg-red-50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
            }`}
          >
            {isAudioLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Carregando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Selecionar Arquivo de Áudio</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Formatos suportados: MP3, WAV, OGG, M4A (máx. 50MB)
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${
            hasError('content.title') ? 'text-red-600' : 'text-gray-700'
          }`}>
            Título do Áudio*
          </label>
          <input
            type="text"
            value={content.title || ''}
            onChange={(e) => updateContent('title', e.target.value)}
            placeholder="Nome do arquivo de áudio..."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              hasError('content.title')
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-indigo-500'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Recomendado para acessibilidade
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transcript (opcional)
          </label>
          <textarea
            value={content.transcript || ''}
            onChange={(e) => updateContent('transcript', e.target.value)}
            placeholder="Transcrição completa do áudio para acessibilidade..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Importante para usuários com deficiência auditiva
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={content.controls !== false}
            onChange={(e) => updateContent('controls', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Mostrar controles do player</span>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Dicas de Acessibilidade:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Sempre forneça um título descritivo</li>
            <li>• Inclua transcript para conteúdo importante</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderTabsProperties = () => {
    const tabs = content.tabs || [
      { title: '', content: '' },
      { title: '', content: '' }
    ];
    const selectedTab = Math.min(tabsSelectedIndex, Math.max(0, tabs.length - 1));
    const setSelectedTab = setTabsSelectedIndex;

    const updateTabCount = (count: number) => {
      const currentCount = tabs.length;
      if (count < 2) return; // Mínimo 2 abas
      
      if (count > currentCount) {
        // Adicionar abas
        const newTabs = [...tabs];
        for (let i = currentCount; i < count; i++) {
          newTabs.push({
            title: '',
            content: '',
          });
        }
        updateContent('tabs', newTabs);
      } else if (count < currentCount) {
        // Remover abas do final
        const newTabs = tabs.slice(0, count);
        updateContent('tabs', newTabs);
        if (tabsSelectedIndex >= count) {
          setTabsSelectedIndex(Math.max(0, count - 1));
        }
      }
    };

    const updateTabField = (index: number, field: 'title' | 'content', value: string) => {
      const newTabs = [...tabs];
      newTabs[index] = {
        ...newTabs[index],
        [field]: value,
      };
      updateContent('tabs', newTabs);
    };

    const currentTab = tabs[selectedTab] || {};

    return (
      <div className="space-y-4">
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs text-indigo-800">
            💡 <strong>Dica:</strong> Configure a quantidade de abas aqui e edite o conteúdo clicando diretamente nas abas.
          </p>
        </div>

        {/* Configurações de Visualização */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Aparência</label>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Borda externa
              </label>
              <p className="text-xs text-gray-500">Contorno ao redor do componente</p>
            </div>
            <input
              type="checkbox"
              checked={content.borderOuter !== false}
              onChange={(e) => updateContent('borderOuter', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Quantidade de Abas */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quantidade de Abas
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateTabCount(tabs.length - 1)}
              disabled={tabs.length <= 2}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              min="2"
              max="8"
              value={tabs.length}
              onChange={(e) => updateTabCount(parseInt(e.target.value) || 2)}
              className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => updateTabCount(tabs.length + 1)}
              disabled={tabs.length >= 8}
              className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-50 disabled:text-gray-300 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {tabs.length} {tabs.length === 1 ? 'aba' : 'abas'} (mín: 2, máx: 8)
          </p>
        </div>

        {/* Seleção de Aba para Editar */}
        {tabs.length > 1 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Selecionar Aba para Editar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tabs.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedTab(index)}
                  className={`p-2 text-xs rounded-lg border transition-colors ${
                    selectedTab === index
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Aba {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Edição da Aba Selecionada */}
        {currentTab && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-700">
              Editando Aba {selectedTab + 1}
            </h4>

            {/* Título da Aba */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  hasError(`content.tabs[${selectedTab}].title`) ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                Título da Aba*
              </label>
              <input
                type="text"
                value={currentTab.title || ''}
                onChange={(e) => updateTabField(selectedTab, 'title', e.target.value)}
                placeholder="Digite o título da aba"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  hasError(`content.tabs[${selectedTab}].title`)
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
            </div>

            {/* Conteúdo da Aba */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  hasError(`content.tabs[${selectedTab}].content`) ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                Conteúdo da Aba*
              </label>
              <textarea
                value={currentTab.content || ''}
                onChange={(e) => updateTabField(selectedTab, 'content', e.target.value)}
                placeholder="Digite o conteúdo da aba"
                rows={4}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                  hasError(`content.tabs[${selectedTab}].content`)
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
            </div>
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Como editar:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Clique nos títulos das abas para renomear</li>
            <li>• Clique no conteúdo para editar</li>
            <li>• Use Enter para confirmar, Escape para cancelar</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderModalProperties = () => {
    const trigger = content.trigger || {
      type: 'button',
      content: {
        label: 'Abrir Modal',
        url: '#',
        type: 'internal',
        size: 'medium',
        variant: 'primary',
      },
    };

    const modalData = content.modalData || {
      title: 'Título do Modal',
      text: 'Conteúdo do modal...',
      hasImage: false,
      imageUrl: '',
      imageAlt: '',
    };

    const updateTrigger = (field: string, value: any) => {
      const newTrigger = {
        ...trigger,
        content: {
          ...trigger.content,
          [field]: value,
        },
      };
      updateContent('trigger', newTrigger);
    };

    const updateModalData = (field: string, value: any) => {
      updateContent('modalData', {
        ...modalData,
        [field]: value,
      });
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validar arquivo
        const validation = ValidationUtils.validateImageFile(file);
        if (!validation.isValid) {
          setModalImageUploadError(validation.error || 'Erro ao validar imagem');
          event.target.value = '';
          return;
        }

        // Limpar erro anterior
        setModalImageUploadError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
          updateModalData('imageUrl', e.target?.result);
        };
        reader.readAsDataURL(file);
      }
      event.target.value = '';
    };

    return (
      <div className="space-y-4">
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs text-indigo-800">
            💡 <strong>Dica:</strong> Configure o conteúdo do modal aqui. As mudanças aparecerão automaticamente no modal.
          </p>
        </div>

        {/* Configurações do Botão Trigger */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Botão Trigger</label>
          
          {/* Texto do Botão */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                hasError('content.trigger.content.label') ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              Texto do Botão*
            </label>
            <input
              type="text"
              value={trigger.content.label || ''}
              onChange={(e) => updateTrigger('label', e.target.value)}
              placeholder="Digite o texto do botão"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                hasError('content.trigger.content.label')
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
          </div>

          {/* Tamanho do Botão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tamanho
            </label>
            <select
              value={trigger.content.size || 'medium'}
              onChange={(e) => updateTrigger('size', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="small">Pequeno</option>
              <option value="medium">Médio</option>
              <option value="large">Grande</option>
            </select>
          </div>

          {/* Variante do Botão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estilo
            </label>
            <select
              value={trigger.content.variant || 'primary'}
              onChange={(e) => updateTrigger('variant', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="primary">Primário</option>
              <option value="secondary">Secundário</option>
              <option value="outline">Contorno</option>
            </select>
          </div>
        </div>

        {/* Conteúdo do Modal */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Conteúdo do Modal</label>
          
          {/* Título do Modal */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                hasError('content.modalData.title') ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              Título do Modal*
            </label>
            <input
              type="text"
              value={modalData.title || ''}
              onChange={(e) => updateModalData('title', e.target.value)}
              placeholder="Digite o título do modal"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                hasError('content.modalData.title')
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
          </div>

          {/* Texto do Modal */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                hasError('content.modalData.text') ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              Texto do Modal*
            </label>
            <textarea
              value={modalData.text || ''}
              onChange={(e) => updateModalData('text', e.target.value)}
              placeholder="Digite o conteúdo do modal"
              rows={4}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                hasError('content.modalData.text')
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
          </div>

          {/* Opção de Imagem */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Incluir Imagem
              </label>
              <p className="text-xs text-gray-500">Adiciona uma imagem ao modal</p>
            </div>
            <input
              type="checkbox"
              checked={modalData.hasImage || false}
              onChange={(e) => updateModalData('hasImage', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Configurações da Imagem */}
          {modalData.hasImage && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700">Configurações da Imagem</label>
              
              {/* Upload de Arquivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload de Imagem
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    modalImageUploadError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                />
                {modalImageUploadError && (
                  <p className="mt-1 text-xs text-red-600">{modalImageUploadError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Formatos: .jpg, .jpeg, .png, .gif, .webp | Tamanho máx.: 500 KB / 1024 KB (GIF)
                </p>
              </div>

              {/* URL da Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  value={modalData.imageUrl || ''}
                  onChange={(e) => updateModalData('imageUrl', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Texto Alternativo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Texto Alternativo
                </label>
                <input
                  type="text"
                  value={modalData.imageAlt || ''}
                  onChange={(e) => updateModalData('imageAlt', e.target.value)}
                  placeholder="Descrição da imagem para acessibilidade"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Preview da Imagem */}
              {modalData.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview
                  </label>
                  <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={modalData.imageUrl}
                      alt={modalData.imageAlt || 'Preview da imagem'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configurações do Modal */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Configurações do Modal</label>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Fechar com ESC
              </label>
              <p className="text-xs text-gray-500">Permite fechar o modal pressionando Escape</p>
            </div>
            <input
              type="checkbox"
              checked={content.closeOnEscape !== false}
              onChange={(e) => updateContent('closeOnEscape', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Como usar:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Configure título e texto do modal aqui</li>
            <li>• Habilite imagem para adicionar visual ao modal</li>
            <li>• Use upload ou URL para adicionar imagem</li>
            <li>• Sempre adicione texto alternativo para acessibilidade</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderAccordionProperties = () => {
    const items = content.items || [
      { title: 'Accordion 1', content: 'Conteúdo do accordion 1', isOpen: false },
      { title: 'Accordion 2', content: 'Conteúdo do accordion 2', isOpen: false }
    ];
    const selectedItem = Math.min(accordionSelectedItem, Math.max(0, items.length - 1));
    const setSelectedItem = setAccordionSelectedItem;

    const updateItemCount = (count: number) => {
      const currentCount = items.length;
      if (count < 1) return;
      
      if (count > currentCount) {
        // Adicionar itens
        const newItems = [...items];
        for (let i = currentCount; i < count; i++) {
          newItems.push({
            title: `Accordion ${i + 1}`,
            content: `Conteúdo do accordion ${i + 1}`,
            isOpen: false,
          });
        }
        updateContent('items', newItems);
      } else if (count < currentCount) {
        // Remover itens do final
        const newItems = items.slice(0, count);
        updateContent('items', newItems);
        if (accordionSelectedItem >= count) {
          setAccordionSelectedItem(Math.max(0, count - 1));
        }
      }
    };

    const updateItemField = (index: number, field: 'title' | 'content', value: string) => {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      updateContent('items', newItems);
    };

    const toggleItemOpen = (index: number) => {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        isOpen: !newItems[index].isOpen,
      };
      updateContent('items', newItems);
    };

    // Habilitar/Desabilitar imagem em todos os itens (layout semelhante ao carrossel)
    const toggleAllItemsImage = () => {
      const hasImageEnabled = items.some((item: any) => item.image);
      const newItems = items.map((item: any) =>
        hasImageEnabled
          ? { ...item, image: undefined }
          : { ...item, image: item.image || { src: '', alt: '' } }
      );
      updateContent('items', newItems);
    };

    const currentItem = items[selectedItem] || {};

    return (
      <div className="space-y-4">
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs text-indigo-800">
            💡 <strong>Dica:</strong> Configure a quantidade de itens aqui e edite o conteúdo clicando diretamente no accordion.
          </p>
        </div>

        {/* Configurações de Visualização */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Aparência</label>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Borda externa
              </label>
              <p className="text-xs text-gray-500">Contorno ao redor do componente</p>
            </div>
            <input
              type="checkbox"
              checked={content.borderOuter !== false}
              onChange={(e) => updateContent('borderOuter', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>


        {/* Quantidade de Itens */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quantidade de Itens
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateItemCount(items.length - 1)}
              disabled={items.length <= 1}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              min="1"
              max="10"
              value={items.length}
              onChange={(e) => updateItemCount(parseInt(e.target.value) || 1)}
              className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => updateItemCount(items.length + 1)}
              disabled={items.length >= 10}
              className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-50 disabled:text-gray-300 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {items.length} {items.length === 1 ? 'item' : 'itens'} (máx: 10)
          </p>
        </div>

      {/* Configuração de Imagem Global - semelhante ao carrossel */}
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold text-gray-700">Configurações de Imagem</h4>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Habilitar Imagem</p>
                <p className="text-xs text-gray-500">
                  Aplica um espaço de imagem em todos os itens • Faça upload individual em cada accordion.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={items.some((item: any) => item.image)}
                onChange={toggleAllItemsImage}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          {items.some((item: any) => item.image) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Dica:</strong> Cada item pode ter sua própria imagem. Clique em “Habilitar imagem” em um item e use o upload para definir arquivos diferentes.
              </p>
            </div>
          )}
        </div>
        {/* Seleção de Item para Editar */}
        {items.length > 1 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Selecionar Item para Editar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {items.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedItem(index)}
                  className={`p-2 text-xs rounded-lg border transition-colors ${
                    selectedItem === index
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Item {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Edição do Item Selecionado */}
        {currentItem && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">
                Editando Item {selectedItem + 1}
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Aberto:</label>
                  <input
                    type="checkbox"
                    checked={currentItem.isOpen || false}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[selectedItem] = {
                        ...newItems[selectedItem],
                        isOpen: e.target.checked,
                      };
                      updateContent('items', newItems);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
              </div>
            </div>

            {/* Título do Item */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  hasError(`content.items[${selectedItem}].title`) ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                Título do Item*
              </label>
              <input
                type="text"
                value={currentItem.title || ''}
                onChange={(e) => updateItemField(selectedItem, 'title', e.target.value)}
                placeholder="Digite o título do accordion"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  hasError(`content.items[${selectedItem}].title`)
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
            </div>

            {/* Conteúdo do Item */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  hasError(`content.items[${selectedItem}].content`) ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                Conteúdo do Item*
              </label>
              <textarea
                value={currentItem.content || ''}
                onChange={(e) => updateItemField(selectedItem, 'content', e.target.value)}
                placeholder="Digite o conteúdo do accordion"
                rows={4}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                  hasError(`content.items[${selectedItem}].content`)
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
            </div>
            
            {/* Imagem do Item (opcional, por item) */}
            {currentItem.image && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagem do Item
                </label>
                <AccordionItemImageUpload
                  itemIndex={selectedItem}
                  item={currentItem}
                  items={items}
                  updateContent={updateContent}
                  validationErrors={validationErrors}
                />
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Como editar:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Clique nos títulos para renomear</li>
            <li>• Clique no conteúdo para editar</li>
            <li>• Clique no header para expandir/colapsar</li>
            <li>• Use Enter para confirmar, Escape para cancelar</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderCarouselProperties = () => {
    const items = content.items || [];
    const selectedCard = Math.min(carouselSelectedCard, Math.max(0, items.length - 1));
    const setSelectedCard = setCarouselSelectedCard;

    const updateCardCount = (count: number) => {
      const currentCount = items.length;
      if (count < 1) return;
      
      if (count > currentCount) {
        // Adicionar cards - herdar imagem e selo se estiverem habilitados em algum card existente
        const newItems = [...items];
        const hasImageEnabled = items.some((item: any) => item.image);
        const hasBadgeEnabled = items.some((item: any) => item.badge);
        
        for (let i = currentCount; i < count; i++) {
          const newCard: any = {
            title: '',
            text: '',
          };
          
          // Herdar imagem se estiver habilitada globalmente
          if (hasImageEnabled) {
            newCard.image = { src: '', alt: '' };
          }
          
          // Herdar selo se estiver habilitado globalmente
          if (hasBadgeEnabled) {
            newCard.badge = { src: '', alt: '' };
          }
          
          newItems.push(newCard);
        }
        updateContent('items', newItems);
      } else if (count < currentCount) {
        // Remover cards do final
        const newItems = items.slice(0, count);
        updateContent('items', newItems);
        if (carouselSelectedCard >= count) {
          setCarouselSelectedCard(Math.max(0, count - 1));
        }
      }
    };

    const updateCardField = (index: number, field: string, value: any) => {
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
      updateContent('items', newItems);
    };

    const toggleAllCardsFeature = (feature: 'image' | 'badge') => {
      const newItems = [...items];
      const currentCard = items[selectedCard] || {};
      
      if (feature === 'image') {
        const shouldEnable = !currentCard.image;
        newItems.forEach((item, index) => {
          if (shouldEnable) {
            newItems[index].image = { src: '', alt: '' };
          } else {
            delete newItems[index].image;
          }
        });
      } else if (feature === 'badge') {
        const shouldEnable = !currentCard.badge;
        newItems.forEach((item, index) => {
          if (shouldEnable) {
            newItems[index].badge = { src: '', alt: '' };
          } else {
            delete newItems[index].badge;
          }
        });
      }
      updateContent('items', newItems);
    };

    const currentCard = items[selectedCard] || {};

    return (
      <div className="space-y-4">
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs text-indigo-800">
            💡 <strong>Dica:</strong> Configure a quantidade de slides e edite cada um individualmente abaixo.
          </p>
        </div>

        {/* Quantidade de Cards */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quantidade de Slides
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateCardCount(items.length - 1)}
              disabled={items.length <= 1}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              min="1"
              max="10"
              value={items.length}
              onChange={(e) => updateCardCount(parseInt(e.target.value) || 1)}
              className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => updateCardCount(items.length + 1)}
              disabled={items.length >= 10}
              className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-50 disabled:text-gray-300 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {items.length} {items.length === 1 ? 'slide' : 'slides'} no carrossel (máx: 10)
          </p>
        </div>

        {/* Seleção de Card */}
        {items.length > 1 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Selecionar Slide para Editar
            </label>
            <div className="grid grid-cols-3 gap-2">
              {items.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedCard(index)}
                  className={`p-2 text-xs rounded-lg border transition-colors ${
                    selectedCard === index
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Slide {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Edição do Card Selecionado */}
        {currentCard && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-700">
              Editando Slide {selectedCard + 1}
            </h4>

            {/* Título */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  hasError(`content.items[${selectedCard}].title`) ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                Título*
              </label>
              <input
                type="text"
                value={currentCard.title || ''}
                onChange={(e) => updateCardField(selectedCard, 'title', e.target.value)}
                placeholder="Digite o título do slide"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  hasError(`content.items[${selectedCard}].title`)
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
            </div>

            {/* Texto */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  hasError(`content.items[${selectedCard}].text`) ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                Texto*
              </label>
              <textarea
                value={currentCard.text || ''}
                onChange={(e) => updateCardField(selectedCard, 'text', e.target.value)}
                placeholder="Digite o conteúdo do slide"
                rows={3}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                  hasError(`content.items[${selectedCard}].text`)
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
            </div>

          </div>
        )}

        {/* Configurações Globais */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-700">Configurações Globais</h4>
          
          {/* Configuração de Imagem Global */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Habilitar Imagem</p>
                <p className="text-xs text-gray-500">Aplica a todos os cards • Clique na imagem para configurar</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={items.some((item: any) => item.image)}
                onChange={() => toggleAllCardsFeature('image')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Configuração de Selo Global - só exibe quando Habilitar Imagem estiver ativado */}
          {items.some((item: any) => item.image) && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Habilitar Selo</p>
                <p className="text-xs text-gray-500">Aplica a todos os cards • Clique no selo de cada card para configurar individualmente</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={items.some((item: any) => item.badge)}
                onChange={() => toggleAllCardsFeature('badge')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          )}
          
          {items.some((item: any) => item.badge) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Dica:</strong> Cada card pode ter seu próprio selo. Clique no selo de cada card para fazer upload de uma imagem diferente.
              </p>
            </div>
          )}
        </div>

        {/* Configurações de Visualização */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-700">Configurações de Exibição</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Mostrar Setas
              </label>
              <p className="text-xs text-gray-500">Botões de navegação</p>
            </div>
            <input
              type="checkbox"
              checked={content.showArrows !== false}
              onChange={(e) => updateContent('showArrows', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Mostrar Indicadores
              </label>
              <p className="text-xs text-gray-500">Pontos de navegação</p>
            </div>
            <input
              type="checkbox"
              checked={content.showDots !== false}
              onChange={(e) => updateContent('showDots', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    );
  };

  // Funções de renderização dos componentes de Quiz
  const renderQuizMultipleChoiceProperties = () => {
    const alternatives = content.alternatives || [];
    const feedbacks = content.feedbacks || [];

    const addAlternative = () => {
      const newAlternatives = [...alternatives, { text: `Alternativa ${alternatives.length + 1}`, isCorrect: false }];
      updateContent('alternatives', newAlternatives);
    };

    const updateAlternative = (index: number, field: string, value: any) => {
      const newAlternatives = [...alternatives];
      newAlternatives[index] = { ...newAlternatives[index], [field]: value };
      updateContent('alternatives', newAlternatives);
    };

    const removeAlternative = (index: number) => {
      if (alternatives.length <= 2) return;
      const newAlternatives = alternatives.filter((_: any, i: number) => i !== index);
      updateContent('alternatives', newAlternatives);
    };

    const updateFeedback = (index: number, field: string, value: any) => {
      const newFeedbacks = [...feedbacks];
      newFeedbacks[index] = { ...newFeedbacks[index], [field]: value };
      updateContent('feedbacks', newFeedbacks);
    };

    return (
      <div className="space-y-6">
        {/* Pergunta */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  hasError('content.question') ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                Pergunta*
              </label>
              <textarea
                value={content.question || ''}
                onChange={(e) => updateContent('question', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  hasError('content.question')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
                rows={3}
                placeholder="Digite a pergunta..."
              />
            </div>

        {/* Alternativas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Alternativas
            </label>
            <button
              onClick={addAlternative}
              className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200"
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {alternatives.map((alt: any, index: number) => (
              <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={alt.isCorrect}
                  onChange={(e) => updateAlternative(index, 'isCorrect', e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={alt.text}
                  onChange={(e) => updateAlternative(index, 'text', e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder={`Alternativa ${index + 1}`}
                />
                {alternatives.length > 2 && (
                  <button
                    onClick={() => removeAlternative(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedbacks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedbacks
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Resposta Incorreta</label>
              <textarea
                value={feedbacks[0]?.text || ''}
                onChange={(e) => updateFeedback(0, 'text', e.target.value.slice(0, 500))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                placeholder="Feedback para resposta incorreta"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {(feedbacks[0]?.text || '').length}/500 caracteres
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Resposta Correta</label>
              <textarea
                value={feedbacks[1]?.text || ''}
                onChange={(e) => updateFeedback(1, 'text', e.target.value.slice(0, 500))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                placeholder="Feedback para resposta correta"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {(feedbacks[1]?.text || '').length}/500 caracteres
              </p>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Mostrar Feedback
              </label>
              <p className="text-xs text-gray-500">Exibir feedback após resposta</p>
            </div>
            <input
              type="checkbox"
              checked={content.showFeedback !== false}
              onChange={(e) => updateContent('showFeedback', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderQuizTrueFalseProperties = () => {
    const feedbacks = content.feedbacks || [];
    const perguntaHasError = hasError('content.question');
    const perguntaErrorMessage = validationErrors.find(
      (err) => err.field === 'content.question'
    )?.message;
    const respostaCorretaHasError = hasError('content.correctAnswer');
    const respostaCorretaErrorMessage = validationErrors.find(
      (err) => err.field === 'content.correctAnswer'
    )?.message;

    const updateFeedback = (index: number, field: string, value: any) => {
      const newFeedbacks = [...feedbacks];
      newFeedbacks[index] = { ...newFeedbacks[index], [field]: value };
      updateContent('feedbacks', newFeedbacks);
    };

    return (
      <div className="space-y-6">
        {/* Pergunta */}
        <div>
        <label className={`block text-sm font-medium mb-2 ${
          perguntaHasError ? 'text-red-600' : 'text-gray-700'
        }`}>
          Pergunta*
        </label>
        <textarea
          value={content.question || ''}
          onChange={(e) => updateContent('question', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            perguntaHasError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-indigo-500'
          }`}
          rows={3}
          placeholder="Digite a pergunta..."
        />
        {perguntaHasError && perguntaErrorMessage && (
          <p className="mt-1 text-xs text-red-600">{perguntaErrorMessage}</p>
        )}
        </div>

        {/* Resposta Correta */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            respostaCorretaHasError ? 'text-red-600' : 'text-gray-700'
          }`}>
            Resposta Correta*
          </label>
          <div
            className={`flex space-x-4 rounded-lg p-1 ${
              respostaCorretaHasError
                ? 'ring-2 ring-red-500 ring-offset-1 bg-red-50/50'
                : ''
            }`}
          >
            <button
              type="button"
              onClick={() => updateContent('correctAnswer', true)}
              className={`px-4 py-2 rounded-lg border-2 font-medium ${
                content.correctAnswer === true
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : respostaCorretaHasError
                  ? 'border-red-300 text-gray-700 hover:bg-gray-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Verdadeiro
            </button>
            <button
              type="button"
              onClick={() => updateContent('correctAnswer', false)}
              className={`px-4 py-2 rounded-lg border-2 font-medium ${
                content.correctAnswer === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : respostaCorretaHasError
                  ? 'border-red-300 text-gray-700 hover:bg-gray-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Falso
            </button>
          </div>
          {respostaCorretaHasError && respostaCorretaErrorMessage && (
            <p className="mt-1 text-xs text-red-600">{respostaCorretaErrorMessage}</p>
          )}
        </div>

        {/* Feedbacks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedbacks
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Resposta Incorreta</label>
              <textarea
                value={feedbacks[0]?.text || ''}
                onChange={(e) => updateFeedback(0, 'text', e.target.value.slice(0, 500))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                placeholder="Feedback para resposta incorreta"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {(feedbacks[0]?.text || '').length}/500 caracteres
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Resposta Correta</label>
              <textarea
                value={feedbacks[1]?.text || ''}
                onChange={(e) => updateFeedback(1, 'text', e.target.value.slice(0, 500))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                placeholder="Feedback para resposta correta"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {(feedbacks[1]?.text || '').length}/500 caracteres
              </p>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Mostrar Feedback
              </label>
              <p className="text-xs text-gray-500">Exibir feedback após resposta</p>
            </div>
            <input
              type="checkbox"
              checked={content.showFeedback !== false}
              onChange={(e) => updateContent('showFeedback', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderQuizEnumerationProperties = () => {
    const items = content.items || [];
    const feedbacks = content.feedbacks || [];

    const addItem = () => {
      const newItems = [...items, `Item ${items.length + 1}`];
      updateContent('items', newItems);
    };

    const updateItem = (index: number, value: string) => {
      const newItems = [...items];
      newItems[index] = value;
      updateContent('items', newItems);
    };

    const removeItem = (index: number) => {
      if (items.length <= 1) return;
      const newItems = items.filter((_: any, i: number) => i !== index);
      updateContent('items', newItems);
    };

    const updateFeedback = (index: number, field: string, value: any) => {
      const newFeedbacks = [...feedbacks];
      newFeedbacks[index] = { ...newFeedbacks[index], [field]: value };
      updateContent('feedbacks', newFeedbacks);
    };

    return (
      <div className="space-y-6">
        {/* Pergunta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pergunta*
          </label>
          <textarea
            value={content.question || ''}
            onChange={(e) => updateContent('question', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Digite a pergunta..."
          />
        </div>

        {/* Itens para Enumeração */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Itens para Enumeração*
            </label>
            <button
              onClick={addItem}
              className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200"
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item: string, index: number) => (
              <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder={`Item ${index + 1}`}
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedbacks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedbacks
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Resposta Incorreta</label>
              <textarea
                value={feedbacks[0]?.text || ''}
                onChange={(e) => updateFeedback(0, 'text', e.target.value.slice(0, 500))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                placeholder="Feedback para resposta incorreta"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {(feedbacks[0]?.text || '').length}/500 caracteres
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Resposta Correta</label>
              <textarea
                value={feedbacks[1]?.text || ''}
                onChange={(e) => updateFeedback(1, 'text', e.target.value.slice(0, 500))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                placeholder="Feedback para resposta correta"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {(feedbacks[1]?.text || '').length}/500 caracteres
              </p>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Mostrar Feedback
              </label>
              <p className="text-xs text-gray-500">Exibir feedback após resposta</p>
            </div>
            <input
              type="checkbox"
              checked={content.showFeedback !== false}
              onChange={(e) => updateContent('showFeedback', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderQuizEssayProperties = () => {
    return (
      <div className="space-y-6">
        {/* Pergunta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pergunta*
          </label>
          <textarea
            value={content.question || ''}
            onChange={(e) => updateContent('question', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Digite a pergunta..."
          />
        </div>

        {/* Limites de Palavras */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Limites de Palavras
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Mínimo</label>
              <input
                type="number"
                value={content.minWords || 50}
                onChange={(e) => updateContent('minWords', parseInt(e.target.value) || 50)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Máximo</label>
              <input
                type="number"
                value={content.maxWords || 500}
                onChange={(e) => updateContent('maxWords', parseInt(e.target.value) || 500)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
          </div>
        </div>

        

        {/* Configurações */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Mostrar Contador
              </label>
              <p className="text-xs text-gray-500">Exibir contador de palavras</p>
            </div>
            <input
              type="checkbox"
              checked={content.showWordCount !== false}
              onChange={(e) => updateContent('showWordCount', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDefaultProperties = () => (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Este componente ainda está em desenvolvimento. 
          As propriedades específicas serão implementadas em breve.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo do Componente
        </label>
        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          {getBlockName()}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID do Bloco
        </label>
        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
          {block.id}
        </p>
      </div>
    </div>
  );

  const renderPropertiesByType = () => {
    switch (type) {
      case 'heading':
        return renderHeadingProperties();
      case 'text':
        return renderTextProperties();
      case 'badge':
        return renderBadgeProperties();
      case 'image':
        return renderImageProperties();
      case 'button':
        return renderButtonProperties();
      case 'video':
        return renderVideoProperties();
      case 'divider':
        return renderDividerProperties();
      case 'audio':
        return renderAudioProperties();
      case 'table':
        return renderTableProperties();
      case 'tabs':
        return renderTabsProperties();
      case 'carousel':
        return renderCarouselProperties();
      case 'accordion':
        return renderAccordionProperties();
      case 'modal':
        return renderModalProperties();
      case 'embed':
        return renderEmbedProperties();
      case 'quiz-multiple-choice':
        return renderQuizMultipleChoiceProperties();
      case 'quiz-true-false':
        return renderQuizTrueFalseProperties();
      case 'quiz-enumeration':
        return renderQuizEnumerationProperties();
      case 'quiz-essay':
        return renderQuizEssayProperties();
      default:
        return renderDefaultProperties();
    }
  };

  // Se estiver em modo preview, não renderizar o painel
  if (isPreview) {
    return null;
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-indigo-600">
            {getBlockIcon()}
          </div>
          <h3 className="font-semibold text-gray-900">{getBlockName()}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        {renderPropertiesByType()}
      </div>
    </div>
  );
};

export default PropertyPanel;
