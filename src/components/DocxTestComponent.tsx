// src/components/DocxTestComponent.tsx
import React, { useState } from 'react';
import { FileProcessingService } from '../services/FileProcessingService';

const DocxTestComponent: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError('');
    setResult('');

    try {
      const fileProcessingService = new FileProcessingService();
      const processingResult = await fileProcessingService.processFile(file);
      setResult(processingResult.content);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>DOCX Processing Test</h2>
      <input 
        type="file" 
        accept=".docx" 
        onChange={handleFileChange} 
        disabled={processing}
      />
      {processing && <p>Processing...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {result && (
        <div>
          <h3>Extracted Content:</h3>
          <pre style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            backgroundColor: '#f9f9f9',
            whiteSpace: 'pre-wrap'
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DocxTestComponent;