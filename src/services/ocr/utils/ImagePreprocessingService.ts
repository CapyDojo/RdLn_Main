/**
 * Image Preprocessing Service for OCR Optimization
 * 
 * Provides comprehensive image preprocessing capabilities to improve OCR accuracy:
 * - Adaptive thresholding for better text/background separation
 * - Noise reduction to eliminate artifacts
 * - Contrast enhancement for clearer text
 * - Gaussian blur for smoothing
 * - Edge sharpening for text clarity
 * - Grayscale conversion for consistent processing
 * 
 * Uses Canvas API for efficient image manipulation in browser environments.
 */

export interface PreprocessingOptions {
  // Adaptive thresholding
  enableThresholding?: boolean;
  thresholdBlockSize?: number; // Must be odd number >= 3
  thresholdConstant?: number; // Usually between -10 and 10
  
  // Noise reduction
  enableDenoising?: boolean;
  denoiseStrength?: number; // 0-100, higher = more aggressive
  
  // Contrast enhancement
  enableContrastEnhancement?: boolean;
  contrastFactor?: number; // 1.0 = no change, >1.0 = increase contrast
  
  // Gaussian blur for noise reduction
  enableGaussianBlur?: boolean;
  blurRadius?: number; // 0-5, typically 1-2 for text
  
  // Edge sharpening
  enableSharpening?: boolean;
  sharpenStrength?: number; // 0-5, typically 1-2
  
  // Grayscale conversion
  enableGrayscale?: boolean;
  
  // Resize for better OCR (if image is too large or too small)
  enableResize?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface PreprocessingResult {
  processedImage: Blob;
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
  appliedFilters: string[];
  processingTime: number;
}

export class ImagePreprocessingService {
  private static readonly DEFAULT_OPTIONS: PreprocessingOptions = {
    enableThresholding: true,
    thresholdBlockSize: 15,
    thresholdConstant: 2,
    enableDenoising: true,
    denoiseStrength: 30,
    enableContrastEnhancement: true,
    contrastFactor: 1.2,
    enableGaussianBlur: true,
    blurRadius: 1,
    enableSharpening: true,
    sharpenStrength: 1.5,
    enableGrayscale: true,
    enableResize: true,
    maxWidth: 2000,
    maxHeight: 2000,
    minWidth: 300,
    minHeight: 300
  };

  /**
   * Preprocess image for OCR using specified options
   */
  public static async preprocessImage(
    imageFile: File | Blob,
    options: PreprocessingOptions = {}
  ): Promise<PreprocessingResult> {
    const startTime = performance.now();
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const appliedFilters: string[] = [];

    try {
      // Convert Blob to Image
      const image = await this.blobToImage(imageFile);
      const originalSize = { width: image.width, height: image.height };

      // Create canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas dimensions
      let { width, height } = originalSize;
      
      // Resize if needed
      if (mergedOptions.enableResize) {
        const resizeResult = this.calculateOptimalSize(
          width, 
          height, 
          mergedOptions.maxWidth!, 
          mergedOptions.maxHeight!,
          mergedOptions.minWidth!,
          mergedOptions.minHeight!
        );
        width = resizeResult.width;
        height = resizeResult.height;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image to canvas
      ctx.drawImage(image, 0, 0, width, height);

      // Get image data for processing
      let imageData = ctx.getImageData(0, 0, width, height);

      // Apply preprocessing filters
      if (mergedOptions.enableGrayscale) {
        imageData = this.applyGrayscale(imageData);
        appliedFilters.push('grayscale');
      }

      if (mergedOptions.enableContrastEnhancement) {
        imageData = this.applyContrastEnhancement(imageData, mergedOptions.contrastFactor!);
        appliedFilters.push('contrast-enhancement');
      }

      if (mergedOptions.enableDenoising) {
        imageData = this.applyDenoising(imageData, mergedOptions.denoiseStrength!);
        appliedFilters.push('denoising');
      }

      if (mergedOptions.enableGaussianBlur) {
        imageData = this.applyGaussianBlur(imageData, mergedOptions.blurRadius!);
        appliedFilters.push('gaussian-blur');
      }

      if (mergedOptions.enableSharpening) {
        imageData = this.applySharpening(imageData, mergedOptions.sharpenStrength!);
        appliedFilters.push('sharpening');
      }

      if (mergedOptions.enableThresholding) {
        imageData = this.applyAdaptiveThresholding(
          imageData, 
          mergedOptions.thresholdBlockSize!, 
          mergedOptions.thresholdConstant!
        );
        appliedFilters.push('adaptive-thresholding');
      }

      // Put processed image data back to canvas
      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to blob
      const processedBlob = await this.canvasToBlob(canvas);
      const processingTime = performance.now() - startTime;

      return {
        processedImage: processedBlob,
        originalSize,
        processedSize: { width, height },
        appliedFilters,
        processingTime
      };

    } catch (error) {
      console.error('Image preprocessing failed:', error);
      throw new Error(`Image preprocessing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Blob/File to Image element
   */
  private static async blobToImage(imageFile: File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Convert canvas to Blob
   */
  private static async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png', 0.95);
    });
  }

  /**
   * Calculate optimal image size while maintaining aspect ratio
   */
  private static calculateOptimalSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    minWidth: number,
    minHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Scale down if too large
    if (width > maxWidth || height > maxHeight) {
      const scale = Math.min(maxWidth / width, maxHeight / height);
      width *= scale;
      height *= scale;
    }

    // Scale up if too small
    if (width < minWidth || height < minHeight) {
      const scale = Math.max(minWidth / width, minHeight / height);
      width *= scale;
      height *= scale;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Convert image to grayscale
   */
  private static applyGrayscale(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    return imageData;
  }

  /**
   * Enhance contrast using histogram equalization
   */
  private static applyContrastEnhancement(imageData: ImageData, factor: number): ImageData {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);
    
    // Calculate histogram
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }

    // Calculate cumulative distribution
    const cdf = new Array(256).fill(0);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i];
    }

    // Create lookup table
    const lookup = new Array(256);
    const totalPixels = data.length / 4;
    for (let i = 0; i < 256; i++) {
      lookup[i] = Math.round((cdf[i] / totalPixels) * 255 * factor);
      lookup[i] = Math.max(0, Math.min(255, lookup[i]));
    }

    // Apply lookup table
    for (let i = 0; i < data.length; i += 4) {
      data[i] = lookup[data[i]];
      data[i + 1] = lookup[data[i + 1]];
      data[i + 2] = lookup[data[i + 2]];
    }

    return imageData;
  }

  /**
   * Apply adaptive thresholding (Otsu's method approximation)
   */
  private static applyAdaptiveThresholding(
    imageData: ImageData, 
    blockSize: number, 
    constant: number
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Ensure blockSize is odd and >= 3
    blockSize = Math.max(3, blockSize % 2 === 0 ? blockSize + 1 : blockSize);
    const halfBlock = Math.floor(blockSize / 2);

    const output = new ImageData(width, height);
    const outputData = output.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;

        // Calculate local mean
        for (let dy = -halfBlock; dy <= halfBlock; dy++) {
          for (let dx = -halfBlock; dx <= halfBlock; dx++) {
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const idx = (ny * width + nx) * 4;
            sum += data[idx];
            count++;
          }
        }

        const threshold = (sum / count) - constant;
        const idx = (y * width + x) * 4;
        const value = data[idx];
        const binary = value < threshold ? 0 : 255;

        outputData[idx] = binary;
        outputData[idx + 1] = binary;
        outputData[idx + 2] = binary;
        outputData[idx + 3] = 255;
      }
    }

    return output;
  }

  /**
   * Apply denoising using median filter
   */
  private static applyDenoising(imageData: ImageData, strength: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const radius = Math.max(1, Math.min(3, Math.round(strength / 30)));

    const output = new ImageData(width, height);
    const outputData = output.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const values = [];
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const idx = (ny * width + nx) * 4;
            values.push(data[idx]);
          }
        }

        values.sort((a, b) => a - b);
        const median = values[Math.floor(values.length / 2)];

        const idx = (y * width + x) * 4;
        outputData[idx] = median;
        outputData[idx + 1] = median;
        outputData[idx + 2] = median;
        outputData[idx + 3] = 255;
      }
    }

    return output;
  }

  /**
   * Apply Gaussian blur for noise reduction
   */
  private static applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Simple 3x3 Gaussian kernel
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16;

    const output = new ImageData(width, height);
    const outputData = output.data;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            sum += data[idx] * kernel[ky + 1][kx + 1];
          }
        }

        const value = Math.round(sum / kernelSum);
        const idx = (y * width + x) * 4;
        outputData[idx] = value;
        outputData[idx + 1] = value;
        outputData[idx + 2] = value;
        outputData[idx + 3] = 255;
      }
    }

    return output;
  }

  /**
   * Apply sharpening using unsharp mask
   */
  private static applySharpening(imageData: ImageData, strength: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Sharpening kernel
    const kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ];

    const output = new ImageData(width, height);
    const outputData = output.data;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            sum += data[idx] * kernel[ky + 1][kx + 1];
          }
        }

        const value = Math.round(sum * strength);
        const idx = (y * width + x) * 4;
        outputData[idx] = Math.max(0, Math.min(255, value));
        outputData[idx + 1] = Math.max(0, Math.min(255, value));
        outputData[idx + 2] = Math.max(0, Math.min(255, value));
        outputData[idx + 3] = 255;
      }
    }

    return output;
  }
}