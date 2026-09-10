import { extractDocx, extractXml } from './index.js';
import type { DocxParts, ExtractionResult } from './types.js';

declare const DEMO_PARTS: DocxParts;
declare const DEMO_LABELS: string[];
declare const REFERENCE_SUMMARY: string;

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing inspector element: ${id}`);
  return found as T;
}
const input = element<HTMLInputElement>('document-file');
const expected = element<HTMLTextAreaElement>('expected-labels');
const compareEnabled = element<HTMLInputElement>('compare-enabled');
const status = element('status');
const output = element('output');
const rows = element('paragraphs');
const issues = element('issues');
const downloadText = element<HTMLButtonElement>('download-text');
const downloadJson = element<HTMLButtonElement>('download-json');
let result: ExtractionResult | null = null;
let filename = 'numbering-inspection';
let request = 0;

element('reference-summary').textContent = REFERENCE_SUMMARY;

function render(): void {
  rows.replaceChildren();
  issues.replaceChildren();
  output.textContent = result?.text ?? '';
  downloadText.disabled = !result?.complete;
  downloadJson.disabled = result === null;
  if (!result) return;
  const labels = expected.value.replaceAll('\r\n', '\n').split('\n');
  let mismatches = 0;
  for (const paragraph of result.paragraphs) {
    const tr = document.createElement('tr');
    const expectedLabel = labels[paragraph.index];
    const mismatch = compareEnabled.checked && (expectedLabel === undefined || paragraph.label !== expectedLabel);
    if (mismatch) mismatches++;
    tr.dataset.mismatch = String(mismatch);
    tr.dataset.unresolved = String(paragraph.label === null);
    const values = [
      String(paragraph.index + 1),
      paragraph.level === null ? '—' : String(paragraph.level + 1),
      paragraph.label === null ? 'Unresolved' : paragraph.label || '—',
      compareEnabled.checked ? expectedLabel === undefined ? '(missing)' : expectedLabel || '—' : '—',
      paragraph.text || '(empty paragraph)'
    ];
    for (const [index, value] of values.entries()) {
      const td = document.createElement('td');
      td.textContent = value;
      if (index === 4) td.title = JSON.stringify({ numId: paragraph.numId, abstractNumId: paragraph.abstractNumId, indentation: paragraph.indentation, tablePath: paragraph.tablePath });
      tr.append(td);
    }
    rows.append(tr);
  }
  const extraLabels = compareEnabled.checked ? Math.max(0, labels.length - result.paragraphs.length) : 0;
  for (const diagnostic of result.diagnostics) {
    const li = document.createElement('li');
    li.textContent = `${diagnostic.paragraphIndex === undefined ? '' : `Paragraph ${diagnostic.paragraphIndex + 1}: `}${diagnostic.message}`;
    issues.append(li);
  }
  element('diagnostics').hidden = result.diagnostics.length === 0;
  const numbered = result.paragraphs.filter(p => p.numberingStatus !== 'none').length;
  const comparison = compareEnabled.checked ? ` · ${mismatches + extraLabels} label mismatches${extraLabels ? ` (${extraLabels} extra expected labels)` : ''}` : ' · No expected labels supplied';
  status.textContent = `${result.paragraphs.length} paragraphs · ${numbered} list items${comparison}${result.complete ? '' : ' · Review required'}`;
  status.dataset.state = !result.complete || mismatches + extraLabels ? 'review' : 'ready';
}

async function load(file: File): Promise<void> {
  const current = ++request;
  result = null;
  compareEnabled.checked = false;
  expected.value = '';
  element('diagnostics').hidden = true;
  render();
  filename = file.name.replace(/\.docx$/i, '');
  status.textContent = `Reading ${file.name}…`;
  status.dataset.state = '';
  try {
    if (!file.name.toLowerCase().endsWith('.docx')) throw new Error('Choose a .docx file.');
    const parsed = await extractDocx(await file.arrayBuffer());
    if (current !== request) return;
    result = parsed;
    element('filename').textContent = file.name;
    render();
  } catch (error) {
    if (current !== request) return;
    status.textContent = error instanceof Error ? error.message : String(error);
    status.dataset.state = 'review';
    element('filename').textContent = 'Could not read document';
  }
}
input.addEventListener('change', () => { const file = input.files?.[0]; if (file) void load(file); });
const drop = element('drop-zone');
drop.addEventListener('dragover', event => { event.preventDefault(); drop.dataset.dragging = 'true'; });
drop.addEventListener('dragleave', () => { drop.dataset.dragging = 'false'; });
drop.addEventListener('drop', event => {
  event.preventDefault();
  drop.dataset.dragging = 'false';
  const file = event.dataTransfer?.files[0];
  if (file) void load(file);
});
element('load-demo').addEventListener('click', () => {
  request++;
  filename = 'three-level-outline';
  input.value = '';
  element('filename').textContent = 'Three-level outline · Word reference example';
  result = extractXml(DEMO_PARTS);
  expected.value = DEMO_LABELS.join('\n');
  compareEnabled.checked = true;
  render();
});
expected.addEventListener('input', render);
compareEnabled.addEventListener('change', render);

function download(extension: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
downloadText.addEventListener('click', () => { if (result?.complete) download('txt', result.text, 'text/plain;charset=utf-8'); });
downloadJson.addEventListener('click', () => { if (result) download('json', JSON.stringify(result, null, 2), 'application/json'); });
