#!/usr/bin/env node
/*
  Split a large changelog archive into monthly files and normalize headings.
  - Input: docs/changelog/Changelog-Archive-2025-08.md (default) or path arg
  - Output: docs/changelog/Changelog-Archive-YYYY-MM.md per month
  - Normalizes headings to: `## Version x.y.z`
  - Ensures a `*Released: YYYY-MM-DD*` line if the date was only in the header
*/
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || path.join('docs', 'changelog', 'Changelog-Archive-2025-08.md');
const OUT_DIR = path.join('docs', 'changelog');

function monthName(ym) {
  const [y, m] = ym.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function parseDate(str) {
  // Try ISO first (YYYY-MM-DD)
  let m = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // Try Month DD, YYYY
  m = str.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})/i);
  if (m) {
    const monthMap = {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
    };
    const month = monthMap[m[1].toLowerCase()];
    const day = String(m[2]).padStart(2, '0');
    const year = m[3];
    return `${year}-${month}-${day}`;
  }
  return null;
}

function detectMonth(sectionLines, headerDate) {
  // Prefer header date if present
  let date = headerDate || null;
  // Search for *Released: ...
  if (!date) {
    for (const ln of sectionLines) {
      const m = ln.match(/^\*Released:\s*(.+)\s*\*?\s*$/);
      if (m) {
        const iso = parseDate(m[1]);
        if (iso) { date = iso; break; }
      }
    }
  }
  // Search for spans YYYY-MM-DD–YYYY-MM-DD -> pick end date
  if (!date) {
    for (const ln of sectionLines) {
      const m = ln.match(/spans\s+(\d{4}-\d{2}-\d{2})[^\d]+(\d{4}-\d{2}-\d{2})/i);
      if (m) { date = m[2]; break; }
    }
  }
  // Fallback: any ISO date in the section
  if (!date) {
    for (const ln of sectionLines) {
      const m = ln.match(/(\d{4}-\d{2}-\d{2})/);
      if (m) { date = m[1]; break; }
    }
  }
  if (!date) return 'unknown';
  return date.slice(0, 7); // YYYY-MM
}

function normalizeHeading(headerLine) {
  // Returns { header: '## Version x.y.z', version, headerDate }
  let version = null;
  let headerDate = null;
  let m;
  // ## [0.2.6] - 2025-07-05
  m = headerLine.match(/^##\s*\[(\d+\.\d+\.\d+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/);
  if (m) {
    version = m[1];
    if (m[2]) headerDate = m[2];
    return { header: `## Version ${version}`, version, headerDate };
  }
  // ## Version 0.5.28 - "Tagline"
  m = headerLine.match(/^##\s*Version\s*(\d+\.\d+\.\d+)/);
  if (m) {
    version = m[1];
    return { header: `## Version ${version}`, version, headerDate };
  }
  return null;
}

function splitSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  let i = 0;
  // Skip preface until first release heading
  while (i < lines.length && !/^##\s/.test(lines[i])) i++;
  while (i < lines.length) {
    // Find a release header
    while (i < lines.length && !/^##\s/.test(lines[i])) i++;
    if (i >= lines.length) break;
    const headerIdx = i;
    const headerLine = lines[i];
    const norm = normalizeHeading(headerLine);
    if (!norm) { i++; continue; }
    // Find next header start
    let j = i + 1;
    while (j < lines.length && !/^##\s/.test(lines[j])) j++;
    const section = lines.slice(headerIdx, j);
    sections.push({ headerLine, norm, lines: section });
    i = j;
  }
  return sections;
}

function ensureReleasedLine(sectionLines, headerDate) {
  const hasReleased = sectionLines.some(l => /^\*Released:/.test(l));
  if (!hasReleased && headerDate) {
    // Insert after header line
    const res = [...sectionLines];
    res.splice(1, 0, `*Released: ${headerDate}*`);
    return res;
  }
  return sectionLines;
}

function process() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source archive not found: ${SRC}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(SRC, 'utf8');
  const sections = splitSections(raw);
  if (!sections.length) {
    console.error('No release sections found to split.');
    process.exit(1);
  }
  const buckets = new Map(); // ym -> array of section strings
  for (const s of sections) {
    const { header, headerDate } = s.norm;
    // Normalize header
    const body = s.lines.slice(1);
    let outLines = [header, ...body];
    // Ensure Released line if we had a date in the header
    outLines = ensureReleasedLine(outLines, headerDate);
    const ym = detectMonth(outLines, headerDate);
    if (!buckets.has(ym)) buckets.set(ym, []);
    buckets.get(ym).push(outLines.join('\n'));
  }

  // Write each bucket to its own file
  for (const [ym, parts] of buckets.entries()) {
    const fname = `Changelog-Archive-${ym}.md`;
    const fpath = path.join(OUT_DIR, fname);
    const humanMonth = monthName(ym);
    const header = `# Changelog Archive — ${humanMonth} (${ym})\n\nThis archive contains entries released in ${humanMonth}.`;
    const content = header + '\n\n' + parts.join('\n\n');
    fs.writeFileSync(fpath, content, 'utf8');
    console.log(`Wrote ${fpath}`);
  }
}

process();

