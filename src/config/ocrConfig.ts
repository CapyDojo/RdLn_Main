import { LanguageOption, OCRLanguage, OCROptions, CacheConfiguration } from '../types/ocr-types';
import languagesData from '../data/ocr-languages.json';

export const SUPPORTED_LANGUAGES: LanguageOption[] = languagesData.supportedLanguages;
export const DETECTION_LANGUAGES: OCRLanguage[] = languagesData.detectionLanguages;
export const CACHE_CONFIGURATION: CacheConfiguration = languagesData.cacheConfiguration;

/** Image preprocessing configuration options */
export interface PreprocessingConfig {
  /** Enable/disable image preprocessing */
  enabled: boolean;
  /** Adaptive thresholding parameters */
  adaptiveThreshold: {
    enabled: boolean;
    blockSize: number; // Must be odd number >= 3
    C: number; // Constant subtracted from mean
  };
  /** Noise reduction parameters */
  noiseReduction: {
    enabled: boolean;
    kernelSize: number; // Kernel size for morphological operations
    iterations: number; // Number of iterations
  };
  /** Contrast enhancement parameters */
  contrastEnhancement: {
    enabled: boolean;
    alpha: number; // Contrast factor (1.0 = no change)
    beta: number; // Brightness factor (0 = no change)
  };
  /** Gaussian blur parameters */
  gaussianBlur: {
    enabled: boolean;
    kernelSize: number; // Must be odd number >= 3
    sigma: number; // Standard deviation
  };
  /** Edge sharpening parameters */
  edgeSharpening: {
    enabled: boolean;
    strength: number; // Sharpening strength (0.5-2.0)
  };
  /** Image resizing parameters */
  resize: {
    enabled: boolean;
    width: number;
    height: number;
    maintainAspectRatio: boolean;
  };
  /** Grayscale conversion */
  grayscale: {
    enabled: boolean;
  };
}

/** Default preprocessing configuration */
export const DEFAULT_PREPROCESSING_CONFIG: PreprocessingConfig = {
  enabled: true,
  adaptiveThreshold: {
    enabled: true,
    blockSize: 11,
    C: 2
  },
  noiseReduction: {
    enabled: true,
    kernelSize: 3,
    iterations: 1
  },
  contrastEnhancement: {
    enabled: true,
    alpha: 1.2,
    beta: 10
  },
  gaussianBlur: {
    enabled: false,
    kernelSize: 3,
    sigma: 1.0
  },
  edgeSharpening: {
    enabled: false,
    strength: 1.0
  },
  resize: {
    enabled: true,
    width: 1024,
    height: 1024,
    maintainAspectRatio: true
  },
  grayscale: {
    enabled: true
  }
};

/** Performance-optimized preprocessing configuration */
export const PERFORMANCE_PREPROCESSING_CONFIG: PreprocessingConfig = {
  enabled: true,
  adaptiveThreshold: {
    enabled: true,
    blockSize: 9,
    C: 2
  },
  noiseReduction: {
    enabled: false,
    kernelSize: 3,
    iterations: 1
  },
  contrastEnhancement: {
    enabled: true,
    alpha: 1.1,
    beta: 5
  },
  gaussianBlur: {
    enabled: false,
    kernelSize: 3,
    sigma: 1.0
  },
  edgeSharpening: {
    enabled: false,
    strength: 1.0
  },
  resize: {
    enabled: true,
    width: 800,
    height: 800,
    maintainAspectRatio: true
  },
  grayscale: {
    enabled: true
  }
};

/** Accuracy-focused preprocessing configuration */
export const ACCURACY_PREPROCESSING_CONFIG: PreprocessingConfig = {
  enabled: true,
  adaptiveThreshold: {
    enabled: true,
    blockSize: 15,
    C: 3
  },
  noiseReduction: {
    enabled: true,
    kernelSize: 5,
    iterations: 2
  },
  contrastEnhancement: {
    enabled: true,
    alpha: 1.3,
    beta: 15
  },
  gaussianBlur: {
    enabled: true,
    kernelSize: 5,
    sigma: 0.8
  },
  edgeSharpening: {
    enabled: true,
    strength: 1.2
  },
  resize: {
    enabled: true,
    width: 1200,
    height: 1200,
    maintainAspectRatio: true
  },
  grayscale: {
    enabled: true
  }
};
