/**
 * Test utilities for image preprocessing testing
 */

/**
 * Creates a mock canvas with test image data
 */
export function createTestCanvas(width: number, height: number, color: string = '#000000'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

/**
 * Creates a mock File object for testing
 */
export function createMockFile(name: string, type: string = 'image/jpeg'): File {
  return new File(['test-content'], name, { type });
}

/**
 * Creates a simple test image with text-like patterns
 */
export function createTextPatternCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Create background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  // Add some text-like patterns
  ctx.fillStyle = '#000000';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(10 + i * 20, 10, 15, 2);
    ctx.fillRect(10 + i * 20, 15, 2, 10);
  }
  
  return canvas;
}

/**
 * Creates a noisy image for testing denoising
 */
export function createNoisyCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Create noisy background
  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = Math.random() * 50;\    imageData.data[i] = 128 + noise;     // R
    imageData.data[i + 1] = 128 + noise; // G
    imageData.data[i + 2] = 128 + noise; // B
    imageData.data[i + 3] = 255;         // A
  }
  ctx.putImageData(imageData, 0, 0);
  
  return canvas;
}

/**
 * Creates a low contrast image for testing contrast enhancement
 */
export function createLowContrastCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Create low contrast pattern
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#B0B0B0';
  ctx.fillRect(width / 4, height / 4, width / 2, height / 2);
  
  return canvas;
}

/**
 * Creates a skewed image for testing rotation
 */
export function createSkewedCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI / 12); // 15 degrees
  ctx.fillStyle = '#000000';
  ctx.fillRect(-width / 4, -height / 4, width / 2, height / 2);
  ctx.restore();
  
  return canvas;
}

/**
 * Compares two canvas elements pixel by pixel
 */
export function compareCanvases(canvas1: HTMLCanvasElement, canvas2: HTMLCanvasElement, tolerance: number = 0): boolean {
  if (canvas1.width !== canvas2.width || canvas1.height !== canvas2.height) {
    return false;
  }
  
  const ctx1 = canvas1.getContext('2d')!;
  const ctx2 = canvas2.getContext('2d')!;
  
  const data1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  const data2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
  
  for (let i = 0; i < data1.data.length; i++) {
    if (Math.abs(data1.data[i] - data2.data[i]) > tolerance) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calculates image statistics for testing
 */
export function getImageStats(canvas: HTMLCanvasElement): {
  brightness: number;
  contrast: number;
  entropy: number;
} {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  const histogram = new Array(256).fill(0);
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
    totalBrightness += brightness;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    histogram[Math.floor(brightness)]++;
  }
  
  const pixelCount = imageData.data.length / 4;
  const avgBrightness = totalBrightness / pixelCount;
  const contrast = maxBrightness - minBrightness;
  
  // Calculate entropy
  let entropy = 0;
  for (let i = 0; i < histogram.length; i++) {
    if (histogram[i] > 0) {
      const probability = histogram[i] / pixelCount;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return {
    brightness: avgBrightness,
    contrast,
    entropy
  };
}