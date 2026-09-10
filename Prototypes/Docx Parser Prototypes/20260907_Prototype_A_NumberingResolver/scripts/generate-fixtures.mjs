import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fixtures, fixtureHash, toDocx } from '../tests/fixtures.mjs';

const destination = new URL('../artifacts/fixtures/', import.meta.url);
await mkdir(destination, { recursive: true });
const manifest = [];
for (const fixture of fixtures) {
  await writeFile(new URL(`${fixture.id}.docx`, destination), await toDocx(fixture.parts));
  manifest.push({ id: fixture.id, sourceHash: fixtureHash(fixture), file: `${fixture.id}.docx` });
}
await writeFile(new URL('manifest.json', destination), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Generated ${manifest.length} DOCX fixtures in ${fileURLToPath(destination)}`);
