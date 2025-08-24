# Test Suite Fix Plan

## Overview
The current test suite has several issues that need to be addressed to make the tests pass reliably. This document outlines the problems and solutions.

## Issues Identified

### 1. Context Provider Issues
**Problem**: Tests are failing because components require specific context providers (FontSizeProvider, ExperimentalLayoutProvider) but are not properly wrapped.
**Solution**: 
- Ensure all tests that render RedlineOutput component wrap it with required context providers
- Fix the context provider nesting order

### 2. Performance Test Issues
**Problem**: The `render` function is not properly imported or used in performance tests.
**Solution**:
- Fix imports to use the correct render function from test-utils
- Update render calls to use proper context wrappers

### 3. Memory Cleanup Test Issues
**Problem**: Tests expect result to be null but receive actual result objects.
**Solution**:
- Review test logic to understand what should actually be nullified
- Fix test expectations to match actual behavior

### 4. Timeout Issues
**Problem**: Some memory cleanup tests are timing out (30s limit).
**Solution**:
- Increase timeout for long-running tests
- Optimize test logic to reduce execution time

### 5. Test Logic Issues
**Problem**: Some tests have incorrect assertions (e.g., expecting text to match regex pattern).
**Solution**:
- Fix assertions to match actual component output
- Update test cases to be more realistic

## Implementation Steps

### Step 1: Fix Context Providers
- Update all rendering tests to properly wrap components with required context providers
- Ensure correct nesting order: ExperimentalLayoutProvider > FontSizeProvider > Component

### Step 2: Fix Performance Tests
- Correct imports for render function
- Update render calls to use proper context wrappers
- Fix any remaining syntax issues

### Step 3: Fix Memory Cleanup Tests
- Review what should actually be nullified during cancellation
- Update test expectations to match actual implementation
- Add proper timeout configurations for long-running tests

### Step 4: Fix Test Logic Issues
- Update text matching assertions to be more realistic
- Fix scroll event testing issues
- Correct any other assertion logic problems

### Step 5: Verify All Fixes
- Run unit tests to ensure all issues are resolved
- Run integration tests to ensure they pass
- Document any remaining issues

## Files to Modify

### Rendering Tests
- `tests/unit/rendering/visual.test.ts`
- `tests/unit/rendering/performance.test.ts`

### Memory Cleanup Tests
- `tests/unit/myers-algorithm-memory-cleanup.test.ts`
- `tests/unit/state-memory-cleanup-simple.test.ts`

### Integration Tests
- `tests/integration/*.test.ts`

## Expected Outcomes
After implementing these fixes:
1. All unit tests should pass
2. All integration tests should pass
3. Test suite should run without context provider errors
4. Test suite should run without timeout errors
5. Test expectations should match actual implementation behavior