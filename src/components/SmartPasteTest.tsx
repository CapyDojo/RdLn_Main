import React, { useState } from 'react';
import { formatPastedText } from '../utils/paragraphFormatting.ts?v=2';

export const SmartPasteTest = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text/plain');
    const formatted = formatPastedText(text);
    setInput(text);
    setOutput(formatted);
    e.preventDefault();
  };

  return (
    <div>
      <h2>SmartPaste Test</h2>
      <textarea
        placeholder="Paste contract header here..."
        onPaste={handlePaste}
        style={{ width: '100%', height: '200px' }}
      />
      <h3>Original:</h3>
      <pre>{input}</pre>
      <h3>Formatted:</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{output}</pre>
    </div>
  );
};
