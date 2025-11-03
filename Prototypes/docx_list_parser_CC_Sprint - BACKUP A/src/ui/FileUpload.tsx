/**
 * FileUpload - File upload component with drag-and-drop support
 */

import { useState, useRef } from 'react';

interface FileUploadProps {
  accept: string;
  onFileSelect: (file: File) => void;
  label: string;
  disabled?: boolean;
}

export function FileUpload({ accept, onFileSelect, label, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file =>
      accept.split(',').some(ext => file.name.endsWith(ext.trim()))
    );

    if (validFile) {
      onFileSelect(validFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`file-upload ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <div className="upload-content">
        <div className="upload-icon">📁</div>
        <p className="upload-label">{label}</p>
        <p className="upload-hint">or drag and drop here</p>
      </div>
    </div>
  );
}
