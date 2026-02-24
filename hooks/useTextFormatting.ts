import React, { useState, useCallback } from 'react';

export type UnorderedListMarkerStyle = 'dash' | 'bullet' | 'circle' | 'square' | 'asterisk';
export type OrderedListStyle = 'decimal' | 'alpha';

export interface TextFormats {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  listMarkerStyle?: UnorderedListMarkerStyle;
  orderedListActive?: boolean;
  orderedListStyle?: OrderedListStyle;
}

/** Converte formatos de texto em objeto de estilo CSS (exportado para uso em TableBlock etc.) */
export function getStyleFromFormats(formats: TextFormats): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (formats.bold) style.fontWeight = 'bold';
  if (formats.italic) style.fontStyle = 'italic';
  if (formats.underline) style.textDecoration = 'underline';
  if (formats.fontSize) style.fontSize = `${formats.fontSize}px`;
  if (formats.color) style.color = formats.color;
  if (formats.backgroundColor) style.backgroundColor = formats.backgroundColor;
  if (formats.align) {
    switch (formats.align) {
      case 'left': style.textAlign = 'left'; break;
      case 'center': style.textAlign = 'center'; break;
      case 'right': style.textAlign = 'right'; break;
      case 'justify': style.textAlign = 'justify'; break;
    }
  }
  return style;
}

export const useTextFormatting = (initialFormats: TextFormats = {}) => {
  const [formats, setFormats] = useState<TextFormats>(initialFormats);

  const updateFormat = useCallback((format: keyof TextFormats, value: any) => {
    setFormats(prev => ({
      ...prev,
      [format]: value
    }));
  }, []);

  const resetFormats = useCallback(() => {
    setFormats({});
  }, []);

  const getStyleFromFormatsFromHook = useCallback((formatsArg: TextFormats): React.CSSProperties => {
    return getStyleFromFormats(formatsArg);
  }, []);

  const applyFormatsToElement = useCallback((element: HTMLElement, formats: TextFormats) => {
    const style = getStyleFromFormats(formats);
    Object.entries(style).forEach(([key, value]) => {
      (element.style as any)[key] = value;
    });
  }, []);

  return {
    formats,
    updateFormat,
    resetFormats,
    getStyleFromFormats: getStyleFromFormatsFromHook,
    applyFormatsToElement
  };
};

