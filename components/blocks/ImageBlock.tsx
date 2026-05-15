import React, { useState, useRef, useCallback } from 'react';
import { ImageBlockProps } from '@/types/builder';

interface ImageBlockComponentProps {
  block: { props: ImageBlockProps };
  isSelected?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<ImageBlockProps>) => void;
  onSelect?: () => void;
}

type InteractionPoint = NonNullable<ImageBlockProps['content']['interactionPoints']>[number];

const DRAG_THRESHOLD_PX = 6;

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function InteractionPointTextDialog({
  point,
  onClose,
}: {
  point: InteractionPoint;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interaction-point-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="interaction-point-dialog-title" className="text-base font-semibold text-gray-900">
          Ponto de interação
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
          {(point.text || '').trim() ? point.text : 'Nenhum texto foi configurado para este ponto no painel de propriedades.'}
        </p>
        <button
          type="button"
          className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

function InteractionPointsLayer({
  points,
  activePointId,
  editable,
  onDragPoint,
  onSelectPoint,
  onOpenPointText,
}: {
  points: InteractionPoint[];
  activePointId?: string;
  editable: boolean;
  onDragPoint?: (pointId: string, clientX: number, clientY: number) => void;
  onSelectPoint?: (pointId: string) => void;
  onOpenPointText: (point: InteractionPoint) => void;
}) {
  if (points.length === 0) return null;

  return (
    <>
      {points.map((point, index) => {
        const isActive = activePointId ? point.id === activePointId : index === 0;

        if (!editable) {
          return (
            <button
              key={point.id}
              type="button"
              title="Ver texto do ponto"
              className={`absolute z-20 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                isActive
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenPointText(point);
              }}
              aria-label={`Abrir texto do ponto ${index + 1}`}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          );
        }

        return (
          <InteractionPointMarkerEditable
            key={point.id}
            point={point}
            index={index}
            isActive={isActive}
            onDragPoint={onDragPoint}
            onSelectPoint={onSelectPoint}
            onOpenPointText={onOpenPointText}
          />
        );
      })}
    </>
  );
}

function InteractionPointMarkerEditable({
  point,
  index,
  isActive,
  onDragPoint,
  onSelectPoint,
  onOpenPointText,
}: {
  point: InteractionPoint;
  index: number;
  isActive: boolean;
  onDragPoint?: (pointId: string, clientX: number, clientY: number) => void;
  onSelectPoint?: (pointId: string) => void;
  onOpenPointText: (point: InteractionPoint) => void;
}) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  return (
    <button
      type="button"
      title="Toque para ver o texto • Arraste para mover"
      className={`absolute z-20 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-1 ${
        isActive
          ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1'
          : 'bg-indigo-500 text-white hover:bg-indigo-600'
      } cursor-grab active:cursor-grabbing touch-none`}
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
      onPointerDown={(e) => {
        if (!onDragPoint) return;
        e.preventDefault();
        e.stopPropagation();
        startRef.current = { x: e.clientX, y: e.clientY };
        movedRef.current = false;
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        onSelectPoint?.(point.id);
      }}
      onPointerMove={(e) => {
        if (!onDragPoint) return;
        const btn = e.currentTarget as HTMLButtonElement;
        if (!btn.hasPointerCapture(e.pointerId)) return;
        const st = startRef.current;
        if (st) {
          if (
            Math.abs(e.clientX - st.x) > DRAG_THRESHOLD_PX ||
            Math.abs(e.clientY - st.y) > DRAG_THRESHOLD_PX
          ) {
            movedRef.current = true;
          }
        }
        if (movedRef.current) {
          e.preventDefault();
          onDragPoint(point.id, e.clientX, e.clientY);
        }
      }}
      onPointerUp={(e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        if (btn.hasPointerCapture(e.pointerId)) {
          btn.releasePointerCapture(e.pointerId);
        }
        if (!movedRef.current) {
          onSelectPoint?.(point.id);
          onOpenPointText(point);
        }
        startRef.current = null;
        movedRef.current = false;
      }}
      onPointerCancel={(e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        if (btn.hasPointerCapture(e.pointerId)) {
          btn.releasePointerCapture(e.pointerId);
        }
        startRef.current = null;
        movedRef.current = false;
      }}
      aria-label={`Ponto de interação ${index + 1}`}
    >
      <PlusIcon className="h-4 w-4" />
    </button>
  );
}

const ImageBlock: React.FC<ImageBlockComponentProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onSelect,
}) => {
  const { content, style } = block.props;
  const { src, alt, width, height, lazyLoad } = content;
  const interactionEnabled = content.interactionEnabled ?? false;
  const interactionPoints = content.interactionPoints ?? [];
  const activePointId = content.interactionActivePointId;

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dialogPoint, setDialogPoint] = useState<InteractionPoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const imageStyle: React.CSSProperties = {
    width: width != null && width > 0 ? `${width}px` : '100%',
    height: height != null && height > 0 ? `${height}px` : 'fit-content',
    maxWidth: '100%',
    borderRadius: style?.effects?.borderRadius ? `${style.effects.borderRadius}px` : undefined,
    boxShadow: style?.effects?.shadow,
    opacity: style?.effects?.opacity,
  };

  const commitPointPosition = useCallback(
    (pointId: string, clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el || !onUpdate) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      const c = contentRef.current;
      const pts = c.interactionPoints ?? [];
      const next = pts.map((p) => (p.id === pointId ? { ...p, x, y } : p));
      onUpdate({ content: { ...c, interactionPoints: next } });
    },
    [onUpdate]
  );

  const handleSelectPoint = useCallback(
    (pointId: string) => {
      if (!onUpdate) return;
      const c = contentRef.current;
      onUpdate({
        content: {
          ...c,
          interactionActivePointId: pointId,
        },
      });
    },
    [onUpdate]
  );

  const openPointText = useCallback((point: InteractionPoint) => {
    setDialogPoint(point);
  }, []);

  const renderInteractionOverlay = (editable: boolean) => {
    if (!interactionEnabled || interactionPoints.length === 0) return null;
    return (
      <InteractionPointsLayer
        points={interactionPoints}
        activePointId={activePointId}
        editable={editable}
        onDragPoint={editable ? commitPointPosition : undefined}
        onSelectPoint={editable ? handleSelectPoint : undefined}
        onOpenPointText={openPointText}
      />
    );
  };

  const dialog = dialogPoint ? (
    <InteractionPointTextDialog point={dialogPoint} onClose={() => setDialogPoint(null)} />
  ) : null;

  if (isEditing) {
    return (
      <>
        <div
          className={`relative group w-full ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
          onClick={onSelect}
        >
          <div ref={containerRef} className="relative w-full max-w-full">
            {src && !imageError ? (
              <img
                src={src}
                alt={alt}
                style={imageStyle}
                className="block"
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading={lazyLoad ? 'lazy' : 'eager'}
                draggable={false}
              />
            ) : (
              <div
                className="flex w-full items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500"
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

            {renderInteractionOverlay(
              Boolean(
                onUpdate &&
                  interactionEnabled &&
                  interactionPoints.length > 0 &&
                  !(src && imageError)
              )
            )}

            {src && !imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}

            {!alt && isSelected && (
              <div className="absolute bottom-2 left-2 right-2 bg-yellow-100 border border-yellow-300 rounded p-2 z-10">
                <p className="text-xs text-yellow-800">
                  ⚠️ Texto alternativo é obrigatório para acessibilidade
                </p>
              </div>
            )}
          </div>
        </div>
        {dialog}
      </>
    );
  }

  if (!src || imageError) {
    return (
      <>
        <div
          className={`flex w-full items-center justify-center bg-gray-100 border border-gray-300 text-gray-500 ${
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
        {dialog}
      </>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`relative w-full max-w-full ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        onClick={onSelect}
      >
        <img
          src={src}
          alt={alt}
          style={imageStyle}
          className="block"
          loading={lazyLoad ? 'lazy' : 'eager'}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
        {renderInteractionOverlay(false)}
      </div>
      {dialog}
    </>
  );
};

export default ImageBlock;
