import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSync, toMarkdownBytes, toDocument } from '@firecrawl/anydoc-wasm';
const root = path.dirname(fileURLToPath(import.meta.url));
initSync({ module: fs.readFileSync(path.join(root, 'node_modules/@firecrawl/anydoc-wasm/anydoc_wasm_bg.wasm')) });
const results = [];
for (const name of ['simple-list.doc', 'Lists.doc', 'lists-margins.doc']) {
  const bytes = fs.readFileSync(path.join(root, name));
  try { results.push({ name, markdown: toMarkdownBytes(bytes), document: toDocument(bytes) }); }
  catch (error) { results.push({ name, error: String(error) }); }
}
const fixtureRoot = path.resolve(root, '../../prototypes/Docx Parser Prototypes/20260907_Prototype_A_NumberingResolver/artifacts/fixtures');
for (const name of ['three-level-outline', 'never-restart', 'style-inheritance-and-cancellation', 'legal-numbering', 'instance-restart-resume', 'inherited-style-level']) {
  try { const bytes = fs.readFileSync(path.join(fixtureRoot, name + '.docx')); results.push({ name, markdown: toMarkdownBytes(bytes), document: toDocument(bytes) }); }
  catch (error) { results.push({ name, error: String(error) }); }
}
fs.writeFileSync(path.join(root, 'anydoc-results.json'), JSON.stringify({ package: '@firecrawl/anydoc-wasm@0.2.4', results }, null, 2));
console.log(JSON.stringify(results.map(({ name, markdown, error }) => ({ name, markdown, error })), null, 2));
