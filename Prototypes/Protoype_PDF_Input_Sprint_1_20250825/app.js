// Prototype: Minimal PDF importer with selective OCR (CDN-based)
// Scope: Standalone prototype. Does not touch production code.

const statusEl = document.getElementById('status');
const progressBar = document.getElementById('progressBar');
const resultsEl = document.getElementById('results');
const fileInput = document.getElementById('fileInput');
const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const enableOcrEl = document.getElementById('enableOcr');
const dpiEl = document.getElementById('dpi');
const ocrLangEl = document.getElementById('ocrLang');
const dropZone = document.getElementById('dropZone');

let cancelled = false;

// Configure pdf.js worker
if (window['pdfjsLib']) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setProgress(current, total) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  progressBar.style.width = pct + '%';
}

function resetUI() {
  setStatus('Idle');
  setProgress(0, 1);
  resultsEl.innerHTML = '';
}

function card({ page, mode, text, confidence }) {
  const modeClass = mode === 'ocr' ? 'mode-ocr' : (mode === 'text' ? 'mode-text' : 'mode-image');
  const confStr = typeof confidence === 'number' ? ` • conf: ${confidence.toFixed(2)}` : '';
  return `
    <div class="card">
      <h3>Page ${page + 1} <span class="mode ${modeClass}">${mode}</span><span class="muted">${confStr}</span></h3>
      <pre>${(text || '').slice(0, 2000)}</pre>
    </div>
  `;
}

async function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(fr.result);
    fr.readAsArrayBuffer(file);
  });
}

function joinTextItems(items) {
  // Minimal line grouping: group by y (transform[5]) with a small epsilon
  const lines = [];
  const eps = 2.5; // px tolerance
  const sorted = [...items].sort((a, b) => (a.transform[5] - b.transform[5]) || (a.transform[4] - b.transform[4]));
  for (const it of sorted) {
    const y = it.transform[5];
    let line = lines.find(l => Math.abs(l.y - y) < eps);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push(it);
  }
  // Sort each line by x and concatenate strings with basic spacing
  const text = lines
    .sort((a, b) => b.y - a.y) // pdfjs y grows upwards; reverse for top-to-bottom
    .map(line => line.items.sort((a, b) => a.transform[4] - b.transform[4])
      .map(x => x.str)
      .join(' '))
    .join('\n');
  return text;
}

async function ocrCanvas(canvas, lang, logger) {
  if (!window.Tesseract) throw new Error('Tesseract.js not loaded');
  const result = await Tesseract.recognize(canvas, lang || 'eng', { logger });
  return { text: result.data.text || '', confidence: result.data.confidence || undefined };
}

async function processPdf(arrayBuffer, opts) {
  const { enableOcr, dpi, ocrLang } = opts;
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch (err) {
    if (err && err.name === 'PasswordException') {
      const pwd = prompt('PDF is password-protected. Enter password:');
      if (!pwd) throw new Error('Password required');
      const retryTask = pdfjsLib.getDocument({ data: arrayBuffer, password: pwd });
      pdf = await retryTask.promise;
    } else {
      throw err;
    }
  }

  const numPages = pdf.numPages;
  const results = [];
  let processed = 0;
  setProgress(0, numPages);

  for (let i = 0; i < numPages; i++) {
    if (cancelled) break;
    setStatus(`Processing page ${i + 1}/${numPages}...`);
    const page = await pdf.getPage(i + 1);
    let mode = 'text';
    let text = '';
    let confidence;

    try {
      const content = await page.getTextContent();
      const items = content.items || [];
      const density = items.length;
      if (density > 5) {
        text = joinTextItems(items);
        mode = 'text';
      } else {
        // Likely image-only. Optionally OCR.
        if (enableOcr) {
          const scale = (dpi || 300) / 72; // 72 user units per inch
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          const ocr = await ocrCanvas(canvas, ocrLang, (m) => {
            // Optional per-page OCR progress; keep quiet or reflect minimal state
          });
          text = ocr.text;
          confidence = ocr.confidence;
          mode = 'ocr';
        } else {
          mode = 'image';
          text = '';
        }
      }
    } catch (e) {
      mode = 'error';
      text = `Error: ${e && e.message ? e.message : e}`;
    }

    results.push({ page: i, mode, text, confidence });
    processed++;
    setProgress(processed, numPages);
    resultsEl.insertAdjacentHTML('beforeend', card({ page: i, mode, text, confidence }));
  }

  setStatus(cancelled ? `Cancelled after ${processed}/${numPages} pages.` : `Done. Processed ${processed}/${numPages} pages.`);
  return results;
}

startBtn.addEventListener('click', async () => {
  if (!fileInput.files || fileInput.files.length === 0) {
    setStatus('Please choose a PDF file.');
    return;
  }
  cancelled = false;
  resultsEl.innerHTML = '';
  setProgress(0, 1);
  setStatus('Loading PDF...');
  try {
    const buf = await readFileAsArrayBuffer(fileInput.files[0]);
    await processPdf(buf, { enableOcr: enableOcrEl.checked, dpi: parseInt(dpiEl.value, 10), ocrLang: ocrLangEl?.value || 'eng' });
  } catch (err) {
    resultsEl.insertAdjacentHTML('beforeend', `<div class="error">${err && err.message ? err.message : err}</div>`);
    setStatus('Error.');
  }
});

cancelBtn.addEventListener('click', () => {
  cancelled = true;
  setStatus('Cancelling... Will stop after current page.');
});

resetUI();

// Load embedded sample into the file input
import { getSamplePdfBlob } from './sample-pdf.js';
loadSampleBtn?.addEventListener('click', async () => {
  try {
    const blob = getSamplePdfBlob();
    const file = new File([blob], 'sample-text.pdf', { type: 'application/pdf' });
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    setStatus('Sample loaded. Click Start to process.');
  } catch (e) {
    resultsEl.insertAdjacentHTML('beforeend', `<div class="error">Failed to load sample: ${e && e.message ? e.message : e}</div>`);
  }
});

// Drag & Drop support
if (dropZone) {
  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    });
  });
  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (!dt) return;
    const files = dt.files;
    if (!files || files.length === 0) return;
    const pdf = Array.from(files).find(f => f.type === 'application/pdf' || (f.name || '').toLowerCase().endsWith('.pdf'));
    if (!pdf) {
      setStatus('No PDF found in drop.');
      return;
    }
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(pdf);
    fileInput.files = dataTransfer.files;
    setStatus(`Loaded dropped file: ${pdf.name}. Click Start to process.`);
  });
}
