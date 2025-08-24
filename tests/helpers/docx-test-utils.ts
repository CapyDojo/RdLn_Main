// src/testing/docx-test-utils.ts

import { FileTypeDetector } from '../services/FileTypeDetector';

/**
 * Test utility functions for DOCX processing
 */

export const createTestDocxFile = (content: string, filename: string = 'test.docx'): File => {
  // Create a simple text file with DOCX extension for testing
  // In a real scenario, this would be an actual DOCX file
  const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  return new File([blob], filename, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
};

export const createTestDocFile = (content: string, filename: string = 'test.doc'): File => {
  // Create a simple text file with DOC extension for testing
  const blob = new Blob([content], { type: 'application/msword' });
  return new File([blob], filename, { type: 'application/msword' });
};

export const testFileTypeDetection = () => {
  console.log('Testing file type detection...');
  
  const docxFile = createTestDocxFile('Test content', 'document.docx');
  const docFile = createTestDocFile('Test content', 'document.doc');
  const txtFile = new File(['Test content'], 'document.txt', { type: 'text/plain' });
  
  console.log('DOCX file detection:', FileTypeDetector.isDocx(docxFile)); // Should be true
  console.log('DOC file detection:', FileTypeDetector.isDoc(docFile)); // Should be true
  console.log('TXT file detection (DOCX):', FileTypeDetector.isDocx(txtFile)); // Should be false
  console.log('TXT file detection (DOC):', FileTypeDetector.isDoc(txtFile)); // Should be false
  
  console.log('File category (DOCX):', FileTypeDetector.getFileCategory(docxFile)); // Should be 'docx'
  console.log('File category (DOC):', FileTypeDetector.getFileCategory(docFile)); // Should be 'unknown'
  console.log('File category (TXT):', FileTypeDetector.getFileCategory(txtFile)); // Should be 'unknown'
};