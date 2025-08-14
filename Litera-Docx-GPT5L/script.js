// --- Start of RdLn DOCX (Track Changes) exporter // Originally from docxExport.ts, adapted for browser environment

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
// Simple reading mode to mimic Notepad copy (max fidelity), can be toggled after validation
const SIMPLE_MODE = true;

const trimZeroWidth = (s) => s.replace(/^[\u200B-\u200D\uFEFF]+|[\u200B-\u200D\uFEFF]+$/g, '');

function isInsertionSpan(el) {
  const style = (el.getAttribute('style') || '').toLowerCase();
  if (/text-decoration[^;]*underline/.test(style) || /text-decoration-line[^;]*underline/.test(style)) return true;
  if (/dcfce7|bbf7d0|16a34a|166534/.test(style)) return true;
  return false;
}

function isDeletionSpan(el) {
  const style = (el.getAttribute('style') || '').toLowerCase();
  if (/text-decoration[^;]*line-through/.test(style) || /line-through/.test(style)) return true;
  if (/fef2f2|fecaca|dc2626|991b1b/.test(style)) return true;
  return false;
}

function tokenizeNode(node, out, mode) {
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = (node.textContent ?? '');
    if (!raw) return;
    const text = trimZeroWidth(raw);
    if (!text) return;
    const parts = text.split(/(\r\n|\n)/);
    for (const part of parts) {
      if (part === '\n' || part === '\r\n') {
        out.push({ type: 'newline' });
      } else if (part.length) {
        out.push({ type: mode, text: part });
      }
    }
    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node;
    const tag = el.tagName.toLowerCase();

    if (tag === 'br') {
      out.push({ type: 'newline' });
      return;
    }

    if (tag === 'div' && el !== (el.ownerDocument?.body?.firstElementChild ?? null)) {
      if (out.length && out[out.length - 1].type !== 'newline') out.push({ type: 'newline' });
      Array.from(el.childNodes).forEach((child) => tokenizeNode(child, out, 'equal'));
      out.push({ type: 'newline' });
      return;
    }

    let nextMode = mode;
    if (tag === 'span') {
      if (isInsertionSpan(el)) nextMode = 'ins';
      else if (isDeletionSpan(el)) nextMode = 'del';
    }

    Array.from(el.childNodes).forEach((child) => tokenizeNode(child, out, nextMode));
    return;
  }
}

function mergeAdjacent(tokens) {
  const merged = [];
  for (const t of tokens) {
    const last = merged[merged.length - 1];
    if (t.type === 'newline') {
      if (!last || last.type !== 'newline') merged.push(t);
      continue;
    }
    if (last && last.type === t.type && last.text !== undefined && t.text !== undefined) {
      last.text += t.text;
    } else {
      merged.push({ ...t });
    }
  }
  while (merged.length && merged[0].type === 'newline') merged.shift();
  while (merged.length && merged[merged.length - 1].type === 'newline') merged.pop();
  return merged;
}

function chunkParagraphs(tokens) {
  const paras = [];
  let current = [];
  for (const t of tokens) {
    if (t.type === 'newline') {
      if (current.length) {
        paras.push(current);
        current = [];
      }
    } else {
      current.push(t);
    }
  }
  if (current.length) paras.push(current);
  if (paras.length === 0) paras.push([]);
  return paras;
}

function buildDocumentXml(paras, author, isoDate, comments = []) {
  let revId = 1;
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(`<w:document xmlns:w="${W_NS}">`);
  parts.push('<w:body>');

  for (const para of paras) {
    parts.push('<w:p>');
    for (const token of para) {
      const text = token.text ?? '';
      if (token.type === 'equal') {
        parts.push('<w:r>');
        parts.push('<w:t xml:space="preserve">' + escapeXml(text) + '</w:t>');
        parts.push('</w:r>');
      } else if (token.type === 'ins') {
        parts.push(`<w:ins w:id="${String(revId++)}" w:author="${escapeXml(author)}" w:date="${isoDate}">`);
        parts.push('<w:r>');
        parts.push('<w:t xml:space="preserve">' + escapeXml(text) + '</w:t>');
        parts.push('</w:r>');
        parts.push('</w:ins>');
      } else if (token.type === 'del') {
        parts.push(`<w:del w:id="${String(revId++)}" w:author="${escapeXml(author)}" w:date="${isoDate}">`);
        parts.push('<w:r>');
        parts.push('<w:delText xml:space="preserve">' + escapeXml(text) + '</w:delText>');
        parts.push('</w:r>');
        parts.push('</w:del>');
      }
    }
    parts.push('</w:p>');
  }

  // Append comments table at the end if any comments were collected
  if (comments && comments.length > 0) {
    // spacer paragraph
    parts.push('<w:p><w:r><w:t xml:space="preserve">\n</w:t></w:r></w:p>');
    // heading paragraph "Comments"
    parts.push('<w:p><w:r><w:t>Comments</w:t></w:r></w:p>');

    // simple table with 3 columns: Page | Author | Comment
    parts.push('<w:tbl>');
    parts.push('<w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr>');
    parts.push('<w:tblGrid><w:gridCol w:w="1200"/><w:gridCol w:w="2400"/><w:gridCol w:w="8000"/></w:tblGrid>');

    // header row
    parts.push('<w:tr>');
    const headers = ['Page', 'Author', 'Comment'];
    for (const h of headers) {
      parts.push('<w:tc>');
      parts.push('<w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>');
      parts.push('<w:p><w:r><w:t>' + escapeXml(h) + '</w:t></w:r></w:p>');
      parts.push('</w:tc>');
    }
    parts.push('</w:tr>');

    // data rows
    for (const c of comments) {
      const pageStr = String(c.page ?? '');
      const authorStr = c.author ? String(c.author) : '';
      const commentStr = c.text ? String(c.text) : '';
      parts.push('<w:tr>');
      // Page
      parts.push('<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:r><w:t>' + escapeXml(pageStr) + '</w:t></w:r></w:p></w:tc>');
      // Author
      parts.push('<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:r><w:t>' + escapeXml(authorStr) + '</w:t></w:r></w:p></w:tc>');
      // Comment
      parts.push('<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:r><w:t xml:space="preserve">' + escapeXml(commentStr) + '</w:t></w:r></w:p></w:tc>');
      parts.push('</w:tr>');
    }

    parts.push('</w:tbl>');
  }

  parts.push('<w:sectPr/>');
  parts.push('</w:body>');
  parts.push('</w:document>');
  return parts.join('');
}

function contentTypesXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>',
    '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    '</Types>'
  ].join('');
}

function relsRels() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
    '</Relationships>'
  ].join('');
}

function corePropsXml(author, isoDate) {
    const esc = escapeXml;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"',
    ' xmlns:dc="http://purl.org/dc/elements/1.1/"',
    ' xmlns:dcterms="http://purl.org/dc/terms/"',
    ' xmlns:dcmitype="http://purl.org/dc/dcmitype/"',
    ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    `<dc:creator>${esc(author)}</dc:creator>`, 
    `<cp:lastModifiedBy>${esc(author)}</cp:lastModifiedBy>`, 
    `<dcterms:created xsi:type="dcterms:W3CDTF">${isoDate}</dcterms:created>`, 
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${isoDate}</dcterms:modified>`, 
    '</cp:coreProperties>'
  ].join('');
}

function appPropsXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"',
    ' xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
    '<Application>RdLn</Application>',
    '<DocSecurity>0</DocSecurity>',
    '<ScaleCrop>false</ScaleCrop>',
    '<LinksUpToDate>false</LinksUpToDate>',
    '<SharedDoc>false</SharedDoc>',
    '<HyperlinksChanged>false</HyperlinksChanged>',
    '<AppVersion>1.0</AppVersion>',
    '</Properties>'
  ].join('');
}

function stylesXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<w:styles xmlns:w="${W_NS}">`,
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">',
    '<w:name w:val="Normal"/>',
    '<w:qFormat/>',
    '</w:style>',
    '</w:styles>'
  ].join('');
}

function settingsXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<w:settings xmlns:w="${W_NS}">`,
    '<w:trackRevisions/>',
    '</w:settings>'
  ].join('');
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ensureDom(html) {
  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container;
  }
  throw new Error('DOM environment not available for HTML parsing');
}

function htmlToTokens(html) {
  const root = ensureDom(html);
  const out = [];
  const children = Array.from(root.childNodes);
  if (children.length === 1 && children[0].nodeType === 1 && children[0].nodeName.toLowerCase() === 'div') {
    tokenizeNode(children[0], out, 'equal');
  } else {
    for (const child of children) {
      tokenizeNode(child, out, 'equal');
    }
  }
  return mergeAdjacent(out);
}

async function exportHtmlDiffToDocx(html, opts = {}) {
  const author = opts.author || 'RdLn';
  const isoDate = (opts.date || new Date()).toISOString();
  const comments = Array.isArray(opts.comments) ? opts.comments : [];

  const tokens = htmlToTokens(html);
  const paragraphs = chunkParagraphs(tokens);
  const documentXml = buildDocumentXml(paragraphs, author, isoDate, comments);

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXml());
  zip.folder('_rels')?.file('.rels', relsRels());
  const docProps = zip.folder('docProps');
  docProps?.file('core.xml', corePropsXml(author, isoDate));
  docProps?.file('app.xml', appPropsXml());

  const word = zip.folder('word');
  word?.file('document.xml', documentXml);
  word?.file('styles.xml', stylesXml());
  word?.file('settings.xml', settingsXml());
  word?.folder('_rels')?.file('document.xml.rels', documentRels());

  const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  return content;
}

function documentRels() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>',
    '</Relationships>'
  ].join('');
}

// --- End of RdLn DOCX Exporter ---

window.onload = () => {
    const uploadInput = document.getElementById('pdf-upload');
    const convertBtn = document.getElementById('convert-btn');
    const statusDiv = document.getElementById('status');

    let selectedFile = null;

    console.log('Converter script loaded. Attaching event listeners.');

    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js`;

    uploadInput.addEventListener('change', (event) => {
        console.log('File input change event fired.');
        if (event.target.files && event.target.files.length > 0) {
            selectedFile = event.target.files[0];
            console.log('File selected:', selectedFile.name);
            statusDiv.textContent = `File selected: ${selectedFile.name}`;
            convertBtn.disabled = false;
            console.log('Convert button enabled.');
        } else {
            console.log('No file selected.');
        }
    });

    convertBtn.addEventListener('click', async () => {
        console.log('Convert button clicked.');
        if (!selectedFile) {
            console.error('No file is selected for conversion.');
            statusDiv.textContent = 'Please select a file first.';
            return;
        }

        convertBtn.disabled = true;
        statusDiv.textContent = 'Processing PDF...';

        try {
            await processPdf(selectedFile);
        } catch (error) {
            console.error('Conversion failed:', error);
            statusDiv.textContent = `Conversion failed: ${error.message}`;
        } finally {
            convertBtn.disabled = false;
        }
    });

    async function processPdf(file) {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                statusDiv.textContent = `PDF loaded. Pages: ${pdf.numPages}. Analyzing content...`;

                let styledText = [];
                let collectedComments = [];
                const debugPages = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const operatorList = await page.getOperatorList();
                    const viewport = page.getViewport({ scale: 1.25 });

                    const lines = parseLinesFromOps(operatorList, viewport);

                    // Collect annotation rectangles in viewport coords to exclude those regions from body text
                    let annotRects = [];
                    let collectedPageComments = [];
                    try {
                        const annots = await page.getAnnotations();
                        for (const a of annots) {
                            if (Array.isArray(a.rect) && a.rect.length === 4) {
                                // rect is [x1,y1,x2,y2] in PDF space
                                const r = viewport.convertToViewportRectangle(a.rect);
                                // normalize to {x1,y1,x2,y2} with x1<x2, y1<y2 in viewport
                                const x1 = Math.min(r[0], r[2]);
                                const y1 = Math.min(r[1], r[3]);
                                const x2 = Math.max(r[0], r[2]);
                                const y2 = Math.max(r[1], r[3]);
                                // pad slightly
                                const pad = 6;
                                annotRects.push({ x1: x1 - pad, y1: y1 - pad, x2: x2 + pad, y2: y2 + pad });
                            }
                            const hasText = (a.contents && a.contents.trim().length) || (a.richText && String(a.richText).trim().length);
                            if (hasText) {
                                collectedPageComments.push({
                                    page: i,
                                    author: a.title || a.user || 'Comment',
                                    text: (a.contents && a.contents.trim()) || String(a.richText || '').trim(),
                                    subtype: a.subtype || a.annotationType || 'Text'
                                });
                            }
                        }
                    } catch (_) { /* ignore */ }

                    const pageStyledTextRaw = textContent.items.map(item => {
                        // Map text matrix into viewport coordinate space to align with line detection
                        const m = pdfjsLib.Util.transform(viewport.transform, item.transform);
                        const x = m[4];
                        const y = m[5];
                        const fontSize = Math.hypot(m[0], m[1]);
                        const height = item.height || fontSize || 10;
                        const width = item.width || (item.str ? item.str.length * (fontSize * 0.5) : 0);

                        const style = checkStyle({ x, y, width, height }, lines);
                        return { text: item.str, style, x, y, width, height, pageIndex: i };
                    });

                    // Heuristic exclusion: any text that intersects an annotation rect, or lies to the right of the leftmost annotation rect (margin)
                    const intersects = (bx, by, bw, bh, r) => {
                        const x1 = bx, y1 = by, x2 = bx + bw, y2 = by + bh;
                        return !(x2 < r.x1 || x1 > r.x2 || y2 < r.y1 || y1 > r.y2);
                    };
                    let excludeXMin = null;
                    if (annotRects.length > 0) {
                        excludeXMin = annotRects.reduce((min, r) => Math.min(min, r.x1), Infinity);
                        if (!isFinite(excludeXMin)) excludeXMin = null;
                    }

                    // Geometry-based margin detection with strict right-edge band first
                    const xs = pageStyledTextRaw.map(it => it.x).filter(Number.isFinite);
                    let pageStyledText = pageStyledTextRaw;
                    if (xs.length > 10) {
                        const pageWidth = viewport.viewBox[2] - viewport.viewBox[0];
                        const rightEdgeStart = pageWidth - 40; // strict band near the physical right edge
                        const strictRight = pageStyledTextRaw.filter(it => it.x >= rightEdgeStart);

                        const groupAndAddComments = (items) => {
                            const sorted = [...items].sort((a,b)=> a.y - b.y);
                            const groups = [];
                            let current = [];
                            let lastY = null;
                            const yGap = 14;
                            for (const it of sorted) {
                                if (lastY === null || Math.abs(it.y - lastY) <= yGap) current.push(it);
                                else { groups.push(current); current = [it]; }
                                lastY = it.y;
                            }
                            if (current.length) groups.push(current);
                            for (const g of groups) {
                                const gSorted = g.sort((a,b)=> a.y === b.y ? a.x - b.x : a.y - b.y);
                                const text = gSorted.map(t => (t.text || '')).join(' ').replace(/\s+/g,' ').trim();
                                if (text) collectedPageComments.push({ page: i, author: 'Margin', text, subtype: 'PrintedMargin' });
                            }
                        };

                        if (strictRight.length >= 5) {
                            // Treat only the strict band as margin to avoid over-exclusion
                            pageStyledText = pageStyledTextRaw.filter(it => it.x < rightEdgeStart);
                            groupAndAddComments(strictRight);
                        } else {
                            // Fallback: simple 2-means clustering on x
                            let c1 = Math.min(...xs), c2 = Math.max(...xs);
                            for (let iter = 0; iter < 5; iter++) {
                                const g1 = [], g2 = [];
                                for (const x of xs) (Math.abs(x - c1) <= Math.abs(x - c2) ? g1 : g2).push(x);
                                c1 = g1.length ? g1.reduce((a,b)=>a+b,0)/g1.length : c1;
                                c2 = g2.length ? g2.reduce((a,b)=>a+b,0)/g2.length : c2;
                            }
                            const meanLeft = Math.min(c1, c2);
                            const meanRight = Math.max(c1, c2);
                            const assignRight = (x) => Math.abs(x - meanRight) < Math.abs(x - meanLeft);
                            const rightItems = pageStyledTextRaw.filter(it => assignRight(it.x));
                            const leftItems = pageStyledTextRaw.filter(it => !assignRight(it.x));
                            const rightRatio = rightItems.length / pageStyledTextRaw.length;
                            const isRightMargin = (meanRight > meanLeft + 40) && (meanRight > pageWidth * 0.55) && rightRatio <= 0.6;
                            if (isRightMargin) {
                                pageStyledText = leftItems;
                                groupAndAddComments(rightItems);
                            }
                        }
                    }

                    // Apply annotation exclusion last (covers popups overlapping left cluster)
                    pageStyledText = pageStyledText.filter(it => {
                        if (annotRects.length > 0) {
                            for (const r of annotRects) {
                                if (intersects(it.x, it.y, it.width, it.height, r)) return false;
                            }
                            if (excludeXMin != null && it.x > (excludeXMin - 8)) return false;
                        }
                        return true;
                    });

                    // Debug: capture kept items ordering sample for early pages
                    if (debugPages && debugPages[i]) {
                        const sample = [...pageStyledText]
                            .sort((a,b)=> {
                                if (Math.abs(a.y - b.y) > 6) return b.y - a.y; // top->bottom
                                return a.x - b.x;
                            })
                            .slice(0, 150)
                            .map(t => ({ text: t.text || '', x: t.x, y: t.y, style: t.style }));
                        debugPages[i].keptItemsSample = sample;
                    }

                    styledText.push(...pageStyledText);
                    collectedComments.push(...collectedPageComments);

                    // Collect debug info for this page
                    try {
                        const rightThreshold = Math.min(
                            ...pageStyledTextRaw.map(t => t.x + t.width).filter(v => Number.isFinite(v))
                        ) || 0;
                        // Heuristic: consider items whose left x is in the rightmost 25% of the page width as margin candidates
                        const pageWidth = viewport.viewBox[2] - viewport.viewBox[0];
                        const rightStart = viewport.viewBox[0] + pageWidth * 0.7;
                        const rightItems = pageStyledTextRaw
                            .filter(t => t.x >= rightStart)
                            .map(t => ({ text: t.text, x: t.x, y: t.y, w: t.width, h: t.height }));

                        debugPages.push({
                            page: i,
                            viewportWidth: pageWidth,
                            annotationsRaw: (await page.getAnnotations()),
                            annotRectsViewport: annotRects,
                            excludeXMin,
                            textItemsRawCount: pageStyledTextRaw.length,
                            textItemsKeptCount: pageStyledText.length,
                            rightMarginStartGuess: rightStart,
                            rightMarginItemsSample: rightItems.slice(0, 50)
                        });
                    } catch (_) { /* ignore */ }
                }

                const htmlDiff = generateHtmlDiff(styledText);
                const docxBytes = await exportHtmlDiffToDocx(htmlDiff, { author: 'Converter', comments: collectedComments });

                const blob = new Blob([docxBytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                const fileName = (file.name || 'document').replace(/\.pdf$/i, '');
                link.download = `${fileName}_converted.docx`;
                link.click();

                statusDiv.textContent = 'Conversion successful! Check your downloads.';

                // Auto-dump debug JSON for the specific file to help diagnose margin annotations
                try {
                    const fname = (file.name || '').toLowerCase();
                    if (fname.includes('litera_markup') || fname.endsWith('.pdf')) {
                        const debugBlob = new Blob([JSON.stringify({ file: file.name, pages: debugPages }, null, 2)], { type: 'application/json' });
                        const dbgLink = document.createElement('a');
                        dbgLink.href = window.URL.createObjectURL(debugBlob);
                        const base = (file.name || 'document').replace(/\.pdf$/i, '');
                        dbgLink.download = base + '_pdf_debug.json';
                        dbgLink.click();
                    }
                } catch (_) { /* ignore */ }

            } catch (error) {
                console.error('Error during PDF processing:', error);
                statusDiv.textContent = `Error: ${error.message}`;
            }
        };
        fileReader.readAsArrayBuffer(file);
    }

    function parseLinesFromOps(opList, viewport) {
        const lines = [];
        const H_TOL = 1.0; // horizontal tolerance in viewport units

        // Track minimal graphics state we care about
        let strokeRGB = [0, 0, 0]; // 0..1
        let lineWidth = 1;

        for (let i = 0; i < opList.fnArray.length; i++) {
            const fn = opList.fnArray[i];
            const args = opList.argsArray[i];

            // capture stroke color (various ops possible; handle common rgb variants)
            if (fn === pdfjsLib.OPS.setStrokeRGBColor) {
                strokeRGB = args.map(v => Math.max(0, Math.min(1, v / 255)));
                continue;
            }
            // line width
            if (fn === pdfjsLib.OPS.setLineWidth) {
                lineWidth = args[0];
                continue;
            }

            if (fn === pdfjsLib.OPS.constructPath) {
                const pathOps = args[0];
                const pathArgs = args[1];
                // Look for simple moveTo -> lineTo
                if (pathOps.length === 2 && pathOps[0] === pdfjsLib.OPS.moveTo && pathOps[1] === pdfjsLib.OPS.lineTo) {
                    const start = viewport.convertToViewportPoint(pathArgs[0], pathArgs[1]);
                    const end = viewport.convertToViewportPoint(pathArgs[2], pathArgs[3]);
                    if (Math.abs(start[1] - end[1]) <= H_TOL) {
                        const [r, g, b] = strokeRGB;
                        const typeHint = classifyColor(r, g, b);
                        lines.push({ x1: start[0], y1: start[1], x2: end[0], y2: end[1], r, g, b, lineWidth, typeHint });
                    }
                }
            }
        }
        return lines;
    }

    function classifyColor(r, g, b) {
        // Very simple heuristic: red-ish => deletion, green-ish => insertion
        const max = Math.max(r, g, b);
        const isRed = r === max && (r - Math.max(g, b)) >= 0.2;
        const isGreen = g === max && (g - Math.max(r, b)) >= 0.2;
        if (isRed) return 'del';
        if (isGreen) return 'ins';
        return 'unknown';
    }

    function checkStyle(textGeom, lines) {
        const { x, y, width, height } = textGeom; // viewport coords
        const textMidY = y + height * 0.5;
        const baselineTol = Math.max(1.0, height * 0.2);
        const midlineTol = Math.max(1.0, height * 0.35);

        let best = { dist: Infinity, type: 'equal' };

        for (const line of lines) {
            const lineY = line.y1; // viewport coords
            const overlapsX = (line.x1 < x + width && line.x2 > x);
            if (!overlapsX) continue;

            // Prefer color hint when available
            if (Math.abs(lineY - y) <= baselineTol && (line.typeHint === 'ins' || line.typeHint === 'unknown')) {
                const d = Math.abs(lineY - y);
                if (d < best.dist) best = { dist: d, type: 'ins' };
            }
            if (Math.abs(lineY - textMidY) <= midlineTol && (line.typeHint === 'del' || line.typeHint === 'unknown')) {
                const d = Math.abs(lineY - textMidY);
                if (d < best.dist) best = { dist: d, type: 'del' };
            }
        }
        return best.type;
    }

    // --- Helpers ported from paragraphFormatting.ts (JS version) ---
    function containsChinese(text) { return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text); }
    function containsJapanese(text) { return /[\u3040-\u309f\u30a0-\u30ff]/.test(text); }
    function containsKorean(text) { return /[\uac00-\ud7af]/.test(text); }
    function containsCJK(text) { return containsChinese(text) || containsJapanese(text) || containsKorean(text); }
    function countContentUnits(line) {
        const trimmed = (line || '').trim();
        if (containsCJK(trimmed)) {
            return trimmed.replace(/[\s\u3000-\u303f\uff00-\uffef]/g, '').length;
        }
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).length;
    }
    function getLanguageThreshold(line) { return containsCJK(line) ? 30 : 5; }
    function isShortLine(line) {
        const units = countContentUnits(line);
        const thr = getLanguageThreshold(line);
        return units <= thr;
    }
    function shouldContinue(prevParagraph, currentLine) {
        const trimmedPrev = (prevParagraph || '').trim();
        const trimmedCurr = (currentLine || '').trim();
        if (/[.!?:;。！？：；]$/.test(trimmedPrev) || /:-\s*$/.test(trimmedPrev) || /:\s*-\s*$/.test(trimmedPrev) || /;\s*or\s*$/.test(trimmedPrev) || /;\s*and\s*$/.test(trimmedPrev)) {
            return false;
        }
        if (trimmedPrev.endsWith('-')) return true;
        if (/^\p{Ll}/u.test(trimmedCurr) && !containsCJK(trimmedCurr)) return true;
        if (containsCJK(trimmedPrev) && !(/[。！？：；]$/.test(trimmedPrev))) return true;
        if (!/[.!?:;。！？：；]$/.test(trimmedPrev) && !/:-\s*$/.test(trimmedPrev) && !/:\s*-\s*$/.test(trimmedPrev) && !/;\s*or\s*$/.test(trimmedPrev) && !/;\s*and\s*$/.test(trimmedPrev)) return true;
        return false;
    }

    function generateHtmlDiff(styledText) {
        // Sort by page, then by y (asc, top to bottom), then by x (asc)
        styledText.sort((a, b) => {
            if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
            if (Math.abs(a.y - b.y) > 6) return a.y - b.y; // top-to-bottom
            return a.x - b.x;
        });

        // Group into visual lines per page
        const linesByPage = new Map(); // pageIndex -> [{ y, height, items: [{text, style, x, width, height}]}]
        const LINE_JOIN = (h) => Math.max(6, h * 0.6);
        for (const item of styledText) {
            if (!linesByPage.has(item.pageIndex)) linesByPage.set(item.pageIndex, []);
            const lines = linesByPage.get(item.pageIndex);
            const threshold = LINE_JOIN(item.height || 10);
            let line = null;
            // Find existing line within threshold of y
            for (const ln of lines) {
                if (Math.abs(item.y - ln.y) <= threshold) { line = ln; break; }
            }
            if (!line) {
                line = { y: item.y, height: item.height || 10, items: [] };
                lines.push(line);
            }
            line.items.push({ text: item.text, style: item.style, x: item.x, width: item.width || 0, height: item.height || 10 });
        }

        // Build plain text and HTML per line
        function renderItemsHtml(items) {
            if (!items || items.length === 0) return '';
            const arr = [...items].sort((a,b)=> a.x - b.x);
            let s = '';
            let prev = null;
            for (const it of arr) {
                const raw = it.text || '';
                const t = escapeXml(raw);
                let needsSpace = false;
                if (prev) {
                    const prevEnd = prev.x + (prev.width || 0);
                    const gap = it.x - prevEnd;
                    const refH = Math.max(prev.height || 10, it.height || 10);
                    const spaceThreshold = Math.max(1.5, refH * 0.15); // small geometric gap => join, larger => space
                    // Punctuation rules
                    const prevEndsHyphen = /-$/.test(prev.text || '');
                    const currStartsPunct = /^[,.;:!?)]/.test(raw);
                    const prevEndsLeftPunct = /[\[(]$/.test(prev.text || '');
                    if (!prevEndsHyphen && !currStartsPunct && !prevEndsLeftPunct && gap > spaceThreshold) {
                        needsSpace = true;
                    }
                    // If prev ended with hyphen: join without space and drop the hyphen visually
                    if (prevEndsHyphen) {
                        // remove trailing '-' from output if it was just appended
                        s = s.replace(/-\s*$/, '');
                    }
                }
                if (needsSpace) s += ' ';
                if (it.style === 'ins') s += `<span style="text-decoration: underline;">${t}</span>`;
                else if (it.style === 'del') s += `<span style="text-decoration: line-through;">${t}</span>`;
                else s += t;
                prev = it;
            }
            return s.replace(/\s+/g,' ').trim();
        }
        function itemsPlainText(items) {
            if (!items || items.length === 0) return '';
            const arr = [...items].sort((a,b)=> a.x - b.x);
            let out = '';
            let prev = null;
            for (const it of arr) {
                const raw = it.text || '';
                let needsSpace = false;
                if (prev) {
                    const prevEnd = prev.x + (prev.width || 0);
                    const gap = it.x - prevEnd;
                    const refH = Math.max(prev.height || 10, it.height || 10);
                    const spaceThreshold = Math.max(1.5, refH * 0.15);
                    const prevEndsHyphen = /-$/.test(prev.text || '');
                    const currStartsPunct = /^[,.;:!?)]/.test(raw);
                    const prevEndsLeftPunct = /[\[(]$/.test(prev.text || '');
                    if (!prevEndsHyphen && !currStartsPunct && !prevEndsLeftPunct && gap > spaceThreshold) {
                        needsSpace = true;
                    }
                    if (prevEndsHyphen) {
                        out = out.replace(/-\s*$/, '');
                    }
                }
                if (needsSpace) out += ' ';
                out += raw;
                prev = it;
            }
            return out.replace(/\s+/g,' ').trim();
        }

        // Reconstruct paragraphs
        if (SIMPLE_MODE) {
            // Notepad-like: for each page, take lines as-is and output each as its own paragraph
            const paragraphs = [];
            const pageKeys = [...linesByPage.keys()].sort((a,b)=> a-b);
            for (const pk of pageKeys) {
                const lines = linesByPage.get(pk) || [];
                // sort top-to-bottom by y ascending (PDF viewport y grows downward)
                lines.sort((a,b)=> a.y - b.y);
                for (const ln of lines) {
                    const lineHtml = renderItemsHtml(ln.items);
                    const lineText = itemsPlainText(ln.items);
                    if (!lineText) continue;
                    paragraphs.push(lineHtml);
                }
                // page break as empty paragraph separator
                paragraphs.push('');
            }
            return paragraphs.filter(p => p !== null && p !== undefined).join('\n');
        }

        // Heuristic paragraphing (original advanced mode)
        let html = '<div>';
        let firstPage = true;
        const pageIndices = Array.from(linesByPage.keys()).sort((a,b)=>a-b);
        for (const pIdx of pageIndices) {
            const lines = linesByPage.get(pIdx) || [];
            // Sort lines top->bottom by y desc (already close, but ensure)
            lines.sort((a,b)=> b.y - a.y);

            let paragraphs = [];
            let currentParaHtml = '';
            let currentParaText = '';
            let prevLineText = '';

            for (let i = 0; i < lines.length; i++) {
                const ln = lines[i];
                const lineText = itemsPlainText(ln.items);
                const lineHtml = renderItemsHtml(ln.items);

                if (i === 0) {
                    currentParaHtml = lineHtml;
                    currentParaText = lineText;
                    prevLineText = lineText;
                    continue;
                }

                // Paragraph decision based on previous visual line (not accumulated paragraph)
                if (isShortLine(prevLineText)) {
                    // finalize previous paragraph
                    paragraphs.push(currentParaHtml);
                    currentParaHtml = lineHtml;
                    currentParaText = lineText;
                } else if (shouldContinue(prevLineText, lineText)) {
                    // join
                    const prevPureCJK = containsCJK(currentParaText) && !/[a-zA-Z]/.test(currentParaText);
                    const currPureCJK = containsCJK(lineText) && !/[a-zA-Z]/.test(lineText);
                    const sep = (currentParaText.trim().endsWith('-')) ? '' : (prevPureCJK && currPureCJK ? '' : ' ');
                    // if hyphen at end, drop it when joining
                    if (currentParaText.trim().endsWith('-')) {
                        currentParaText = currentParaText.replace(/-\s*$/, '');
                    }
                    currentParaHtml += sep + lineHtml;
                    currentParaText = (currentParaText + ' ' + lineText).replace(/\s+/g,' ').trim();
                } else {
                    // new paragraph
                    paragraphs.push(currentParaHtml);
                    currentParaHtml = lineHtml;
                    currentParaText = lineText;
                }

                prevLineText = lineText;
            }
            if (currentParaHtml) paragraphs.push(currentParaHtml);

            // Emit paragraphs
            if (!firstPage) html += '<br><br>'; // simple page break between pages
            firstPage = false;
            for (let i = 0; i < paragraphs.length; i++) {
                if (i > 0) html += '<br><br>';
                html += paragraphs[i];
            }
        }

        html += '</div>';
        return html;
    }
};
