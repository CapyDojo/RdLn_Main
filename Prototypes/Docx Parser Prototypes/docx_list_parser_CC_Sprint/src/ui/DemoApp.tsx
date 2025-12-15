/**
 * DemoApp - Main application component for DOCX List Parser MVP
 */

import { useState } from 'react';
import { DocxListExtractor } from '../core/DocxListExtractor';
import { ListValidator } from '../core/ListValidator';
import type { ExtractionResult, AccuracyMetrics } from '../core/types';
import { FileUpload } from './FileUpload';
import { TextPreview } from './TextPreview';
import { AccuracyReport } from './AccuracyReport';
import './DemoApp.css';

export function DemoApp() {
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [expectedText, setExpectedText] = useState<string>('');
  const [accuracyMetrics, setAccuracyMetrics] = useState<AccuracyMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const extractor = new DocxListExtractor();
  const validator = new ListValidator();

  const handleDocxUpload = async (file: File) => {
    setLoading(true);
    setAccuracyMetrics(null);

    try {
      const result = await extractor.extractText(file);
      setExtractionResult(result);

      // If we have expected text, calculate accuracy
      if (expectedText.trim() && result.success) {
        const metrics = validator.calculateAccuracy(
          file.name,
          expectedText,
          result.text
        );
        setAccuracyMetrics(metrics);
      }
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpectedTextUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setExpectedText(text);

      // If we already have extraction result, recalculate accuracy
      if (extractionResult && extractionResult.success) {
        const metrics = validator.calculateAccuracy(
          extractionResult.metadata.fileName,
          text,
          extractionResult.text
        );
        setAccuracyMetrics(metrics);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setExtractionResult(null);
    setExpectedText('');
    setAccuracyMetrics(null);
  };

  return (
    <div className="demo-app">
      <header className="app-header">
        <h1>📄 DOCX List Parser MVP</h1>
        <p className="subtitle">
          Test DOCX extraction with faithful list numbering reproduction
        </p>
      </header>

      <main className="app-main">
        <div className="upload-section">
          <div className="upload-card">
            <h2>1. Upload DOCX File</h2>
            <FileUpload
              accept=".docx"
              onFileSelect={handleDocxUpload}
              label="Choose DOCX file"
              disabled={loading}
            />
          </div>

          <div className="upload-card">
            <h2>2. Upload Expected Output (Optional)</h2>
            <FileUpload
              accept=".txt"
              onFileSelect={handleExpectedTextUpload}
              label="Choose .txt file (Word copy-paste)"
              disabled={loading}
            />
            <p className="help-text">
              Generate this by: Open in Word → Select All → Copy → Paste in Notepad → Save
            </p>
          </div>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Extracting text from DOCX...</p>
          </div>
        )}

        {extractionResult && !loading && (
          <>
            {extractionResult.success ? (
              <div className="results-section">
                {extractionResult.warning && (
                  <div className="warning-banner">
                    <h3>⚠️ Fallback Numbering Applied</h3>
                    <p>{extractionResult.warning}</p>
                    <p className="warning-details">
                      The original DOCX numbering definitions were missing or invalid.
                      Default decimal numbering (1, 2, 3 or 1.1, 1.2) has been applied instead.
                    </p>
                  </div>
                )}

                <div className="metadata">
                  <h3>Extraction Metadata</h3>
                  <p><strong>File:</strong> {extractionResult.metadata.fileName}</p>
                  <p><strong>Size:</strong> {(extractionResult.metadata.fileSize / 1024).toFixed(2)} KB</p>
                  <p><strong>Processing Time:</strong> {extractionResult.metadata.processingTime.toFixed(2)} ms</p>
                </div>

                <div className="preview-container">
                  <div className="preview-pane">
                    <h3>Extracted Text</h3>
                    <TextPreview text={extractionResult.text} />
                  </div>

                  {expectedText && (
                    <div className="preview-pane">
                      <h3>Expected Text (Word)</h3>
                      <TextPreview text={expectedText} />
                    </div>
                  )}
                </div>

                {accuracyMetrics && (
                  <AccuracyReport metrics={accuracyMetrics} />
                )}

                <button className="reset-button" onClick={handleReset}>
                  Start Over
                </button>
              </div>
            ) : (
              <div className="error-message">
                <h3>❌ Extraction Failed</h3>
                <p>{extractionResult.error}</p>
                <button onClick={handleReset}>Try Again</button>
              </div>
            )}
          </>
        )}

        {!extractionResult && !loading && (
          <div className="instructions">
            <h2>How to Use</h2>
            <ol>
              <li>Upload a DOCX file with numbered or bulleted lists</li>
              <li>Optionally upload expected output (from Word's copy-paste) for accuracy validation</li>
              <li>View extracted text and accuracy metrics</li>
            </ol>

            <h3>Test Cases to Try</h3>
            <ul>
              <li>✓ Simple numbered lists (1, 2, 3)</li>
              <li>✓ Nested lists (1.1, 1.2, 1.2.1)</li>
              <li>✓ Mixed bullets and numbers</li>
              <li>✓ Roman numerals (I, II, III)</li>
              <li>✓ Letter sequences (a, b, c)</li>
              <li>✓ Legal outline format (1.1.1.1)</li>
            </ul>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          <strong>MVP Goal:</strong> Achieve ≥95% accuracy on list numbering reproduction
        </p>
        <p>
          Powered by <code>@omer-go/docx-parser-converter-ts</code>
        </p>
      </footer>
    </div>
  );
}
