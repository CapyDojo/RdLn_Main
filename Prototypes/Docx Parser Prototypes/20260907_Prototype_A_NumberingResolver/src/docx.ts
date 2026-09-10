import JSZip from 'jszip';
import { extractXml } from './document.js';
import { browserXmlParser } from './xml.js';
import type { DocxParts, ExtractionResult, XmlParser } from './types.js';

const REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OFFICE_REL = ['http://schemas.openxmlformats.org/officeDocument/2006/relationships/', 'http://purl.oclc.org/ooxml/officeDocument/relationships/'];
interface Relationship { target: string; type: string; external: boolean }

function relationships(xml: string, parser: XmlParser): Relationship[] {
  if (/<!DOCTYPE/i.test(xml)) throw new Error('DTD declarations are not supported.');
  const doc = parser(xml);
  if (doc.documentElement.namespaceURI !== REL || doc.documentElement.localName !== 'Relationships') throw new Error('Invalid package relationships.');
  return Array.from(doc.documentElement.children).filter(node => node.namespaceURI === REL && node.localName === 'Relationship').map(node => ({
    target: node.getAttribute('Target') ?? '', type: node.getAttribute('Type') ?? '', external: node.getAttribute('TargetMode') === 'External'
  }));
}
function partPath(base: string, target: string): string {
  if (!target || /[\\?#]/.test(target) || /^[a-z]+:/i.test(target)) throw new Error('Unsupported package relationship target.');
  const path = target.startsWith('/') ? [] : base.split('/').slice(0, -1);
  for (const segment of decodeURIComponent(target).split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (!path.length) throw new Error('Package relationship escapes the archive root.');
      path.pop();
    } else path.push(segment);
  }
  return path.join('/');
}
function relationshipOf(entries: Relationship[], name: string): Relationship | undefined {
  const matching = entries.filter(entry => OFFICE_REL.some(prefix => entry.type === prefix + name));
  if (matching.length > 1) throw new Error(`Multiple ${name} relationships are not supported.`);
  const result = matching[0];
  if (result?.external) throw new Error(`External ${name} parts are not loaded.`);
  return result;
}

export async function extractDocx(bytes: ArrayBuffer | Uint8Array, parser: XmlParser = browserXmlParser): Promise<ExtractionResult> {
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error('DOCX exceeds the prototype limit (10 MB compressed).');
  const zip = await JSZip.loadAsync(bytes);
  async function read(name: string): Promise<string> {
    const entry = zip.file(name);
    if (!entry) throw new Error(`Missing DOCX part: ${name}`);
    const text = await entry.async('string');
    if (text.length > 12 * 1024 * 1024) throw new Error('Expanded XML part exceeds the prototype limit (12 MB).');
    return text;
  }
  const rootRelationships = relationships(await read('_rels/.rels'), parser);
  const main = relationshipOf(rootRelationships, 'officeDocument');
  if (!main) throw new Error('Package has no main document relationship.');
  const mainPath = partPath('', main.target);
  const segments = mainPath.split('/');
  const name = segments.pop();
  const relPath = [...segments, '_rels', `${name}.rels`].join('/');
  const documentRelationships = zip.file(relPath) ? relationships(await read(relPath), parser) : [];
  const parts: DocxParts = { documentXml: await read(mainPath) };
  for (const [kind, property] of [['numbering', 'numberingXml'], ['styles', 'stylesXml']] as const) {
    const relation = relationshipOf(documentRelationships, kind);
    if (relation) parts[property] = await read(partPath(mainPath, relation.target));
  }
  const result = extractXml(parts, parser);
  const extraStories = documentRelationships.filter(relation => ['header', 'footer', 'footnotes', 'endnotes'].some(kind => OFFICE_REL.some(prefix => relation.type === prefix + kind)));
  if (extraStories.length) {
    result.diagnostics.push({ code: 'MAIN_STORY_ONLY', severity: 'warning', message: 'This prototype extracts the main story; headers, footers and note stories are not included.' });
    result.complete = false;
  }
  return result;
}
