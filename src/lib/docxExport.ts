/*
 * RdLn DOCX (Track Changes) exporter
 * TypeScript implementation for Electron stack.
 *
 * Exposes:
 *   export async function exportHtmlDiffToDocx(html: string, opts?: { author?: string; date?: Date }): Promise<Uint8Array>
 *
 * No network, offline only. Uses jszip + xmlbuilder2.
 */

import JSZip from 'jszip';
import { create } from 'xmlbuilder2';

export type TokenType = 'equal' | 'ins' | 'del' | 'newline';

export interface Token {
  type: TokenType;
  text?: string; // undefined for newline separators
}

export interface ExportOptions {
  author?: string;
  date?: Date; // UTC preferred; will be serialized to ISO 8601 with Z
}

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

// Remove only leading/trailing zero-width whitespace, preserve user spaces
const trimZeroWidth = (s: string) => s.replace(/^[\u200B-\u200D\uFEFF]+|[\u200B-\u200D\uFEFF]+$/g, '');

function isInsertionSpan(el: Element): boolean {
  const style = (el.getAttribute('style') || '').toLowerCase();
  if (/text-decoration[^;]*underline/.test(style) || /text-decoration-line[^;]*underline/.test(style)) return true;
  // Fallback to green-ish cues in style (very tolerant)
  if (/dcfce7|bbf7d0|16a34a|166534/.test(style)) return true;
  return false;
}

function isDeletionSpan(el: Element): boolean {
  const style = (el.getAttribute('style') || '').toLowerCase();
  if (/text-decoration[^;]*line-through/.test(style) || /line-through/.test(style)) return true;
  // Fallback to red-ish cues
  if (/fef2f2|fecaca|dc2626|991b1b/.test(style)) return true;
  return false;
}

function tokenizeNode(node: Node, out: Token[], mode: 'equal' | 'ins' | 'del'): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = (node.textContent ?? '');
    if (!raw) return;
    const text = trimZeroWidth(raw);
    if (!text) return;
    // Split on newlines to produce paragraph boundaries
    const parts = text.split(/(\r\n|\n)/);
    for (const part of parts) {
      if (part === '\n' || part === '\r\n') {
        out.push({ type: 'newline' });
      } else if (part.length) {
        out.push({ type: mode, text: part });
      }
    }
    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (tag === 'br') {
      out.push({ type: 'newline' });
      return;
    }

    // Paragraph containers: treat a nested <div> as a paragraph break before and after
    if (tag === 'div' && el !== (el.ownerDocument?.body?.firstElementChild ?? null)) {
      // ensure a break before nested div content when not first container
      if (out.length && out[out.length - 1].type !== 'newline') out.push({ type: 'newline' });
      Array.from(el.childNodes).forEach((child) => tokenizeNode(child, out, 'equal'));
      out.push({ type: 'newline' });
      return;
    }

    let nextMode: 'equal' | 'ins' | 'del' = mode;
    if (tag === 'span') {
      if (isInsertionSpan(el)) nextMode = 'ins';
      else if (isDeletionSpan(el)) nextMode = 'del';
    }

    Array.from(el.childNodes).forEach((child) => tokenizeNode(child, out, nextMode));
    return;
  }
}

function mergeAdjacent(tokens: Token[]): Token[] {
  const merged: Token[] = [];
  for (const t of tokens) {
    const last = merged[merged.length - 1];
    if (t.type === 'newline') {
      // avoid consecutive newlines (collapse to single)
      if (!last || last.type !== 'newline') merged.push(t);
      continue;
    }
    if (last && last.type === t.type && last.text !== undefined && t.text !== undefined) {
      last.text += t.text;
    } else {
      merged.push({ ...t });
    }
  }
  // Trim leading/trailing newlines
  while (merged.length && merged[0].type === 'newline') merged.shift();
  while (merged.length && merged[merged.length - 1].type === 'newline') merged.pop();
  return merged;
}

function chunkParagraphs(tokens: Token[]): Token[][] {
  const paras: Token[][] = [];
  let current: Token[] = [];
  for (const t of tokens) {
    if (t.type === 'newline') {
      if (current.length) {
        paras.push(current);
        current = [];
      } else {
        // skip extra blank lines
      }
    } else {
      current.push(t);
    }
  }
  if (current.length) paras.push(current);
  if (paras.length === 0) paras.push([]);
  return paras;
}

function buildDocumentXml(paras: Token[][], author: string, isoDate: string): string {
  let revId = 1;
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('w:document', { 'xmlns:w': W_NS })
    .ele('w:body');

  for (const para of paras) {
    const p = root.ele('w:p');
    for (const token of para) {
      if (token.type === 'equal') {
        const r = p.ele('w:r');
        r.ele('w:t', { 'xml:space': 'preserve' }).txt(token.text ?? '');
      } else if (token.type === 'ins') {
        const ins = p.ele('w:ins', { 'w:id': String(revId++), 'w:author': author, 'w:date': isoDate });
        const r = ins.ele('w:r');
        r.ele('w:t', { 'xml:space': 'preserve' }).txt(token.text ?? '');
      } else if (token.type === 'del') {
        const del = p.ele('w:del', { 'w:id': String(revId++), 'w:author': author, 'w:date': isoDate });
        const r = del.ele('w:r');
        r.ele('w:delText', { 'xml:space': 'preserve' }).txt(token.text ?? '');
      }
    }
  }

  // section properties minimal
  root.ele('w:sectPr');

  return root.up().end({ prettyPrint: false });
}

function contentTypesXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>',
    '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    '</Types>'
  ].join('');
}

function relsRels(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
    '</Relationships>'
  ].join('');
}

function corePropsXml(author: string, isoDate: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"',
    ' xmlns:dc="http://purl.org/dc/elements/1.1/"',
    ' xmlns:dcterms="http://purl.org/dc/terms/"',
    ' xmlns:dcmitype="http://purl.org/dc/dcmitype/"',
    ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    `<dc:creator>${escapeXml(author)}</dc:creator>`,
    `<cp:lastModifiedBy>${escapeXml(author)}</cp:lastModifiedBy>`,
    `<dcterms:created xsi:type="dcterms:W3CDTF">${isoDate}</dcterms:created>`,
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${isoDate}</dcterms:modified>`,
    '</cp:coreProperties>'
  ].join('');
}

function appPropsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"',
    ' xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
    '<Application>RdLn</Application>',
    '<DocSecurity>0</DocSecurity>',
    '<ScaleCrop>false</ScaleCrop>',
    '<LinksUpToDate>false</LinksUpToDate>',
    '<SharedDoc>false</SharedDoc>',
    '<HyperlinksChanged>false</HyperlinksChanged>',
    '<AppVersion>1.0</AppVersion>',
    '</Properties>'
  ].join('');
}

function stylesXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<w:styles xmlns:w="${W_NS}">`,
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">',
    '<w:name w:val="Normal"/>',
    '<w:qFormat/>',
    '</w:style>',
    '</w:styles>'
  ].join('');
}

function settingsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<w:settings xmlns:w="${W_NS}">`,
    '<w:trackRevisions/>',
    '</w:settings>'
  ].join('');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ensureDom(html: string): HTMLElement {
  // In browser/renderer, DOM is available
  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container;
  }
  // Fallback for non-DOM environments is not needed in our app/tests
  throw new Error('DOM environment not available for HTML parsing');
}

export function htmlToTokens(html: string): Token[] {
  const root = ensureDom(html);
  const out: Token[] = [];
  // Treat top-level <div> as paragraph container; if multiple, insert newline between
  const children = Array.from(root.childNodes);
  if (children.length === 1 && (children[0] as Element)?.nodeType === 1 && (children[0] as Element).nodeName.toLowerCase() === 'div') {
    tokenizeNode(children[0], out, 'equal');
  } else {
    for (const child of children) {
      tokenizeNode(child, out, 'equal');
    }
  }
  return mergeAdjacent(out);
}

export async function exportHtmlDiffToDocx(html: string, opts: ExportOptions = {}): Promise<Uint8Array> {
  const author = opts.author || 'RdLn';
  const isoDate = (opts.date || new Date()).toISOString();

  const tokens = htmlToTokens(html);
  const paragraphs = chunkParagraphs(tokens);
  const documentXml = buildDocumentXml(paragraphs, author, isoDate);

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXml());
  zip.folder('_rels')?.file('.rels', relsRels());
  const docProps = zip.folder('docProps');
  docProps?.file('core.xml', corePropsXml(author, isoDate));
  docProps?.file('app.xml', appPropsXml());

  const word = zip.folder('word');
  word?.file('document.xml', documentXml);
  word?.file('styles.xml', stylesXml());
  word?.file('settings.xml', settingsXml());
  // Relationships for document -> styles/settings
  word?.folder('_rels')?.file('document.xml.rels', documentRels());

  const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  return content;
}

function documentRels(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>',
    '</Relationships>'
  ].join('');
}

export async function saveDocxToFile(html: string, filePath: string, opts: ExportOptions = {}): Promise<void> {
  const data = await exportHtmlDiffToDocx(html, opts);
  // Defer to Node fs only if available (Electron main/renderer with nodeIntegration)
  // Consumers can also use IPC or showSaveDialog externally.
  const fs = await import('fs');
  await fs.promises.writeFile(filePath, Buffer.from(data));
}
