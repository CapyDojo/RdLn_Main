// --- Start of RdLn DOCX (Track Changes) exporter // Originally from docxExport.ts, adapted for browser environment

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

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

function buildDocumentXml(paras, author, isoDate) {
  let revId = 1;
  const root = xmlbuilder2.create({ version: '1.0', encoding: 'UTF-8' })
    .ele('w:document', { 'xmlns:w': W_NS })
    .ele('w:body');

  for (const para of paras) {
    const p = root.ele('w:p');
    for (const token of para) {
      if (token.type === 'equal') {
        const r = p.ele('w:r');
        r.ele('w:t', { 'xml:space': 'preserve' }).txt(token.text ?? '');
      } else if (token.type === 'ins') {
        const ins = p.ele('w:ins', { 'w:id': String(revId++), 'w:author': author, 'w:date': isoDate });
        const r = ins.ele('w:r');
        r.ele('w:t', { 'xml:space': 'preserve' }).txt(token.text ?? '');
      } else if (token.type === 'del') {
        const del = p.ele('w:del', { 'w:id': String(revId++), 'w:author': author, 'w:date': isoDate });
        const r = del.ele('w:r');
        r.ele('w:delText', { 'xml:space': 'preserve' }).txt(token.text ?? '');
      }
    }
  }

  root.ele('w:sectPr');
  return root.up().end({ prettyPrint: false });
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

  const tokens = htmlToTokens(html);
  const paragraphs = chunkParagraphs(tokens);
  const documentXml = buildDocumentXml(paragraphs, author, isoDate);

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

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const operatorList = await page.getOperatorList();
                    const viewport = page.getViewport({ scale: 1.0 });

                    const lines = parseLinesFromOps(operatorList, viewport);
                    
                    const pageStyledText = textContent.items.map(item => {
                        const style = checkStyle(item, lines);
                        // Attach transform for sorting
                        return { text: item.str, style: style, transform: item.transform };
                    });
                    styledText.push(...pageStyledText);
                }

                const htmlDiff = generateHtmlDiff(styledText);
                const docxBytes = await exportHtmlDiffToDocx(htmlDiff, { author: 'Converter' });

                const blob = new Blob([docxBytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                const fileName = (file.name || 'document').replace(/\.pdf$/i, '');
                link.download = `${fileName}_converted.docx`;
                link.click();

                statusDiv.textContent = 'Conversion successful! Check your downloads.';

            } catch (error) {
                console.error('Error during PDF processing:', error);
                statusDiv.textContent = `Error: ${error.message}`;
            }
        };
        fileReader.readAsArrayBuffer(file);
    }

    function parseLinesFromOps(opList, viewport) {
        const lines = [];
        const BBOX_HEIGHT_THRESHOLD = 1.0; // Heuristic for what counts as a horizontal line

        // This is a simplified parser. A robust one would manage the full graphics state.
        for (let i = 0; i < opList.fnArray.length; i++) {
            const fn = opList.fnArray[i];
            const args = opList.argsArray[i];

            // Look for rectangle drawing operations, as Litera often uses thin rectangles for lines.
            if (fn === pdfjsLib.OPS.constructPath) {
                const pathOps = args[0];
                const pathArgs = args[1];
                // Check if this path is a simple horizontal line
                if (pathOps.length === 2 && pathOps[0] === pdfjsLib.OPS.moveTo && pathOps[1] === pdfjsLib.OPS.lineTo) {
                    const start = viewport.convertToViewportPoint(pathArgs[0], pathArgs[1]);
                    const end = viewport.convertToViewportPoint(pathArgs[2], pathArgs[3]);
                     if(Math.abs(start[1] - end[1]) < BBOX_HEIGHT_THRESHOLD){
                         lines.push({ x1: start[0], y1: start[1], x2: end[0], y2: end[1] });
                     }
                }
            }
        }
        return lines;
    }

    function checkStyle(textItem, lines) {
        const transform = textItem.transform;
        const x = transform[4];
        const y = transform[5];
        const width = textItem.width;
        const height = textItem.height;

        const textMidY = y + height / 2;
        const textBaselineY = y;

        for (const line of lines) {
            const lineY = line.y1;
            const overlapsX = (line.x1 < x + width && line.x2 > x);

            if (overlapsX) {
                // Strikethrough check: line is near the middle of the text
                if (Math.abs(lineY - textMidY) < height * 0.4) { // Increased tolerance
                    return 'del';
                }
                // Underline check: line is just below the baseline
                if (Math.abs(lineY - textBaselineY) < 2.5) { // Increased tolerance
                    return 'ins';
                }
            }
        }
        return 'equal';
    }

    function generateHtmlDiff(styledText) {
        // Sort text items by their position on the page to reconstruct reading order
        styledText.sort((a, b) => {
            const y1 = a.transform[5];
            const y2 = b.transform[5];
            const x1 = a.transform[4];
            const x2 = b.transform[4];
            if (Math.abs(y1 - y2) > 5) { // Threshold for being on the same line
                return y2 - y1; // Higher y is lower on the page in PDF coordinates
            } else {
                return x1 - x2;
            }
        });

        let html = '<div>';
        let currentLineY = -1;

        styledText.forEach((item, index) => {
            const y = item.transform[5];
            // Add a space between items on the same line
            if (index > 0 && Math.abs(y - currentLineY) < 5) {
                 html += ' ';
            }

            if (currentLineY !== -1 && Math.abs(y - currentLineY) > 5) {
                html += '<br>'; // Add a line break if y position changes significantly
            }
            currentLineY = y;

            if (item.style === 'ins') {
                html += `<span style="text-decoration: underline;">${escapeXml(item.text)}</span>`;
            } else if (item.style === 'del') {
                html += `<span style="text-decoration: line-through;">${escapeXml(item.text)}</span>`;
            } else {
                html += escapeXml(item.text);
            }
        });
        html += '</div>';
        return html;
    }
};