import JSZip from 'jszip';
import { createHash } from 'node:crypto';

export const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
export const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
export const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export const tag = (name, value) => `<w:${name} w:val="${esc(value)}"/>`;
export function level(i, options = {}) {
  const { start = 1, fmt = 'decimal', text = `%${i + 1}.`, restart, style, legal, suffix = 'tab', extra = '' } = options;
  return `<w:lvl w:ilvl="${i}">${start === null ? '' : tag('start', start)}${tag('numFmt', fmt)}${restart === undefined ? '' : tag('lvlRestart', restart)}${style ? tag('pStyle', style) : ''}${legal === undefined ? '' : tag('isLgl', legal ? 1 : 0)}${tag('suff', suffix)}${tag('lvlText', text)}${tag('lvlJc', 'left')}<w:pPr><w:ind w:left="${(i + 1) * 720}" w:hanging="360"/></w:pPr>${extra}</w:lvl>`;
}
export const abstract = (id, levels, extra = '') => `<w:abstractNum w:abstractNumId="${id}">${tag('nsid', Number(id + 1).toString(16).padStart(8, '0'))}${tag('multiLevelType', 'multilevel')}${extra}${levels}</w:abstractNum>`;
export const instance = (id, abs, overrides = '') => `<w:num w:numId="${id}">${tag('abstractNumId', abs)}${overrides}</w:num>`;
export const override = (i, start, nested = '') => `<w:lvlOverride w:ilvl="${i}">${start === null ? '' : tag('startOverride', start)}${nested}</w:lvlOverride>`;
export function p(text, { numId, ilvl, style, properties = '', inline } = {}) {
  const num = numId !== undefined || ilvl !== undefined ? `<w:numPr>${ilvl === undefined ? '' : tag('ilvl', ilvl)}${numId === undefined ? '' : tag('numId', numId)}</w:numPr>` : '';
  return `<w:p><w:pPr>${style ? tag('pStyle', style) : ''}${num}${properties}</w:pPr>${inline ?? `<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`}</w:p>`;
}
export const item = (text, ilvl = 0, numId = 1) => p(text, { numId, ilvl });
export const style = (id, { base, numId, ilvl, type = 'paragraph', extra = '' } = {}) => `<w:style w:type="${type}" w:styleId="${id}">${tag('name', id)}${base ? tag('basedOn', base) : ''}<w:pPr>${numId !== undefined || ilvl !== undefined ? `<w:numPr>${ilvl === undefined ? '' : tag('ilvl', ilvl)}${numId === undefined ? '' : tag('numId', numId)}</w:numPr>` : ''}${extra}</w:pPr></w:style>`;
export const table = body => `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid><w:gridCol w:w="7000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="7000" w:type="dxa"/></w:tcPr>${body}</w:tc></w:tr></w:tbl>`;
export function parts(body, definitions = '', styles = '') {
  return {
    documentXml: `<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`,
    numberingXml: definitions ? `<w:numbering xmlns:w="${W}">${definitions}</w:numbering>` : undefined,
    stylesXml: `<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:default="1" w:styleId="Normal">${tag('name', 'Normal')}</w:style>${styles}</w:styles>`
  };
}
const basic = levels => abstract(0, levels) + instance(1, 0);
const three = level(0) + level(1, { fmt: 'lowerLetter', text: '(%2)' }) + level(2, { fmt: 'lowerRoman', text: '(%3)' });
const sequence = levels => levels.map((lev, i) => item(`Paragraph ${i + 1}`, lev)).join('');
export const fixtures = [
  { id: 'single-continuation', parts: parts(item('One') + p('Intervening prose') + item('Two') + item('Three'), basic(level(0))), labels: ['1.', '', '2.', '3.'] },
  { id: 'three-level-outline', parts: parts(sequence([0, 1, 2, 2, 1, 2, 0, 1, 2]), basic(three)), labels: ['1.', '(a)', '(i)', '(ii)', '(b)', '(i)', '2.', '(a)', '(i)'] },
  { id: 'compound-labels', parts: parts(sequence([0, 1, 2, 1, 2, 0, 2]), basic(level(0) + level(1, { text: '%1.%2' }) + level(2, { text: '%1.%2.%3' }))), labels: ['1.', '1.1', '1.1.1', '1.2', '1.2.1', '2.', '2.1.1'] },
  { id: 'never-restart', parts: parts(sequence([0, 1, 0, 1]), basic(level(0) + level(1, { fmt: 'lowerLetter', text: '(%2)', restart: 0 }))), labels: ['1.', '(a)', '2.', '(b)'] },
  { id: 'explicit-restart-trigger', parts: parts(sequence([0, 1, 2, 1, 2, 0, 2]), basic(level(0) + level(1) + level(2, { fmt: 'lowerRoman', text: '(%3)', restart: 1 }))), labels: ['1.', '1.', '(i)', '2.', '(ii)', '2.', '(i)'] },
  { id: 'shared-definition-instances', parts: parts(item('First A', 0, 1) + item('First B', 0, 2) + item('Second A', 0, 1) + item('Second B', 0, 2), abstract(0, level(0)) + instance(1, 0) + instance(2, 0)), labels: ['1.', '2.', '3.', '4.'] },
  { id: 'interleaved-parent-restart', parts: parts(item('A parent') + item('A child', 1) + item('B parent', 0, 2) + item('A next parent') + item('B next', 0, 2) + item('A new child', 1), abstract(0, three) + abstract(1, level(0, { fmt: 'upperRoman' })) + instance(1, 0) + instance(2, 1)), labels: ['1.', '(a)', 'I.', '2.', 'II.', '(a)'] },
  { id: 'start-override', parts: parts(sequence([0, 1, 1, 0, 1]), abstract(0, three) + instance(1, 0, override(0, 4) + override(1, 3))), labels: ['4.', '(c)', '(d)', '5.', '(c)'] },
  { id: 'zero-start', parts: parts(item('Zero') + item('One'), basic(level(0, { start: 0 }))), labels: ['0.', '1.'] },
  { id: 'omitted-start', parts: parts(item('First') + item('Second'), basic(level(0, { start: null }))), labels: ['0.', '1.'] },
  { id: 'level-override', parts: parts(sequence([0, 1, 0, 1]), abstract(0, three) + instance(1, 0, override(1, 4, level(1, { fmt: 'upperRoman', text: '[%2]', start: 8, restart: 0 })))), labels: ['1.', '[VIII]', '2.', '[VIII]'] },
  { id: 'style-inheritance-and-cancellation', parts: parts(p('Inherited child', { style: 'Derived' }) + p('Suppressed', { style: 'Derived', numId: 0 }) + p('Next child', { style: 'Derived' }) + p('Direct level', { style: 'Derived', ilvl: 0 }), basic(level(0) + level(1, { fmt: 'lowerLetter', text: '(%2)', style: 'Base' })), style('Base', { numId: 1 }) + style('Derived', { base: 'Base' })), labels: ['1.', '', '2.', '3.'] },
  { id: 'numbering-style-link', parts: parts(item('Linked first', 0, 2) + item('Linked second', 0, 2), abstract(0, level(0, { fmt: 'upperRoman', text: '%1)' }), tag('styleLink', 'ListDefinition')) + abstract(1, '', tag('numStyleLink', 'ListDefinition')) + instance(1, 0) + instance(2, 1), style('ListDefinition', { type: 'numbering', numId: 1 })), labels: ['I)', 'II)'] },
  { id: 'legal-numbering', parts: parts(sequence([0, 1, 2, 2]), basic(level(0, { fmt: 'upperLetter', text: '%1' }) + level(1, { fmt: 'lowerLetter', text: '%1.%2' }) + level(2, { fmt: 'lowerRoman', text: '%1.%2.%3', legal: true }))), labels: ['A', 'A.a', '1.1.1', '1.1.2'] },
  { id: 'legal-false', parts: parts(sequence([0, 1]), basic(level(0, { fmt: 'upperLetter', text: '%1' }) + level(1, { fmt: 'lowerRoman', text: '%1.%2', legal: false }))), labels: ['A', 'A.i'] },
  { id: 'table-continuation', parts: parts(item('Before table') + table(item('Inside table') + item('Table child', 1)) + item('After table'), basic(three)), labels: ['1.', '2.', '(a)', '3.'] },
  { id: 'suffix-and-punctuation', parts: parts(item('Space', 0, 1) + item('Nothing', 0, 2) + item('Tab', 0, 3), abstract(0, level(0, { text: 'Article %1:', suffix: 'space' })) + abstract(1, level(0, { text: '(%1)', suffix: 'nothing' })) + abstract(2, level(0, { text: '%1)', suffix: 'tab' })) + instance(1, 0) + instance(2, 1) + instance(3, 2)), labels: ['Article 1:', '(1)', '1)'] },
  { id: 'letters-beyond-z', parts: parts(sequence([0, 0, 0, 0]), basic(level(0, { fmt: 'lowerLetter', text: '%1)', start: 26 }))), labels: ['z)', 'aa)', 'bb)', 'cc)'] },
  { id: 'empty-numbered-paragraph', parts: parts(item('') + item('After empty'), basic(level(0))), labels: ['1.', '2.'] },
  { id: 'inline-text-order', parts: parts(p('', { numId: 1, inline: '<w:r><w:t>Before </w:t></w:r><w:hyperlink w:anchor="local"><w:r><w:t>link</w:t></w:r></w:hyperlink><w:r><w:tab/><w:t>after</w:t><w:br/><w:t>line</w:t></w:r>' }), basic(level(0))), labels: ['1.'] },
  { id: 'instance-restart-resume', parts: parts(item('A one') + item('A two') + item('B restart', 0, 2) + item('B next', 0, 2) + item('A resume') + item('B resume', 0, 2), abstract(0, level(0)) + instance(1, 0) + instance(2, 0, override(0, 1))), labels: ['1.', '2.', '1.', '2.', '3.', '4.'] },
  { id: 'both-instances-overridden', parts: parts(item('A first') + item('B first', 0, 2) + item('A next') + item('B next', 0, 2), abstract(0, level(0)) + instance(1, 0, override(0, 4)) + instance(2, 0, override(0, 8))), labels: ['4.', '8.', '9.', '10.'] },
  { id: 'style-exact-level', parts: parts(p('Styled a', { style: 'Base' }) + p('Styled b', { style: 'Base' }) + p('Explicit root', { style: 'Base', ilvl: 0 }), basic(level(0) + level(1, { fmt: 'lowerLetter', text: '(%2)', style: 'Base' })), style('Base', { numId: 1 })), labels: ['1.', '2.', '3.'] },
  { id: 'parent-not-yet-used', parts: parts(sequence([2, 2, 0, 2]), basic(level(0, { start: 4 }) + level(1, { start: 3, text: '%1.%2' }) + level(2, { text: '%1.%2.%3' }))), labels: ['4.3.1', '4.3.2', '5.', '5.3.1'] },
  { id: 'override-without-nested-start', parts: parts(sequence([0, 1, 0, 1]), abstract(0, three) + instance(1, 0, override(1, 4, level(1, { fmt: 'upperRoman', text: '[%2]', start: null })))), labels: ['1.', '[IV]', '2.', '[IV]'] },
  { id: 'inherited-style-level', parts: parts(p('First child', { style: 'Derived' }) + p('Next child', { style: 'Derived' }) + p('Direct root', { style: 'Derived', ilvl: 0 }) + p('Restart child', { style: 'Derived' }), basic(three), style('Base', { numId: 1, ilvl: 1 }) + style('Derived', { base: 'Base' })), labels: ['(a)', '(b)', '2.', '(a)'] },
  { id: 'bullets-and-numbers', parts: parts(sequence([0, 1, 1, 0, 1]), basic(level(0) + level(1, { fmt: 'bullet', text: '•' }))), labels: ['1.', '•', '•', '2.', '•'] },
  { id: 'none-format', parts: parts(sequence([0, 1, 0, 1]), basic(level(0, { fmt: 'none', text: '' }) + level(1, { text: '%1.%2', legal: true }))), labels: ['', '.1', '', '.1'] },
  { id: 'repeated-and-future-placeholders', parts: parts(sequence([0, 1]), basic(level(0) + level(1, { text: '%1/%1/%2/%3' }))), labels: ['1.', null], unsupported: true },
  { id: 'empty-table-cell', parts: parts(table(p('')) + item('After empty cell'), basic(level(0))), labels: ['', '1.'] },
  { id: 'different-definitions', parts: parts(item('A first') + item('B first', 0, 2) + item('A second') + item('B second', 0, 2), abstract(0, level(0)) + abstract(1, level(0)) + instance(1, 0) + instance(2, 1)), labels: ['1.', '1.', '2.', '2.'] }
];

export function fixtureHash(fixture) {
  return createHash('sha256').update(JSON.stringify(fixture.parts)).digest('hex');
}
export async function toDocx(xmlParts) {
  const zip = new JSZip();
  const date = new Date('2026-09-07T00:00:00Z');
  const put = (name, value) => zip.file(name, value, { date });
  const definitions = [['document', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'], ['styles', 'application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml']];
  if (xmlParts.numberingXml) definitions.push(['numbering', 'application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml']);
  put('[Content_Types].xml', `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${definitions.map(([name, type]) => `<Override PartName="/word/${name}.xml" ContentType="${type}"/>`).join('')}</Types>`);
  put('_rels/.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`);
  put('word/_rels/document.xml.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${definitions.filter(([name]) => name !== 'document').map(([name], i) => `<Relationship Id="rId${i + 1}" Type="${R}/${name}" Target="${name}.xml"/>`).join('')}</Relationships>`);
  put('word/document.xml', xmlParts.documentXml);
  put('word/styles.xml', xmlParts.stylesXml);
  if (xmlParts.numberingXml) put('word/numbering.xml', xmlParts.numberingXml);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
