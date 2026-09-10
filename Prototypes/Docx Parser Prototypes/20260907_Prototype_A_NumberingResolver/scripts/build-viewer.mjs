import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fixtures, fixtureHash } from '../tests/fixtures.mjs';

const root = new URL('../', import.meta.url);
const fixture = fixtures.find(f => f.id === 'three-level-outline');
const reference = JSON.parse(await readFile(new URL('tests/word-reference.json', root), 'utf8'));
const captured = reference.fixtures.find(f => f.id === fixture.id);
if (!captured || captured.sourceHash !== fixtureHash(fixture)) throw new Error('Demo requires a current Word reference.');
const bundle = await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: ['src/viewer.ts'], bundle: true, write: false, minify: true,
  platform: 'browser', format: 'iife', target: ['es2020'],
  define: {
    DEMO_PARTS: JSON.stringify(fixture.parts),
    DEMO_LABELS: JSON.stringify(captured.paragraphs.filter(p => !p.isTableRowMarker).map(p => p.label)),
    REFERENCE_SUMMARY: JSON.stringify(`Reference example: Microsoft Word ${reference.wordVersion} · build ${reference.wordBuild}`)
  }
});
const html = await readFile(new URL('inspector.html', root), 'utf8');
const script = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script');
await mkdir(new URL('dist/', root), { recursive: true });
const target = new URL('dist/inspector.html', root);
await writeFile(target, html.replace('<!-- PROTOTYPE_SCRIPT -->', () => `<script>${script}</script>`));
console.log(`Offline inspector: ${fileURLToPath(target)}`);
