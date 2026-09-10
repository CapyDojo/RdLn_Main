import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { extractXml, extractDocx, serializeParagraphs } from '../dist/core/index.js';
import { formatNumber } from '../dist/core/formats.js';
import { parseXml } from '../scripts/node-parser.mjs';
import { verifyWord } from '../scripts/verify-word.mjs';
import { fixtures, parts, level, abstract, instance, p, item, style, table, tag, toDocx, W } from './fixtures.mjs';

const basic = (levels = level(0)) => abstract(0, levels) + instance(1, 0);
const extract = (body, definitions = basic(), styles = '') => extractXml(parts(body, definitions, styles), parseXml);

for (const fixture of fixtures) {
  test(`exact labels: ${fixture.id}`, async () => {
    const result = await extractDocx(await toDocx(fixture.parts), parseXml);
    assert.deepEqual(result.paragraphs.map(paragraph => paragraph.label), fixture.labels);
    assert.equal(result.complete, !fixture.unsupported);
  });
}
test('actual Word reference: labels, levels, paragraph order and text match', async () => {
  const report = await verifyWord();
  assert.deepEqual(report.failures, []);
});
test('paragraph text retains hyperlink and simple-field text once in source order', () => {
  const result = extract(p('', { inline: '<w:r><w:t xml:space="preserve">A &amp; B </w:t></w:r><w:hyperlink><w:r><w:t>link</w:t></w:r></w:hyperlink><w:fldSimple w:instr="REF target"><w:r><w:t xml:space="preserve"> field</w:t></w:r></w:fldSimple>' }));
  assert.equal(result.text, 'A & B link field');
  assert.equal(result.diagnostics[0].code, 'CACHED_FIELD');
});
test('tabs and breaks survive without trimming or collapsing empty paragraphs', () => {
  const result = extract(p('') + p('', { inline: '<w:r><w:t xml:space="preserve"> leading </w:t><w:tab/><w:t>x</w:t><w:br/><w:t>y</w:t><w:cr/><w:noBreakHyphen/><w:softHyphen/></w:r>' }) + p(''));
  assert.equal(result.text, '\n leading \tx\ny\n\u2011\u00AD\n');
});
test('nested tables are visited once and retain cell context', () => {
  const result = extract(table(item('Outer') + table(item('Inner')) + item('Outer again')) + item('Body'));
  assert.deepEqual(result.paragraphs.map(p => [p.text, p.label, p.tablePath.length]), [['Outer', '1.', 3], ['Inner', '2.', 6], ['Outer again', '3.', 3], ['Body', '4.', 0]]);
});
test('content controls and insertions preserve body order; deleted blocks do not consume numbers', () => {
  const result = extract(`<w:sdt><w:sdtPr/><w:sdtContent>${item('One')}</w:sdtContent></w:sdt><w:del>${item('Deleted')}</w:del><w:ins>${item('Two')}</w:ins>`);
  assert.deepEqual(result.paragraphs.map(p => [p.text, p.label]), [['One', '1.'], ['Two', '2.']]);
});
test('current-view runs exclude deleted and moved-from text', () => {
  const result = extract(p('', { inline: '<w:del><w:r><w:delText>old</w:delText></w:r></w:del><w:ins><w:r><w:t>new</w:t></w:r></w:ins><w:moveFrom><w:r><w:t>duplicate</w:t></w:r></w:moveFrom>' }));
  assert.equal(result.text, 'new');
});
test('negative indentation is retained as metadata without repeat-count errors', () => {
  const result = extract(p('Text', { numId: 1, properties: '<w:ind w:left="-120" w:firstLine="-80"/>' }));
  assert.equal(result.paragraphs[0].indentation.left, -120);
  assert.equal(result.paragraphs[0].indentation.firstLine, -80);
  assert.equal(result.text, '1.\tText');
});
test('prefix names do not matter; namespace URIs do', () => {
  const original = parts(item('Text'), basic());
  const renamed = Object.fromEntries(Object.entries(original).map(([name, xml]) => [name, xml?.replaceAll('w:', 'x:').replaceAll('xmlns:w=', 'xmlns:x=')]));
  assert.equal(extractXml(renamed, parseXml).text, '1.\tText');
  const strict = Object.fromEntries(Object.entries(original).map(([name, xml]) => [name, xml?.replaceAll(W, 'http://purl.oclc.org/ooxml/wordprocessingml/main')]));
  assert.equal(extractXml(strict, parseXml).text, '1.\tText');
});
test('foreign t/r/p elements do not masquerade as Word elements', () => {
  const result = extract(p('', { inline: '<x:r xmlns:x="urn:foreign"><x:t>not Word text</x:t></x:r><w:r><w:t>Word text</w:t></w:r>' }));
  assert.equal(result.text, 'Word text');
});
test('partial direct numbering inherits the style numId and overrides its level', () => {
  const result = extract(p('Child', { style: 'Derived', ilvl: 1 }), basic(level(0) + level(1, { text: '(%2)', fmt: 'lowerLetter' })), style('Base', { numId: 1 }) + style('Derived', { base: 'Base' }));
  assert.equal(result.text, '\t(a)\tChild');
});
test('explicit cancellation works even with a missing inherited style', () => {
  const result = extract(p('Plain', { numId: 0, style: 'Missing' }));
  assert.equal(result.text, 'Plain');
  assert.equal(result.complete, true);
});
test('default paragraph style numbering is inherited without pStyle', () => {
  const xml = parts(p('Default'), basic());
  xml.stylesXml = xml.stylesXml.replace(tag('name', 'Normal'), tag('name', 'Normal') + '<w:pPr><w:numPr><w:numId w:val="1"/></w:numPr></w:pPr>');
  assert.equal(extractXml(xml, parseXml).text, '1.\tDefault');
});
test('separate extractions and concurrent imports cannot leak counters', async () => {
  const bytes = await toDocx(parts(item('Start'), basic()));
  const results = await Promise.all([extractDocx(bytes, parseXml), extractDocx(bytes, parseXml)]);
  assert.deepEqual(results.map(r => r.text), ['1.\tStart', '1.\tStart']);
});
test('zero and abstractNumId=0 remain valid values', () => {
  const result = extract(item('Zero'), basic(level(0, { start: 0 })));
  assert.equal(result.paragraphs[0].abstractNumId, '0');
  assert.equal(result.paragraphs[0].label, '0.');
});
test('unsupported formats and missing definitions are explicit, not decimal guesses', () => {
  for (const definitions of [basic(level(0, { fmt: 'chineseCounting' })), '']) {
    const result = extract(item('Text'), definitions);
    assert.equal(result.complete, false);
    assert.equal(result.paragraphs[0].label, null);
    assert.match(result.text, /numbering unresolved/);
    assert.throws(() => serializeParagraphs(result.paragraphs), /Unresolved numbering/);
  }
});
test('cyclic numbering style links terminate with diagnostics', () => {
  const definitions = abstract(0, '', tag('numStyleLink', 'Loop')) + instance(1, 0);
  const result = extract(item('Text'), definitions, style('Loop', { type: 'numbering', numId: 1 }));
  assert.match(result.diagnostics[0].message, /Cyclic numbering/);
});
test('cyclic style inheritance terminates with diagnostics', () => {
  const result = extract(p('Text', { style: 'A' }), basic(), style('A', { base: 'B' }) + style('B', { base: 'A' }));
  assert.match(result.diagnostics[0].message, /Cyclic style/);
});
test('missing intermediate level is flagged instead of inventing a parent', () => {
  const result = extract(item('Child', 2), basic(level(0) + level(2)));
  assert.equal(result.paragraphs[0].label, null);
});
test('font-dependent and picture bullets require explicit support', () => {
  for (const options of [{ fmt: 'bullet', text: '\uF0B7' }, { fmt: 'bullet', text: '•', extra: '<w:lvlPicBulletId w:val="1"/>' }]) {
    assert.equal(extract(item('Bullet'), basic(level(0, options))).complete, false);
  }
});

const listFont = font => `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/></w:rPr>`;

test('verified Symbol bullets resolve with raw glyph and font provenance', () => {
  const result = extract(item('First') + item('Child', 1) + item('Second'), basic(
    level(0, { fmt: 'bullet', text: '\uF0B7', extra: listFont('Symbol') }) +
    level(1, { fmt: 'lowerLetter', text: '%2.' })
  ));
  assert.equal(result.complete, true);
  assert.deepEqual(result.paragraphs.map(p => p.label), ['•', 'a.', '•']);
  assert.deepEqual(result.paragraphs[0].labelSource, { text: '\uF0B7', font: 'Symbol' });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(serializeParagraphs(result.paragraphs), '•\tFirst\n\ta.\tChild\n•\tSecond');
});

for (const [font, code, expected] of [
  ['Symbol', 0x2d, '−'], ['Symbol', 0x6f, 'ο'], ['Symbol', 0xa7, '♣'],
  ['Symbol', 0xa8, '♦'], ['Symbol', 0xab, '↔'], ['Symbol', 0xac, '←'],
  ['Symbol', 0xad, '↑'], ['Symbol', 0xae, '→'], ['Symbol', 0xaf, '↓'], ['Symbol', 0xb7, '•'],
  ['Wingdings', 0x6c, '⚫'], ['Wingdings', 0x6e, '◼'], ['Wingdings', 0x75, '◆'],
  ['Wingdings', 0x9f, '•'], ['Wingdings', 0xa7, '▪'], ['Wingdings', 0xab, '★'],
  ['Wingdings', 0xfc, '✓'], ['Wingdings 2', 0x52, '☑'], ['Webdings', 0x61, '✔']
]) {
  test(`font-specific label: ${font} ${code.toString(16)}`, () => {
    for (const source of [String.fromCodePoint(code), String.fromCodePoint(0xf000 + code)]) {
      const result = extract(item('Item'), basic(level(0, { fmt: 'bullet', text: source, extra: listFont(font) })));
      assert.equal(result.paragraphs[0].label, expected);
      assert.equal(result.complete, true);
    }
  });
}

test('Unicode bullets, multi-character literals and suffixes remain literal', () => {
  for (const text of ['•', '○', '▪', '□', '→', '✓', '—', '✓ →', '%9', '']) {
    for (const [suffix, separator] of [['tab', '\t'], ['space', ' '], ['nothing', '']]) {
      const result = extract(item('Item'), basic(level(0, { fmt: 'bullet', text, suffix })));
      assert.equal(result.paragraphs[0].label, text);
      assert.equal(result.paragraphs[0].suffix, separator);
      assert.equal(result.complete, true);
    }
  }
});

test('unknown font glyphs remain unresolved with their original metadata', () => {
  for (const [font, text] of [['OtherFont', '\uF0B7'], ['OtherFont', '\u{F0001}'], ['OtherFont', '\u{100001}'], ['Wingdings', '\uF0B7'], ['Wingdings 3', 'a'], ['Symbol', '\uF060']]) {
    const result = extract(item('Item'), basic(level(0, { fmt: 'bullet', text, extra: listFont(font) })));
    assert.equal(result.paragraphs[0].label, null);
    assert.equal(result.complete, false);
    assert.deepEqual(result.paragraphs[0].labelSource, { text, font });
    assert.throws(() => serializeParagraphs(result.paragraphs), /Unresolved numbering/);
  }
});

test('font matching normalizes case but never guesses theme or conflicting slots', () => {
  assert.equal(extract(item('Item'), basic(level(0, { fmt: 'bullet', text: '\uF0B7', extra: listFont(' sYmBoL ') }))).paragraphs[0].label, '•');
  for (const attributes of ['w:ascii="Symbol" w:hAnsi="Wingdings"', 'w:ascii="Symbol" w:asciiTheme="minorHAnsi"', 'w:hAnsiTheme="minorHAnsi"']) {
    assert.equal(extract(item('Item'), basic(level(0, { fmt: 'bullet', text: '\uF0B7', extra: `<w:rPr><w:rFonts ${attributes}/></w:rPr>` }))).complete, false);
  }
  assert.equal(extract(item('Item'), basic(level(0, { fmt: 'bullet', text: '•', extra: '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Calibri"/></w:rPr>' }))).paragraphs[0].label, '•');
  assert.equal(extract(item('Item'), basic(level(0, { fmt: 'bullet', text: 'l', extra: '<w:rPr><w:rFonts w:ascii="Wingdings" w:hAnsi="Symbol"/></w:rPr>' }))).complete, false);
});

test('null and none labels do not report errors for invisible template glyphs', () => {
  assert.equal(extract(item('Item'), basic(level(0, { fmt: 'none', text: '\uF0B7%9' }))).paragraphs[0].label, '');
  const nullLabel = basic(level(0, { fmt: 'bullet', text: '\uF0B7' })).replace('<w:lvlText ', '<w:lvlText w:null="true" ');
  assert.equal(extract(item('Item'), nullLabel).paragraphs[0].label, '');
});

test('list-level indentation wins over style while direct paragraph overrides win last', () => {
  const styles = style('Base', { extra: '<w:ind w:left="720" w:right="90"/>' }) + style('Derived', { base: 'Base' });
  const body = p('Nested', { style: 'Derived', numId: 1, ilvl: 1 }) +
    p('Direct', { style: 'Derived', numId: 1, ilvl: 1, properties: '<w:ind w:left="1800" w:hanging="240"/>' }) +
    p('Plain', { style: 'Derived' });
  const result = extract(body, basic(level(0) + level(1)), styles);
  assert.deepEqual(result.paragraphs.map(p => p.indentation), [
    { left: 1440, right: 90, hanging: 360 },
    { left: 1800, right: 90, hanging: 240 },
    { left: 720, right: 90 }
  ]);
});
test('formatting bounds are checked, including long alphabetic sequences', () => {
  assert.equal(formatNumber(28, 'upperLetter'), 'BB');
  assert.equal(formatNumber(53, 'lowerLetter'), 'aaa');
  assert.equal(formatNumber(19, 'lowerRoman'), 'xix');
  assert.equal(formatNumber(8, 'decimalZero'), '08');
  assert.throws(() => formatNumber(4000, 'upperRoman'));
  assert.throws(() => formatNumber(1000000, 'lowerLetter'));
});
test('malformed XML, DTDs, invalid levels and duplicate IDs fail clearly', () => {
  assert.throws(() => extractXml({ documentXml: '<bad>' }, parseXml));
  assert.throws(() => extractXml({ documentXml: '<!DOCTYPE document><w:document/>' }, parseXml), /DTD/);
  assert.equal(extract(item('Bad', 99)).complete, false);
  assert.throws(() => extract(item('Duplicate'), basic() + instance(1, 0)), /duplicate/i);
});
test('package relationships locate nonstandard document, style and numbering paths', async () => {
  const zip = await JSZip.loadAsync(await toDocx(parts(item('Moved'), basic())));
  const main = await zip.file('word/document.xml').async('string');
  const nums = await zip.file('word/numbering.xml').async('string');
  const styles = await zip.file('word/styles.xml').async('string');
  const rels = (await zip.file('word/_rels/document.xml.rels').async('string')).replace('numbering.xml', '../lists/defs.xml').replace('styles.xml', '../formats/styles.xml');
  zip.file('_rels/.rels', (await zip.file('_rels/.rels').async('string')).replace('word/document.xml', 'content/body.xml'));
  zip.remove('word');
  zip.file('content/body.xml', main);
  zip.file('content/_rels/body.xml.rels', rels);
  zip.file('lists/defs.xml', nums);
  zip.file('formats/styles.xml', styles);
  assert.equal((await extractDocx(await zip.generateAsync({ type: 'nodebuffer' }), parseXml)).text, '1.\tMoved');
});
test('external and escaping package relationships are rejected without network access', async () => {
  for (const target of ['https://example.com/document.xml', '../../document.xml']) {
    const zip = await JSZip.loadAsync(await toDocx(parts(p('Text'))));
    zip.file('_rels/.rels', (await zip.file('_rels/.rels').async('string')).replace('word/document.xml', target));
    await assert.rejects(extractDocx(await zip.generateAsync({ type: 'nodebuffer' }), parseXml), /target|escapes/);
  }
});
test('1,000 sequential paragraphs retain exact first and last labels', () => {
  const result = extract(Array.from({ length: 1000 }, (_, i) => item(`Clause ${i}`)).join(''));
  assert.equal(result.paragraphs.length, 1000);
  assert.equal(result.paragraphs[0].label, '1.');
  assert.equal(result.paragraphs[999].label, '1000.');
});
