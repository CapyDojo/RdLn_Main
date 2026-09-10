import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { fixtures, fixtureHash, toDocx } from '../tests/fixtures.mjs';
import { extractDocx } from '../dist/core/index.js';
import { parseXml } from './node-parser.mjs';

export function normalizeWordText(text) {
  // Remove only paragraph/cell terminators, preserving empty paragraphs, tabs and content.
  const body = text.endsWith('\r\u0007') ? text.slice(0, -2) : text.endsWith('\r') ? text.slice(0, -1) : text;
  return body.replaceAll('\v', '\n');
}
export async function verifyWord() {
  const reference = JSON.parse(await readFile(new URL('../tests/word-reference.json', import.meta.url), 'utf8'));
  if (!reference.source.startsWith('Microsoft Word COM:') || !reference.wordVersion) throw new Error('Reference lacks Microsoft Word provenance.');
  const failures = [];
  const unsupported = [];
  let paragraphCount = 0;
  for (const fixture of fixtures) {
    const captured = reference.fixtures.find(entry => entry.id === fixture.id);
    if (!captured || captured.sourceHash !== fixtureHash(fixture)) {
      failures.push({ fixture: fixture.id, reason: 'Missing or stale Word reference; recapture this fixture.' });
      continue;
    }
    const expected = captured.paragraphs.filter(paragraph => !paragraph.isTableRowMarker);
    const result = await extractDocx(await toDocx(fixture.parts), parseXml);
    if (fixture.unsupported) {
      unsupported.push({ fixture: fixture.id, diagnostics: result.diagnostics });
      if (result.complete || !result.paragraphs.some(p => p.label === null)) failures.push({ fixture: fixture.id, reason: 'Expected an explicit unsupported result.' });
      continue;
    }
    const actual = result.paragraphs;
    if (!result.complete) failures.push({ fixture: fixture.id, reason: 'Extraction reported incomplete semantics.', diagnostics: result.diagnostics });
    if (expected.length !== actual.length) failures.push({ fixture: fixture.id, reason: 'Paragraph count differs.', expected: expected.length, actual: actual.length });
    for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
      const word = expected[i];
      const parsed = actual[i];
      if (!word || !parsed) continue;
      paragraphCount++;
      const wanted = { text: normalizeWordText(word.text), label: word.label, level: word.level };
      const received = { text: parsed.text, label: parsed.label, level: parsed.level };
      if (JSON.stringify(wanted) !== JSON.stringify(received)) failures.push({ fixture: fixture.id, paragraph: i + 1, expected: wanted, actual: received });
    }
  }
  return { fixtures: fixtures.length, supportedFixtures: fixtures.length - unsupported.length, paragraphs: paragraphCount, wordVersion: reference.wordVersion, wordBuild: reference.wordBuild, unsupported, failures };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await verifyWord();
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
}
