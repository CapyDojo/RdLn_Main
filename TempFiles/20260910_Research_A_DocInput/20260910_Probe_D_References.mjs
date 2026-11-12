import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtures, fixtureHash } from '../../prototypes/Docx Parser Prototypes/20260907_Prototype_A_NumberingResolver/tests/fixtures.mjs';
import JSZip from 'jszip';
const root = path.dirname(fileURLToPath(import.meta.url));
const proto = path.resolve(root, '../../prototypes/Docx Parser Prototypes/20260907_Prototype_A_NumberingResolver');
const reference = JSON.parse(fs.readFileSync(path.join(proto, 'tests/word-reference.json'), 'utf8'));
const anydoc = JSON.parse(fs.readFileSync(path.join(root, 'anydoc-results.json'), 'utf8'));
const checks = [];
for (const id of ['style-inheritance-and-cancellation', 'instance-restart-resume', 'inherited-style-level']) {
  const fixture = fixtures.find(f => f.id === id);
  const captured = reference.fixtures.find(f => f.id === id);
  const zip = await JSZip.loadAsync(fs.readFileSync(path.join(proto, 'artifacts/fixtures', id + '.docx')));
  const partsMatch = (await Promise.all([['documentXml','word/document.xml'], ['numberingXml','word/numbering.xml'], ['stylesXml','word/styles.xml']].map(async ([key, name]) => (await zip.file(name).async('string')) === fixture.parts[key]))).every(Boolean);
  checks.push({ id, referenceHashMatches: fixtureHash(fixture) === captured.sourceHash, fixturePartsMatch: partsMatch, expected: captured.paragraphs.map(p => ({ text: p.text.replace(/[\r\x07]+$/g, ''), label: p.label })), actualMarkdown: anydoc.results.find(r => r.name === id).markdown });
}
const result = { wordVersion: reference.wordVersion, wordBuild: reference.wordBuild, capturedAt: reference.capturedAt, checks };
fs.writeFileSync(path.join(root, 'verified-cross-checks.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
