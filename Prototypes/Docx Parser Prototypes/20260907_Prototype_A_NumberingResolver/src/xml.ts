import type { Indentation, ParagraphProperties, XmlParser } from './types.js';

export const WORD_NAMESPACES = new Set([
  'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  'http://purl.oclc.org/ooxml/wordprocessingml/main'
]);
export const MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006';
export const isWord = (element: Element, name?: string): boolean => WORD_NAMESPACES.has(element.namespaceURI ?? '') && (!name || element.localName === name);
export const children = (element: Element | undefined, name: string): Element[] => Array.from(element?.children ?? []).filter(child => isWord(child, name));
export const child = (element: Element | undefined, name: string): Element | undefined => children(element, name)[0];
export function attr(element: Element | undefined, name = 'val'): string | undefined {
  if (!element) return undefined;
  for (const namespace of WORD_NAMESPACES) {
    const value = element.getAttributeNS(namespace, name);
    if (value !== null) return value;
  }
  return undefined;
}
export const value = (element: Element | undefined, name: string): string | undefined => attr(child(element, name));
export function integer(input: string | undefined, fallback: number, minimum = 0, maximum = 2147483647): number {
  if (input === undefined) return fallback;
  if (!/^-?\d+$/.test(input)) throw new Error(`Invalid integer: ${input}`);
  const result = Number(input);
  if (!Number.isSafeInteger(result) || result < minimum || result > maximum) throw new Error(`Integer outside supported range: ${input}`);
  return result;
}
export function on(element: Element | undefined): boolean {
  if (!element) return false;
  const v = attr(element);
  if (v === undefined || v === '1' || v === 'true' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'off') return false;
  throw new Error(`Invalid on/off value: ${v}`);
}
export function parsePart(xml: string, root: string, parser: XmlParser): Element {
  if (xml.length > 12 * 1024 * 1024) throw new Error('XML part exceeds the prototype limit (12 MB).');
  if (/<!DOCTYPE/i.test(xml)) throw new Error('DTD declarations are not supported.');
  const doc = parser(xml);
  if (doc.getElementsByTagNameNS('*', 'parsererror').length || !isWord(doc.documentElement, root)) throw new Error(`Invalid ${root} XML part.`);
  return doc.documentElement;
}
export function readIndentation(pPr: Element | undefined): Indentation {
  const ind = child(pPr, 'ind');
  const result: Indentation = {};
  for (const name of ['left', 'right', 'hanging', 'firstLine', 'start', 'end'] as const) {
    const v = attr(ind, name);
    if (v !== undefined) result[name] = integer(v, 0, -2147483648);
  }
  return result;
}
export function readProperties(pPr: Element | undefined): ParagraphProperties {
  const num = child(pPr, 'numPr');
  const level = value(num, 'ilvl');
  const numId = value(num, 'numId');
  return {
    styleId: value(pPr, 'pStyle'),
    numId: numId === undefined ? undefined : String(integer(numId, 0)),
    level: level === undefined ? undefined : integer(level, 0, 0, 8),
    indentation: readIndentation(pPr)
  };
}
export const browserXmlParser: XmlParser = xml => new DOMParser().parseFromString(xml, 'application/xml');
