/**
 * Tesseract.js Performance Configuration
 * 
 * Centralized configuration for Tesseract.js performance parameters
 * Optimized for accuracy vs speed trade-offs based on document type
 */

export interface TesseractPerformanceConfig {
  // Page segmentation mode - affects layout detection accuracy
  tessedit_pageseg_mode: number;
  
  // OCR engine mode - affects recognition accuracy vs speed
  tessedit_ocr_engine_mode: number;
  
  // Minimum confidence threshold for character recognition
  tessedit_char_whitelist?: string;
  
  // Character blacklisting for performance optimization
  tessedit_char_blacklist?: string;
  
  // Enable/disable dictionary-based corrections
  tessedit_enable_dict_correction: boolean;
  
  // Minimum word confidence threshold
  tessedit_word_for_non_dict_word: number;
  
  // Maximum image size for processing (downscale large images)
  tessedit_max_image_size: number;
  
  // Enable/disable layout analysis for structured documents
  tessedit_do_invert: boolean;
  
  // Text line detection sensitivity
  textord_min_linesize: number;
  
  // Enable/disable block segmentation
  tessedit_pageseg_mode_auto: boolean;
}

// Performance-optimized configurations for different use cases
export const TESSERACT_PERFORMANCE_MODES = {
  // Fast mode - optimized for speed over accuracy
  FAST: {
    tessedit_pageseg_mode: 6, // Single uniform block of text (fastest)
    // tessedit_ocr_engine_mode: 3, // REMOVED: Must be set during worker initialization only
    tessedit_enable_dict_correction: false,
    tessedit_word_for_non_dict_word: 0.6,
    tessedit_max_image_size: 1024,
    tessedit_do_invert: false,
    textord_min_linesize: 2.5,
    tessedit_pageseg_mode_auto: false
  } as TesseractPerformanceConfig,

  // Balanced mode - good balance of speed and accuracy
  BALANCED: {
    tessedit_pageseg_mode: 3, // Automatic page segmentation without OSD
    // tessedit_ocr_engine_mode: 3, // REMOVED: Must be set during worker initialization only
    tessedit_enable_dict_correction: true,
    tessedit_word_for_non_dict_word: 0.7,
    tessedit_max_image_size: 2048,
    tessedit_do_invert: true,
    textord_min_linesize: 2.0,
    tessedit_pageseg_mode_auto: true
  } as TesseractPerformanceConfig,

  // Accurate mode - maximum accuracy for complex documents
  ACCURATE: {
    tessedit_pageseg_mode: 1, // Automatic page segmentation with OSD
    // tessedit_ocr_engine_mode: 3, // REMOVED: Must be set during worker initialization only
    tessedit_enable_dict_correction: true,
    tessedit_word_for_non_dict_word: 0.8,
    tessedit_max_image_size: 4096,
    tessedit_do_invert: true,
    textord_min_linesize: 1.5,
    tessedit_pageseg_mode_auto: true
  } as TesseractPerformanceConfig,

  // Document-specific modes
  DOCUMENT: {
    tessedit_pageseg_mode: 4, // Single column of text of variable sizes
    // tessedit_ocr_engine_mode: 1, // REMOVED: Must be set during worker initialization only
    tessedit_enable_dict_correction: true,
    tessedit_max_image_size: 2048,
    tessedit_do_invert: true,
    textord_min_linesize: 1.8
  } as TesseractPerformanceConfig,

  // Receipt/invoice specific
  RECEIPT: {
    tessedit_pageseg_mode: 6, // Single uniform block
    // tessedit_ocr_engine_mode: 1, // REMOVED: Must be set during worker initialization only
    tessedit_enable_dict_correction: true,
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz $,.:-/',
    tessedit_max_image_size: 1024,
    tessedit_do_invert: false,
    textord_min_linesize: 2.0
  } as TesseractPerformanceConfig
};

// Environment-specific optimizations
export const getTesseractPerformanceConfig = (useCase: keyof typeof TESSERACT_PERFORMANCE_MODES = 'BALANCED'): TesseractPerformanceConfig => {
  // Allow environment override via query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('tesseract_mode') as keyof typeof TESSERACT_PERFORMANCE_MODES;
  
  if (modeParam && TESSERACT_PERFORMANCE_MODES[modeParam]) {
    console.log(`🔧 Using Tesseract mode from URL: ${modeParam}`);
    return TESSERACT_PERFORMANCE_MODES[modeParam];
  }
  
  return TESSERACT_PERFORMANCE_MODES[useCase];
};

// Language-specific optimizations
export const LANGUAGE_OPTIMIZATIONS: Record<string, Partial<TesseractPerformanceConfig>> = {
  'eng': {
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:\'"-()[]{}',
    tessedit_enable_dict_correction: true
  },
  'chi_sim': {
    tessedit_pageseg_mode: 6, // Single block for Chinese characters
    tessedit_enable_dict_correction: false // Disable for Chinese
  },
  'jpn': {
    tessedit_pageseg_mode: 6, // Single block for Japanese characters
    tessedit_enable_dict_correction: false
  },
  'ara': {
    tessedit_pageseg_mode: 6, // Single block for Arabic
    tessedit_enable_dict_correction: false
  }
};