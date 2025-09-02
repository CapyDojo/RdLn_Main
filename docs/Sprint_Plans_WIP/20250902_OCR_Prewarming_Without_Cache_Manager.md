# OCR Prewarming Without Cache Manager
**Date**: September 2, 2025
**Author**: Qwen Code Assistant

## Executive Summary

This document details how to implement OCR prewarming without relying on the OCRCacheManager. This approach can be useful in scenarios where you want to minimize dependencies or have more direct control over the prewarming process.

## Implementation Approach

The key to prewarming without the cache manager is to directly use Tesseract.js's `createWorker` function during application initialization, storing the created workers in a simple cache structure.

## Direct Prewarming Implementation

### 1. Create a Simple Worker Cache

```typescript
// Simple worker cache outside of OCRCacheManager
class SimpleOCRCache {
  private static detectionWorker: Tesseract.Worker | null = null;
  private static languageWorkers: Map<string, Tesseract.Worker> = new Map();
  
  static setDetectionWorker(worker: Tesseract.Worker) {
    this.detectionWorker = worker;
  }
  
  static getDetectionWorker(): Tesseract.Worker | null {
    return this.detectionWorker;
  }
  
  static setLanguageWorker(languages: string[], worker: Tesseract.Worker) {
    const key = languages.sort().join('-');
    this.languageWorkers.set(key, worker);
  }
  
  static getLanguageWorker(languages: string[]): Tesseract.Worker | null {
    const key = languages.sort().join('-');
    return this.languageWorkers.get(key) || null;
  }
  
  static async terminateAll() {
    if (this.detectionWorker) {
      await this.detectionWorker.terminate();
    }
    
    for (const worker of this.languageWorkers.values()) {
      await worker.terminate();
    }
    
    this.detectionWorker = null;
    this.languageWorkers.clear();
  }
}
```

### 2. Prewarming Functions

```typescript
// Prewarming functions that don't depend on OCRCacheManager
async function prewarmDetectionWorker() {
  try {
    // Check if already prewarmed
    if (SimpleOCRCache.getDetectionWorker()) {
      console.log('🎯 Detection worker already prewarmed');
      return;
    }
    
    console.log('🔥 Prewarming detection worker...');
    
    // Create worker with OSD support for language detection
    const worker = await createWorker(['eng', 'osd'], 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`🔍 Detection worker progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    // Store in simple cache
    SimpleOCRCache.setDetectionWorker(worker);
    console.log('✅ Detection worker prewarmed successfully');
  } catch (error) {
    console.error('❌ Failed to prewarm detection worker:', error);
  }
}

async function prewarmLanguageWorker(languages: string[] = ['eng']) {
  try {
    // Check if already prewarmed
    if (SimpleOCRCache.getLanguageWorker(languages)) {
      console.log(`🎯 Language worker for ${languages.join(',')} already prewarmed`);
      return;
    }
    
    console.log(`🔥 Prewarming language worker for: ${languages.join(',')}`);
    
    // Create worker for specific languages
    const worker = await createWorker(languages, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`📖 Language worker progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    // Store in simple cache
    SimpleOCRCache.setLanguageWorker(languages, worker);
    console.log(`✅ Language worker for ${languages.join(',')} prewarmed successfully`);
  } catch (error) {
    console.error(`❌ Failed to prewarm language worker for ${languages.join(',')}:`, error);
  }
}
```

### 3. Integration with App Initialization

```typescript
// In your app initialization (e.g., in App.tsx or main.ts)
useEffect(() => {
  // Prewarm during app initialization
  const prewarmWorkers = async () => {
    // Prewarm detection worker for language detection
    await prewarmDetectionWorker();
    
    // Optionally prewarm common language workers
    await prewarmLanguageWorker(['eng']);
    // await prewarmLanguageWorker(['eng', 'chi_sim']); // For English+Chinese
  };
  
  prewarmWorkers();
  
  // Cleanup on app unmount
  return () => {
    SimpleOCRCache.terminateAll();
  };
}, []);
```

### 4. Using Prewarmed Workers

```typescript
// Modified OCR functions that use prewarmed workers
async function detectLanguageWithPrewarmedWorker(imageFile: File | Blob) {
  // Try to use prewarmed detection worker
  let worker = SimpleOCRCache.getDetectionWorker();
  
  if (!worker) {
    // Fallback to creating new worker if not prewarmed
    console.log('🔄 Creating new detection worker (not prewarmed)');
    worker = await createWorker(['eng', 'osd'], 1);
    SimpleOCRCache.setDetectionWorker(worker);
  }
  
  try {
    const result = await worker.detect(imageFile);
    return result;
  } catch (error) {
    // If prewarmed worker fails, try creating a new one
    console.warn('⚠️ Prewarmed detection worker failed, creating new one:', error);
    const newWorker = await createWorker(['eng', 'osd'], 1);
    SimpleOCRCache.setDetectionWorker(newWorker);
    return await newWorker.detect(imageFile);
  }
}

async function extractTextWithPrewarmedWorker(imageFile: File | Blob, languages: string[] = ['eng']) {
  // Try to use prewarmed language worker
  let worker = SimpleOCRCache.getLanguageWorker(languages);
  
  if (!worker) {
    // Fallback to creating new worker if not prewarmed
    console.log(`🔄 Creating new worker for languages: ${languages.join(',')}`);
    worker = await createWorker(languages, 1);
    SimpleOCRCache.setLanguageWorker(languages, worker);
  }
  
  try {
    const result = await worker.recognize(imageFile);
    return result.data.text;
  } catch (error) {
    // If prewarmed worker fails, try creating a new one
    console.warn(`⚠️ Prewarmed worker for ${languages.join(',')} failed, creating new one:`, error);
    const newWorker = await createWorker(languages, 1);
    SimpleOCRCache.setLanguageWorker(languages, newWorker);
    return await newWorker.recognize(imageFile).then(res => res.data.text);
  }
}
```

## Benefits of This Approach

1. **Independence**: No dependency on OCRCacheManager
2. **Control**: Direct control over worker creation and caching
3. **Simplicity**: Simpler implementation for basic prewarming needs
4. **Flexibility**: Easy to customize for specific use cases

## Considerations

1. **Limited Features**: This approach lacks advanced features of OCRCacheManager like:
   - Automatic cleanup of expired workers
   - Memory pressure detection
   - Progressive language loading
   - Error handling and fallbacks
   - Performance optimizations

2. **Maintenance**: You'll need to maintain the caching logic yourself

3. **Resource Management**: Without automatic cleanup, you need to be more careful about memory management

## Recommendation

While it's possible to implement prewarming without the cache manager, it's recommended to use OCRCacheManager when possible as it provides:
- Robust error handling
- Memory management
- Performance optimizations
- Progressive loading
- Cross-environment compatibility

The direct approach is suitable for:
- Simple applications with basic OCR needs
- Prototyping or proof-of-concept implementations
- Cases where you need maximum control over the process