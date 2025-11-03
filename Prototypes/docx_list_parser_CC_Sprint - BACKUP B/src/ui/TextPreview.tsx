/**
 * TextPreview - Display extracted text with line numbers
 */

interface TextPreviewProps {
  text: string;
}

export function TextPreview({ text }: TextPreviewProps) {
  const lines = text.split('\n');

  return (
    <div className="text-preview">
      <pre className="preview-content">
        {lines.map((line, index) => (
          <div key={index} className="preview-line">
            <span className="line-number">{index + 1}</span>
            <span className="line-content">{line || ' '}</span>
          </div>
        ))}
      </pre>
      <div className="preview-stats">
        <p>Lines: {lines.length}</p>
        <p>Characters: {text.length}</p>
      </div>
    </div>
  );
}
