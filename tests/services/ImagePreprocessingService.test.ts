import { ImagePreprocessingService } from '../../src/services/ImagePreprocessingService';
import { PreprocessingConfig } from '../types/ocr-types';

describe('ImagePreprocessingService', () => {
  let service: ImagePreprocessingService;

  beforeEach(() => {
    service = new ImagePreprocessingService();
  });

  afterEach(() => {
    // Clean up any created canvas elements
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => canvas.remove());
  });

  describe('createCanvas', () => {
    it('should create canvas with correct dimensions', () => {
      const canvas = ImagePreprocessingService.createCanvas(800, 600);
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
    });

    it('should handle zero dimensions gracefully', () => {
      const canvas = ImagePreprocessingService.createCanvas(0, 0);
      expect(canvas.width).toBe(0);
      expect(canvas.height).toBe(0);
    });
  });

  describe('applyGrayscale', () => {
    it('should convert colored image to grayscale', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      // Fill with red color
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 100, 100);
      
      const grayscaleCanvas = ImagePreprocessingService.applyGrayscale(canvas);
      
      // Check if pixel values are grayscale (R=G=B)
      const imageData = grayscaleCanvas.getContext('2d')!.getImageData(0, 0, 1, 1);
      const [r, g, b] = [imageData.data[0], imageData.data[1], imageData.data[2]];
      expect(r).toBe(g);
      expect(g).toBe(b);
    });

    it('should handle already grayscale images', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      // Fill with grayscale
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 100, 100);
      
      const grayscaleCanvas = ImagePreprocessingService.applyGrayscale(canvas);
      
      // Should remain the same
      const originalData = ctx.getImageData(0, 0, 1, 1);
      const grayscaleData = grayscaleCanvas.getContext('2d')!.getImageData(0, 0, 1, 1);
      expect(originalData.data).toEqual(grayscaleData.data);
    });
  });

  describe('applyAdaptiveThreshold', () => {
    it('should apply adaptive threshold to image', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      // Create test pattern
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#000000';
      ctx.fillRect(10, 10, 80, 80);
      
      const thresholdCanvas = ImagePreprocessingService.applyAdaptiveThreshold(canvas, 128);
      
      expect(thresholdCanvas.width).toBe(100);
      expect(thresholdCanvas.height).toBe(100);
    });

    it('should handle different threshold values', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 100, 100);
      
      const lowThreshold = ImagePreprocessingService.applyAdaptiveThreshold(canvas, 64);
      const highThreshold = ImagePreprocessingService.applyAdaptiveThreshold(canvas, 192);
      
      expect(lowThreshold).toBeDefined();
      expect(highThreshold).toBeDefined();
    });
  });

  describe('applyNoiseReduction', () => {
    it('should reduce noise in image', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      // Create noisy pattern
      for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 100; j++) {
          const color = Math.random() > 0.5 ? 255 : 0;
          ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
          ctx.fillRect(i, j, 1, 1);
        }
      }
      
      const denoisedCanvas = ImagePreprocessingService.applyNoiseReduction(canvas);
      
      expect(denoisedCanvas.width).toBe(100);
      expect(denoisedCanvas.height).toBe(100);
    });
  });

  describe('applyContrastEnhancement', () => {
    it('should enhance contrast of image', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      // Fill with low contrast
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(0, 0, 100, 100);
      
      const enhancedCanvas = ImagePreprocessingService.applyContrastEnhancement(canvas, 1.5);
      
      expect(enhancedCanvas.width).toBe(100);
      expect(enhancedCanvas.height).toBe(100);
    });

    it('should handle different contrast factors', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 100, 100);
      
      const lowContrast = ImagePreprocessingService.applyContrastEnhancement(canvas, 0.5);
      const highContrast = ImagePreprocessingService.applyContrastEnhancement(canvas, 2.0);
      
      expect(lowContrast).toBeDefined();
      expect(highContrast).toBeDefined();
    });
  });

  describe('applyGaussianBlur', () => {
    it('should apply gaussian blur to image', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 100, 100);
      
      const blurredCanvas = ImagePreprocessingService.applyGaussianBlur(canvas, 3);
      
      expect(blurredCanvas.width).toBe(100);
      expect(blurredCanvas.height).toBe(100);
    });
  });

  describe('applySharpen', () => {
    it('should sharpen image edges', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 100, 100);
      
      const sharpenedCanvas = ImagePreprocessingService.applySharpen(canvas, 1.0);
      
      expect(sharpenedCanvas.width).toBe(100);
      expect(sharpenedCanvas.height).toBe(100);
    });
  });

  describe('resizeImage', () => {
    it('should resize image to specified dimensions', async () => {
      const canvas = ImagePreprocessingService.createCanvas(200, 150);
      
      const resizedCanvas = ImagePreprocessingService.resizeImage(canvas, 100, 75);
      
      expect(resizedCanvas.width).toBe(100);
      expect(resizedCanvas.height).toBe(75);
    });

    it('should handle upscaling', async () => {
      const canvas = ImagePreprocessingService.createCanvas(50, 50);
      
      const resizedCanvas = ImagePreprocessingService.resizeImage(canvas, 100, 100);
      
      expect(resizedCanvas.width).toBe(100);
      expect(resizedCanvas.height).toBe(100);
    });

    it('should handle same dimensions', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      
      const resizedCanvas = ImagePreprocessingService.resizeImage(canvas, 100, 100);
      
      expect(resizedCanvas.width).toBe(100);
      expect(resizedCanvas.height).toBe(100);
    });
  });

  describe('preprocessImage', () => {
    it('should apply all specified preprocessing steps', async () => {
      const config: PreprocessingConfig = {
        grayscale: true,
        denoise: true,
        contrast: true,
        sharpen: true,
        resize: 1.5,
        rotate: 0
      };

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock FileReader and canvas creation
      const mockCanvas = ImagePreprocessingService.createCanvas(100, 100);
      const mockCtx = mockCanvas.getContext('2d')!;
      mockCtx.fillStyle = '#000000';
      mockCtx.fillRect(0, 0, 100, 100);

      // Mock URL.createObjectURL
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = jest.fn(() => 'mock-url');

      // Mock Image constructor
      const mockImage = { 
        src: '', 
        width: 100, 
        height: 100,
        onload: null as any,
        onerror: null as any
      };
      
      const originalImage = global.Image;
      global.Image = jest.fn(() => mockImage) as any;

      try {
        // Simulate image loading
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 0);

        const result = await ImagePreprocessingService.preprocessImage(mockFile, config);
        
        expect(result.processedImage).toBeDefined();
        expect(result.appliedFilters).toContain('grayscale');
        expect(result.appliedFilters).toContain('denoise');
        expect(result.appliedFilters).toContain('contrast');
        expect(result.appliedFilters).toContain('sharpen');
        expect(result.appliedFilters).toContain('resize');
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        global.Image = originalImage;
      }
    });

    it('should handle empty configuration', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock FileReader and canvas creation
      const mockCanvas = ImagePreprocessingService.createCanvas(100, 100);
      const mockCtx = mockCanvas.getContext('2d')!;
      mockCtx.fillStyle = '#000000';
      mockCtx.fillRect(0, 0, 100, 100);

      // Mock URL.createObjectURL
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = jest.fn(() => 'mock-url');

      // Mock Image constructor
      const mockImage = { 
        src: '', 
        width: 100, 
        height: 100,
        onload: null as any,
        onerror: null as any
      };
      
      const originalImage = global.Image;
      global.Image = jest.fn(() => mockImage) as any;

      try {
        // Simulate image loading
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 0);

        const result = await ImagePreprocessingService.preprocessImage(mockFile, {});
        
        expect(result.processedImage).toBeDefined();
        expect(result.appliedFilters).toEqual([]);
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        global.Image = originalImage;
      }
    });

    it('should handle file loading errors', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock URL.createObjectURL
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = jest.fn(() => 'mock-url');

      // Mock Image constructor with error
      const mockImage = { 
        src: '', 
        width: 100, 
        height: 100,
        onload: null as any,
        onerror: null as any
      };
      
      const originalImage = global.Image;
      global.Image = jest.fn(() => mockImage) as any;

      try {
        // Simulate image loading error
        setTimeout(() => {
          if (mockImage.onerror) mockImage.onerror(new Error('Load error'));
        }, 0);

        await expect(ImagePreprocessingService.preprocessImage(mockFile, {}))
          .rejects.toThrow('Failed to load image');
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        global.Image = originalImage;
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very small images', async () => {
      const canvas = ImagePreprocessingService.createCanvas(1, 1);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1, 1);
      
      const resized = ImagePreprocessingService.resizeImage(canvas, 10, 10);
      expect(resized.width).toBe(10);
      expect(resized.height).toBe(10);
    });

    it('should handle very large images', async () => {
      const canvas = ImagePreprocessingService.createCanvas(5000, 5000);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 5000, 5000);
      
      const resized = ImagePreprocessingService.resizeImage(canvas, 1000, 1000);
      expect(resized.width).toBe(1000);
      expect(resized.height).toBe(1000);
    });

    it('should handle transparent images', async () => {
      const canvas = ImagePreprocessingService.createCanvas(100, 100);
      const ctx = canvas.getContext('2d')!;
      
      // Create transparent image
      const imageData = ctx.createImageData(100, 100);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i + 3] = 0; // Alpha = 0 (transparent)
      }
      ctx.putImageData(imageData, 0, 0);
      
      const grayscaleCanvas = ImagePreprocessingService.applyGrayscale(canvas);
      expect(grayscaleCanvas.width).toBe(100);
      expect(grayscaleCanvas.height).toBe(100);
    });
  });
});