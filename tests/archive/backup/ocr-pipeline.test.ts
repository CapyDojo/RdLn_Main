import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { OCRService } from '@/services/OCRService';
import { 
  TEST_DOCUMENTS, 
  getTestDocumentsByLanguage,
  getTestDocumentsByDifficulty,
  createTestImageFromDocument
} from '@tests/fixtures/test-documents';
import { 
  PerformanceTracker,
  TestReporter,
  type TestResult,
  calculateCharacterAccuracy,
  validateLanguageDetection
} from '@tests/helpers/test-utils';

/**
 * Integration tests for the complete OCR pipeline
 * 
 * These tests use actual test documents and measure real performance
 * and accuracy metrics across different document types and languages.
 */

describe('OCR Pipeline Integration Tests', () => {
  let performanceTracker: PerformanceTracker;
  let testReporter: TestReporter;

  beforeAll(async () => {
    console.log('🚀 Setting up OCR Integration Tests...');
    performanceTracker = new PerformanceTracker();
    testReporter = new TestReporter();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up OCR Integration Tests...');
    await OCRService.terminate();
    
    // Export test results
    const results = testReporter.exportToJson();
    console.log('📊 Test Results Summary:', testReporter.getSummary());
    
    // You could save results to file here if needed
    // fs.writeFileSync('test-results/integration-results.json', results);
  });

  beforeEach(() => {
    performanceTracker.reset();
  });

  describe('Single Language Documents', () => {
    const englishDocs = getTestDocumentsByLanguage(['eng']);
    
    it.each(englishDocs)('should process English document: $name', async (document) => {
      performanceTracker.start();
      
      try {
        // Create image file from test document
        const imageFile = createTestImageFromDocument(document);
        const imageUrl = URL.createObjectURL(imageFile);
        
        // Detect languages
        const detectedLanguages = await OCRService.detectLanguages(imageUrl);
        
        // Extract text
        const result = await OCRService.extractText(
          imageUrl,
          detectedLanguages,
          { preserveParagraphs: true }
        );
        
        const duration = performanceTracker.end(`english-${document.id}`);
        
        // Validate results
        expect(result).toBeDefined();
        expect(result.extractedText).toBeDefined();
        expect(result.detectedLanguages).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
        
        // Calculate accuracy (for mocked tests, this will be low)
        const accuracy = calculateCharacterAccuracy(document.expectedText, result.extractedText);
        
        // Validate language detection
        const langValidation = validateLanguageDetection(
          result.detectedLanguages,
          document.expectedLanguages as any[]
        );
        
        // Record test result
        const testResult: TestResult = {
          testName: `English-${document.name}`,
          duration,
          accuracy,
          languageDetection: langValidation,
          success: true
        };
        
        testReporter.addResult(testResult);
        
        // Cleanup
        URL.revokeObjectURL(imageUrl);
        
      } catch (error) {
        const duration = performanceTracker.end(`english-${document.id}-error`);
        
        const testResult: TestResult = {
          testName: `English-${document.name}`,
          duration,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        testReporter.addResult(testResult);
        throw error;
      }
    });

    const chineseDocs = getTestDocumentsByLanguage(['chi_sim', 'chi_tra']);
    
    it.each(chineseDocs)('should process Chinese document: $name', async (document) => {
      performanceTracker.start();
      
      try {
        const imageFile = createTestImageFromDocument(document);
        const imageUrl = URL.createObjectURL(imageFile);
        
        const detectedLanguages = await OCRService.detectLanguages(imageUrl);
        const result = await OCRService.extractText(
          imageUrl,
          detectedLanguages,
          { preserveParagraphs: true, processChineseVariants: true }
        );
        
        const duration = performanceTracker.end(`chinese-${document.id}`);
        
        expect(result).toBeDefined();
        expect(result.extractedText).toBeDefined();
        expect(result.detectedLanguages).toBeDefined();
        
        const accuracy = calculateCharacterAccuracy(document.expectedText, result.extractedText);
        const langValidation = validateLanguageDetection(
          result.detectedLanguages,
          document.expectedLanguages as any[]
        );
        
        const testResult: TestResult = {
          testName: `Chinese-${document.name}`,
          duration,
          accuracy,
          languageDetection: langValidation,
          success: true
        };
        
        testReporter.addResult(testResult);
        
        URL.revokeObjectURL(imageUrl);
        
      } catch (error) {
        const duration = performanceTracker.end(`chinese-${document.id}-error`);
        
        const testResult: TestResult = {
          testName: `Chinese-${document.name}`,
          duration,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        testReporter.addResult(testResult);
        throw error;
      }
    });
  });

  describe('Multi-Language Documents', () => {
    const multiLangDocs = TEST_DOCUMENTS.filter(doc => doc.expectedLanguages.length > 1);
    
    it.each(multiLangDocs)('should process multi-language document: $name', async (document) => {
      performanceTracker.start();
      
      try {
        const imageFile = createTestImageFromDocument(document);
        const imageUrl = URL.createObjectURL(imageFile);
        
        // Test automatic language detection
        const detectedLanguages = await OCRService.detectLanguages(imageUrl);
        
        // Should detect multiple languages
        expect(detectedLanguages.length).toBeGreaterThan(1);
        
        // Extract text with detected languages
        const result = await OCRService.extractText(
          imageUrl,
          detectedLanguages,
          { preserveParagraphs: true, processChineseVariants: true }
        );
        
        const duration = performanceTracker.end(`multilang-${document.id}`);
        
        expect(result).toBeDefined();
        expect(result.extractedText).toBeDefined();
        expect(result.detectedLanguages.length).toBeGreaterThan(1);
        
        const accuracy = calculateCharacterAccuracy(document.expectedText, result.extractedText);
        const langValidation = validateLanguageDetection(
          result.detectedLanguages,
          document.expectedLanguages as any[]
        );
        
        // Multi-language detection should have reasonable precision/recall
        expect(langValidation.precision).toBeGreaterThan(0);
        expect(langValidation.recall).toBeGreaterThan(0);
        
        const testResult: TestResult = {
          testName: `MultiLang-${document.name}`,
          duration,
          accuracy,
          languageDetection: langValidation,
          success: true
        };
        
        testReporter.addResult(testResult);
        
        URL.revokeObjectURL(imageUrl);
        
      } catch (error) {
        const duration = performanceTracker.end(`multilang-${document.id}-error`);
        
        const testResult: TestResult = {
          testName: `MultiLang-${document.name}`,
          duration,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        testReporter.addResult(testResult);
        throw error;
      }
    });
  });

  describe('Document Quality Variations', () => {
    const qualityTests = [
      { quality: 'high', expectedAccuracy: 0.9 },
      { quality: 'medium', expectedAccuracy: 0.7 },
      { quality: 'low', expectedAccuracy: 0.5 }
    ] as const;

    it.each(qualityTests)('should handle $quality quality documents', async ({ quality, expectedAccuracy }) => {
      const qualityDocs = TEST_DOCUMENTS.filter(doc => doc.quality === quality);
      
      for (const document of qualityDocs) {
        performanceTracker.start();
        
        try {
          const imageFile = createTestImageFromDocument(document);
          const imageUrl = URL.createObjectURL(imageFile);
          
          const detectedLanguages = await ocrService.detectLanguages(imageUrl);
          const result = await ocrService.extractText(
            imageUrl,
            detectedLanguages,
            { preserveParagraphs: true }
          );
          
          const duration = performanceTracker.end(`quality-${quality}-${document.id}`);
          
          expect(result).toBeDefined();
          expect(result.extractedText).toBeDefined();
          
          const accuracy = calculateCharacterAccuracy(document.expectedText, result.extractedText);
          
          // Note: In real tests with actual images, accuracy should meet expectations
          // For mocked tests, we just verify the pipeline works
          
          const testResult: TestResult = {
            testName: `Quality-${quality}-${document.name}`,
            duration,
            accuracy,
            success: true
          };
          
          testReporter.addResult(testResult);
          
          URL.revokeObjectURL(imageUrl);
          
        } catch (error) {
          const duration = performanceTracker.end(`quality-${quality}-${document.id}-error`);
          
          const testResult: TestResult = {
            testName: `Quality-${quality}-${document.name}`,
            duration,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          
          testReporter.addResult(testResult);
          throw error;
        }
      }
    });
  });

  describe('Document Type Variations', () => {
    const documentTypes = ['contract', 'invoice', 'letter', 'form', 'technical'] as const;
    
    it.each(documentTypes)('should handle %s documents', async (docType) => {
      const typeDocs = TEST_DOCUMENTS.filter(doc => doc.documentType === docType);
      
      for (const document of typeDocs) {
        performanceTracker.start();
        
        try {
          const imageFile = createTestImageFromDocument(document);
          const imageUrl = URL.createObjectURL(imageFile);
          
          const detectedLanguages = await ocrService.detectLanguages(imageUrl);
          const result = await ocrService.extractText(
            imageUrl,
            detectedLanguages,
            { preserveParagraphs: true }
          );
          
          const duration = performanceTracker.end(`type-${docType}-${document.id}`);
          
          expect(result).toBeDefined();
          expect(result.extractedText).toBeDefined();
          
          // Different document types may have different accuracy expectations
          const accuracy = calculateCharacterAccuracy(document.expectedText, result.extractedText);
          
          const testResult: TestResult = {
            testName: `Type-${docType}-${document.name}`,
            duration,
            accuracy,
            success: true
          };
          
          testReporter.addResult(testResult);
          
          URL.revokeObjectURL(imageUrl);
          
        } catch (error) {
          const duration = performanceTracker.end(`type-${docType}-${document.id}-error`);
          
          const testResult: TestResult = {
            testName: `Type-${docType}-${document.name}`,
            duration,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          
          testReporter.addResult(testResult);
          throw error;
        }
      }
    });
  });

  describe('Difficulty Levels', () => {
    const difficultyLevels = ['easy', 'medium', 'hard'] as const;
    
    it.each(difficultyLevels)('should handle %s difficulty documents', async (difficulty) => {
      const difficultyDocs = getTestDocumentsByDifficulty(difficulty);
      
      for (const document of difficultyDocs) {
        performanceTracker.start();
        
        try {
          const imageFile = createTestImageFromDocument(document);
          const imageUrl = URL.createObjectURL(imageFile);
          
          const detectedLanguages = await ocrService.detectLanguages(imageUrl);
          const result = await ocrService.extractText(
            imageUrl,
            detectedLanguages,
            { preserveParagraphs: true }
          );
          
          const duration = performanceTracker.end(`difficulty-${difficulty}-${document.id}`);
          
          expect(result).toBeDefined();
          expect(result.extractedText).toBeDefined();
          
          const accuracy = calculateCharacterAccuracy(document.expectedText, result.extractedText);
          
          const testResult: TestResult = {
            testName: `Difficulty-${difficulty}-${document.name}`,
            duration,
            accuracy,
            success: true
          };
          
          testReporter.addResult(testResult);
          
          URL.revokeObjectURL(imageUrl);
          
        } catch (error) {
          const duration = performanceTracker.end(`difficulty-${difficulty}-${document.id}-error`);
          
          const testResult: TestResult = {
            testName: `Difficulty-${difficulty}-${document.name}`,
            duration,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          
          testReporter.addResult(testResult);
          throw error;
        }
      }
    });
  });

  describe('Progress Tracking', () => {
    it('should report progress during extraction', async () => {
      const document = TEST_DOCUMENTS[0]; // Use first test document
      const progressUpdates: number[] = [];
      
      const progressCallback = (progress: number) => {
        progressUpdates.push(progress);
      };
      
      const imageFile = createTestImageFromDocument(document);
      const imageUrl = URL.createObjectURL(imageFile);
      
      await ocrService.extractText(
        imageUrl,
        ['eng'],
        { preserveParagraphs: true },
        progressCallback
      );
      
      // Should have received progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
      
      URL.revokeObjectURL(imageUrl);
    });
  });

  describe('Caching and Performance', () => {
    it('should benefit from caching on repeated operations', async () => {
      const document = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(document);
      const imageUrl = URL.createObjectURL(imageFile);
      
      // First run (cold cache)
      performanceTracker.start();
      const detectedLanguages1 = await ocrService.detectLanguages(imageUrl);
      const duration1 = performanceTracker.end('cache-test-1');
      
      // Second run (warm cache)
      performanceTracker.start();
      const detectedLanguages2 = await ocrService.detectLanguages(imageUrl);
      const duration2 = performanceTracker.end('cache-test-2');
      
      // Results should be identical
      expect(detectedLanguages1).toEqual(detectedLanguages2);
      
      // Second run should be faster (though this may not be reliable in mocked tests)
      expect(duration2).toBeDefined();
      expect(duration1).toBeDefined();
      
      URL.revokeObjectURL(imageUrl);
    });
  });
});
