/**
 * Main Litera to DOCX Converter
 * 
 * Orchestrates the conversion process from Litera PDF markup to Word DOCX
 * with native track changes support.
 */

class LiteraDocxConverter {
    constructor() {
        this.pdfAnalyzer = new PdfAnalyzer();
        this.docxExporter = new DocxExporter();
        this.isInitialized = false;
    }

    /**
     * Initialize the converter with all dependencies
     */
    async initialize() {
        if (this.isInitialized) return;
        
        await this.pdfAnalyzer.initialize();
        await this.docxExporter.initialize();
        
        this.isInitialized = true;
        console.log('Litera to DOCX Converter initialized');
    }

    /**
     * Convert a Litera PDF file to DOCX with track changes
     * @param {File} pdfFile - The PDF file to convert
     * @param {Object} options - Conversion options
     * @returns {Promise<{docxBytes: Uint8Array, summary: Object, filename: string}>}
     */
    async convertPdfToDocx(pdfFile, options = {}) {
        await this.initialize();
        
        if (!pdfFile || pdfFile.type !== 'application/pdf') {
            throw new Error('Please provide a valid PDF file');
        }

        try {
            console.log(`Converting PDF: ${pdfFile.name}`);
            
            // Step 1: Analyze the PDF to extract styled text
            console.log('Analyzing PDF structure...');
            const analysis = await this.pdfAnalyzer.analyzePdf(pdfFile);
            
            if (!analysis.styledText || analysis.styledText.length === 0) {
                throw new Error('No text content found in PDF. Please check if this is a valid Litera markup document.');
            }

            console.log(`Found ${analysis.styledText.length} text items across ${analysis.pageCount} pages`);
            
            // Step 2: Generate HTML diff from styled text
            console.log('Generating HTML diff markup...');
            const htmlDiff = this.pdfAnalyzer.generateHtmlDiff(analysis.styledText);
            
            // Step 3: Convert to DOCX with track changes and separate annotations
            console.log('Creating DOCX with track changes...');
            const author = options.author || this.inferAuthorFromSummary(analysis.summary);
            const docxBytes = await this.docxExporter.exportHtmlDiffToDocx(htmlDiff, {
                author: author,
                date: options.date || new Date(),
                annotations: analysis.annotations || []
            });

            // Step 4: Generate output filename
            const filename = this.generateOutputFilename(pdfFile.name, analysis.summary);
            
            console.log(`Conversion complete. Generated ${docxBytes.length} bytes`);
            
            return {
                docxBytes: docxBytes,
                summary: analysis.summary,
                filename: filename,
                htmlPreview: htmlDiff // For debugging/preview purposes
            };
            
        } catch (error) {
            console.error('Conversion failed:', error);
            throw new Error(`Conversion failed: ${error.message}`);
        }
    }

    /**
     * Infer author name from Litera summary information
     */
    inferAuthorFromSummary(summary) {
        // Try to extract author from filenames or use default
        if (summary.modifiedFilename) {
            // Look for patterns like "filename - Author.docx" or "filename_Author_comments.docx"
            const patterns = [
                /([^-_]+)[-_]\s*([^.]+)[-_]?(comments?)?\./i,
                /([^(]+)\(([^)]+)\)/i
            ];
            
            for (const pattern of patterns) {
                const match = summary.modifiedFilename.match(pattern);
                if (match && match[2] && match[2].length < 50) {
                    const author = match[2].trim().replace(/[-_]/g, ' ');
                    if (author && !author.toLowerCase().includes('comment')) {
                        return author;
                    }
                }
            }
        }
        
        return 'Document Reviewer';
    }

    /**
     * Generate appropriate output filename
     */
    generateOutputFilename(originalName, summary) {
        const baseName = originalName.replace(/\.pdf$/i, '');
        const timestamp = this.formatTimestamp(new Date());
        
        // Try to use original document name from summary
        let docName = baseName;
        if (summary.originalFilename) {
            const cleanName = summary.originalFilename
                .replace(/\.docx?$/i, '')
                .replace(/[<>:"/\\|?*]/g, '_')
                .substring(0, 60);
            if (cleanName.length > 3) {
                docName = cleanName;
            }
        }
        
        return `${docName}_tracked_changes_${timestamp}.docx`;
    }

    /**
     * Format timestamp for filename
     */
    formatTimestamp(date) {
        const pad = (n) => n.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hour = pad(date.getHours());
        const minute = pad(date.getMinutes());
        
        return `${year}${month}${day}_${hour}${minute}`;
    }

    /**
     * Download the converted DOCX file
     */
    async downloadDocx(docxBytes, filename) {
        try {
            const blob = new Blob([docxBytes], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 1000);
            
            console.log(`Downloaded: ${filename}`);
            
        } catch (error) {
            console.error('Download failed:', error);
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    /**
     * Get conversion statistics from the last analysis
     */
    getConversionStats(analysis) {
        if (!analysis || !analysis.styledText) {
            return null;
        }
        
        const stats = {
            totalItems: analysis.styledText.length,
            insertions: 0,
            deletions: 0,
            unchanged: 0,
            pages: analysis.pageCount || 0
        };
        
        for (const item of analysis.styledText) {
            switch (item.style) {
                case 'ins':
                    stats.insertions++;
                    break;
                case 'del':
                    stats.deletions++;
                    break;
                default:
                    stats.unchanged++;
                    break;
            }
        }
        
        return stats;
    }

    /**
     * Validate PDF file before processing
     */
    validatePdfFile(file) {
        if (!file) {
            return 'Please select a PDF file';
        }
        
        if (file.type !== 'application/pdf') {
            return 'Please select a valid PDF file';
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            return 'PDF file is too large (maximum 50MB)';
        }
        
        if (file.size < 1024) { // 1KB minimum
            return 'PDF file appears to be empty or corrupted';
        }
        
        return null; // Valid
    }

    /**
     * Process multiple PDF files in batch
     */
    async convertMultiplePdfs(files, options = {}) {
        const results = [];
        const errors = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
                const result = await this.convertPdfToDocx(file, options);
                results.push({ file: file.name, result });
                
                // Optional: auto-download each file
                if (options.autoDownload) {
                    await this.downloadDocx(result.docxBytes, result.filename);
                }
                
            } catch (error) {
                console.error(`Failed to convert ${file.name}:`, error);
                errors.push({ file: file.name, error: error.message });
            }
        }
        
        return { results, errors };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiteraDocxConverter;
} else {
    window.LiteraDocxConverter = LiteraDocxConverter;
}