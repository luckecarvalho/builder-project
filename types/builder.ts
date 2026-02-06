// Builder Flexível - Tipos Fundamentais

export interface PageMetadata {
  title: string;
  description?: string;
  slug: string;
  tags: string[];
  version: string;
  status: 'draft' | 'published' | 'archived';
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BreakpointConfig {
  xs?: number; // <576px
  sm?: number; // ≥576px
  md?: number; // ≥768px
  lg?: number; // ≥992px
  xl?: number; // ≥1200px
}

export interface GridConfig {
  span: BreakpointConfig;
  offset?: BreakpointConfig;
  order?: BreakpointConfig;
  hide?: BreakpointConfig;
}

export interface BackgroundConfig {
  type: 'color' | 'image' | 'video' | 'gradient';
  value: string;
  opacity?: number;
  position?: string;
  size?: string;
  repeat?: string;
}

export interface SpacingConfig {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  x?: number; // horizontal
  y?: number; // vertical
}

export interface StyleConfig {
  background?: BackgroundConfig;
  padding?: SpacingConfig;
  margin?: SpacingConfig;
  borderRadius?: number;
  boxShadow?: string;
  border?: {
    width: number;
    style: string;
    color: string;
  };
  minHeight?: number;
  maxWidth?: number;
}

export interface AccessibilityConfig {
  ariaLabel?: string;
  role?: string;
  tabIndex?: number;
  alt?: string; // para imagens
  caption?: string; // para vídeos
  description?: string; // para mídias
}

export interface BlockProps {
  // Identidade
  id: string;
  type: string;
  version: string;
  tags?: string[];
  label?: string;
  
  // Conteúdo (específico por tipo)
  content: Record<string, any>;
  
  // Estilo
  style?: {
    typography?: {
      fontSize?: number;
      fontWeight?: string;
      fontFamily?: string;
      lineHeight?: number;
      color?: string;
      textAlign?: 'left' | 'center' | 'right' | 'justify';
    };
    spacing?: SpacingConfig;
    colors?: {
      text?: string;
      background?: string;
      border?: string;
    };
    effects?: {
      shadow?: string;
      borderRadius?: number;
      opacity?: number;
    };
  };
  
  // Layout
  layout?: {
    maxWidth?: number;
    alignment?: 'left' | 'center' | 'right';
    zIndex?: number;
    wrap?: boolean;
    visibility?: BreakpointConfig;
  };
  
  // Acessibilidade
  accessibility?: AccessibilityConfig;
  
  // Dados/Binding (opcional)
  dataBinding?: {
    variables?: Record<string, any>;
    placeholders?: Record<string, string>;
    i18nKeys?: Record<string, string>;
  };
}

export interface Column {
  id: string;
  grid: GridConfig;
  blocks: Block[];
}

export interface Row {
  id: string;
  style: StyleConfig;
  columns: Column[];
  order?: number;
}

export interface Page {
  version: string;
  metadata: PageMetadata;
  rows: Row[];
}

export interface Block {
  props: BlockProps;
}

// Tipos específicos para cada bloco
export interface HeadingBlockProps extends BlockProps {
  content: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    text: string;
    maxChars?: number;
    alignment?: 'left' | 'center' | 'right';
  };
}

export interface TextBlockProps extends BlockProps {
  content: {
    html: string;
    maxChars?: number;
    allowHtml?: boolean;
    allowLinks?: boolean;
  };
}

export interface ImageBlockProps extends BlockProps {
  content: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    lazyLoad?: boolean;
    recommendedSize?: {
      width: number;
      height: number;
    };
  };
}

export interface VideoBlockProps extends BlockProps {
  content: {
    url: string;
    type: 'youtube' | 'vimeo' | 'url';
    title: string;
    autoplay?: boolean;
    controls?: boolean;
    subtitles?: string; // URL do arquivo VTT
    description: string;
  };
}

export interface AudioBlockProps extends BlockProps {
  content: {
    src: string;
    title: string;
    controls?: boolean;
    transcript?: string;
    caption?: string;
  };
}

export interface ButtonBlockProps extends BlockProps {
  content: {
    label: string;
    url: string;
    type: 'internal' | 'external';
    icon?: string;
    size: 'small' | 'medium' | 'large';
    variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  };
}

export interface CardBlockProps extends BlockProps {
  content: {
    image?: {
      src: string;
      alt: string;
    };
    title: string;
    text: string;
    actions?: ButtonBlockProps[];
    badge?: {
      src: string;
      alt: string;
      text?: string;
    };
    variant: 'simple' | 'with-badge';
  };
}

export interface ListBlockProps extends BlockProps {
  content: {
    items: Array<{
      title: string;
      text: string;
      icon?: string;
      position?: {
        x: number;
        y: number;
      };
    }>;
    baseImage?: {
      src: string;
      alt: string;
    };
  };
}

export interface TableBlockProps extends BlockProps {
  content: {
    headers: string[];
    rows: string[][];
    format: 'basic' | 'striped' | 'bordered';
    borderRows?: boolean;
    borderColumns?: boolean;
    borderOuter?: boolean;
  };
}

export interface BadgeBlockProps extends BlockProps {
  content: {
    image?: {
      src: string;
      alt: string;
    };
    icon?: string;
    text?: string;
    size: number;
  };
}

export interface CarouselBlockProps extends BlockProps {
  content: {
    items: Array<{
      image?: {
        src: string;
        alt: string;
      };
      title: string;
      text: string;
      button?: ButtonBlockProps;
    }>;
    autoplay?: boolean;
    showArrows?: boolean;
    showDots?: boolean;
  };
}

export interface TabsBlockProps extends BlockProps {
  content: {
    tabs: Array<{
      title: string;
      content: string;
    }>;
    activeTab: number;
    borderOuter?: boolean;
  };
}

export interface AccordionBlockProps extends BlockProps {
  content: {
    items: Array<{
      title: string;
      content: string;
      isOpen: boolean;
    }>;
    borderOuter?: boolean;
  };
}

export interface DividerBlockProps extends BlockProps {
  content: {
    type: 'line' | 'space';
    thickness?: number;
    color?: string;
    spacing?: number;
    direction?: 'horizontal' | 'vertical';
  };
}

export interface ContainerBlockProps extends BlockProps {
  content: {
    blocks: Block[];
    padding?: SpacingConfig;
    shadow?: string;
    border?: {
      width: number;
      style: string;
      color: string;
    };
    background?: BackgroundConfig;
  };
}

export interface IconBlockProps extends BlockProps {
  content: {
    name: string;
    library: 'material' | 'fontawesome' | 'lucide';
    size: number;
    color: string;
  };
}

export interface ModalBlockProps extends BlockProps {
  content: {
    trigger: Block;
    modalData?: {
      title: string;
      text: string;
      hasImage: boolean;
      imageUrl: string;
      imageAlt: string;
    };
    content: Block[];
    focusOnOpen?: string;
    closeOnEscape?: boolean;
  };
}

export interface QuizMultipleChoiceBlockProps extends BlockProps {
  content: {
    question: string;
    alternatives: Array<{
      text: string;
      isCorrect: boolean;
    }>;
    feedbacks: Array<{
      text: string;
      type: 'correct' | 'incorrect' | 'general';
    }>;
    showFeedback?: boolean;
    blockNavigation?: boolean;
  };
}

export interface QuizTrueFalseBlockProps extends BlockProps {
  content: {
    question: string;
    correctAnswer: boolean;
    feedbacks: Array<{
      text: string;
      type: 'correct' | 'incorrect';
    }>;
    showFeedback?: boolean;
  };
}

export interface QuizEnumerationBlockProps extends BlockProps {
  content: {
    question: string;
    items: string[];
    feedbacks: Array<{
      text: string;
      type: 'correct' | 'incorrect';
    }>;
    showFeedback?: boolean;
  };
}

export interface QuizEssayBlockProps extends BlockProps {
  content: {
    question: string;
    minWords?: number;
    maxWords?: number;
    placeholder?: string;
    showWordCount?: boolean;
  };
}

export interface QuizSimulationBlockProps extends BlockProps {
  content: {
    questions: Block[];
    approvalRules: {
      minimumScore: number;
      attempts: number;
    };
    randomBank: boolean;
  };
}

// Union type para todos os tipos de blocos
export type BlockType = 
  | HeadingBlockProps
  | TextBlockProps
  | ImageBlockProps
  | VideoBlockProps
  | AudioBlockProps
  | ButtonBlockProps
  | TableBlockProps
  | BadgeBlockProps
  | CarouselBlockProps
  | TabsBlockProps
  | AccordionBlockProps
  | DividerBlockProps
  | ContainerBlockProps
  | ModalBlockProps
  | QuizMultipleChoiceBlockProps
  | QuizTrueFalseBlockProps
  | QuizEnumerationBlockProps
  | QuizEssayBlockProps;

// Configurações de validação
export interface ValidationRule {
  field: string;
  type: 'required' | 'maxLength' | 'minLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface BlockManifest {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  validation: ValidationRule[];
  defaultProps: Partial<BlockProps>;
  renderer: string; // Componente React
}

// Configurações de tema
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

// Eventos de telemetria
export interface TelemetryEvent {
  type: 'block_view' | 'block_interact' | 'quiz_submit' | 'quiz_result';
  blockId?: string;
  blockType?: string;
  data?: Record<string, any>;
  timestamp: Date;
  sessionId: string;
}

// Configurações de internacionalização
export interface I18nConfig {
  locale: string;
  translations: Record<string, string>;
  fallbackLocale: string;
}

// Hooks de build/publicação
export interface BuildHook {
  name: string;
  execute: (page: Page) => Promise<{ success: boolean; errors: string[] }>;
}

export interface PublishHook {
  name: string;
  execute: (page: Page) => Promise<{ success: boolean; url?: string; errors: string[] }>;
}

