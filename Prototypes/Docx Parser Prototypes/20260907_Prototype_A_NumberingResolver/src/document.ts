import { NumberingResolver } from './numbering.js';
import { attr, browserXmlParser, child, children, isWord, MC, parsePart } from './xml.js';
import type { Diagnostic, DocxParts, ExtractionResult, ParagraphRecord, XmlParser } from './types.js';

/** Deliberate structural text projection, not Word's visual tab-stop layout. */
export function serializeParagraphs(paragraphs: ParagraphRecord[], markUnresolved = false): string {
  return paragraphs.map(paragraph => {
    if (paragraph.label === null) {
      if (!markUnresolved) throw new Error(`Unresolved numbering at paragraph ${paragraph.index + 1}.`);
      return `[numbering unresolved]\t${paragraph.text}`;
    }
    if (!paragraph.label) return paragraph.text;
    return '\t'.repeat(paragraph.level ?? 0) + paragraph.label + paragraph.suffix + paragraph.text;
  }).join('\n');
}

export function extractXml(parts: DocxParts, parser: XmlParser = browserXmlParser): ExtractionResult {
  const root = parsePart(parts.documentXml, 'document', parser);
  const body = child(root, 'body');
  if (!body) throw new Error('Document has no body.');
  const numbering = new NumberingResolver(parts.numberingXml, parts.stylesXml, parser);
  const paragraphs: ParagraphRecord[] = [];
  const diagnostics: Diagnostic[] = [];
  let tableId = 0;
  const report = (code: string, message: string, paragraphIndex?: number): void => {
    diagnostics.push({ code, severity: 'warning', message, paragraphIndex });
  };

  function inline(element: Element, index: number): string {
    if (!isWord(element)) {
      if (element.namespaceURI === MC && element.localName === 'AlternateContent') {
        report('ALTERNATE_CONTENT', 'Alternate content uses its fallback; drawing/text-box layout is not supported.', index);
        const fallback = Array.from(element.children).find(node => node.namespaceURI === MC && node.localName === 'Fallback');
        return fallback ? Array.from(fallback.children).map(node => inline(node, index)).join('') : '';
      }
      return '';
    }
    switch (element.localName) {
      case 't': {
        let ancestor: Element | null = element;
        let space: string | null = null;
        while (ancestor && space === null) {
          space = ancestor.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'space');
          ancestor = ancestor.parentElement;
        }
        const text = element.textContent ?? '';
        return space === 'preserve' ? text : text.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '');
      }
      case 'tab': return '\t';
      case 'br': return attr(element, 'type') === 'page' ? '\f' : '\n';
      case 'cr': return '\n';
      case 'noBreakHyphen': return '\u2011';
      case 'softHyphen': return '\u00AD';
      case 'del': case 'moveFrom': case 'delText': case 'instrText':
      case 'pPr': case 'rPr': return '';
      case 'drawing': case 'pict': case 'object': case 'txbxContent':
        report('DRAWING_CONTENT', 'Drawing or text-box content is outside the main-story text parser.', index);
        return '';
      case 'sym':
        report('FONT_SYMBOL', 'Run contains a font-specific symbol without a verified Unicode mapping.', index);
        return '[font symbol]';
      case 'footnoteReference': case 'endnoteReference':
        report('NOTE_REFERENCE', 'Footnote/endnote content is outside this prototype.', index);
        return '';
      case 'fldSimple':
        report('CACHED_FIELD', 'Field display text is retained without recalculating the field.', index);
        break;
      case 'fldChar':
        if (attr(element, 'fldCharType') === 'begin') report('CACHED_FIELD', 'Field display text is retained without recalculating the field.', index);
        return '';
      case 'sdt': {
        const content = child(element, 'sdtContent');
        return content ? Array.from(content.children).map(node => inline(node, index)).join('') : '';
      }
    }
    return Array.from(element.children).map(node => inline(node, index)).join('');
  }

  // Expand only block wrappers, not arbitrary descendants (which would duplicate nested tables).
  function structuralChildren(element: Element, name: string): Element[] {
    const result: Element[] = [];
    for (const node of Array.from(element.children)) {
      if (isWord(node, name)) result.push(node);
      else if (isWord(node, 'sdt')) {
        const content = child(node, 'sdtContent');
        if (content) result.push(...structuralChildren(content, name));
      } else if (isWord(node, 'customXml') || isWord(node, 'ins') || isWord(node, 'moveTo')) result.push(...structuralChildren(node, name));
    }
    return result;
  }

  function blocks(elements: Element[], tablePath: number[]): void {
    for (const element of elements) {
      if (isWord(element, 'p')) {
        const index = paragraphs.length;
        const pPr = child(element, 'pPr');
        const resolved = numbering.resolve(pPr, index);
        const before = diagnostics.length;
        if (child(pPr, 'pPrChange') || child(child(pPr, 'numPr'), 'numberingChange')) report('REVISED_PROPERTIES', 'Current paragraph properties are used; historical numbering is not reconstructed.', index);
        if (child(child(pPr, 'rPr'), 'del')) report('DELETED_PARAGRAPH_MARK', 'Accepting a deleted paragraph mark requires paragraph merging, which is not implemented.', index);
        const text = Array.from(element.children).map(node => inline(node, index)).join('');
        const local = [...resolved.diagnostics, ...diagnostics.slice(before)];
        diagnostics.push(...resolved.diagnostics);
        paragraphs.push({ ...resolved, index, text, tablePath: [...tablePath], diagnostics: local });
      } else if (isWord(element, 'tbl')) {
        const id = tableId++;
        structuralChildren(element, 'tr').forEach((row, rowIndex) => {
          structuralChildren(row, 'tc').forEach((cell, cellIndex) => {
            blocks(Array.from(cell.children), [...tablePath, id, rowIndex, cellIndex]);
          });
        });
      } else if (isWord(element, 'sdt')) {
        const content = child(element, 'sdtContent');
        if (content) blocks(Array.from(content.children), tablePath);
      } else if (['customXml', 'ins', 'moveTo'].some(name => isWord(element, name))) {
        blocks(Array.from(element.children), tablePath);
      } else if (isWord(element, 'altChunk')) {
        report('ALT_CHUNK', 'Externally imported document chunks are not expanded.');
      } else if (element.namespaceURI === MC && element.localName === 'AlternateContent') {
        report('ALTERNATE_CONTENT', 'Alternate block content is not resolved.');
      } else if (!isWord(element)) {
        report('FOREIGN_BLOCK', `Unsupported block namespace: ${element.namespaceURI ?? '(none)'}.`);
      }
    }
  }
  blocks(Array.from(body.children), []);
  if (children(body, 'sectPr').length > 1) report('SECTION_PROPERTIES', 'Multiple terminal section definitions were found.');
  return { paragraphs, text: serializeParagraphs(paragraphs, true), diagnostics, complete: diagnostics.length === 0 };
}
