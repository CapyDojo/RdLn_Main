const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const WordExtractor = require('word-extractor');
(async () => {
  const results = [];
  for (const filename of ['simple-list.doc', 'Lists.doc', 'lists-margins.doc']) {
    const bytes = fs.readFileSync(path.join(__dirname, filename));
    const result = await new WordExtractor().extract(bytes);
    results.push({ filename, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), signature: bytes.subarray(0, 8).toString('hex'), body: result.getBody({ filterUnicode: false }) });
  }
  fs.writeFileSync(path.join(__dirname, 'extraction-results.json'), JSON.stringify({ library: 'word-extractor@1.0.4', results }, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
