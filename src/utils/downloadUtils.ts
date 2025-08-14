/*
 * RdLn™ - Professional Document Comparison Tool
 * Copyright (c) 2025 RdLn Team. All rights reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is proprietary to RdLn Team and may not be copied,
 * distributed, modified, or used without express written permission.
 * 
 * For licensing information, see LICENSE file.
 */

/**
 * Download utilities for file export functionality
 */

/**
 * Triggers a download of text content as a file
 * @param content - The text content to download
 * @param filename - The filename for the download
 * @param mimeType - The MIME type of the file (default: 'application/json')
 */
export const downloadTextFile = (
  content: string,
  filename: string,
  mimeType: string = 'application/json'
): void => {
  try {
    // Create blob with the content
    const blob = new Blob([content], { type: mimeType });
    
    // Create object URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL
    URL.revokeObjectURL(url);
    
    console.log(`📥 Downloaded: ${filename}`);
  } catch (error) {
    console.error('Failed to download file:', error);
    throw new Error(`Failed to download ${filename}`);
  }
};

/**
 * Generates a timestamped filename for exports
 * @param prefix - The prefix for the filename (e.g., 'rdln-export')
 * @param extension - The file extension (default: 'json')
 * @param includeTime - Whether to include time in the filename (default: false)
 * @returns The generated filename
 */
export const generateTimestampedFilename = (
  prefix: string,
  extension: string = 'json',
  includeTime: boolean = false
): string => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (includeTime) {
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    return `${prefix}-${dateStr}-${timeStr}.${extension}`;
  }
  
  return `${prefix}-${dateStr}.${extension}`;
};

/**
 * Generates export filename based on export type
 * @param exportType - The type of export ('full', 'incremental', 'dateRange', 'selected')
 * @param includeTime - Whether to include time in filename
 * @returns The generated filename
 */
export const generateExportFilename = (
  exportType: 'full' | 'incremental' | 'dateRange' | 'selected',
  includeTime: boolean = false
): string => {
  const prefixMap = {
    full: 'rdln-full',
    incremental: 'rdln-incremental',
    dateRange: 'rdln-daterange',
    selected: 'rdln-selected',
  };
  
  return generateTimestampedFilename(prefixMap[exportType], 'json', includeTime);
};

/**
 * Validates if a filename is safe for download
 * @param filename - The filename to validate
 * @returns Whether the filename is safe
 */
export const isValidFilename = (filename: string): boolean => {
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(filename)) {
    return false;
  }
  
  // Check length (most filesystems support up to 255 characters)
  if (filename.length > 255) {
    return false;
  }
  
  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(filename)) {
    return false;
  }
  
  return true;
};

/**
 * Sanitizes a filename by removing or replacing invalid characters
 * @param filename - The filename to sanitize
 * @returns The sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  // Replace invalid characters with underscores
  let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_');
  
  // Trim whitespace and dots from ends
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');
  
  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'download';
  }
  
  // Truncate if too long
  if (sanitized.length > 255) {
    const extension = sanitized.split('.').pop();
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    const maxNameLength = 255 - (extension ? extension.length + 1 : 0);
    sanitized = nameWithoutExt.substring(0, maxNameLength) + (extension ? `.${extension}` : '');
  }
  
  return sanitized;
};