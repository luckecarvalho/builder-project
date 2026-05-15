import type { TextFormats, UnorderedListMarkerStyle, OrderedListStyle } from '@/hooks/useTextFormatting';

const UNORDERED_MARKER_IDS: readonly UnorderedListMarkerStyle[] = [
  'dash',
  'bullet',
  'circle',
  'square',
  'asterisk',
];

/** Valor CSS de `list-style-type` para cada opção da toolbar (listas não ordenadas). */
export function markerStyleToListStyleTypeCss(marker: UnorderedListMarkerStyle): string {
  switch (marker) {
    case 'dash':
      return '"- "';
    case 'asterisk':
      return '"* "';
    case 'circle':
      return 'circle';
    case 'square':
      return 'square';
    case 'bullet':
    default:
      return 'disc';
  }
}

/** Interpreta `getComputedStyle(ul).listStyleType` para o estado da toolbar. */
export function listStyleTypeCssToMarker(css: string): UnorderedListMarkerStyle {
  let v = css.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  const lower = v.toLowerCase();
  if (lower === 'circle') return 'circle';
  if (lower === 'square') return 'square';
  if (lower === 'disc') return 'bullet';
  if (v === '-' || v === '- ' || v === '–' || v === '—') return 'dash';
  if (v === '*' || v === '* ') return 'asterisk';
  return 'bullet';
}

export function isUnorderedListMarkerValue(v: unknown): v is UnorderedListMarkerStyle {
  return typeof v === 'string' && (UNORDERED_MARKER_IDS as readonly string[]).includes(v);
}

/**
 * Garante um range colapsado dentro do editor (ex.: foco veio da toolbar e a seleção ainda está fora).
 */
export function ensureSelectionInsideEditor(editor: HTMLElement): void {
  const sel = window.getSelection();
  if (!sel) return;
  if (sel.rangeCount > 0) {
    try {
      const r = sel.getRangeAt(0);
      if (editor.contains(r.commonAncestorContainer)) return;
    } catch {
      /* continuar */
    }
  }
  const r = document.createRange();
  const textEmpty =
    (editor.textContent ?? '').replace(/\u200b/g, '').trim() === '' &&
    !editor.querySelector('ul, ol, table, img');
  if (textEmpty) {
    // Colapsar no início: em <div><br></div> o fim do conteúdo quebra insertUnorderedList em alguns browsers
    r.setStart(editor, 0);
    r.collapse(true);
  } else {
    r.selectNodeContents(editor);
    r.collapse(false);
  }
  sel.removeAllRanges();
  sel.addRange(r);
}

function isEditorDomVisuallyEmpty(editor: HTMLElement): boolean {
  if (editor.querySelector('ul, ol, table, img')) return false;
  const raw = (editor.innerHTML ?? '').trim();
  if (raw === '' || raw === '<br>' || /^<br\s*\/?>$/i.test(raw)) return true;
  const t = (editor.textContent ?? '').replace(/\u200b/g, '').trim();
  return t === '';
}

/** Verifica se o range (colapsado ou não) se sobrepõe ao conteúdo do elemento. */
function rangeIntersectsElementContents(range: Range, el: HTMLElement): boolean {
  try {
    if (range.intersectsNode(el)) return true;
  } catch {
    /* ignorar */
  }
  try {
    const inner = document.createRange();
    inner.selectNodeContents(el);
    return (
      range.compareBoundaryPoints(Range.END_TO_START, inner) > 0 &&
      range.compareBoundaryPoints(Range.START_TO_END, inner) < 0
    );
  } catch {
    return false;
  }
}

function nearestLiInUnorderedList(node: Node, editor: HTMLElement): HTMLLIElement | null {
  let n: Node | null = node;
  while (n && n !== editor) {
    if (n.nodeName === 'LI') {
      const li = n as HTMLLIElement;
      if (li.parentElement?.tagName === 'UL') return li;
    }
    n = n.parentNode;
  }
  return null;
}

function nearestUlFromNode(node: Node, editor: HTMLElement): HTMLUListElement | null {
  let n: Node | null = node;
  while (n && n !== editor) {
    if (n.nodeName === 'UL') return n as HTMLUListElement;
    n = n.parentNode;
  }
  return null;
}

function nearestOlFromNode(node: Node | null, editor: HTMLElement): HTMLOListElement | null {
  let n: Node | null = node;
  if (!n) return null;
  while (n && n !== editor) {
    if (n.nodeName === 'OL') return n as HTMLOListElement;
    n = n.parentNode;
  }
  return null;
}

/** `<ol>` que envolvem o início ou o fim da seleção (sem chamar `insertOrderedList` se já existir). */
function collectOlsTouchingRange(editor: HTMLElement, range: Range): HTMLOListElement[] {
  const seen = new Set<HTMLOListElement>();
  const out: HTMLOListElement[] = [];
  const add = (node: Node | null) => {
    const ol = nearestOlFromNode(node, editor);
    if (ol && !seen.has(ol)) {
      seen.add(ol);
      out.push(ol);
    }
  };
  add(range.startContainer);
  add(range.endContainer);
  return out;
}

function setOrderedListMarkerOnOl(ol: HTMLOListElement, style: OrderedListStyle) {
  if (style === 'alpha') {
    ol.type = 'a';
    ol.style.setProperty('list-style-type', 'lower-alpha');
  } else {
    ol.type = '1';
    ol.style.setProperty('list-style-type', 'decimal');
  }
}

/**
 * Lista ordenada: se já houver `<ol>` na seleção, só altera o tipo (evita `insertOrderedList`
 * remover a lista). Garante `list-style-type` inline para não ser sobrescrito por CSS global
 * (ex.: `.builder-rich-html ol { list-style-type: decimal }`).
 */
export function applyOrderedListStyleAtSelection(editor: HTMLElement, style: OrderedListStyle): void {
  if (!editor.isConnected) return;
  ensureSelectionInsideEditor(editor);
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const existing = collectOlsTouchingRange(editor, range);
  if (existing.length > 0) {
    existing.forEach((ol) => setOrderedListMarkerOnOl(ol, style));
    return;
  }

  try {
    document.execCommand('insertOrderedList', false);
  } catch {
    /* ignorar */
  }

  const sel2 = window.getSelection();
  if (!sel2?.rangeCount) return;
  const range2 = sel2.getRangeAt(0);
  if (!editor.contains(range2.commonAncestorContainer)) return;
  const created = nearestOlFromNode(range2.startContainer, editor);
  if (created) setOrderedListMarkerOnOl(created, style);
}

/**
 * `<li>` filhos diretos de `<ul>` que devem receber o novo marcador (só o que a seleção toca).
 */
export function collectUnorderedListLisForRange(editor: HTMLElement, range: Range): HTMLLIElement[] {
  const lis = new Set<HTMLLIElement>();

  editor.querySelectorAll('ul > li').forEach((node) => {
    const li = node as HTMLLIElement;
    if (!editor.contains(li)) return;
    if (rangeIntersectsElementContents(range, li)) lis.add(li);
  });

  if (lis.size === 0) {
    const a = nearestLiInUnorderedList(range.startContainer, editor);
    const b = nearestLiInUnorderedList(range.endContainer, editor);
    if (a) lis.add(a);
    if (b) lis.add(b);
  }

  return [...lis];
}

/**
 * Aplica marcador de lista não ordenada sem alternar a lista: atualiza `list-style-type`
 * em cada `<li>` tocado pela seleção (respeita só o trecho/itens selecionados). Se não houver
 * lista, cria com `insertUnorderedList` e aplica no(s) novo(s) item(ns).
 */
export function applyUnorderedListMarkerAtSelection(
  editor: HTMLElement,
  marker: UnorderedListMarkerStyle
): void {
  if (!editor.isConnected) return;
  ensureSelectionInsideEditor(editor);
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const cssVal = markerStyleToListStyleTypeCss(marker);
  const lis = collectUnorderedListLisForRange(editor, range);

  if (lis.length > 0) {
    lis.forEach((li) => {
      li.style.listStyleType = cssVal;
    });
    return;
  }

  try {
    document.execCommand('insertUnorderedList', false);
  } catch {
    /* ignorar */
  }

  const sel2 = window.getSelection();
  if (!sel2 || sel2.rangeCount === 0) return;
  const range2 = sel2.getRangeAt(0);
  const lis2 = collectUnorderedListLisForRange(editor, range2);
  if (lis2.length > 0) {
    lis2.forEach((li) => {
      li.style.listStyleType = cssVal;
    });
    return;
  }

  // insertUnorderedList pode criar <ul> sem <li> reconhecido pelo coletor — estilizar itens do ul atual
  const ulFromRange = nearestUlFromNode(range2.startContainer, editor);
  if (ulFromRange) {
    const directLis = Array.from(ulFromRange.children).filter(
      (n): n is HTMLLIElement => n.tagName === 'LI'
    );
    if (directLis.length > 0) {
      directLis.forEach((li) => {
        li.style.listStyleType = cssVal;
      });
      return;
    }
    ulFromRange.style.listStyleType = cssVal;
    return;
  }

  // insertUnorderedList às vezes não cria <li> em editor só com <br> — fallback manual
  if (isEditorDomVisuallyEmpty(editor)) {
    const ulEl = document.createElement('ul');
    const liEl = document.createElement('li');
    liEl.style.listStyleType = cssVal;
    liEl.appendChild(document.createElement('br'));
    ulEl.appendChild(liEl);
    editor.innerHTML = '';
    editor.appendChild(ulEl);
    const rNew = document.createRange();
    rNew.setStart(liEl, 0);
    rNew.collapse(true);
    sel2.removeAllRanges();
    sel2.addRange(rNew);
  }
}

/** Converte cor CSS (rgb/rgba/#) para #rrggbb para controles HTML (color input). */
export function cssColorToHex(color: string | undefined | null): string | undefined {
  if (color == null || color === '') return undefined;
  const c = color.trim().toLowerCase();
  if (c === 'transparent') return undefined;
  if (c.startsWith('#')) {
    if (c.length === 4) {
      return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
    }
    return c.length >= 7 ? c.slice(0, 7) : c;
  }
  const m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!m) return undefined;
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
  if (a < 0.01) return undefined;
  const to255 = (x: string) =>
    Math.min(255, Math.max(0, Math.round(parseFloat(x))));
  const r = to255(m[1]);
  const g = to255(m[2]);
  const b = to255(m[3]);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function isTransparentBackground(bg: string): boolean {
  const t = bg.trim().toLowerCase();
  if (t === 'transparent' || t === '') return true;
  const m = t.match(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/i);
  if (m && parseFloat(m[1]) < 0.02) return true;
  return false;
}

const BG_NONE = '__none__';

function normalizeHex(c: string | undefined): string | undefined {
  if (!c) return undefined;
  const h = cssColorToHex(c);
  return h ? h.toLowerCase() : undefined;
}

function getWalkerRoot(range: Range, editor: HTMLElement): HTMLElement {
  const c = range.commonAncestorContainer;
  if (!editor.contains(c)) {
    return editor;
  }
  if (c.nodeType === Node.TEXT_NODE) {
    return (c as Text).parentElement || editor;
  }
  return c as HTMLElement;
}

/** Pais de nós de texto que intersectam o range (dentro do editor). */
export function collectTextParentsIntersectingRange(editor: HTMLElement, range: Range): HTMLElement[] {
  const root = getWalkerRoot(range, editor);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const parents: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();
  let t: Node | null;
  while ((t = walker.nextNode())) {
    if (t.nodeType !== Node.TEXT_NODE) continue;
    const text = t as Text;
    if (!editor.contains(text)) continue;
    if (text.length === 0) continue;
    try {
      if (!range.intersectsNode(text)) continue;
    } catch {
      continue;
    }
    const p = text.parentElement;
    if (!p || !editor.contains(p)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    parents.push(p);
  }
  return parents;
}

function resolveStyleTargetElement(editor: HTMLElement, refNode: Node): HTMLElement {
  let node: Node = refNode;
  if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
    node = node.parentElement;
  }
  let target = node as HTMLElement;
  if (!editor.contains(target)) {
    target = editor;
  }
  if (target.nodeName === 'BR') {
    target = (target.parentElement && editor.contains(target.parentElement)
      ? target.parentElement
      : editor) as HTMLElement;
  }
  return target;
}

/** Envolve o range atual (não colapsado) num span com estilos inline. */
export function wrapCurrentRangeWithSpanStyle(styleProps: Record<string, string>): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;
  const span = document.createElement('span');
  Object.assign(span.style, styleProps as Partial<CSSStyleDeclaration>);
  try {
    range.surroundContents(span);
  } catch {
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
    sel.removeAllRanges();
    const nr = document.createRange();
    nr.selectNodeContents(span);
    nr.collapse(false);
    sel.addRange(nr);
  }
}

/**
 * Retorna [start, end) em `t` cobertos pelo range (seleções que cruzam `<span>` etc.).
 * Usa `Range.comparePoint` quando o início/fim da seleção não estão no próprio nó de texto.
 */
function textSliceForRange(t: Text, range: Range): [number, number] | null {
  const len = t.length;
  if (len === 0) return null;
  try {
    if (range.comparePoint(t, 0) === 1 || range.comparePoint(t, len) === -1) return null;
  } catch {
    return null;
  }

  let start: number;
  let end: number;

  if (t === range.startContainer) {
    start = Math.max(0, Math.min(len, range.startOffset));
  } else {
    let lo = 0;
    let hi = len;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (range.comparePoint(t, mid) === -1) lo = mid + 1;
      else hi = mid;
    }
    start = lo;
  }

  if (t === range.endContainer) {
    end = Math.max(start, Math.min(len, range.endOffset));
  } else {
    let lo = start;
    let hi = len;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (range.comparePoint(t, mid) === 1) hi = mid - 1;
      else lo = mid;
    }
    end = lo;
  }

  if (start >= end) return null;
  return [start, end];
}

/** Remove só declarações `font-size` do `style` inline; mantém cor, peso, etc. */
function removeFontSizeFromElement(el: HTMLElement) {
  const raw = el.getAttribute('style');
  if (raw?.trim()) {
    const rest = raw
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !/^font-size\s*:/i.test(s));
    if (rest.length) el.setAttribute('style', rest.join('; '));
    else el.removeAttribute('style');
  }
  el.style.removeProperty('font-size');
}

/**
 * Remove todas as declarações `font-size` do atributo `style` e do objeto `style` em runtime,
 * depois define um único `font-size` (evita `font-size: 12px; font-size: 18px` no mesmo elemento).
 */
function setSingleFontSizePxOnElement(el: HTMLElement, fontSizePx: string) {
  removeFontSizeFromElement(el);
  el.style.setProperty('font-size', fontSizePx);
}

/** Remove nós `Text` com comprimento 0 no mesmo pai (evita quebrar deteção de único filho). */
function removeZeroLengthTextNodesInParent(text: Text) {
  const p = text.parentNode;
  if (!p) return;
  for (let c = p.firstChild; c; ) {
    const nx = c.nextSibling;
    if (c.nodeType === Node.TEXT_NODE && (c as Text).length === 0) {
      p.removeChild(c);
    }
    c = nx;
  }
}

/**
 * Sobe a partir do nó de texto fatiado: em cada `span` que envolve exclusivamente o nó atual
 * (único filho), remove `font-size`. Evita que um novo `span` com tamanho fique por baixo de
 * ancestrais que ainda carregam o tamanho antigo (ex.: cadeia `span>span>texto`).
 */
function stripFontSizeFromExclusiveSpanChainFromLeaf(leaf: Text, editor: HTMLElement) {
  let node: Node = leaf;
  for (;;) {
    const p = node.parentElement;
    if (!p || p === editor || !editor.contains(p)) break;
    if (p.tagName !== 'SPAN') break;
    if (p.childNodes.length !== 1 || p.firstChild !== node) break;
    removeFontSizeFromElement(p);
    node = p;
  }
}

/**
 * Aplica `font-size` em px a toda a seleção, inclusive quando cruza nós (ex.: parte fora e parte
 * dentro de `<span style="font-size:…">`), evitando `surroundContents` que falha nesses casos.
 * Reutiliza o `span` pai quando ele só envolve o trecho selecionado, evitando aninhar outro
 * `span` só com `font-size` por cima. Antes disso, remove `font-size` de cadeias de `span` que
 * envolvem exclusivamente o nó de texto fatiado, para não deixar tamanho antigo por cima do novo.
 */
export function applyFontSizePxToRange(editor: HTMLElement, px: number): boolean {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return false;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return false;
  if (!editor.contains(range.commonAncestorContainer)) return false;

  const rangeClone = range.cloneRange();
  const doc = editor.ownerDocument;
  const fontSize = `${px}px`;

  const walker = doc.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
  const hits: { node: Text; start: number; end: number }[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    const sl = textSliceForRange(t, rangeClone);
    if (!sl) continue;
    hits.push({ node: t, start: sl[0], end: sl[1] });
  }

  if (hits.length === 0) return false;

  const spans: HTMLElement[] = [];
  for (const { node: t, start, end } of hits) {
    if (start >= end || end > t.length) continue;
    // Evitar splitText(0) e splitText(length): ambos criam nó de texto vazio irmão, quebram
    // `childNodes.length === 1` e impedem reutilizar o `span` pai → spans de font-size aninhados.
    let tail: Text;
    if (start > 0) {
      tail = t.splitText(start);
    } else {
      tail = t;
    }
    const segLen = end - start;
    if (segLen < tail.length) {
      tail.splitText(segLen);
    }
    removeZeroLengthTextNodesInParent(tail);
    stripFontSizeFromExclusiveSpanChainFromLeaf(tail, editor);
    const parent = tail.parentElement;

    const canReuseParentSpan =
      parent &&
      parent !== editor &&
      parent.tagName === 'SPAN' &&
      editor.contains(parent) &&
      parent.childNodes.length === 1 &&
      parent.firstChild === tail;

    if (canReuseParentSpan) {
      setSingleFontSizePxOnElement(parent, fontSize);
      spans.push(parent);
      continue;
    }

    const span = doc.createElement('span');
    setSingleFontSizePxOnElement(span, fontSize);
    tail.parentNode?.insertBefore(span, tail);
    span.appendChild(tail);
    spans.push(span);
  }

  if (spans.length === 0) return false;

  sel.removeAllRanges();
  const nr = doc.createRange();
  nr.setStartBefore(spans[0]);
  nr.setEndAfter(spans[spans.length - 1]);
  sel.addRange(nr);
  return true;
}

/**
 * Lê formatos no editor: com seleção não colapsada, compara todos os trechos de texto
 * intersectados; tamanho/cor/fundo diferentes → flags *Mixed e valor omitido (UI "-").
 */
export function computeRichTextToolbarFormats(editor: HTMLElement): TextFormats | null {
  if (typeof window === 'undefined' || !editor?.isConnected) return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  const refNode: Node = range.collapsed
    ? range.startContainer
    : sel.focusNode && editor.contains(sel.focusNode)
      ? sel.focusNode
      : range.endContainer;

  if (!editor.contains(refNode)) return null;

  const target = resolveStyleTargetElement(editor, refNode);
  const cs = window.getComputedStyle(target);

  const fw = cs.fontWeight;
  const fwNum = parseInt(String(fw), 10);
  const bold =
    fw === 'bold' ||
    fw === 'bolder' ||
    (!Number.isNaN(fwNum) && fwNum >= 600);

  const italic = cs.fontStyle === 'italic' || cs.fontStyle === 'oblique';

  const tdLine = cs.textDecorationLine || '';
  const td = cs.textDecoration || '';
  const underline =
    String(tdLine).includes('underline') || td.includes('underline');

  const ta = cs.textAlign;
  let align: TextFormats['align'] = 'left';
  if (ta === 'center') align = 'center';
  else if (ta === 'right' || ta === 'end') align = 'right';
  else if (ta === 'justify') align = 'justify';

  let listMarkerStyle: UnorderedListMarkerStyle | undefined;
  let orderedListActive = false;
  let orderedListStyle: OrderedListStyle | undefined;
  try {
    let n: Node | null = refNode;
    while (n && n !== editor) {
      const el = n as HTMLElement;
      const name = el.nodeName?.toLowerCase?.();
      if (name === 'li' && el.parentElement?.nodeName === 'UL') {
        try {
          const lst = window.getComputedStyle(el).listStyleType;
          listMarkerStyle = listStyleTypeCssToMarker(lst);
        } catch {
          listMarkerStyle = 'bullet';
        }
        break;
      }
      if (name === 'ol') {
        orderedListActive = true;
        const ol = el as HTMLOListElement;
        const typeRaw = ol.getAttribute('type') ?? '';
        const typeLower = typeRaw.toLowerCase();
        let liMarker = '';
        try {
          const firstLi = ol.querySelector(':scope > li');
          if (firstLi) {
            liMarker = window.getComputedStyle(firstLi as Element).listStyleType.toLowerCase();
          }
        } catch {
          /* ignorar */
        }
        const isAlpha =
          typeLower === 'a' ||
          typeRaw === 'A' ||
          liMarker === 'lower-alpha' ||
          liMarker === 'upper-alpha' ||
          liMarker === 'lower-latin' ||
          liMarker === 'upper-latin';
        orderedListStyle = isAlpha ? 'alpha' : 'decimal';
        break;
      }
      if (name === 'ul') {
        try {
          const lst = window.getComputedStyle(el).listStyleType;
          listMarkerStyle = listStyleTypeCssToMarker(lst);
        } catch {
          listMarkerStyle = 'bullet';
        }
        break;
      }
      n = n.parentNode;
    }
  } catch {
    /* ignorar */
  }

  let fontSize: number | undefined;
  let fontSizeMixed = false;
  let color: string | undefined;
  let colorMixed = false;
  let backgroundColor: string | undefined;
  let backgroundColorMixed = false;

  if (range.collapsed) {
    const fontSizePx = parseFloat(cs.fontSize);
    fontSize = Number.isFinite(fontSizePx) ? Math.round(fontSizePx) : 16;
    color = normalizeHex(cs.color) || '#000000';
    const bg = cs.backgroundColor;
    if (!isTransparentBackground(bg)) {
      backgroundColor = normalizeHex(bg);
    }
  } else {
    const parents = collectTextParentsIntersectingRange(editor, range);
    const samples =
      parents.length > 0
        ? parents
        : [resolveStyleTargetElement(editor, range.startContainer)];

    const fontSizes = new Set<number>();
    const colors = new Set<string>();
    const bgs = new Set<string>();

    for (const p of samples) {
      const pcs = window.getComputedStyle(p);
      const fsp = parseFloat(pcs.fontSize);
      fontSizes.add(Number.isFinite(fsp) ? Math.round(fsp) : 16);
      const col = normalizeHex(pcs.color) || '#000000';
      colors.add(col);
      const rawBg = pcs.backgroundColor;
      bgs.add(isTransparentBackground(rawBg) ? BG_NONE : normalizeHex(rawBg) || BG_NONE);
    }

    fontSizeMixed = fontSizes.size > 1;
    fontSize = fontSizeMixed ? undefined : [...fontSizes][0];

    colorMixed = colors.size > 1;
    color = colorMixed ? undefined : [...colors][0];

    backgroundColorMixed = bgs.size > 1;
    if (backgroundColorMixed) {
      backgroundColor = undefined;
    } else {
      const only = [...bgs][0];
      backgroundColor = only === BG_NONE ? undefined : only;
    }
  }

  return {
    bold,
    italic,
    underline,
    fontSize,
    fontSizeMixed,
    color,
    colorMixed,
    backgroundColor,
    backgroundColorMixed,
    align,
    listMarkerStyle,
    orderedListActive,
    orderedListStyle,
  };
}

/**
 * Remove sublinhado da seleção atual no editor.
 * Trata tanto <u> quanto <span style="text-decoration:underline"> (varia por navegador).
 */
export function removeUnderlineFromSelection(editor: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);

  const toUnwrap: HTMLElement[] = [];
  const uElements = Array.from(editor.getElementsByTagName('u'));
  for (const u of uElements) {
    try {
      if (range.intersectsNode(u)) toUnwrap.push(u);
    } catch {
      /* ignorar */
    }
  }

  const spansWithUnderline = editor.querySelectorAll<HTMLElement>(
    'span[style*="text-decoration"]'
  );
  spansWithUnderline.forEach((el) => {
    try {
      const dec = el.style.textDecoration || '';
      if (!dec.toLowerCase().includes('underline')) return;
      if (!range.intersectsNode(el)) return;
      const rest = dec
        .split(/\s+/)
        .filter((v) => v.toLowerCase() !== 'underline')
        .join(' ');
      if (rest) {
        el.style.textDecoration = rest;
      } else {
        el.removeAttribute('style');
        toUnwrap.push(el);
      }
    } catch {
      /* ignorar */
    }
  });

  toUnwrap.forEach((u) => {
    try {
      while (u.firstChild) {
        u.parentNode?.insertBefore(u.firstChild, u);
      }
      u.remove();
    } catch {
      /* ignorar */
    }
  });

  return toUnwrap.length > 0;
}

export function restoreRangeInRoot(range: Range | null, root: HTMLElement): boolean {
  if (!range || !root) return false;
  try {
    const sel = window.getSelection();
    if (!sel) return false;
    const clone = range.cloneRange();
    if (!root.contains(clone.commonAncestorContainer)) return false;
    sel.removeAllRanges();
    sel.addRange(clone);
    return true;
  } catch {
    return false;
  }
}

export function ensureCommandState(command: 'bold' | 'italic' | 'underline', desired: boolean) {
  try {
    const current = document.queryCommandState(command);
    if (current !== desired) {
      document.execCommand(command, false);
    }
  } catch {
    /* ignorar */
  }
}

/** Mapeia tamanho em px para valor 1–7 do execCommand('fontSize') */
export function fontSizeToExecCommand(pixels: number): string {
  if (pixels <= 10) return '1';
  if (pixels <= 12) return '2';
  if (pixels <= 14) return '3';
  if (pixels <= 18) return '4';
  if (pixels <= 24) return '5';
  if (pixels <= 36) return '6';
  return '7';
}
