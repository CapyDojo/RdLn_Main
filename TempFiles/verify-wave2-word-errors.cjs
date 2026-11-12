/**
 * WAVE-2 verification: extract mapWordCompareFailure from production main.cjs
 * and assert approved buckets + first-match-wins. Does not start Electron.
 */
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src-electron', 'main.cjs');
const src = fs.readFileSync(mainPath, 'utf8');

const start = src.indexOf('const WORD_COMPARE_FAILURE_BUCKETS');
const end = src.indexOf('async function launchWordCompare');
if (start < 0 || end < 0 || end <= start) {
  console.error('FAIL: could not extract mapper from main.cjs');
  process.exit(1);
}

const extracted = src.slice(start, end);
const factory = new Function(`${extracted}\nreturn { WORD_COMPARE_FAILURE_BUCKETS, mapWordCompareFailure };`);
const { WORD_COMPARE_FAILURE_BUCKETS, mapWordCompareFailure } = factory();

const EXPECTED_ORDER = [
  'WORD_NOT_AVAILABLE',
  'FILE_READ_ONLY',
  'FILE_IN_USE',
  'FILE_PROTECTED',
  'FILE_NOT_FOUND'
];

const EXPECTED_MESSAGES = {
  WORD_NOT_AVAILABLE: 'Microsoft Word does not appear to be installed on this computer.',
  FILE_READ_ONLY: 'The original file is marked read-only. Remove that restriction or save a copy, then try again.',
  FILE_IN_USE: 'One of the files is open or locked in another program. Close it and try again.',
  FILE_PROTECTED: 'Word could not open one of the files because it is password-protected or in Protected View.',
  FILE_NOT_FOUND: 'One or both source files could not be found.',
  WORD_COMPARE_FAILED: 'RdLn could not launch Microsoft Word. Please try again.'
};

let failed = 0;
function assert(cond, label) {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
  }
}

console.log('1. Bucket order');
assert(
  WORD_COMPARE_FAILURE_BUCKETS.map((b) => b.code).join(',') === EXPECTED_ORDER.join(','),
  `order is ${EXPECTED_ORDER.join(' → ')}`
);

console.log('2. Phrase mapping');
const phraseCases = [
  ['Retrieving the COM class factory failed', 'WORD_NOT_AVAILABLE'],
  ['80040154 Class not registered', 'WORD_NOT_AVAILABLE'],
  ['ActiveX component cannot create object', 'WORD_NOT_AVAILABLE'],
  ['The file is read-only', 'FILE_READ_ONLY'],
  ['Access is denied', 'FILE_READ_ONLY'],
  ['HRESULT: 800A1066', 'FILE_READ_ONLY'],
  ['The process cannot access the file because it is being used by another process', 'FILE_IN_USE'],
  ['The file is locked', 'FILE_IN_USE'],
  ['permission denied sharing', 'FILE_IN_USE'],
  ['The document is password protected', 'FILE_PROTECTED'],
  ['Document is in Protected View', 'FILE_PROTECTED'],
  ['The file is encrypted', 'FILE_PROTECTED'],
  ['Original file not found.', 'FILE_NOT_FOUND'],
  ['Revised file not found.', 'FILE_NOT_FOUND'],
  ['The system cannot find the file specified', 'FILE_NOT_FOUND'],
  ["Sorry, we couldn't find your file. Was it moved, renamed, or deleted?", 'FILE_NOT_FOUND'],
  ['Some unexpected Word COM explosion', 'WORD_COMPARE_FAILED'],
  ['', 'WORD_COMPARE_FAILED'],
  [null, 'WORD_COMPARE_FAILED']
];

for (const [input, expected] of phraseCases) {
  const result = mapWordCompareFailure(input);
  assert(
    result.ok === false && result.code === expected && result.message === EXPECTED_MESSAGES[expected],
    `${JSON.stringify(input)} → ${expected}`
  );
}

console.log('3. First match wins');
assert(
  mapWordCompareFailure('80040154 file not found').code === 'WORD_NOT_AVAILABLE',
  'COM missing + not found → WORD_NOT_AVAILABLE'
);
assert(
  mapWordCompareFailure('access denied because file is in use').code === 'FILE_READ_ONLY',
  'access denied + in use → FILE_READ_ONLY'
);
assert(
  mapWordCompareFailure('file is locked and password protected').code === 'FILE_IN_USE',
  'locked + password → FILE_IN_USE'
);
assert(
  mapWordCompareFailure('password required; file not found').code === 'FILE_PROTECTED',
  'password + not found → FILE_PROTECTED'
);

console.log('4. UI must not receive raw traces');
const raw = mapWordCompareFailure('System.Runtime.InteropServices.COMException (0x80040154): Class not registered');
assert(
  !raw.message.toLowerCase().includes('comexception') && !raw.message.includes('0x80040154'),
  'mapped message contains no HRESULT/trace'
);

console.log('5. WAVE-1 production invariants');
assert(!src.includes('IsReadOnly'), 'production main.cjs no longer mutates IsReadOnly');
assert(
  src.includes("throw 'Original file not found.'") && src.includes("throw 'Revised file not found.'"),
  'PowerShell still throws the not-found lines the mapper matches'
);

const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'ComparisonInterface.tsx'), 'utf8');
assert(
  renderer.includes("message: result.message || 'RdLn could not launch Microsoft Word. Please try again.'"),
  'renderer uses main-process message'
);
assert(
  renderer.includes("message: 'RdLn could not launch Microsoft Word. Please try again.'") &&
    !renderer.includes('error instanceof Error ? error.message'),
  'renderer catch does not surface raw exception text'
);
assert(renderer.includes('wordCompareFeedback.message'), 'mapped message is rendered in the UI');

if (failed) {
  console.log(`\nRESULT: ${failed} failure(s)`);
  process.exit(1);
}
console.log('\nRESULT: all mapper and wiring checks passed');
