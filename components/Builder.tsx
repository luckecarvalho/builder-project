'use client'

import React, { useState } from 'react';
import { useBuilder } from '@/hooks/useBuilder';
import { getBlockComponent, getBlocksByCategory, getBlockCategories } from '@/components/blocks/BlockRegistry';
import { BlockProps } from '@/types/builder';
import PropertyPanel from './PropertyPanel';
import TextFormattingToolbar from './TextFormattingToolbar';
import { 
  Plus, Settings, Eye, Edit3, Save, Undo, Redo, Trash2, 
  Grid3X3, GripVertical, ChevronDown, ChevronUp, Copy, Move,
  Monitor, Smartphone, Tablet, RotateCcw, X, Check
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

  const categories = getBlockCategories();
  const blocks = getBlocksByCategory(selectedCategory);
  
  // Lista de blocos para o dropdown (baseada no registry)
  const allBlocks = getBlockCategories().flatMap(cat =>
    getBlocksByCategory(cat).map(m => ({
      type: m.type,
      name: m.name,
      description: m.description,
      icon: m.icon,
    }))
  );

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
    const blockType = e.dataTransfer.getData('text/plain');
    if (blockType) {
      builder.addBlock(rowId, columnId, blockType);
    }
    setDragOverColumn(null);
    builder.setDraggedBlock(null);
  };

  const handleAddBlockFromDropdown = (blockType: string, rowId: string, columnId: string) => {
    builder.addBlock(rowId, columnId, blockType);
    setShowComponentDropdown(null);
  };

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
        isSelected={builder.selectedBlock === block.props.id}
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
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
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
                onClick={() => builder.addRow()}
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

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className={`mx-auto space-y-8 transition-all duration-300 ${
              responsiveMode === 'desktop' 
                ? 'max-w-6xl' 
                : responsiveMode === 'tablet' 
                ? 'max-w-3xl' 
                : 'max-w-sm'
            }`}>
              {builder.page.rows.map((row, rowIndex) => (
                <div
                  key={row.id}
                  className={`relative group rounded-lg transition-colors ${
                    isPreview 
                      ? '' 
                      : `border-2 border-dashed ${
                          builder.selectedRow === row.id
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
                    <div className="absolute -top-2 -left-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => builder.selectRow(row.id)}
                        className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600"
                        title="Configurar linha"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => builder.addRow(row.id)}
                        className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600"
                        title="Adicionar linha abaixo"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => builder.duplicateRow(row.id)}
                        className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                        title="Duplicar linha"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {builder.page.rows.length > 1 && (
                        <button
                          onClick={() => builder.deleteRow(row.id)}
                          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          title="Deletar linha"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Colunas */}
                  <div className={`grid gap-4 ${
                    responsiveMode === 'mobile' ? 'grid-cols-1' : ''
                  }`} style={{
                    gridTemplateColumns: responsiveMode === 'mobile' 
                      ? '1fr' 
                      : `repeat(${row.columns.length}, 1fr)`
                  }}>
                    {row.columns.map((column, columnIndex) => (
                      <div
                        key={column.id}
                        className={`relative min-h-[100px] p-4 rounded-lg transition-colors ${
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
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, row.id, column.id)}
                        onClick={() => builder.selectColumn(column.id)}
                      >
                        {/* Controles da Coluna */}
                        {!isPreview && (
                          <div className="absolute -top-2 -right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => builder.addColumn(row.id, column.id)}
                              className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600"
                              title="Adicionar coluna"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => builder.splitColumn(row.id, column.id)}
                              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                              title="Dividir coluna"
                            >
                              <Grid3X3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowComponentDropdown({ rowId: row.id, columnId: column.id });
                              }}
                              className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600"
                              title="Adicionar componente"
                            >
                              <Settings className="w-3 h-3" />
                            </button>
                            {row.columns.length > 1 && (
                              <button
                                onClick={() => builder.deleteColumn(row.id, column.id)}
                                className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                title="Deletar coluna"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Blocos */}
                        <div className="space-y-4">
                          {column.blocks.length === 0 ? (
                            !isPreview && (
                              <div className="flex items-center justify-center h-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                <div className="text-center">
                                  <Plus className="w-6 h-6 mx-auto mb-1" />
                                  <p className="text-sm">Arraste um bloco aqui</p>
                                </div>
                              </div>
                            )
                          ) : (
                            column.blocks.map((block, blockIndex) => (
                              <div
                                key={block.props.id}
                                className="relative group/block"
                              >
                                {/* Controles do Bloco */}
                                {!isPreview && (
                                  <div className="absolute -top-2 -left-2 flex items-center space-x-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
                                    <button
                                      onClick={() => builder.selectBlock(block.props.id)}
                                      className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600"
                                      title="Selecionar bloco"
                                    >
                                      <Settings className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => builder.duplicateBlock(
                                        row.id,
                                        column.id,
                                        block.props.id
                                      )}
                                      className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                                      title="Duplicar bloco"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => builder.deleteBlock(
                                        row.id,
                                        column.id,
                                        block.props.id
                                      )}
                                      className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                      title="Deletar bloco"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}

                                {renderBlock(block)}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Botão para adicionar primeira linha */}
              {builder.page.rows.length === 0 && !isPreview && (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                  <button
                    onClick={() => builder.addRow()}
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
