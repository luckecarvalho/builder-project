import { useState, useCallback, useRef } from 'react';
import { Page, Row, Column, Block, BlockProps } from '@/types/builder';
import { PageValidator, ValidationError as ValidationErrorClass } from '@/utils/validation';

export interface BuilderState {
  page: Page;
  selectedBlock: string | null;
  selectedRow: string | null;
  selectedColumn: string | null;
  draggedBlock: string | null;
  validationErrors: ValidationErrorClass[];
  history: Page[];
  historyIndex: number;
  isDirty: boolean;
}

export interface BuilderActions {
  // Page operations
  updatePage: (page: Page) => void;
  savePage: () => Promise<void>;
  loadPage: (page: Page) => void;
  
  // Row operations
  addRow: (afterRowId?: string, columns?: number) => void;
  updateRow: (rowId: string, updates: Partial<Row>) => void;
  deleteRow: (rowId: string) => void;
  duplicateRow: (rowId: string) => void;
  moveRow: (rowId: string, direction: 'up' | 'down') => void;
  
  // Column operations
  addColumn: (rowId: string, afterColumnId?: string) => void;
  updateColumn: (rowId: string, columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (rowId: string, columnId: string) => void;
  duplicateColumn: (rowId: string, columnId: string) => void;
  splitColumn: (rowId: string, columnId: string) => void;
  
  // Block operations
  addBlock: (rowId: string, columnId: string, blockType: string, afterBlockId?: string) => void;
  updateBlock: (rowId: string, columnId: string, blockId: string, updates: Partial<BlockProps>) => void;
  deleteBlock: (rowId: string, columnId: string, blockId: string) => void;
  duplicateBlock: (rowId: string, columnId: string, blockId: string) => void;
  moveBlock: (rowId: string, columnId: string, blockId: string, direction: 'up' | 'down') => void;
  
  // Selection operations
  selectBlock: (blockId: string | null) => void;
  selectRow: (rowId: string | null) => void;
  selectColumn: (columnId: string | null) => void;
  
  // Drag and drop
  setDraggedBlock: (blockId: string | null) => void;
  moveBlockToColumn: (blockId: string, targetRowId: string, targetColumnId: string, afterBlockId?: string) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Validation
  validatePage: () => ValidationErrorClass[];
  clearValidationErrors: () => void;
  
  // Utility operations
  generateId: () => string;
  resetPage: () => void;
}

// Função para obter conteúdo padrão baseado no tipo de bloco
function getDefaultBlockContent(blockType: string): Record<string, any> {
  switch (blockType) {
    case 'heading':
      return {
        level: 2,
        text: 'Novo Título',
        maxChars: 100,
        alignment: 'left',
      };
    case 'text':
      return {
        html: '<p>Digite seu texto aqui...</p>',
        maxChars: 1000,
        allowHtml: true,
        allowLinks: true,
      };
    case 'image':
      return {
        src: '',
        alt: '',
        lazyLoad: true,
      };
    case 'video':
      return {
        url: '',
        type: 'youtube',
        title: '',
        autoplay: false,
        controls: true,
        description: '',
      };
    case 'button':
      return {
        label: 'Clique aqui',
        url: '#',
        type: 'internal',
        size: 'medium',
        variant: 'primary',
      };
      case 'divider':
        return {
          type: 'line',
          thickness: 1,
          color: '#e5e7eb',
          spacing: 20,
          direction: 'horizontal',
        };
      case 'audio':
        return {
          src: '',
          title: '',
          controls: true,
          transcript: '',
        };
      default:
        return {};
  }
}

export function useBuilder(initialPage?: Page): BuilderState & BuilderActions {
  const generateId = useCallback(() => {
    return Math.random().toString(36).slice(2, 9);
  }, []);

  const createDefaultPage = useCallback((): Page => {
    return {
      version: '1.0.0',
      metadata: {
        title: 'Nova Página',
        slug: 'nova-pagina',
        tags: [],
        version: '1.0.0',
        status: 'draft',
        locale: 'pt-BR',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      rows: [
        {
          id: generateId(),
          style: {
            background: { type: 'color', value: '#ffffff' },
            padding: { x: 24, y: 24 },
          },
          columns: [
            {
              id: generateId(),
              grid: { span: { xs: 12, sm: 12, md: 12, lg: 12 } },
              blocks: [],
            },
          ],
        },
      ],
    };
  }, [generateId]);

  const [state, setState] = useState<BuilderState>({
    page: initialPage || createDefaultPage(),
    selectedBlock: null,
    selectedRow: null,
    selectedColumn: null,
    draggedBlock: null,
    validationErrors: [],
    history: [initialPage || createDefaultPage()],
    historyIndex: 0,
    isDirty: false,
  });

  const historyRef = useRef<Page[]>([state.page]);
  const historyIndexRef = useRef<number>(0);

  const saveToHistory = useCallback((page: Page) => {
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(page);
    
    // Limitar histórico a 50 itens
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      historyIndexRef.current++;
    }
    
    historyRef.current = newHistory;
    
    setState(prev => ({
      ...prev,
      page,
      history: newHistory,
      historyIndex: historyIndexRef.current,
      isDirty: true,
    }));
  }, []);

  const updatePage = useCallback((page: Page) => {
    saveToHistory(page);
  }, [saveToHistory]);

  const savePage = useCallback(async () => {
    try {
      // Aqui você implementaria a lógica de salvamento
      // Por exemplo, fazer uma requisição para uma API
      console.log('Salvando página:', state.page);
      
      setState(prev => ({
        ...prev,
        isDirty: false,
      }));
    } catch (error) {
      console.error('Erro ao salvar página:', error);
      throw error;
    }
  }, [state.page]);

  const loadPage = useCallback((page: Page) => {
    setState(prev => ({
      ...prev,
      page,
      selectedBlock: null,
      selectedRow: null,
      selectedColumn: null,
      draggedBlock: null,
      validationErrors: [],
      isDirty: false,
    }));
    
    historyRef.current = [page];
    historyIndexRef.current = 0;
  }, []);

  const addRow = useCallback((afterRowId?: string, columns = 1) => {
    setState(prev => {
      const newRow: Row = {
        id: generateId(),
        style: {
          background: { type: 'color', value: '#ffffff' },
          padding: { x: 24, y: 24 },
        },
        columns: Array.from({ length: columns }, () => ({
          id: generateId(),
          grid: { span: { xs: 12 / columns, sm: 12 / columns, md: 12 / columns, lg: 12 / columns } },
          blocks: [],
        })),
      };

      const newRows = [...prev.page.rows];
      if (afterRowId) {
        const index = newRows.findIndex(row => row.id === afterRowId);
        newRows.splice(index + 1, 0, newRow);
      } else {
        newRows.push(newRow);
      }

      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [generateId, saveToHistory]);

  const updateRow = useCallback((rowId: string, updates: Partial<Row>) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row =>
        row.id === rowId ? { ...row, ...updates } : row
      );
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [saveToHistory]);

  const deleteRow = useCallback((rowId: string) => {
    setState(prev => {
      if (prev.page.rows.length <= 1) return prev; // Não permitir deletar a última row
      
      const newRows = prev.page.rows.filter(row => row.id !== rowId);
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      
      return {
        ...prev,
        page: newPage,
        selectedRow: prev.selectedRow === rowId ? null : prev.selectedRow,
      };
    });
  }, [saveToHistory]);

  const duplicateRow = useCallback((rowId: string) => {
    setState(prev => {
      const rowIndex = prev.page.rows.findIndex(row => row.id === rowId);
      if (rowIndex === -1) return prev;
      
      const originalRow = prev.page.rows[rowIndex];
      const duplicatedRow: Row = {
        ...originalRow,
        id: generateId(),
        columns: originalRow.columns.map(col => ({
          ...col,
          id: generateId(),
          blocks: col.blocks.map(block => ({
            ...block,
            props: {
              ...block.props,
              id: generateId(),
            },
          })),
        })),
      };
      
      const newRows = [...prev.page.rows];
      newRows.splice(rowIndex + 1, 0, duplicatedRow);
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [generateId, saveToHistory]);

  const moveRow = useCallback((rowId: string, direction: 'up' | 'down') => {
    setState(prev => {
      const rowIndex = prev.page.rows.findIndex(row => row.id === rowId);
      if (rowIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
      if (newIndex < 0 || newIndex >= prev.page.rows.length) return prev;
      
      const newRows = [...prev.page.rows];
      [newRows[rowIndex], newRows[newIndex]] = [newRows[newIndex], newRows[rowIndex]];
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [saveToHistory]);

  const addColumn = useCallback((rowId: string, afterColumnId?: string) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        
        const newColumn: Column = {
          id: generateId(),
          grid: { span: { xs: 12, sm: 12, md: 12, lg: 12 } },
          blocks: [],
        };
        
        const newColumns = [...row.columns];
        if (afterColumnId) {
          const index = newColumns.findIndex(col => col.id === afterColumnId);
          newColumns.splice(index + 1, 0, newColumn);
        } else {
          newColumns.push(newColumn);
        }
        
        // Ajustar spans para não exceder 12
        const totalColumns = newColumns.length;
        newColumns.forEach(col => {
          col.grid.span = {
            xs: 12 / totalColumns,
            sm: 12 / totalColumns,
            md: 12 / totalColumns,
            lg: 12 / totalColumns,
          };
        });
        
        return { ...row, columns: newColumns };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [generateId, saveToHistory]);

  const updateColumn = useCallback((rowId: string, columnId: string, updates: Partial<Column>) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          columns: row.columns.map(col =>
            col.id === columnId ? { ...col, ...updates } : col
          ),
        };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [saveToHistory]);

  const deleteColumn = useCallback((rowId: string, columnId: string) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        
        if (row.columns.length <= 1) return row; // Não permitir deletar a última coluna
        
        const newColumns = row.columns.filter(col => col.id !== columnId);
        
        // Ajustar spans das colunas restantes
        const totalColumns = newColumns.length;
        newColumns.forEach(col => {
          col.grid.span = {
            xs: 12 / totalColumns,
            sm: 12 / totalColumns,
            md: 12 / totalColumns,
            lg: 12 / totalColumns,
          };
        });
        
        return { ...row, columns: newColumns };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      
      return {
        ...prev,
        page: newPage,
        selectedColumn: prev.selectedColumn === columnId ? null : prev.selectedColumn,
      };
    });
  }, [saveToHistory]);

  const duplicateColumn = useCallback((rowId: string, columnId: string) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        
        const columnIndex = row.columns.findIndex(col => col.id === columnId);
        if (columnIndex === -1) return row;
        
        const originalColumn = row.columns[columnIndex];
        const duplicatedColumn: Column = {
          ...originalColumn,
          id: generateId(),
          blocks: originalColumn.blocks.map(block => ({
            ...block,
            props: {
              ...block.props,
              id: generateId(),
            },
          })),
        };
        
        const newColumns = [...row.columns];
        newColumns.splice(columnIndex + 1, 0, duplicatedColumn);
        
        // Ajustar spans
        const totalColumns = newColumns.length;
        newColumns.forEach(col => {
          col.grid.span = {
            xs: 12 / totalColumns,
            sm: 12 / totalColumns,
            md: 12 / totalColumns,
            lg: 12 / totalColumns,
          };
        });
        
        return { ...row, columns: newColumns };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [generateId, saveToHistory]);

  const splitColumn = useCallback((rowId: string, columnId: string) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        
        const columnIndex = row.columns.findIndex(col => col.id === columnId);
        if (columnIndex === -1) return row;
        
        const originalColumn = row.columns[columnIndex];
        const newColumns = [...row.columns];
        
        // Criar duas novas colunas com metade do span cada
        const newColumn1: Column = {
          id: generateId(),
          grid: {
            span: {
              xs: 6,
              sm: 6,
              md: 6,
              lg: 6,
            },
          },
          blocks: [...originalColumn.blocks],
        };
        
        const newColumn2: Column = {
          id: generateId(),
          grid: {
            span: {
              xs: 6,
              sm: 6,
              md: 6,
              lg: 6,
            },
          },
          blocks: [],
        };
        
        newColumns.splice(columnIndex, 1, newColumn1, newColumn2);
        
        return { ...row, columns: newColumns };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [generateId, saveToHistory]);

  // Block operations
  const addBlock = useCallback((rowId: string, columnId: string, blockType: string, afterBlockId?: string) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          columns: row.columns.map(col => {
            if (col.id !== columnId) return col;
            
            // Criar novo bloco com propriedades padrão baseadas no tipo
            const newBlock: Block = {
              props: {
                id: generateId(),
                type: blockType,
                version: '1.0.0',
                content: getDefaultBlockContent(blockType),
                style: {},
                layout: {},
                accessibility: {},
              },
            };
            
            const newBlocks = [...col.blocks];
            if (afterBlockId) {
              const index = newBlocks.findIndex(block => block.props.id === afterBlockId);
              newBlocks.splice(index + 1, 0, newBlock);
            } else {
              newBlocks.push(newBlock);
            }
            
            return { ...col, blocks: newBlocks };
          }),
        };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [generateId, saveToHistory]);

  const updateBlock = useCallback((rowId: string, columnId: string, blockId: string, updates: Partial<BlockProps>) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          columns: row.columns.map(col => {
            if (col.id !== columnId) return col;
            return {
              ...col,
              blocks: col.blocks.map(block => {
                if (block.props.id !== blockId) return block;
                return {
                  ...block,
                  props: { ...block.props, ...updates },
                };
              }),
            };
          }),
        };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [saveToHistory]);

  const deleteBlock = useCallback((rowId: string, columnId: string, blockId: string) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          columns: row.columns.map(col => {
            if (col.id !== columnId) return col;
            return {
              ...col,
              blocks: col.blocks.filter(block => block.props.id !== blockId),
            };
          }),
        };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      
      return {
        ...prev,
        page: newPage,
        selectedBlock: prev.selectedBlock === blockId ? null : prev.selectedBlock,
      };
    });
  }, [saveToHistory]);

  const duplicateBlock = useCallback((rowId: string, columnId: string, blockId: string) => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          columns: row.columns.map(col => {
            if (col.id !== columnId) return col;
            
            const blockIndex = col.blocks.findIndex(block => block.props.id === blockId);
            if (blockIndex === -1) return col;
            
            const originalBlock = col.blocks[blockIndex];
            const duplicatedBlock: Block = {
              ...originalBlock,
              props: {
                ...originalBlock.props,
                id: generateId(),
              },
            };
            
            const newBlocks = [...col.blocks];
            newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
            
            return { ...col, blocks: newBlocks };
          }),
        };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [generateId, saveToHistory]);

  const moveBlock = useCallback((rowId: string, columnId: string, blockId: string, direction: 'up' | 'down') => {
    setState(prev => {
      const newRows = prev.page.rows.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          columns: row.columns.map(col => {
            if (col.id !== columnId) return col;
            
            const blockIndex = col.blocks.findIndex(block => block.props.id === blockId);
            if (blockIndex === -1) return col;
            
            const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
            if (newIndex < 0 || newIndex >= col.blocks.length) return col;
            
            const newBlocks = [...col.blocks];
            [newBlocks[blockIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[blockIndex]];
            
            return { ...col, blocks: newBlocks };
          }),
        };
      });
      
      const newPage = { ...prev.page, rows: newRows };
      saveToHistory(newPage);
      return { ...prev, page: newPage };
    });
  }, [saveToHistory]);

  // Selection operations
  const selectBlock = useCallback((blockId: string | null) => {
    setState(prev => ({ ...prev, selectedBlock: blockId }));
  }, []);

  const selectRow = useCallback((rowId: string | null) => {
    setState(prev => ({ ...prev, selectedRow: rowId }));
  }, []);

  const selectColumn = useCallback((columnId: string | null) => {
    setState(prev => ({ ...prev, selectedColumn: columnId }));
  }, []);

  // Drag and drop
  const setDraggedBlock = useCallback((blockId: string | null) => {
    setState(prev => ({ ...prev, draggedBlock: blockId }));
  }, []);

  const moveBlockToColumn = useCallback((blockId: string, targetRowId: string, targetColumnId: string, afterBlockId?: string) => {
    // Implementação do drag and drop entre colunas
    console.log('Move block to column:', { blockId, targetRowId, targetColumnId, afterBlockId });
  }, []);

  // History operations
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousPage = historyRef.current[historyIndexRef.current];
      setState(prev => ({
        ...prev,
        page: previousPage,
        historyIndex: historyIndexRef.current,
        isDirty: true,
      }));
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextPage = historyRef.current[historyIndexRef.current];
      setState(prev => ({
        ...prev,
        page: nextPage,
        historyIndex: historyIndexRef.current,
        isDirty: true,
      }));
    }
  }, []);

  const canUndo = useCallback(() => {
    return historyIndexRef.current > 0;
  }, []);

  const canRedo = useCallback(() => {
    return historyIndexRef.current < historyRef.current.length - 1;
  }, []);

  // Validation
  const validatePage = useCallback((): ValidationErrorClass[] => {
    const errors = PageValidator.validatePage(state.page);
    const validationErrors = errors.map(error => ({
      field: error.field,
      message: error.message,
      value: error.value,
    }));
    
    setState(prev => ({ ...prev, validationErrors }));
    return validationErrors;
  }, [state.page]);

  const clearValidationErrors = useCallback(() => {
    setState(prev => ({ ...prev, validationErrors: [] }));
  }, []);

  // Utility operations
  const resetPage = useCallback(() => {
    const defaultPage = createDefaultPage();
    loadPage(defaultPage);
  }, [createDefaultPage, loadPage]);

  return {
    ...state,
    updatePage,
    savePage,
    loadPage,
    addRow,
    updateRow,
    deleteRow,
    duplicateRow,
    moveRow,
    addColumn,
    updateColumn,
    deleteColumn,
    duplicateColumn,
    splitColumn,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
    selectRow,
    selectColumn,
    setDraggedBlock,
    moveBlockToColumn,
    undo,
    redo,
    canUndo,
    canRedo,
    validatePage,
    clearValidationErrors,
    generateId,
    resetPage,
  };
}
