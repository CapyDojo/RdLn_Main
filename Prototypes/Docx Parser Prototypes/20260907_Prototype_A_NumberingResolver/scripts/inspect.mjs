import { readFile } from 'node:fs/promises';
import { extractDocx } from '../dist/core/index.js';
import { parseXml } from './node-parser.mjs';

const filename = process.argv[2];
if (!filename) {
  console.error('Usage: npm run inspect -- "C:\\path\\document.docx" [--json]');
  process.exitCode = 1;
} else {
  try {
    const result = await extractDocx(await readFile(filename), parseXml);
    console.log(process.argv.includes('--json') ? JSON.stringify(result, null, 2) : result.text);
    if (!result.complete) {
      console.error(JSON.stringify(result.diagnostics, null, 2));
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
