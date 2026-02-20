import React from 'react';
import { BlockProps, BlockManifest } from '@/types/builder';

// Importar componentes de blocos implementados
import HeadingBlock from './HeadingBlock';
import TextBlock from './TextBlock';
import ImageBlock from './ImageBlock';
import VideoBlock from './VideoBlock';
import DividerBlock from './DividerBlock';
import AudioBlock from './AudioBlock';

// Importar blocos stub (em desenvolvimento)
import {
  TableBlock,
  BadgeBlock,
  CarouselBlock,
  TabsBlock,
  AccordionBlock,
  ModalBlock,
  QuizMultipleChoiceBlock,
  QuizTrueFalseBlock,
  QuizEnumerationBlock,
  QuizEssayBlock,
} from './StubBlocks';

// Registry de todos os blocos disponíveis
export const BLOCK_MANIFESTS: Record<string, BlockManifest> = {
  'heading': {
    type: 'heading',
    name: 'Título',
    description: 'Bloco de título com diferentes níveis (H1-H6)',
    icon: 'Heading1',
    category: 'texto',
    validation: [
      { field: 'content.text', type: 'required', message: 'Texto do título é obrigatório' },
      { field: 'content.text', type: 'maxLength', value: 100, message: 'Título deve ter no máximo 100 caracteres' },
    ],
    defaultProps: {
      type: 'heading',
      content: {
        level: 2,
        text: 'Novo Título',
        maxChars: 100,
        alignment: 'left',
      },
    },
    renderer: 'HeadingBlock',
  },
  'text': {
    type: 'text',
    name: 'Texto',
    description: 'Bloco de texto com formatação básica',
    icon: 'FileText',
    category: 'texto',
    validation: [
      { field: 'content.html', type: 'required', message: 'Conteúdo de texto é obrigatório' },
      { field: 'content.html', type: 'maxLength', value: 1000, message: 'Texto deve ter no máximo 1000 caracteres' },
    ],
    defaultProps: {
      type: 'text',
      content: {
        html: '<p>Digite seu texto aqui...</p>',
        maxChars: 1000,
        allowHtml: true,
        allowLinks: true,
      },
    },
    renderer: 'TextBlock',
  },
  'image': {
    type: 'image',
    name: 'Imagem',
    description: 'Bloco de imagem com texto alternativo',
    icon: 'Image',
    category: 'midia',
    validation: [
      { field: 'content.src', type: 'required', message: 'URL da imagem é obrigatória' },
      { field: 'content.alt', type: 'required', message: 'Texto alternativo é obrigatório para acessibilidade' },
    ],
    defaultProps: {
      type: 'image',
      content: {
        src: '',
        alt: '',
        lazyLoad: true,
      },
    },
    renderer: 'ImageBlock',
  },
  'video': {
    type: 'video',
    name: 'Vídeo',
    description: 'Bloco de vídeo (YouTube, Vimeo, URL)',
    icon: 'Play',
    category: 'midia',
    validation: [
      { field: 'content.url', type: 'required', message: 'URL do vídeo é obrigatória' },
      { field: 'content.title', type: 'required', message: 'Título do vídeo é obrigatório' },
      { field: 'content.description', type: 'required', message: 'Descrição do vídeo é obrigatória para acessibilidade' },
    ],
    defaultProps: {
      type: 'video',
      content: {
        url: '',
        type: 'youtube',
        title: '',
        autoplay: false,
        controls: true,
        description: '',
      },
    },
    renderer: 'VideoBlock',
  },
  'audio': {
    type: 'audio',
    name: 'Áudio',
    description: 'Bloco de áudio/podcast',
    icon: 'Volume2',
    category: 'midia',
    validation: [
      { field: 'content.src', type: 'required', message: 'URL do áudio é obrigatória' },
      { field: 'content.title', type: 'required', message: 'Título do áudio é obrigatório' },
    ],
    defaultProps: {
      type: 'audio',
      content: {
        src: '',
        title: '',
        controls: true,
      },
    },
    renderer: 'AudioBlock',
  },
  'table': {
    type: 'table',
    name: 'Tabela',
    description: 'Tabela com cabeçalhos e linhas',
    icon: 'Table',
    category: 'layout',
    validation: [
      { field: 'content.headers', type: 'required', message: 'Tabela deve ter pelo menos um cabeçalho' },
      { field: 'content.rows', type: 'required', message: 'Tabela deve ter pelo menos uma linha' },
    ],
    defaultProps: {
      type: 'table',
      content: {
        headers: ['Coluna 1', 'Coluna 2'],
        rows: [
          ['Linha 1, Coluna 1', 'Linha 1, Coluna 2'],
          ['Linha 2, Coluna 1', 'Linha 2, Coluna 2'],
        ],
        format: 'basic',
        borderRows: true,
        borderColumns: false,
        borderOuter: false,
      },
    },
    renderer: 'TableBlock',
  },
  'badge': {
    type: 'badge',
    name: 'Selo',
    description: 'Selo/badge com imagem e texto opcional',
    icon: 'Award',
    category: 'elementos',
    validation: [],
    defaultProps: {
      type: 'badge',
      content: {
        src: '',
        alt: '',
      },
    },
    renderer: 'BadgeBlock',
  },
  'carousel': {
    type: 'carousel',
    name: 'Carrossel',
    description: 'Carrossel de itens com navegação',
    icon: 'RotateCcw',
    category: 'interacao',
    validation: [
      { field: 'content.items', type: 'required', message: 'Carrossel deve ter pelo menos um item' },
    ],
    defaultProps: {
      type: 'carousel',
      content: {
        items: [
          {
            title: 'Slide 1',
            text: 'Conteúdo do slide 1',
          },
        ],
        showArrows: true,
        showDots: true,
      },
    },
    renderer: 'CarouselBlock',
  },
  'tabs': {
    type: 'tabs',
    name: 'Abas',
    description: 'Sistema de abas com conteúdo',
    icon: 'Folder',
    category: 'interacao',
    validation: [
      { field: 'content.tabs', type: 'required', message: 'Abas devem ter pelo menos 2 itens' },
    ],
    defaultProps: {
      type: 'tabs',
      content: {
        tabs: [
          {
            title: 'Aba 1',
            content: 'Conteúdo da aba 1',
          },
          {
            title: 'Aba 2',
            content: 'Conteúdo da aba 2',
          },
        ],
        activeTab: 0,
        borderOuter: true,
      },
    },
    renderer: 'TabsBlock',
  },
  'accordion': {
    type: 'accordion',
    name: 'Accordion',
    description: 'Accordion expansível com múltiplas seções',
    icon: 'ChevronDown',
    category: 'interacao',
    validation: [
      { field: 'content.items', type: 'required', message: 'Accordion deve ter pelo menos um item' },
    ],
    defaultProps: {
      type: 'accordion',
      content: {
        items: [
          {
            title: 'Accordion 1',
            content: 'Conteúdo do accordion 1',
            isOpen: false,
          },
          {
            title: 'Accordion 2',
            content: 'Conteúdo do accordion 2',
            isOpen: false,
          },
        ],
        borderOuter: true,
      },
    },
    renderer: 'AccordionBlock',
  },
  'divider': {
    type: 'divider',
    name: 'Separador',
    description: 'Linha separadora ou espaçador',
    icon: 'Minus',
    category: 'elementos',
    validation: [],
    defaultProps: {
      type: 'divider',
      content: {
        type: 'line',
        thickness: 1,
        color: '#e5e7eb',
        spacing: 20,
        direction: 'horizontal',
      },
    },
    renderer: 'DividerBlock',
  },
  'modal': {
    type: 'modal',
    name: 'Modal',
    description: 'Modal com trigger e conteúdo',
    icon: 'Square',
    category: 'interacao',
    validation: [
      { field: 'content.trigger', type: 'required', message: 'Trigger do modal é obrigatório' },
      { field: 'content.content', type: 'required', message: 'Conteúdo do modal é obrigatório' },
    ],
    defaultProps: {
      type: 'modal',
      content: {
        trigger: {
          type: 'text',
          content: {
            html: '<p>Abrir Modal</p>',
            maxChars: 1000,
            allowHtml: true,
            allowLinks: true,
          },
        },
        modalData: {
          title: 'Título do Modal',
          text: 'Conteúdo do modal...',
          hasImage: false,
          imageUrl: '',
          imageAlt: '',
        },
        content: [],
        focusOnOpen: '',
        closeOnEscape: true,
      },
    },
    renderer: 'ModalBlock',
  },
  'quiz-multiple-choice': {
    type: 'quiz-multiple-choice',
    name: 'Múltipla Escolha',
    description: 'Quiz de múltipla escolha com feedback',
    icon: 'CheckSquare',
    category: 'quiz',
    validation: [
      { field: 'content.question', type: 'required', message: 'Pergunta é obrigatória' },
      { field: 'content.alternatives', type: 'required', message: 'Pelo menos 2 alternativas são obrigatórias' },
    ],
    defaultProps: {
      type: 'quiz-multiple-choice',
      content: {
        question: 'Qual é a resposta correta?',
        alternatives: [
          { text: 'Alternativa 1', isCorrect: false },
          { text: 'Alternativa 2', isCorrect: true },
        ],
        feedbacks: [
          { text: 'Resposta incorreta!', type: 'incorrect' },
          { text: 'Parabéns! Resposta correta!', type: 'correct' },
        ],
        showFeedback: true,
        blockNavigation: false,
      },
    },
    renderer: 'QuizMultipleChoiceBlock',
  },
  'quiz-true-false': {
    type: 'quiz-true-false',
    name: 'Verdadeiro ou Falso',
    description: 'Quiz de verdadeiro ou falso',
    icon: 'CheckCircle',
    category: 'quiz',
    validation: [
      { field: 'content.question', type: 'required', message: 'Pergunta é obrigatória' },
      { field: 'content.correctAnswer', type: 'required', message: 'Resposta correta é obrigatória' },
    ],
    defaultProps: {
      type: 'quiz-true-false',
      content: {
        question: 'Esta afirmação é verdadeira ou falsa?',
        correctAnswer: true,
        feedbacks: [
          { text: 'Resposta incorreta!', type: 'incorrect' },
          { text: 'Parabéns! Resposta correta!', type: 'correct' },
        ],
        showFeedback: true,
      },
    },
    renderer: 'QuizTrueFalseBlock',
  },
  'quiz-enumeration': {
    type: 'quiz-enumeration',
    name: 'Enumeração',
    description: 'Quiz de enumeração com múltiplas alternativas',
    icon: 'ListOrdered',
    category: 'quiz',
    validation: [
      { field: 'content.question', type: 'required', message: 'Pergunta é obrigatória' },
      { field: 'content.items', type: 'required', message: 'Pelo menos 1 item é obrigatório' },
    ],
    defaultProps: {
      type: 'quiz-enumeration',
      content: {
        question: 'Enumere os itens solicitados:',
        items: [
          'Item 1',
          'Item 2',
          'Item 3',
        ],
        feedbacks: [
          { text: 'Alguns itens estão incorretos!', type: 'incorrect' },
          { text: 'Parabéns! Todos os itens estão corretos!', type: 'correct' },
        ],
        showFeedback: true,
      },
    },
    renderer: 'QuizEnumerationBlock',
  },
  'quiz-essay': {
    type: 'quiz-essay',
    name: 'Dissertativo',
    description: 'Questão dissertativa com limite de texto',
    icon: 'Edit3',
    category: 'quiz',
    validation: [
      { field: 'content.question', type: 'required', message: 'Pergunta é obrigatória' },
    ],
    defaultProps: {
      type: 'quiz-essay',
      content: {
        question: 'Escreva sua resposta dissertativa:',
        minWords: 50,
        maxWords: 500,
        placeholder: 'Digite sua resposta aqui...',
        showWordCount: true,
      },
    },
    renderer: 'QuizEssayBlock',
  },
};

// Mapeamento de componentes
export const BLOCK_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'HeadingBlock': HeadingBlock,
  'TextBlock': TextBlock,
  'ImageBlock': ImageBlock,
  'VideoBlock': VideoBlock,
  'AudioBlock': AudioBlock,
  'TableBlock': TableBlock,
  'BadgeBlock': BadgeBlock,
  'CarouselBlock': CarouselBlock,
  'TabsBlock': TabsBlock,
  'AccordionBlock': AccordionBlock,
  'DividerBlock': DividerBlock,
  'ModalBlock': ModalBlock,
  'QuizMultipleChoiceBlock': QuizMultipleChoiceBlock,
  'QuizTrueFalseBlock': QuizTrueFalseBlock,
  'QuizEnumerationBlock': QuizEnumerationBlock,
  'QuizEssayBlock': QuizEssayBlock,
};

// Função para obter o componente de um bloco
export function getBlockComponent(blockType: string): React.ComponentType<any> | null {
  const manifest = BLOCK_MANIFESTS[blockType];
  if (!manifest) return null;
  
  return BLOCK_COMPONENTS[manifest.renderer] || null;
}

// Função para obter o manifest de um bloco
export function getBlockManifest(blockType: string): BlockManifest | null {
  return BLOCK_MANIFESTS[blockType] || null;
}

// Função para obter todos os blocos por categoria
export function getBlocksByCategory(category: string): BlockManifest[] {
  return Object.values(BLOCK_MANIFESTS).filter(manifest => manifest.category === category);
}

// Função para obter todas as categorias
export function getBlockCategories(): string[] {
  const categories = new Set(Object.values(BLOCK_MANIFESTS).map(manifest => manifest.category));
  return Array.from(categories).sort();
}
