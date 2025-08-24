# Test Suite Structure

This directory contains all tests for the RdLn application, organized by type and purpose.

## Directory Structure

- `unit/` - Unit tests for individual components, hooks, and functions
- `integration/` - Integration tests for service interactions and cross-component functionality
- `performance/` - Performance benchmarks and load testing
- `accuracy/` - OCR accuracy tests with various document types
- `e2e/` - End-to-end tests using Playwright
- `helpers/` - Shared test utilities and helper functions
- `fixtures/` - Test data, mock objects, and sample documents

## Test Categories

### Unit Tests (`unit/`)
Tests that focus on individual units of code in isolation. These tests should:
- Run quickly (typically under 100ms each)
- Mock external dependencies
- Focus on one specific functionality
- Be named `*.test.ts` or `*.spec.ts`

### Integration Tests (`integration/`)
Tests that verify interactions between multiple components or services. These tests:
- May interact with real or mocked external services
- Test workflows that span multiple units
- Verify data flow between components

### Performance Tests (`performance/`)
Tests that measure and validate performance characteristics:
- Execution time benchmarks
- Memory usage monitoring
- Load testing scenarios

### Accuracy Tests (`accuracy/`)
OCR-specific tests that validate text extraction accuracy:
- Different document types and formats
- Multi-language support
- Various quality levels

### End-to-End Tests (`e2e/`)
Full application flow tests using Playwright:
- User interaction scenarios
- Browser-based testing
- Real application workflows

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run performance tests only
npm run test:performance

# Run OCR accuracy tests only
npm run test:accuracy

# Run end-to-end tests
npm run test:e2e
```

## Test Utilities

Shared utilities in `helpers/` provide common testing functionality:
- Mock data generators
- Assertion helpers
- Performance measurement tools
- Test environment setup

## Test Fixtures

Sample data in `fixtures/` includes:
- Test documents in various formats
- Mock file objects
- Sample OCR results
- Configuration test cases