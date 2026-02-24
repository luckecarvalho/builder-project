'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useBuilder } from '@/hooks/useBuilder';
import { getBlockComponent, getBlocksByCategory, getBlockCategories } from '@/components/blocks/BlockRegistry';
import { BlockProps } from '@/types/builder';
import PropertyPanel from './PropertyPanel';
import TextFormattingToolbar from './TextFormattingToolbar';
import { 
  Plus, Settings, Eye, Edit3, Save, Undo, Redo, Trash2, 
  Grid3X3, GripVertical, ChevronDown, ChevronUp, Copy, Move,
  Monitor, Smartphone, Tablet, RotateCcw, X, Check,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ArrowDown
} from 'lucide-react';

interface BuilderProps {
  initialPage?: any;
}

const Builder: React.FC<BuilderProps> = ({ initialPage }) => {
  const builder = useBuilder(initialPage);
  const [isPreview, setIsPreview] = useState(false);
  const [showBlockPalette, setShowBlockPalette] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('texto');
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showComponentDropdown, setShowComponentDropdown] = useState<{rowId: string, columnId: string} | null>(null);
  const [showAlignmentDropdown, setShowAlignmentDropdown] = useState<{rowId: string, columnId: string} | null>(null);
  const [showBlockAlignmentDropdown, setShowBlockAlignmentDropdown] = useState<{rowId: string, columnId: string, blockId: string} | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [resizeStartY, setResizeStartY] = useState<number>(0);
  const [resizeStartHeight, setResizeStartHeight] = useState<number>(0);
  const [showResizeTooltip, setShowResizeTooltip] = useState<string | null>(null);
  const [responsiveMode, setResponsiveMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Estado global para a toolbar de formatação
  const [globalFormattingToolbar, setGlobalFormattingToolbar] = useState<{
    isVisible: boolean;
    onFormatChange: (format: string, value: any) => void;
    onClose: () => void;
    currentFormats: any;
  } | null>(null);

  // Listener para detectar quando o foco sai de campos de texto
  React.useEffect(() => {
    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      // Se o foco sair de um input ou textarea, ocultar a toolbar
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && globalFormattingToolbar) {
        setTimeout(() => {
          // Verificar se o novo foco não é outro campo de texto
          const activeElement = document.activeElement as HTMLElement;
          if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
            setGlobalFormattingToolbar(null);
          }
        }, 100);
      }
    };

    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [globalFormattingToolbar]);

  // Listener para fechar dropdown de alinhamento ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Verificar se o clique foi fora do dropdown de alinhamento da coluna
      if (showAlignmentDropdown && !target.closest('.alignment-dropdown-container')) {
        setShowAlignmentDropdown(null);
      }
      // Verificar se o clique foi fora do dropdown de alinhamento do bloco
      // Não fechar se estiver sobre o dropdown ou sobre o bloco que tem o dropdown aberto
      if (showBlockAlignmentDropdown) {
        const isInsideDropdown = target.closest('.block-alignment-dropdown-container') || 
                                 target.closest('.block-alignment-dropdown');
        const currentBlockId = showBlockAlignmentDropdown.blockId;
        const currentBlockElement = document.querySelector(`[data-block-id="${currentBlockId}"]`);
        const isInsideCurrentBlock = currentBlockElement && currentBlockElement.contains(target);
        const isInsideBlockControls = target.closest('.block-controls-container');
        
        // Só fechar se não estiver sobre nenhum elemento relacionado ao bloco com dropdown aberto
        if (!isInsideDropdown && !isInsideCurrentBlock && !isInsideBlockControls) {
          setShowBlockAlignmentDropdown(null);
        }
      }
    };

    if (showAlignmentDropdown || showBlockAlignmentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAlignmentDropdown, showBlockAlignmentDropdown]);

  const categories = getBlockCategories();
  const blocks = getBlocksByCategory(selectedCategory);
  
  // Lista de blocos para o dropdown (baseada no registry), ordenada alfabeticamente
  const allBlocks = getBlockCategories()
    .flatMap(cat =>
      getBlocksByCategory(cat).map(m => ({
        type: m.type,
        name: m.name,
        description: m.description,
        icon: m.icon,
      }))
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const handleDragStart = (e: React.DragEvent, blockType: string) => {
    e.dataTransfer.setData('text/plain', blockType);
    e.dataTransfer.effectAllowed = 'copy';
    builder.setDraggedBlock(blockType);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, rowId: string, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const blockType = e.dataTransfer.getData('text/plain');
    const draggedBlockId = e.dataTransfer.getData('application/block-id');
    const draggedRowId = e.dataTransfer.getData('application/row-id');
    const draggedColumnId = e.dataTransfer.getData('application/column-id');
    
    if (draggedBlockId && draggedRowId && draggedColumnId) {
      // Drag and drop de bloco existente
      const targetRow = builder.page.rows.find(r => r.id === rowId);
      const targetColumn = targetRow?.columns.find(c => c.id === columnId);
      const sourceRow = builder.page.rows.find(r => r.id === draggedRowId);
      const sourceColumn = sourceRow?.columns.find(c => c.id === draggedColumnId);
      const draggedBlock = sourceColumn?.blocks.find(b => b.props.id === draggedBlockId);

      if (draggedBlock && targetColumn && sourceColumn) {
        // Se está na mesma coluna, não fazer nada (já foi tratado no handleBlockDrop)
        if (draggedRowId === rowId && draggedColumnId === columnId) {
          // Já foi tratado no handleBlockDrop
        } else {
          // Mover entre colunas/linhas diferentes - adicionar no final da coluna destino
          const sourceNewBlocks = sourceColumn.blocks.filter(b => b.props.id !== draggedBlockId);
          builder.updateColumn(draggedRowId, draggedColumnId, { blocks: sourceNewBlocks });
          
          const targetNewBlocks = [...targetColumn.blocks, draggedBlock];
          builder.updateColumn(rowId, columnId, { blocks: targetNewBlocks });
        }
      }
      setDraggedBlockId(null);
      setDragOverBlockId(null);
    } else if (blockType) {
      // Adicionar novo bloco
      builder.addBlock(rowId, columnId, blockType);
    }
    setDragOverColumn(null);
    builder.setDraggedBlock(null);
  };

  const handleBlockDragStart = (e: React.DragEvent, blockId: string, rowId: string, columnId: string) => {
    e.dataTransfer.setData('application/block-id', blockId);
    e.dataTransfer.setData('application/row-id', rowId);
    e.dataTransfer.setData('application/column-id', columnId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedBlockId(blockId);
  };

  const handleRowDragStart = (e: React.DragEvent, rowId: string) => {
    e.dataTransfer.setData('application/row-id', rowId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedRowId(rowId);
  };

  const handleRowDragOver = (e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedRowId && draggedRowId !== rowId) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverRowId(rowId);
    }
  };

  const handleRowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Não limpar dragOverRowId aqui para manter o feedback visual
  };

  const handleRowDrop = (e: React.DragEvent, targetRowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedRowIdFromData = e.dataTransfer.getData('application/row-id');
    
    if (!draggedRowIdFromData || draggedRowIdFromData === targetRowId) {
      setDraggedRowId(null);
      setDragOverRowId(null);
      return;
    }

    const draggedIndex = builder.page.rows.findIndex(r => r.id === draggedRowIdFromData);
    const targetIndex = builder.page.rows.findIndex(r => r.id === targetRowId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newRows = [...builder.page.rows];
      const [removed] = newRows.splice(draggedIndex, 1);
      newRows.splice(targetIndex, 0, removed);
      
      builder.updatePage({ ...builder.page, rows: newRows });
    }
    
    setDraggedRowId(null);
    setDragOverRowId(null);
  };

  const handleBlockDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedBlockId && draggedBlockId !== blockId) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverBlockId(blockId);
    }
  };

  const handleBlockDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Não limpar dragOverBlockId aqui para manter o feedback visual
  };

  const handleBlockDrop = (e: React.DragEvent, rowId: string, columnId: string, targetBlockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedBlockIdFromData = e.dataTransfer.getData('application/block-id');
    const draggedRowId = e.dataTransfer.getData('application/row-id');
    const draggedColumnId = e.dataTransfer.getData('application/column-id');
    
    if (!draggedBlockIdFromData || draggedBlockIdFromData === targetBlockId) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    // Encontrar o bloco sendo arrastado
    const sourceRow = builder.page.rows.find(r => r.id === draggedRowId);
    const sourceColumn = sourceRow?.columns.find(c => c.id === draggedColumnId);
    const draggedBlock = sourceColumn?.blocks.find(b => b.props.id === draggedBlockIdFromData);

    if (!draggedBlock) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    // Se está na mesma coluna, apenas reordenar
    if (draggedRowId === rowId && draggedColumnId === columnId) {
      const column = sourceColumn;
      if (column) {
        const draggedIndex = column.blocks.findIndex(b => b.props.id === draggedBlockIdFromData);
        const targetIndex = column.blocks.findIndex(b => b.props.id === targetBlockId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newBlocks = [...column.blocks];
          const [removed] = newBlocks.splice(draggedIndex, 1);
          newBlocks.splice(targetIndex, 0, removed);
          
          builder.updateColumn(rowId, columnId, { blocks: newBlocks });
        }
      }
    } else {
      // Mover entre colunas/linhas diferentes
      const targetRow = builder.page.rows.find(r => r.id === rowId);
      const targetColumn = targetRow?.columns.find(c => c.id === columnId);
      
      if (targetColumn) {
        // Remover da origem
        const sourceNewBlocks = sourceColumn!.blocks.filter(b => b.props.id !== draggedBlockIdFromData);
        builder.updateColumn(draggedRowId, draggedColumnId, { blocks: sourceNewBlocks });
        
        // Adicionar no destino
        const targetIndex = targetColumn.blocks.findIndex(b => b.props.id === targetBlockId);
        const targetNewBlocks = [...targetColumn.blocks];
        targetNewBlocks.splice(targetIndex, 0, draggedBlock);
        
        builder.updateColumn(rowId, columnId, { blocks: targetNewBlocks });
      }
    }
    
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  const handleAddBlockFromDropdown = (blockType: string, rowId: string, columnId: string) => {
    builder.addBlock(rowId, columnId, blockType);
    setShowComponentDropdown(null);
  };

  // Refs para armazenar valores durante o redimensionamento
  const resizeStartYRef = React.useRef<number>(0);
  const resizeStartHeightRef = React.useRef<number>(0);
  const resizingBlockIdRef = React.useRef<string | null>(null);

  // Handlers para redimensionamento de blocos
  const handleResizeStart = (e: React.MouseEvent, blockId: string, currentHeight: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startHeight = currentHeight || 40;
    
    resizingBlockIdRef.current = blockId;
    resizeStartYRef.current = startY;
    resizeStartHeightRef.current = startHeight;
    
    setResizingBlockId(blockId);
    setResizeStartY(startY);
    setResizeStartHeight(startHeight);
  };

  React.useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!resizingBlockIdRef.current) return;
      
      const deltaY = e.clientY - resizeStartYRef.current;
      const newHeight = Math.max(40, resizeStartHeightRef.current + deltaY);
      
      // Encontrar o bloco e atualizar
      const row = builder.page.rows.find(r => 
        r.columns.some(col => col.blocks.some(b => b.props.id === resizingBlockIdRef.current))
      );
      const column = row?.columns.find(col => 
        col.blocks.some(b => b.props.id === resizingBlockIdRef.current)
      );
      
      if (row && column && resizingBlockIdRef.current) {
        const currentBlock = builder.page.rows
          .find(r => r.id === row.id)
          ?.columns.find(c => c.id === column.id)
          ?.blocks.find(b => b.props.id === resizingBlockIdRef.current);
        
        if (currentBlock) {
          builder.updateBlock(row.id, column.id, resizingBlockIdRef.current, {
            layout: {
              ...currentBlock.props.layout,
              minHeight: newHeight
            }
          });
        }
      }
    };

    const handleResizeEnd = () => {
      resizingBlockIdRef.current = null;
      resizeStartYRef.current = 0;
      resizeStartHeightRef.current = 0;
      setResizingBlockId(null);
      setResizeStartY(0);
      setResizeStartHeight(0);
    };

    if (resizingBlockId) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizingBlockId, builder]);

  const renderBlock = (block: any) => {
    const BlockComponent = getBlockComponent(block.props.type);
    if (!BlockComponent) {
      return (
        <div className="p-4 border-2 border-dashed border-red-300 rounded-lg text-center text-red-500">
          <p>Bloco não encontrado: {block.props.type}</p>
        </div>
      );
    }

    return (
      <BlockComponent
        block={block}
        isSelected={!isPreview && builder.selectedBlock === block.props.id}
        isEditing={!isPreview}
        onUpdate={(updates: Partial<BlockProps>) => {
          const rowId = builder.page.rows.find(row => 
            row.columns.some(col => col.blocks.some(b => b.props.id === block.props.id))
          )?.id;
          const columnId = builder.page.rows
            .find(row => row.id === rowId)
            ?.columns.find(col => col.blocks.some(b => b.props.id === block.props.id))?.id;
          
          if (rowId && columnId) {
            builder.updateBlock(rowId, columnId, block.props.id, updates);
          }
        }}
        onSelect={() => builder.selectBlock(block.props.id)}
        globalFormattingToolbar={{
          show: setGlobalFormattingToolbar,
          hide: () => setGlobalFormattingToolbar(null)
        }}
      />
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Builder Flexível</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {builder.page.metadata.title}
            </span>
            {builder.isDirty && (
              <span className="text-xs text-orange-500">• Não salvo</span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              responsiveMode === 'desktop' 
                ? 'bg-blue-100 text-blue-700' 
                : responsiveMode === 'tablet' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {responsiveMode === 'desktop' ? 'Desktop' : responsiveMode === 'tablet' ? 'Tablet' : 'Mobile'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Controles de visualização responsiva */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button 
              onClick={() => setResponsiveMode('desktop')}
              className={`p-2 border-r border-gray-200 transition-colors ${
                responsiveMode === 'desktop'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Visualização Desktop (1200px+)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setResponsiveMode('tablet')}
              className={`p-2 border-r border-gray-200 transition-colors ${
                responsiveMode === 'tablet'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Visualização Tablet (768px - 1199px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setResponsiveMode('mobile')}
              className={`p-2 transition-colors ${
                responsiveMode === 'mobile'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Visualização Mobile (até 767px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Modo preview */}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPreview
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>

          {/* Controles de histórico */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={builder.undo}
              disabled={!builder.canUndo()}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-200"
            >
              <Undo className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={builder.redo}
              disabled={!builder.canRedo()}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Redo className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Salvar */}
          <button
            onClick={builder.savePage}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
      </header>

     

      <div className="flex flex-1 overflow-hidden">
        {/* Paleta de Blocos - Só aparece quando não estiver em preview */}
        {showBlockPalette && !isPreview && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col z-1">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Blocos</h2>
                <button
                  onClick={() => setShowBlockPalette(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Categorias */}
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Blocos */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {blocks.map(block => (
                  <div
                    key={block.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, block.type)}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-move transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{block.name}</h3>
                      <p className="text-xs text-gray-500">{block.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Área Principal */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!showBlockPalette && (
                <button
                  onClick={() => setShowBlockPalette(true)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>Blocos</span>
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  builder.addRow();
                }}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Linha</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={builder.validatePage}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Validar
              </button>
              <button
                onClick={builder.resetPage}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resetar</span>
              </button>
            </div>
          </div>

           {/* Toolbar de Formatação Global */}
      {globalFormattingToolbar && (
        <div className="">
          <TextFormattingToolbar
            onFormatChange={globalFormattingToolbar.onFormatChange}
            onClose={globalFormattingToolbar.onClose}
            currentFormats={globalFormattingToolbar.currentFormats}
          />
        </div>
      )}

          {/* Canvas - viewport simulado para tablet/mobile */}
          <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-gray-100/50">
            <div
              className="w-full space-y-8 transition-all duration-300 min-h-0"
              style={{
                maxWidth: responsiveMode === 'mobile' ? 375 : responsiveMode === 'tablet' ? 768 : undefined,
                padding: (responsiveMode === 'mobile' || responsiveMode === 'tablet') ? 16 : undefined,
                boxShadow: (responsiveMode === 'mobile' || responsiveMode === 'tablet') ? '0 0 0 1px rgba(0,0,0,0.08), 0 4px 6px -1px rgba(0,0,0,0.1)' : undefined,
                backgroundColor: (responsiveMode === 'mobile' || responsiveMode === 'tablet') ? '#fff' : undefined,
                borderRadius: (responsiveMode === 'mobile' || responsiveMode === 'tablet') ? 8 : undefined,
              }}
            >
              {builder.page.rows.map((row, rowIndex) => {
                const isDraggedRow = draggedRowId === row.id;
                const isDragOverRow = dragOverRowId === row.id;
                
                return (
                <div
                  key={row.id}
                  data-row-id={row.id}
                  draggable={!isPreview}
                  onDragStart={(e) => handleRowDragStart(e, row.id)}
                  onDragOver={(e) => handleRowDragOver(e, row.id)}
                  onDragLeave={handleRowDragLeave}
                  onDrop={(e) => handleRowDrop(e, row.id)}
                  onDragEnd={() => {
                    setDraggedRowId(null);
                    setDragOverRowId(null);
                  }}
                  className={`relative group rounded-lg transition-colors ${
                    isPreview 
                      ? '' 
                      : `border-2 border-dashed ${
                          isDraggedRow
                            ? 'opacity-50'
                            : isDragOverRow
                            ? 'border-indigo-400 bg-indigo-100 ring-2 ring-indigo-300'
                            : builder.selectedRow === row.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-transparent hover:border-gray-300'
                        }`
                  }`}
                  style={{
                    backgroundColor: row.style.background?.value || '#ffffff',
                    padding: `${row.style.padding?.y || 24}px ${row.style.padding?.x || 24}px`,
                  }}
                >
                  {/* Controles da Linha */}
                  {!isPreview && (
                    <div className="absolute -top-2 -left-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg border border-gray-200 shadow-sm py-1 px-0.5 z-10">
                      <div 
                        className="p-2 rounded-md text-gray-400 cursor-move"
                        title="Arrastar para reordenar linha"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                      <button
                        onClick={() => builder.selectRow(row.id)}
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
                        title="Configurar linha"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                      <button
                        onClick={() => builder.addRow(row.id)}
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
                        title="Adicionar linha abaixo"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                      <button
                        onClick={() => builder.duplicateRow(row.id)}
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
                        title="Duplicar linha"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {builder.page.rows.length > 1 && (
                        <>
                          <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                          <button
                            onClick={() => builder.deleteRow(row.id)}
                            className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center justify-center"
                            title="Deletar linha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Colunas: 1 col = 100%, 2 cols = 50% cada, 3 = 33.33%, etc. */}
                  <div
                    className="grid gap-4 w-full"
                    style={{
                      gridTemplateColumns: (responsiveMode === 'mobile' || responsiveMode === 'tablet')
                        ? '1fr'
                        : `repeat(${row.columns.length}, minmax(0, 1fr))`
                    }}
                  >
                    {row.columns.map((column, columnIndex) => (
                      <div
                        key={column.id}
                        className={`relative min-h-[100px] min-w-0 w-full p-4 rounded-lg transition-colors flex flex-col ${
                          isPreview 
                            ? '' 
                            : `border-2 border-dashed ${
                                dragOverColumn === column.id
                                  ? 'border-indigo-400 bg-indigo-50'
                                  : builder.selectedColumn === column.id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`
                        }`}
                        style={{
                          minHeight: (column.alignmentVertical === 'center' || column.alignmentVertical === 'bottom') ? 220 : undefined
                        }}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, row.id, column.id)}
                        onClick={() => builder.selectColumn(column.id)}
                      >
                        {/* Controles da Coluna */}
                        {!isPreview && (
                          <div className="absolute -top-2 -right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg border border-gray-200 shadow-sm py-1 px-0.5 z-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                builder.addColumn(row.id, column.id);
                              }}
                              className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
                              title="Adicionar coluna"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowComponentDropdown({ rowId: row.id, columnId: column.id });
                              }}
                              className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
                              title="Adicionar componente"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                            {row.columns.length > 1 && (
                              <>
                                <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                                <button
                                  onClick={() => builder.deleteColumn(row.id, column.id)}
                                  className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center justify-center"
                                  title="Deletar coluna"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Blocos - 100% da largura da coluna */}
                        <div 
                          className="space-y-4 flex-1 w-full min-w-0 flex flex-col"
                          style={{
                            textAlign: column.alignment || 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: column.alignment === 'center' ? 'center' : 
                                        column.alignment === 'right' ? 'flex-end' : 
                                        column.alignment === 'justify' ? 'stretch' : 'flex-start',
                            justifyContent: (column.alignmentVertical || 'top') === 'center' ? 'center' : 
                                             (column.alignmentVertical || 'top') === 'bottom' ? 'flex-end' : 'flex-start',
                            minHeight: ((column.alignmentVertical || 'top') === 'center' || (column.alignmentVertical || 'top') === 'bottom') ? 180 : undefined
                          }}
                        >
                          {column.blocks.length === 0 ? (
                            !isPreview && (
                              <div className="w-full flex items-center justify-center h-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                <div className="text-center">
                                  <Plus className="w-6 h-6 mx-auto mb-1" />
                                  <p className="text-sm">Arraste um bloco aqui</p>
                                </div>
                              </div>
                            )
                          ) : (
                            column.blocks.map((block, blockIndex) => {
                              // Priorizar layout.alignment, mas usar content.alignment como fallback para compatibilidade
                              const blockAlignment: 'left' | 'center' | 'right' = (
                                block.props.layout?.alignment || 
                                (block.props.content as any)?.alignment || 
                                'left'
                              ) as 'left' | 'center' | 'right';
                              const blockAlignmentVertical: 'top' | 'center' | 'bottom' = (
                                block.props.layout?.alignmentVertical || 
                                (block.props.content as any)?.alignmentVertical || 
                                'top'
                              ) as 'top' | 'center' | 'bottom';
                              const blockMinHeight = block.props.layout?.minHeight || block.props.layout?.height || undefined;
                              const isDragged = draggedBlockId === block.props.id;
                              const isDragOver = dragOverBlockId === block.props.id;
                              const isResizing = resizingBlockId === block.props.id;
                              
                              return (
                                <div
                                  key={block.props.id}
                                  data-block-id={block.props.id}
                                  draggable={!isPreview && !isResizing}
                                  onDragStart={(e) => {
                                    if (!isResizing) {
                                      handleBlockDragStart(e, block.props.id, row.id, column.id);
                                    } else {
                                      e.preventDefault();
                                    }
                                  }}
                                  onDragOver={(e) => handleBlockDragOver(e, block.props.id)}
                                  onDragLeave={handleBlockDragLeave}
                                  onDrop={(e) => handleBlockDrop(e, row.id, column.id, block.props.id)}
                                  onDragEnd={() => {
                                    setDraggedBlockId(null);
                                    setDragOverBlockId(null);
                                  }}
                                  className={`relative group/block min-w-0 transition-all block-content-wrapper ${
                                    isDragged ? 'opacity-50' : ''
                                  } ${
                                    isDragOver ? 'ring-2 ring-indigo-400 ring-offset-2 bg-indigo-50' : ''
                                  } ${
                                    !isPreview ? 'hover:border hover:border-gray-300 hover:rounded-md hover:border-dashed' : ''
                                  } ${
                                    // Aplicar largura baseada no alinhamento (funciona em ambos os modos)
                                    blockAlignment === 'center'
                                      ? 'w-max max-w-full mx-auto'
                                      : blockAlignment === 'right'
                                      ? 'w-max max-w-full ml-auto'
                                      : 'w-full'
                                  }`}
                                  style={{
                                    // Alinhamento horizontal usando margin auto (funciona em ambos os modos)
                                    marginLeft: (blockAlignment === 'right' || blockAlignment === 'center') && column.alignment !== 'justify' ? 'auto' : undefined,
                                    marginRight: blockAlignment === 'right' && column.alignment !== 'justify' ? '0' : 
                                                 blockAlignment === 'center' && column.alignment !== 'justify' ? 'auto' : undefined,
                                    
                                    // Padding para hover border (apenas no modo edição)
                                    padding: !isPreview ? '4px' : undefined,
                                    margin: !isPreview ? '-4px' : undefined,
                                    
                                    // Alinhamento próprio do bloco (se não seguir o da coluna)
                                    alignSelf: column.alignment === 'justify' ? 'stretch' : 
                                              blockAlignment === 'center' ? 'center' :
                                              blockAlignment === 'right' ? 'flex-end' :
                                              'flex-start',
                                    
                                    // Altura mínima do bloco aplicada no wrapper principal (funciona em ambos os modos)
                                    minHeight: blockMinHeight ? `${blockMinHeight}px` : undefined,
                                  }}
                                >
                                  {/* Controles do Bloco */}
                                  {!isPreview && (
                                    <div className="absolute -top-2 -left-2 flex items-center opacity-0 group-hover/block:opacity-100 transition-opacity z-10 block-controls-container bg-white rounded-lg border border-gray-200 shadow-sm py-1 px-0.5">
                                      
                                      <button
                                        className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center cursor-move"
                                        title="Reordenar bloco (arrastar o bloco)"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </button>
                                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                                      <button
                                        onClick={() => builder.selectBlock(block.props.id)}
                                        className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
                                        title="Selecionar bloco"
                                      >
                                        <Settings className="w-3.5 h-3.5" />
                                      </button>
                                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                                      <div className="relative block-alignment-dropdown-container z-20">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowBlockAlignmentDropdown(
                                              showBlockAlignmentDropdown?.blockId === block.props.id
                                                ? null
                                                : { rowId: row.id, columnId: column.id, blockId: block.props.id }
                                            );
                                          }}
                                          className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
                                          title="Alinhar bloco (horizontal e vertical)"
                                          onMouseDown={(e) => e.stopPropagation()}
                                        >
                                          {blockAlignment === 'center' ? <AlignCenterHorizontal className="w-3.5 h-3.5" /> :
                                           blockAlignment === 'right' ? <AlignEndHorizontal className="w-3.5 h-3.5" /> :
                                           <AlignStartHorizontal className="w-3.5 h-3.5" />}
                                        </button>
                                        {showBlockAlignmentDropdown?.blockId === block.props.id && (
                                          <div
                                            className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] p-3 flex flex-col gap-3 block-alignment-dropdown min-w-[200px]"
                                            style={{ 
                                              marginBottom: '8px',
                                              maxWidth: 'calc(100vw - 16px)'
                                            }}
                                            ref={(dropdownEl) => {
                                              if (dropdownEl) {
                                                // Calcular posição baseado no botão pai
                                                const containerEl = dropdownEl.parentElement;
                                                const btnEl = containerEl?.querySelector('button');
                                                if (btnEl) {
                                                  const btnRect = btnEl.getBoundingClientRect();
                                                  const dropdownWidth = 200;
                                                  const spaceOnLeft = btnRect.left;
                                                  const spaceOnRight = window.innerWidth - btnRect.left;
                                                  
                                                  // Se não há espaço suficiente à esquerda, mas há à direita, alinhar à direita
                                                  if (spaceOnLeft < dropdownWidth && spaceOnRight >= dropdownWidth) {
                                                    dropdownEl.style.left = 'auto';
                                                    dropdownEl.style.right = '0';
                                                  } else {
                                                    dropdownEl.style.left = '0';
                                                    dropdownEl.style.right = 'auto';
                                                  }
                                                }
                                              }
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onMouseEnter={(e) => {
                                              e.stopPropagation();
                                              // Manter o dropdown aberto quando o mouse entra nele
                                            }}
                                            onMouseLeave={(e) => {
                                              // Não fechar automaticamente ao sair do dropdown
                                              e.stopPropagation();
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {/* Alinhamento Horizontal - controla esquerda/centro/direita */}
                                            <div>
                                              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Horizontal</label>
                                              <div className="flex rounded-md overflow-hidden border border-gray-200 bg-gray-100 p-0.5">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    builder.updateBlock(row.id, column.id, block.props.id, {
                                                      layout: {
                                                        ...block.props.layout,
                                                        alignment: 'left'
                                                      }
                                                    });
                                                    setShowBlockAlignmentDropdown(null);
                                                  }}
                                                  className={`flex-1 p-1.5 flex items-center justify-center ${blockAlignment === 'left' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                  title="Alinhar à esquerda"
                                                >
                                                  <AlignStartVertical className="w-4 h-4" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    builder.updateBlock(row.id, column.id, block.props.id, {
                                                      layout: {
                                                        ...block.props.layout,
                                                        alignment: 'center'
                                                      }
                                                    });
                                                    setShowBlockAlignmentDropdown(null);
                                                  }}
                                                  className={`flex-1 p-1.5 flex items-center justify-center ${blockAlignment === 'center' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                  title="Centralizar horizontalmente"
                                                >
                                                  <AlignCenterVertical className="w-4 h-4" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    builder.updateBlock(row.id, column.id, block.props.id, {
                                                      layout: {
                                                        ...block.props.layout,
                                                        alignment: 'right'
                                                      }
                                                    });
                                                    setShowBlockAlignmentDropdown(null);
                                                  }}
                                                  className={`flex-1 p-1.5 flex items-center justify-center ${blockAlignment === 'right' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                  title="Alinhar à direita"
                                                >
                                                  <AlignEndVertical className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                            
                                            {/* Alinhamento Vertical - controla topo/centro/base */}
                                            <div>
                                              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Vertical</label>
                                              <div className="flex rounded-md overflow-hidden border border-gray-200 bg-gray-100 p-0.5">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    builder.updateBlock(row.id, column.id, block.props.id, {
                                                      layout: {
                                                        ...block.props.layout,
                                                        alignmentVertical: 'top'
                                                      }
                                                    });
                                                    setShowBlockAlignmentDropdown(null);
                                                  }}
                                                  className={`flex-1 p-1.5 flex items-center justify-center ${blockAlignmentVertical === 'top' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                  title="Alinhar ao topo"
                                                >
                                                  <AlignStartHorizontal className="w-4 h-4" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    builder.updateBlock(row.id, column.id, block.props.id, {
                                                      layout: {
                                                        ...block.props.layout,
                                                        alignmentVertical: 'center'
                                                      }
                                                    });
                                                    setShowBlockAlignmentDropdown(null);
                                                  }}
                                                  className={`flex-1 p-1.5 flex items-center justify-center ${blockAlignmentVertical === 'center' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                  title="Centralizar verticalmente"
                                                >
                                                  <AlignCenterHorizontal className="w-4 h-4" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    builder.updateBlock(row.id, column.id, block.props.id, {
                                                      layout: {
                                                        ...block.props.layout,
                                                        alignmentVertical: 'bottom'
                                                      }
                                                    });
                                                    setShowBlockAlignmentDropdown(null);
                                                  }}
                                                  className={`flex-1 p-1.5 flex items-center justify-center ${blockAlignmentVertical === 'bottom' ? 'bg-white rounded shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                  title="Alinhar à base"
                                                >
                                                  <AlignEndHorizontal className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          builder.duplicateBlock(row.id, column.id, block.props.id);
                                        }}
                                        className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center"
                                        title="Duplicar bloco"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <div className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
                                      <button
                                        onClick={() => builder.deleteBlock(
                                          row.id,
                                          column.id,
                                          block.props.id
                                        )}
                                        className="p-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center justify-center"
                                        title="Deletar bloco"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Wrapper interno do bloco com alinhamento aplicado */}
                                  <div
                                    className="w-full min-w-0"
                                    style={{
                                      // Container flex para alinhamento interno do bloco
                                      display: 'flex',
                                      flexDirection: 'column',
                                      
                                      // Com flex-direction: column: alignItems = eixo horizontal, justifyContent = eixo vertical
                                      // Esquerda: stretch para conteúdo usar 100% da largura (imagem, texto, etc.). Centro/direita: apenas posicionar.
                                      alignItems: blockAlignment === 'center' ? 'center' :
                                                  blockAlignment === 'right' ? 'flex-end' :
                                                  'stretch',
                                      
                                      // Alinhamento VERTICAL: apenas justifyContent (main-axis)
                                      justifyContent: blockAlignmentVertical === 'center' ? 'center' :
                                                      blockAlignmentVertical === 'bottom' ? 'flex-end' :
                                                      'flex-start',
                                      
                                      // Altura mínima para alinhamento vertical funcionar
                                      minHeight: (blockAlignmentVertical === 'center' || blockAlignmentVertical === 'bottom') ? '40px' : undefined,
                                      
                                      // Altura do bloco se definida
                                      height: blockMinHeight ? `${blockMinHeight}px` : undefined,
                                      
                                      // Não aplicar textAlign aqui: alinhamento do bloco só posiciona o componente,
                                      // não deve alterar o alinhamento de textos dentro do bloco (ex.: carrossel).
                                      
                                      // Padding apenas no modo edição
                                      padding: !isPreview ? '2px' : undefined,
                                      
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {renderBlock(block)}
                                  </div>

                                  {/* Handle de redimensionamento */}
                                  {!isPreview && (
                                    <div 
                                      className="relative w-full flex items-center justify-center py-2 group/resize"
                                      onMouseEnter={() => setShowResizeTooltip(block.props.id)}
                                      onMouseLeave={() => {
                                        if (!isResizing) {
                                          setShowResizeTooltip(null);
                                        }
                                      }}
                                    >
                                      {/* Linha horizontal azul */}
                                      <div className={`h-0.5 w-full bg-blue-500 transition-opacity ${
                                        isResizing ? 'opacity-100' : 'opacity-0 group-hover/resize:opacity-100'
                                      }`}></div>
                                      
                                      {/* Botão de redimensionamento */}
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleResizeStart(e, block.props.id, blockMinHeight || 40);
                                        }}
                                        className={`absolute flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white cursor-ns-resize hover:bg-blue-600 active:bg-blue-700 transition-all z-20 ${
                                          isResizing ? 'bg-blue-700 scale-110 opacity-100 shadow-lg' : 'opacity-0 group-hover/resize:opacity-100'
                                        }`}
                                        title="Ajustar proporções"
                                        style={{
                                          transform: 'translateY(-50%)',
                                          touchAction: 'none',
                                        }}
                                        onDragStart={(e) => e.preventDefault()}
                                      >
                                        <ArrowDown className="w-4 h-4" />
                                      </button>
                                      
                                      {/* Tooltip */}
                                      {showResizeTooltip === block.props.id && !isResizing && (
                                        <div 
                                          className="absolute top-10 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30 pointer-events-none shadow-lg"
                                          style={{
                                            transform: 'translateX(-50%)',
                                            left: '50%',
                                          }}
                                        >
                                          Ajustar proporções
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}

              {/* Botão para adicionar primeira linha */}
              {builder.page.rows.length === 0 && !isPreview && (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      builder.addRow();
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Adicionar Primeira Linha</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Painel de Propriedades */}
        {builder.selectedBlock && !isPreview && (() => {
          // Encontrar o bloco selecionado
          const selectedBlock = builder.page.rows
            .flatMap(row => row.columns)
            .flatMap(column => column.blocks)
            .find(block => block.props.id === builder.selectedBlock);
          
          if (!selectedBlock) return null;
          
          return (
            <PropertyPanel
              block={selectedBlock.props}
              isPreview={isPreview}
              onUpdate={(updates) => {
                const rowId = builder.page.rows.find(row => 
                  row.columns.some(col => col.blocks.some(b => b.props.id === selectedBlock.props.id))
                )?.id;
                const columnId = builder.page.rows
                  .find(row => row.id === rowId)
                  ?.columns.find(col => col.blocks.some(b => b.props.id === selectedBlock.props.id))?.id;
                
                if (rowId && columnId) {
                  builder.updateBlock(rowId, columnId, selectedBlock.props.id, updates);
                }
              }}
              onClose={() => builder.selectBlock(null)}
            />
          );
        })()}
      </div>

      {/* Dropdown de Componentes */}
      {showComponentDropdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Selecionar Componente</h3>
              <button
                onClick={() => setShowComponentDropdown(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {allBlocks.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => handleAddBlockFromDropdown(
                      block.type, 
                      showComponentDropdown.rowId, 
                      showComponentDropdown.columnId
                    )}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 text-sm font-medium">
                        {block.icon === 'Heading1' && 'H'}
                        {block.icon === 'FileText' && 'T'}
                        {block.icon === 'Image' && '📷'}
                        {block.icon === 'Play' && '▶️'}
                        {block.icon === 'MousePointer' && '🔘'}
                        {block.icon === 'Minus' && '—'}
                        {block.icon === 'Volume2' && '🔊'}
                        {block.icon === 'CreditCard' && '💳'}
                        {block.icon === 'List' && '📝'}
                        {block.icon === 'Table' && '📊'}
                        {block.icon === 'Award' && '🏆'}
                        {block.icon === 'RotateCcw' && '🔄'}
                        {block.icon === 'Folder' && '📁'}
                        {block.icon === 'ChevronDown' && '▼'}
                        {block.icon === 'Box' && '📦'}
                        {block.icon === 'Star' && '⭐'}
                        {block.icon === 'Square' && '⬜'}
                        {block.icon === 'CheckSquare' && '☑️'}
                        {block.icon === 'CheckCircle' && '✅'}
                        {block.icon === 'ListOrdered' && '🔢'}
                        {block.icon === 'Edit3' && '✏️'}
                        {block.icon === 'Clipboard' && '📋'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">{block.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{block.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                Clique em um componente para adicioná-lo à coluna
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validação */}
      {builder.validationErrors.length > 0 && (
        <div className="bg-red-50 border-t border-red-200 p-4">
          <div className="max-w-6xl mx-auto">
            <h4 className="font-medium text-red-800 mb-2">
              Erros de Validação ({builder.validationErrors.length})
            </h4>
            <div className="space-y-1">
              {builder.validationErrors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">
                  • {error.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Builder;
