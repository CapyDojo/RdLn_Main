// src/types/file-processing.types.ts

export type FileType = 'docx' | 'txt' | 'pdf-text' | 'pdf-scanned' | 'unknown';

export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface ProcessingResult {
  type: FileType;
  content: string;
  processingTime?: number;
  confidence?: number;
  method?: string;
  error?: string;
}

export interface ProcessingError {
  message: string;
  code: string;
  details?: any;
}

export interface FileValidationResult {
  valid: boolean;
  message?: string;
}

export const ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  DOCX_PROCESSING_FAILED: 'DOCX_PROCESSING_FAILED',
  TXT_PROCESSING_FAILED: 'TXT_PROCESSING_FAILED',
  DOC_FORMAT_NOT_SUPPORTED: 'DOC_FORMAT_NOT_SUPPORTED',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;