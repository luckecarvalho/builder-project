import { ValidationRule, BlockProps, Page } from '@/types/builder';

/** Limite de caracteres do texto de cada ponto de interação no bloco imagem */
export const IMAGE_INTERACTION_POINT_TEXT_MAX_CHARS = 1000;

export class ValidationError {
  constructor(
    public field: string,
    public message: string,
    public value?: any
  ) {}
}

export class PageValidator {
  private static validateField(value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          errors.push(new ValidationError(rule.field, rule.message, value));
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          errors.push(new ValidationError(rule.field, rule.message, value));
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          errors.push(new ValidationError(rule.field, rule.message, value));
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          errors.push(new ValidationError(rule.field, rule.message, value));
        }
        break;

      case 'custom':
        if (rule.value && !rule.value(value)) {
          errors.push(new ValidationError(rule.field, rule.message, value));
        }
        break;
    }

    return errors;
  }

  static validateBlock(block: BlockProps, rules: ValidationRule[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const fieldValue = this.getNestedValue(block, rule.field);
      const fieldErrors = this.validateField(fieldValue, rule);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  static validatePage(page: Page): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validar metadados
    if (!page.metadata.title || page.metadata.title.trim() === '') {
      errors.push(new ValidationError('metadata.title', 'Título é obrigatório'));
    }

    if (!page.metadata.slug || page.metadata.slug.trim() === '') {
      errors.push(new ValidationError('metadata.slug', 'Slug é obrigatório'));
    }

    // Validar que há pelo menos uma row
    if (!page.rows || page.rows.length === 0) {
      errors.push(new ValidationError('rows', 'Página deve ter pelo menos uma seção'));
    }

    // Validar grid de colunas
    for (const row of page.rows) {
      if (!row.columns || row.columns.length === 0) {
        errors.push(new ValidationError(`row-${row.id}`, 'Seção deve ter pelo menos uma coluna'));
        continue;
      }

      // Validar soma dos spans não excede 12
      const totalSpan = this.calculateTotalSpan(row.columns);
      if (totalSpan > 12) {
        errors.push(new ValidationError(`row-${row.id}`, `Soma dos spans (${totalSpan}) excede 12 colunas`));
      }

      // Validar blocos
      for (const column of row.columns) {
        for (const block of column.blocks) {
          const blockErrors = this.validateBlockContent(block.props);
          errors.push(...blockErrors.map(error => ({
            ...error,
            field: `${row.id}-${column.id}-${block.props.id}-${error.field}`
          })));
        }
      }
    }

    return errors;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static calculateTotalSpan(columns: any[]): number {
    // Para simplificar, assumimos que estamos validando no breakpoint 'lg'
    return columns.reduce((total, column) => {
      const span = column.grid?.span?.lg || column.grid?.span?.md || column.grid?.span?.sm || column.grid?.span?.xs || 12;
      return total + span;
    }, 0);
  }

  private static validateBlockContent(props: BlockProps): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (props.type) {
      case 'heading': {
        const headingPlain = ValidationUtils.stripHtmlTags(props.content.text || '').trim();
        if (!headingPlain) {
          errors.push(new ValidationError('content.text', 'Texto do título é obrigatório'));
        }
        if (props.content.maxChars && headingPlain.length > props.content.maxChars) {
          errors.push(new ValidationError('content.text', `Título excede limite de ${props.content.maxChars} caracteres`));
        }
        break;
      }

      case 'text': {
        const htmlRaw = props.content.html || '';
        const textPlain = ValidationUtils.stripHtmlTags(htmlRaw).trim();
        if (!textPlain) {
          errors.push(new ValidationError('content.html', 'Conteúdo de texto é obrigatório'));
        }
        if (props.content.maxChars && textPlain.length > props.content.maxChars) {
          errors.push(new ValidationError('content.html', `Texto excede limite de ${props.content.maxChars} caracteres`));
        }
        break;
      }

      case 'image':
        if (!props.content.alt || props.content.alt.trim() === '') {
          errors.push(new ValidationError('content.alt', 'Texto alternativo é obrigatório para acessibilidade'));
        }
        if (props.content.interactionEnabled && Array.isArray(props.content.interactionPoints)) {
          props.content.interactionPoints.forEach((point: { text?: string } | undefined, index: number) => {
            const raw = String(point?.text ?? '');
            const t = raw.trim();
            if (!t) {
              errors.push(
                new ValidationError(
                  `content.interactionPoints[${index}].text`,
                  'Texto do ponto de interação é obrigatório'
                )
              );
            } else if (raw.length > IMAGE_INTERACTION_POINT_TEXT_MAX_CHARS) {
              errors.push(
                new ValidationError(
                  `content.interactionPoints[${index}].text`,
                  `Texto do ponto de interação deve ter no máximo ${IMAGE_INTERACTION_POINT_TEXT_MAX_CHARS} caracteres`
                )
              );
            }
          });
        }
        break;

      case 'badge':
        if (!props.content.src || props.content.src.trim() === '') {
          errors.push(new ValidationError('content.src', 'Imagem do selo é obrigatória'));
        }
        if (!props.content.alt || props.content.alt.trim() === '') {
          errors.push(new ValidationError('content.alt', 'Texto alternativo do selo é obrigatório'));
        }
        break;

      case 'video':
        if (!props.content.url || props.content.url.trim() === '') {
          errors.push(new ValidationError('content.url', 'URL do vídeo é obrigatória'));
        }
        if (!props.content.title || props.content.title.trim() === '') {
          errors.push(new ValidationError('content.title', 'Título do vídeo é obrigatório'));
        }
        if (!props.content.description || props.content.description.trim() === '') {
          errors.push(new ValidationError('content.description', 'Descrição do vídeo é obrigatória para acessibilidade'));
        }
        break;

      case 'audio':
        if (!props.content.src || props.content.src.trim() === '') {
          errors.push(new ValidationError('content.src', 'URL do áudio é obrigatória'));
        }
        if (!props.content.title || props.content.title.trim() === '') {
          errors.push(new ValidationError('content.title', 'Título do áudio é obrigatório'));
        }
        break;

      case 'button':
        if (!props.content.label || props.content.label.trim() === '') {
          errors.push(new ValidationError('content.label', 'Rótulo do botão é obrigatório'));
        }
        if (!props.content.url || props.content.url.trim() === '') {
          errors.push(new ValidationError('content.url', 'URL do botão é obrigatória'));
        }
        break;

      case 'quiz-multiple-choice':
        if (!props.content.question || props.content.question.trim() === '') {
          errors.push(new ValidationError('content.question', 'Pergunta é obrigatória'));
        }
        if (!props.content.alternatives || props.content.alternatives.length < 2) {
          errors.push(new ValidationError('content.alternatives', 'Pelo menos 2 alternativas são obrigatórias'));
        }
        if (!props.content.alternatives || props.content.alternatives.length > 6) {
          errors.push(new ValidationError('content.alternatives', 'Máximo de 6 alternativas permitidas'));
        }
        const hasCorrectAnswer = props.content.alternatives?.some((alt: any) => alt.isCorrect);
        if (!hasCorrectAnswer) {
          errors.push(new ValidationError('content.alternatives', 'Pelo menos uma alternativa deve ser marcada como correta'));
        }
        break;

      case 'quiz-true-false':
        // Apenas content.question: o bloco e o painel usam "Pergunta" (não content.text)
        if (!props.content.question || String(props.content.question).trim() === '') {
          errors.push(new ValidationError('content.question', 'Pergunta é obrigatória'));
        }
        if (props.content.correctAnswer === undefined || props.content.correctAnswer === null) {
          errors.push(new ValidationError('content.correctAnswer', 'Resposta correta é obrigatória'));
        }
        break;

      case 'quiz-enumeration':
        if (!props.content.question || props.content.question.trim() === '') {
          errors.push(new ValidationError('content.question', 'Pergunta é obrigatória'));
        }
        if (!props.content.alternatives || props.content.alternatives.length < 3) {
          errors.push(new ValidationError('content.alternatives', 'Pelo menos 3 alternativas são obrigatórias'));
        }
        if (!props.content.alternatives || props.content.alternatives.length > 6) {
          errors.push(new ValidationError('content.alternatives', 'Máximo de 6 alternativas permitidas'));
        }
        break;

      case 'quiz-essay':
        if (!props.content.question || props.content.question.trim() === '') {
          errors.push(new ValidationError('content.question', 'Pergunta é obrigatória'));
        }
        break;

      case 'carousel': {
        const items = Array.isArray(props.content.items) && props.content.items.length > 0
          ? props.content.items
          : [
              { title: '', text: '' },
            ];

        if (!props.content.items || props.content.items.length === 0) {
          errors.push(new ValidationError('content.items', 'Carrossel deve ter pelo menos um item'));
        }

        items.forEach((item: any, index: number) => {
          const titlePlain = ValidationUtils.stripHtmlTags(String(item?.title ?? '')).trim();
          if (!item?.title || titlePlain === '') {
            errors.push(
              new ValidationError(
                `content.items[${index}].title`,
                `Título do slide ${index + 1} é obrigatório`
              )
            );
          }
          const textPlain = ValidationUtils.stripHtmlTags(String(item?.text ?? '')).trim();
          if (!item?.text || textPlain === '') {
            errors.push(
              new ValidationError(
                `content.items[${index}].text`,
                `Texto do slide ${index + 1} é obrigatório`
              )
            );
          }
        });
        break;
      }

      case 'tabs': {
        const tabs = Array.isArray(props.content.tabs) && props.content.tabs.length > 0
          ? props.content.tabs
          : [
              { title: '', content: '' },
              { title: '', content: '' },
            ];

        if (!props.content.tabs || props.content.tabs.length < 2) {
          errors.push(new ValidationError('content.tabs', 'Tabs devem ter pelo menos 2 abas'));
        }

        tabs.forEach((tab: any, index: number) => {
          const titlePlain = ValidationUtils.stripHtmlTags(String(tab?.title ?? '')).trim();
          if (!tab?.title || titlePlain === '') {
            errors.push(
              new ValidationError(
                `content.tabs[${index}].title`,
                `Título da aba ${index + 1} é obrigatório`
              )
            );
          }
          const contentPlain = ValidationUtils.stripHtmlTags(String(tab?.content ?? '')).trim();
          if (!tab?.content || contentPlain === '') {
            errors.push(
              new ValidationError(
                `content.tabs[${index}].content`,
                `Conteúdo da aba ${index + 1} é obrigatório`
              )
            );
          }
        });
        break;
      }

      case 'accordion': {
        const items = Array.isArray(props.content.items) && props.content.items.length > 0
          ? props.content.items
          : [
              { title: '', content: '' },
              { title: '', content: '' },
            ];

        if (!props.content.items || props.content.items.length === 0) {
          errors.push(new ValidationError('content.items', 'Accordion deve ter pelo menos um item'));
        }

        items.forEach((item: any, index: number) => {
          const titlePlain = ValidationUtils.stripHtmlTags(String(item?.title ?? '')).trim();
          if (!item?.title || titlePlain === '') {
            errors.push(
              new ValidationError(
                `content.items[${index}].title`,
                `Título do item ${index + 1} é obrigatório`
              )
            );
          }
          const contentPlain = ValidationUtils.stripHtmlTags(String(item?.content ?? '')).trim();
          if (!item?.content || contentPlain === '') {
            errors.push(
              new ValidationError(
                `content.items[${index}].content`,
                `Conteúdo do item ${index + 1} é obrigatório`
              )
            );
          }
          // Validação opcional de imagem por item: se campo image existir, src é obrigatório
          if (item?.image) {
            if (!item.image.src || String(item.image.src).trim() === '') {
              errors.push(
                new ValidationError(
                  `content.items[${index}].image.src`,
                  `Imagem do item ${index + 1} do accordion é obrigatória`
                )
              );
            }
          }
        });
        break;
      }

      case 'modal':
        if (!props.content.modalData?.title || String(props.content.modalData.title).trim() === '') {
          errors.push(
            new ValidationError(
              'content.modalData.title',
              'Título do modal é obrigatório'
            )
          );
        }
        if (!props.content.modalData?.text || String(props.content.modalData.text).trim() === '') {
          errors.push(
            new ValidationError(
              'content.modalData.text',
              'Texto do modal é obrigatório'
            )
          );
        }
        if (!props.content.trigger?.content?.label || String(props.content.trigger.content.label).trim() === '') {
          errors.push(
            new ValidationError(
              'content.trigger.content.label',
              'Texto do botão do modal é obrigatório'
            )
          );
        }
        break;

      case 'embed':
        if (!props.content.iframe || String(props.content.iframe).trim() === '') {
          errors.push(
            new ValidationError(
              'content.iframe',
              'Código do iframe é obrigatório'
            )
          );
        }
        break;

      case 'table':
        if (!props.content.headers || props.content.headers.length === 0) {
          errors.push(new ValidationError('content.headers', 'Tabela deve ter pelo menos um cabeçalho'));
        }
        if (!props.content.rows || props.content.rows.length === 0) {
          errors.push(new ValidationError('content.rows', 'Tabela deve ter pelo menos uma linha'));
        }
        break;
    }

    return errors;
  }
}

// Validações específicas para templates
export class TemplateValidator {
  static validateTemplateBasico(blocks: BlockProps[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    const headingBlock = blocks.find(b => b.type === 'heading');
    const textBlock = blocks.find(b => b.type === 'text');

    if (!headingBlock) {
      errors.push(new ValidationError('heading', 'Template Básico requer um bloco de título'));
    } else {
      if (!headingBlock.content.text || headingBlock.content.text.trim() === '') {
        errors.push(new ValidationError('heading.text', 'Título é obrigatório'));
      }
      if (headingBlock.content.text && headingBlock.content.text.length > 100) {
        errors.push(new ValidationError('heading.text', 'Título deve ter no máximo 100 caracteres'));
      }
    }

    if (!textBlock) {
      errors.push(new ValidationError('text', 'Template Básico requer um bloco de texto'));
    } else {
      if (!textBlock.content.html || textBlock.content.html.trim() === '') {
        errors.push(new ValidationError('text.html', 'Texto é obrigatório'));
      }
      if (textBlock.content.html && textBlock.content.html.length > 1000) {
        errors.push(new ValidationError('text.html', 'Texto deve ter no máximo 1000 caracteres'));
      }
    }

    return errors;
  }

  static validateTemplateColunas(blocks: BlockProps[], numColumns: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    const headingBlock = blocks.find(b => b.type === 'heading');
    const textBlock = blocks.find(b => b.type === 'text');
    const cardBlocks = blocks.filter(b => b.type === 'card');

    // Validar título principal
    if (!headingBlock) {
      errors.push(new ValidationError('heading', 'Template Colunas requer um bloco de título'));
    } else {
      if (headingBlock.content.text && headingBlock.content.text.length > 500) {
        errors.push(new ValidationError('heading.text', 'Título deve ter no máximo 500 caracteres'));
      }
    }

    // Validar texto principal
    if (!textBlock) {
      errors.push(new ValidationError('text', 'Template Colunas requer um bloco de texto'));
    } else {
      if (textBlock.content.html && textBlock.content.html.length > 4500) {
        errors.push(new ValidationError('text.html', 'Texto deve ter no máximo 4500 caracteres'));
      }
    }

    // Validar cartões das colunas
    if (cardBlocks.length !== numColumns) {
      errors.push(new ValidationError('cards', `Template deve ter exatamente ${numColumns} cartões`));
    }

    cardBlocks.forEach((card, index) => {
      if (!card.content.title || card.content.title.trim() === '') {
        errors.push(new ValidationError(`card-${index}.title`, 'Título do cartão é obrigatório'));
      }
      if (card.content.title && card.content.title.length > 100) {
        errors.push(new ValidationError(`card-${index}.title`, 'Título do cartão deve ter no máximo 100 caracteres'));
      }
      if (!card.content.text || card.content.text.trim() === '') {
        errors.push(new ValidationError(`card-${index}.text`, 'Texto do cartão é obrigatório'));
      }
      if (card.content.text && card.content.text.length > 300) {
        errors.push(new ValidationError(`card-${index}.text`, 'Texto do cartão deve ter no máximo 300 caracteres'));
      }
    });

    return errors;
  }

  static validateTemplateWide(blocks: BlockProps[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    const headingBlock = blocks.find(b => b.type === 'heading');
    const textBlock = blocks.find(b => b.type === 'text');
    const imageBlock = blocks.find(b => b.type === 'image');

    // Validar título
    if (!headingBlock) {
      errors.push(new ValidationError('heading', 'Template Wide requer um bloco de título'));
    } else {
      if (headingBlock.content.text && headingBlock.content.text.length > 500) {
        errors.push(new ValidationError('heading.text', 'Título deve ter no máximo 500 caracteres'));
      }
    }

    // Validar texto
    if (!textBlock) {
      errors.push(new ValidationError('text', 'Template Wide requer um bloco de texto'));
    } else {
      if (textBlock.content.html && textBlock.content.html.length > 4500) {
        errors.push(new ValidationError('text.html', 'Texto deve ter no máximo 4500 caracteres'));
      }
    }

    // Validar imagem
    if (!imageBlock) {
      errors.push(new ValidationError('image', 'Template Wide requer um bloco de imagem'));
    } else {
      if (!imageBlock.content.src || imageBlock.content.src.trim() === '') {
        errors.push(new ValidationError('image.src', 'Imagem é obrigatória'));
      }
      if (!imageBlock.content.alt || imageBlock.content.alt.trim() === '') {
        errors.push(new ValidationError('image.alt', 'Texto alternativo é obrigatório'));
      }
      // Validar dimensões recomendadas (845x500)
      if (imageBlock.content.recommendedSize) {
        const { width, height } = imageBlock.content.recommendedSize;
        if (width !== 845 || height !== 500) {
          errors.push(new ValidationError('image.size', 'Imagem deve ter dimensões 845x500 pixels'));
        }
      }
    }

    return errors;
  }
}

// Utilitários de validação
export class ValidationUtils {
  /** Texto visível sem tags HTML (contagem de caracteres, campos obrigatórios) */
  static stripHtmlTags(html: string): string {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<[^>]+>/g, '');
  }

  static sanitizeHtml(html: string, allowLinks = true): string {
    // Remover tags perigosas
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link', 'meta'];
    let sanitized = html;
    
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    // Se não permitir links, remover tags <a>
    if (!allowLinks) {
      sanitized = sanitized.replace(/<a[^>]*>.*?<\/a>/gi, '');
    }

    return sanitized;
  }

  static validateImageDimensions(src: string, recommendedWidth: number, recommendedHeight: number): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const isValid = img.width === recommendedWidth && img.height === recommendedHeight;
        resolve(isValid);
      };
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  static validateUrl(url: string, allowedTypes: string[] = ['http', 'https']): boolean {
    try {
      const urlObj = new URL(url);
      return allowedTypes.includes(urlObj.protocol.slice(0, -1));
    } catch {
      return false;
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug) && slug.length > 0;
  }

  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Formatos permitidos
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    // Verificar formato pelo MIME type
    if (!allowedFormats.includes(file.type)) {
      // Verificar também pela extensão como fallback
      const fileName = file.name.toLowerCase();
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidExtension) {
        return {
          isValid: false,
          error: `Formato não suportado. Formatos permitidos: ${allowedExtensions.join(', ')}`
        };
      }
    }

    // Verificar tamanho
    const maxSizeBytes = file.type === 'image/gif' ? 1024 * 1024 : 500 * 1024; // 1024 KB para GIF, 500 KB para outros
    const maxSizeKB = file.type === 'image/gif' ? 1024 : 500;
    
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${maxSizeKB} KB${file.type === 'image/gif' ? ' (GIF)' : ''}`
      };
    }

    return { isValid: true };
  }

  static validateBadgeImageFile(file: File): { isValid: boolean; error?: string } {
    // Formatos permitidos
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    // Verificar formato pelo MIME type
    if (!allowedFormats.includes(file.type)) {
      // Verificar também pela extensão como fallback
      const fileName = file.name.toLowerCase();
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidExtension) {
        return {
          isValid: false,
          error: `Formato não suportado. Formatos permitidos: ${allowedExtensions.join(', ')}`
        };
      }
    }

    // Para selo, não validamos tamanho - aceita qualquer tamanho
    return { isValid: true };
  }
}

