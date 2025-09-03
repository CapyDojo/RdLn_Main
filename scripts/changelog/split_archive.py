#!/usr/bin/env python3
"""
Split a large changelog archive into monthly files and normalize headings.
- Input: docs/changelog/Changelog-Archive-2025-08.md (default) or path arg
- Output: docs/changelog/Changelog-Archive-YYYY-MM.md per month
- Normalizes headings to: '## Version x.y.z'
- Ensures a '*Released: YYYY-MM-DD*' line if the date was only in the header
"""
import sys
import re
from pathlib import Path
from datetime import datetime

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('docs/changelog/Changelog-Archive-2025-08.md')
OUT_DIR = Path('docs/changelog')

MONTHS = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
}

def month_name(ym: str) -> str:
    if ym == 'unknown':
        return 'Unknown'
    y, m = ym.split('-')
    dt = datetime(int(y), int(m), 1)
    return dt.strftime('%B %Y')

def parse_date(s: str):
    m = re.search(r'(\d{4})-(\d{2})-(\d{2})', s)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    m = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})', s, re.I)
    if m:
        mon = MONTHS[m.group(1).lower()]
        day = str(int(m.group(2))).zfill(2)
        year = m.group(3)
        return f"{year}-{mon}-{day}"
    return None

def normalize_heading(header: str):
    # ## [0.2.6] - 2025-07-05
    m = re.match(r'^##\s*\[(\d+\.\d+\.\d+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?', header)
    if m:
        ver, date = m.group(1), m.group(2)
        return f"## Version {ver}", ver, date
    # ## Version 0.5.28 - "..."
    m = re.match(r'^##\s*Version\s*(\d+\.\d+\.\d+)', header)
    if m:
        ver = m.group(1)
        return f"## Version {ver}", ver, None
    return None, None, None

def ensure_released_line(lines, header_date):
    if not any(l.strip().startswith('*Released:') for l in lines) and header_date:
        return [lines[0], f"*Released: {header_date}*", *lines[1:]]
    return lines

def detect_month(lines, header_date):
    date = header_date
    if not date:
        for ln in lines:
            m = re.match(r'^\*Released:\s*(.+)\s*\*?\s*$', ln.strip())
            if m:
                d = parse_date(m.group(1))
                if d:
                    date = d
                    break
    if not date:
        for ln in lines:
            m = re.search(r'spans\s+(\d{4}-\d{2}-\d{2})[^\d]+(\d{4}-\d{2}-\d{2})', ln)
            if m:
                date = m.group(2)
                break
    if not date:
        for ln in lines:
            m = re.search(r'(\d{4}-\d{2}-\d{2})', ln)
            if m:
                date = m.group(1)
                break
    return (date[:7] if date else 'unknown')

def split_sections(text: str):
    lines = text.splitlines()
    # Find release section starts
    starts = [i for i, ln in enumerate(lines) if ln.startswith('## ')]
    sections = []
    for idx, start in enumerate(starts):
        end = starts[idx + 1] if idx + 1 < len(starts) else len(lines)
        header = lines[start]
        norm_header, ver, header_date = normalize_heading(header)
        if not norm_header:
            continue
        body = lines[start + 1:end]
        sec_lines = [norm_header, *body]
        sec_lines = ensure_released_line(sec_lines, header_date)
        sections.append((ver, header_date, sec_lines))
    return sections

def main():
    if not SRC.exists():
        print(f"Source archive not found: {SRC}", file=sys.stderr)
        sys.exit(1)
    text = SRC.read_text(encoding='utf-8')
    sections = split_sections(text)
    if not sections:
        print("No release sections found to split.", file=sys.stderr)
        sys.exit(1)
    buckets = {}
    for ver, header_date, lines in sections:
        ym = detect_month(lines, header_date)
        buckets.setdefault(ym, []).append('\n'.join(lines))
    # Write per-month files (overwrite)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for ym, parts in buckets.items():
        out = OUT_DIR / f"Changelog-Archive-{ym}.md"
        label = month_name(ym)
        suffix = f" ({ym})" if ym != 'unknown' else ''
        header = f"# Changelog Archive — {label}{suffix}\n\nThis archive contains entries released in {label}.\n\n"
        out.write_text(header + '\n\n'.join(parts) + '\n', encoding='utf-8')
        print(f"Wrote {out}")

if __name__ == '__main__':
    main()
