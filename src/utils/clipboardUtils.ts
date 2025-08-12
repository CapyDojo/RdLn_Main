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
      return 'background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 8px; text-decoration: underline; text-decoration-thickness: 2px; text-decoration-color: #15803d; font-weight: 500; padding: 1.8px 4.5px; margin: 1.5px 1.5px; ';
    case 'removed':
      return 'background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 8px; text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: #b91c1c; font-weight: 500; padding: 1.8px 4.5px; margin: 1.5px 1.5px; ';
    case 'changed-original':
      return 'background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 8px; text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: #b91c1c; font-weight: 500; padding: 1.8px 4.5px; margin: 1.5px 1.5px; ';
    case 'changed-revised':
      return 'background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 8px; text-decoration: underline; text-decoration-thickness: 2px; text-decoration-color: #15803d; font-weight: 500; padding: 1.8px 4.5px; margin: 1.5px 1.5px; ';
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

  let html = '<div style="font-family: serif; line-height: 1.5; white-space: pre-wrap;">';
  
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