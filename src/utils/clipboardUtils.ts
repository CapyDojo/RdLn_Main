/**
 * Clipboard utilities for rich text copying
 * Provides multi-format clipboard support for redlined document output
 */

import { DiffChange } from '../types';

/**
 * Converts Tailwind CSS classes to inline styles for better clipboard compatibility
 * Maps theme-based classes to standard colors that work across applications
 */
const getInlineStyles = (changeType: string): string => {
  switch (changeType) {
    case 'added':
      return 'background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; text-decoration: underline; text-decoration-thickness: 2px; text-decoration-color: #16a34a;';
    case 'removed':
      return 'background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: #dc2626;';
    case 'changed-original':
      return 'background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: #dc2626;';
    case 'changed-revised':
      return 'background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; text-decoration: underline; text-decoration-thickness: 2px; text-decoration-color: #16a34a;';
    default:
      return '';
  }
};

/**
 * Escapes HTML special characters for safe HTML generation
 */
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\n/g, '<br>');
};

/**
 * Generates HTML content with inline styles for clipboard compatibility
 */
export const generateClipboardHTML = (changes: DiffChange[]): string => {
  if (!changes || !Array.isArray(changes)) {
    return '';
  }

  let html = '<div style="font-family: serif; line-height: 1.6; white-space: pre-wrap;">';
  
  changes.forEach(change => {
    switch (change.type) {
      case 'added':
        html += `<span style="${getInlineStyles('added')}">${escapeHtml(change.content || '')}</span>`;
        break;
      case 'removed':
        html += `<span style="${getInlineStyles('removed')}">${escapeHtml(change.content || '')}</span>`;
        break;
      case 'changed':
        // Render as cohesive substitution with both original and revised content
        html += `<span style="${getInlineStyles('changed-original')}">${escapeHtml(change.originalContent || '')}</span>`;
        html += `<span style="${getInlineStyles('changed-revised')}">${escapeHtml(change.revisedContent || '')}</span>`;
        break;
      default:
        html += `<span>${escapeHtml(change.content || '')}</span>`;
        break;
    }
  });
  
  html += '</div>';
  return html;
};

/**
 * Generates plain text content for clipboard fallback
 */
export const generateClipboardPlainText = (changes: DiffChange[]): string => {
  if (!changes || !Array.isArray(changes)) {
    return '';
  }

  return changes.map(change => {
    switch (change.type) {
      case 'changed': 
        return change.revisedContent || '';
      case 'removed': 
        return '';
      default: 
        return change.content || '';
    }
  }).join('');
};

/**
 * Copies content to clipboard in multiple formats (HTML + plain text)
 * Falls back to plain text only if modern Clipboard API is not supported
 */
export const copyToClipboardMultiFormat = async (changes: DiffChange[]): Promise<void> => {
  const htmlContent = generateClipboardHTML(changes);
  const plainTextContent = generateClipboardPlainText(changes);

  try {
    // Check if modern Clipboard API with multiple formats is supported
    if (navigator.clipboard && window.ClipboardItem) {
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([plainTextContent], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([clipboardItem]);
      return;
    }
    
    // Fallback to plain text only
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(plainTextContent);
      return;
    }
    
    // Final fallback for test environments
    console.log('Clipboard API not available, simulating copy operation');
    
  } catch (error) {
    // If HTML clipboard fails, try plain text as fallback
    console.warn('Multi-format clipboard failed, falling back to plain text:', error);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(plainTextContent);
    } else {
      throw new Error('Clipboard access not available');
    }
  }
};

/**
 * Checks if multi-format clipboard is supported in current browser
 */
export const isMultiFormatClipboardSupported = (): boolean => {
  return !!(navigator.clipboard && window.ClipboardItem);
};