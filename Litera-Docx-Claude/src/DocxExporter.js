/**
 * DOCX Exporter with Track Changes
 * 
 * Converts HTML diff markup to proper Word DOCX files with native track changes.
 * Adapted from RdLn docxExport.ts for standalone use.
 */

class DocxExporter {
    constructor() {
        this.W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        this.isInitialized = false;
        this.JSZip = null;
    }

    /**
     * Initialize the exporter with required dependencies
     */
    async initialize() {
        if (this.isInitialized) return;
        
        // JSZip should be loaded from CDN
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not found. Make sure it is loaded from CDN.');
        }
        
        this.JSZip = JSZip;
        this.isInitialized = true;
        console.log('DOCX Exporter initialized');
    }

    /**
     * Convert HTML diff to DOCX with track changes
     * @param {string} html - HTML with diff markup
     * @param {Object} options - Export options
     * @returns {Promise<Uint8Array>} - DOCX file as bytes
     */
    async exportHtmlDiffToDocx(html, options = {}) {
        await this.initialize();
        
        const author = options.author || 'Litera Converter';
        const isoDate = (options.date || new Date()).toISOString();
        const annotations = options.annotations || [];
        
        // Convert HTML to tokens
        const tokens = this.htmlToTokens(html);
        
        // Group tokens into paragraphs
        const paragraphs = this.chunkParagraphs(tokens);
        
        // Generate document XML with separate annotations table
        const documentXml = this.buildDocumentXml(paragraphs, author, isoDate, annotations);
        
        // Create ZIP structure
        const zip = new this.JSZip();
        
        // Add all required files
        zip.file('[Content_Types].xml', this.contentTypesXml());
        zip.folder('_rels').file('.rels', this.relsRels());
        
        const docProps = zip.folder('docProps');
        docProps.file('core.xml', this.corePropsXml(author, isoDate));
        docProps.file('app.xml', this.appPropsXml());
        
        const word = zip.folder('word');
        word.file('document.xml', documentXml);
        word.file('styles.xml', this.stylesXml());
        word.file('settings.xml', this.settingsXml());
        word.folder('_rels').file('document.xml.rels', this.documentRels());
        
        // Generate DOCX file
        const content = await zip.generateAsync({
            type: 'uint8array',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        return content;
    }

    /**
     * Convert HTML to structured tokens
     */
    htmlToTokens(html) {
        const root = this.ensureDom(html);
        const tokens = [];
        
        // Process child nodes
        const children = Array.from(root.childNodes);
        if (children.length === 1 && children[0].nodeType === 1 && 
            children[0].nodeName.toLowerCase() === 'div') {
            this.tokenizeNode(children[0], tokens, 'equal');
        } else {
            for (const child of children) {
                this.tokenizeNode(child, tokens, 'equal');
            }
        }
        
        return this.mergeAdjacent(tokens);
    }

    /**
     * Create DOM element from HTML string
     */
    ensureDom(html) {
        if (typeof document !== 'undefined') {
            const container = document.createElement('div');
            container.innerHTML = html;
            return container;
        }
        throw new Error('DOM environment not available for HTML parsing');
    }

    /**
     * Recursively tokenize DOM nodes
     */
    tokenizeNode(node, output, mode) {
        if (node.nodeType === Node.TEXT_NODE) {
            const raw = node.textContent || '';
            if (!raw) return;
            
            const text = this.trimZeroWidth(raw);
            if (!text) return;
            
            // Split on newlines to create paragraph boundaries
            const parts = text.split(/(\r\n|\n)/);
            for (const part of parts) {
                if (part === '\n' || part === '\r\n') {
                    output.push({ type: 'newline' });
                } else if (part.length) {
                    output.push({ type: mode, text: part });
                }
            }
            return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            const tag = el.tagName.toLowerCase();

            if (tag === 'br') {
                output.push({ type: 'newline' });
                return;
            }

            // Handle div elements as paragraph containers
            if (tag === 'div' && el !== (el.ownerDocument?.body?.firstElementChild ?? null)) {
                // Add paragraph break before nested div content
                if (output.length && output[output.length - 1].type !== 'newline') {
                    output.push({ type: 'newline' });
                }
                Array.from(el.childNodes).forEach(child => 
                    this.tokenizeNode(child, output, 'equal')
                );
                output.push({ type: 'newline' });
                return;
            }

            let nextMode = mode;
            if (tag === 'span') {
                if (this.isInsertionSpan(el)) {
                    nextMode = 'ins';
                } else if (this.isDeletionSpan(el)) {
                    nextMode = 'del';
                }
            }

            Array.from(el.childNodes).forEach(child => 
                this.tokenizeNode(child, output, nextMode)
            );
        }
    }

    /**
     * Check if span represents an insertion
     */
    isInsertionSpan(el) {
        const style = (el.getAttribute('style') || '').toLowerCase();
        if (/text-decoration[^;]*underline/.test(style) || 
            /text-decoration-line[^;]*underline/.test(style)) {
            return true;
        }
        // Color-based detection for green insertion styling
        if (/dcfce7|bbf7d0|16a34a|166534/.test(style)) {
            return true;
        }
        return false;
    }

    /**
     * Check if span represents a deletion
     */
    isDeletionSpan(el) {
        const style = (el.getAttribute('style') || '').toLowerCase();
        if (/text-decoration[^;]*line-through/.test(style) || 
            /line-through/.test(style)) {
            return true;
        }
        // Color-based detection for red deletion styling
        if (/fef2f2|fecaca|dc2626|991b1b/.test(style)) {
            return true;
        }
        return false;
    }

    /**
     * Remove zero-width whitespace characters
     */
    trimZeroWidth(s) {
        return s.replace(/^[\u200B-\u200D\uFEFF]+|[\u200B-\u200D\uFEFF]+$/g, '');
    }

    /**
     * Merge adjacent tokens of the same type
     */
    mergeAdjacent(tokens) {
        const merged = [];
        for (const token of tokens) {
            const last = merged[merged.length - 1];
            
            if (token.type === 'newline') {
                // Avoid consecutive newlines
                if (!last || last.type !== 'newline') {
                    merged.push(token);
                }
                continue;
            }
            
            if (last && last.type === token.type && 
                last.text !== undefined && token.text !== undefined) {
                last.text += token.text;
            } else {
                merged.push({ ...token });
            }
        }
        
        // Trim leading/trailing newlines
        while (merged.length && merged[0].type === 'newline') merged.shift();
        while (merged.length && merged[merged.length - 1].type === 'newline') merged.pop();
        
        return merged;
    }

    /**
     * Group tokens into paragraphs based on newlines
     */
    chunkParagraphs(tokens) {
        const paragraphs = [];
        let current = [];
        
        for (const token of tokens) {
            if (token.type === 'newline') {
                if (current.length) {
                    paragraphs.push(current);
                    current = [];
                }
            } else {
                current.push(token);
            }
        }
        
        if (current.length) paragraphs.push(current);
        if (paragraphs.length === 0) paragraphs.push([]);
        
        return paragraphs;
    }

    /**
     * Build Word document XML with track changes and annotations table
     */
    buildDocumentXml(paragraphs, author, isoDate, annotations = []) {
        let revId = 1;
        const parts = [];
        
        parts.push('<?xml version="1.0" encoding="UTF-8"?>');
        parts.push(`<w:document xmlns:w="${this.W_NS}">`);
        parts.push('<w:body>');
        
        // Main document content with track changes
        for (const paragraph of paragraphs) {
            parts.push('<w:p>');
            
            for (const token of paragraph) {
                const text = this.escapeXml(token.text || '');
                
                if (token.type === 'equal') {
                    parts.push('<w:r>');
                    parts.push('<w:t xml:space="preserve">' + text + '</w:t>');
                    parts.push('</w:r>');
                } else if (token.type === 'ins') {
                    parts.push(`<w:ins w:id="${revId++}" w:author="${this.escapeXml(author)}" w:date="${isoDate}">`);
                    parts.push('<w:r>');
                    parts.push('<w:t xml:space="preserve">' + text + '</w:t>');
                    parts.push('</w:r>');
                    parts.push('</w:ins>');
                } else if (token.type === 'del') {
                    parts.push(`<w:del w:id="${revId++}" w:author="${this.escapeXml(author)}" w:date="${isoDate}">`);
                    parts.push('<w:r>');
                    parts.push('<w:delText xml:space="preserve">' + text + '</w:delText>');
                    parts.push('</w:r>');
                    parts.push('</w:del>');
                }
            }
            
            parts.push('</w:p>');
        }
        
        // Add comments table if there are annotations
        if (annotations && annotations.length > 0) {
            this.addCommentsTable(parts, annotations);
        }
        
        parts.push('<w:sectPr/>');
        parts.push('</w:body>');
        parts.push('</w:document>');
        
        return parts.join('');
    }

    /**
     * Add comments table at the end of the document
     */
    addCommentsTable(parts, annotations) {
        // Add some spacing before the comments section
        parts.push('<w:p><w:r><w:t xml:space="preserve">\n\n</w:t></w:r></w:p>');
        
        // Add comments section heading
        parts.push('<w:p>');
        parts.push('<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>');
        parts.push('<w:r>');
        parts.push('<w:rPr><w:b/><w:sz w:val="32"/></w:rPr>');
        parts.push('<w:t>Comments and Annotations</w:t>');
        parts.push('</w:r>');
        parts.push('</w:p>');
        
        // Create table structure
        parts.push('<w:tbl>');
        parts.push('<w:tblPr>');
        parts.push('<w:tblW w:w="0" w:type="auto"/>');
        parts.push('<w:tblBorders>');
        parts.push('<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>');
        parts.push('<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>');
        parts.push('<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>');
        parts.push('<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>');
        parts.push('<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>');
        parts.push('<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>');
        parts.push('</w:tblBorders>');
        parts.push('</w:tblPr>');
        
        // Table grid definition (3 columns)
        parts.push('<w:tblGrid>');
        parts.push('<w:gridCol w:w="1000"/>'); // Page column (narrow)
        parts.push('<w:gridCol w:w="2000"/>'); // Author column (medium)
        parts.push('<w:gridCol w:w="6000"/>'); // Comment column (wide)
        parts.push('</w:tblGrid>');
        
        // Header row
        parts.push('<w:tr>');
        this.addTableCell(parts, 'Page', true);
        this.addTableCell(parts, 'Author', true);
        this.addTableCell(parts, 'Comment', true);
        parts.push('</w:tr>');
        
        // Data rows
        for (const annotation of annotations) {
            parts.push('<w:tr>');
            this.addTableCell(parts, String(annotation.page || ''));
            this.addTableCell(parts, annotation.author || '');
            this.addTableCell(parts, annotation.text || '');
            parts.push('</w:tr>');
        }
        
        parts.push('</w:tbl>');
    }

    /**
     * Add a table cell with content
     */
    addTableCell(parts, content, isHeader = false) {
        parts.push('<w:tc>');
        parts.push('<w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>');
        parts.push('<w:p>');
        
        if (isHeader) {
            parts.push('<w:pPr><w:jc w:val="center"/></w:pPr>');
        }
        
        parts.push('<w:r>');
        
        if (isHeader) {
            parts.push('<w:rPr><w:b/></w:rPr>');
        }
        
        parts.push('<w:t xml:space="preserve">' + this.escapeXml(content) + '</w:t>');
        parts.push('</w:r>');
        parts.push('</w:p>');
        parts.push('</w:tc>');
    }

    /**
     * Escape XML special characters
     */
    escapeXml(s) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // DOCX file structure methods
    
    contentTypesXml() {
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

    relsRels() {
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
            '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
            '</Relationships>'
        ].join('');
    }

    corePropsXml(author, isoDate) {
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"',
            ' xmlns:dc="http://purl.org/dc/elements/1.1/"',
            ' xmlns:dcterms="http://purl.org/dc/terms/"',
            ' xmlns:dcmitype="http://purl.org/dc/dcmitype/"',
            ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
            `<dc:creator>${this.escapeXml(author)}</dc:creator>`,
            `<cp:lastModifiedBy>${this.escapeXml(author)}</cp:lastModifiedBy>`,
            `<dcterms:created xsi:type="dcterms:W3CDTF">${isoDate}</dcterms:created>`,
            `<dcterms:modified xsi:type="dcterms:W3CDTF">${isoDate}</dcterms:modified>`,
            '</cp:coreProperties>'
        ].join('');
    }

    appPropsXml() {
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"',
            ' xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
            '<Application>Litera to DOCX Converter</Application>',
            '<DocSecurity>0</DocSecurity>',
            '<ScaleCrop>false</ScaleCrop>',
            '<LinksUpToDate>false</LinksUpToDate>',
            '<SharedDoc>false</SharedDoc>',
            '<HyperlinksChanged>false</HyperlinksChanged>',
            '<AppVersion>1.0</AppVersion>',
            '</Properties>'
        ].join('');
    }

    stylesXml() {
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            `<w:styles xmlns:w="${this.W_NS}">`,
            '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">',
            '<w:name w:val="Normal"/>',
            '<w:qFormat/>',
            '</w:style>',
            '</w:styles>'
        ].join('');
    }

    settingsXml() {
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            `<w:settings xmlns:w="${this.W_NS}">`,
            '<w:trackRevisions/>',
            '</w:settings>'
        ].join('');
    }

    documentRels() {
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>',
            '</Relationships>'
        ].join('');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocxExporter;
} else {
    window.DocxExporter = DocxExporter;
}