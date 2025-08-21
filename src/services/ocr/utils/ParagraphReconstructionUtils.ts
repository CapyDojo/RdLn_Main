/**
 * Paragraph Reconstruction Utilities
 * 
 * Centralized utilities for paragraph reconstruction in OCR post-processing.
 * Consolidates redundant logic from OCRService and OCRTextCleanupService.
 * 
 * Features:
 * - Configurable reconstruction modes (intelligent, universal, gentle)
 * - Language-specific adaptations
 * - Conservatism levels for joining (strict, balanced, lenient)
 * - Special handling for legal documents
 * - Extensible for future ML integration
 */

import { OCRLanguage } from '../../types/ocr-types';

export interface ReconstructionOptions {
  mode: 'intelligent' | 'universal' | 'gentle';
  language: OCRLanguage;
  conservatismLevel: 'strict' | 'balanced' | 'lenient';
  isLegalDocument?: boolean;
}

export function reconstructParagraphs(text: string, options: ReconstructionOptions): string {
  const { mode, language, conservatismLevel, isLegalDocument = false } = options;
  const lines = text.split('\n');
  const result: string[] = [];
  let currentParagraph = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.length === 0) {
      if (currentParagraph.trim()) {
        result.push(currentParagraph.trim());
        currentParagraph = '';
      }
      continue;
    }

    const isNewPara = isNewParagraph(line, mode, isLegalDocument);
    if (isNewPara) {
      if (currentParagraph.trim()) {
        result.push(currentParagraph.trim());
      }
      currentParagraph = line;
      continue;
    }

    if (currentParagraph && shouldJoin(currentParagraph, line, mode, conservatismLevel, language)) {
      currentParagraph += (currentParagraph.endsWith('-') ? '' : ' ') + line;
    } else {
      if (currentParagraph.trim()) {
        result.push(currentParagraph.trim());
      }
      currentParagraph = line;
    }
  }

  if (currentParagraph.trim()) {
    result.push(currentParagraph.trim());
  }

  return finalCleanup(result.join('\n\n'));
}

function isNewParagraph(line: string, mode: string, isLegal: boolean): boolean {
  const commonStarters = [/^\d+\./, /^[A-Z]\./, /^\([a-z]\)/, /^\([0-9]+\)/];
  const legalStarters = [/^WHEREAS\b/i, /^NOW THEREFORE\b/i, /^IN WITNESS WHEREOF\b/i, /^Section\s+\d+/i, /^Article\s+\d+/i, /^Chapter\s+\d+/i];

  if (mode === 'gentle' || mode === 'universal') {
    return commonStarters.some(p => p.test(line)) || (isLegal && legalStarters.some(p => p.test(line)));
  }
  return [...commonStarters, ... (isLegal ? legalStarters : [])].some(p => p.test(line));
}

function shouldJoin(prev: string, current: string, mode: string, level: string, lang: OCRLanguage): boolean {
  if (isNewParagraph(current, mode, false)) return false;

  const joinIndicators = {
    strict: [/-$/, /,$/],
    balanced: [/-$/, /,$/, /\sand$/, /\sor$/],
    lenient: [/-$/, /,$/, /\sand$/, /\sor$/, /\sof$/, /\sto$/, /\sthe$/, /\sa$/, /\san$/, /\sin$/, /\sfor$/, /\swith$/, /\sby$/, /\sfrom$/, /\sthat$/, /\swhich$/, /\swho$/, /\swhere$/]
  };

  const indicators = joinIndicators[level];
  if (indicators.some(p => p.test(prev.trim()))) return true;

  if (/^[a-z]/.test(current)) return true;

  if (mode === 'gentle' && level === 'strict') return false;

  return false;
}

function finalCleanup(text: string): string {
  return text
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n\n')
    .map(para => para.trim())
    .filter(para => para.length > 0)
    .join('\n\n')
    .trim();
}