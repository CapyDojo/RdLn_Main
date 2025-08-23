# Task Completion Checklist for RdLn

## Universal Pre-Completion Steps

### 1. Code Quality Checks
```bash
# Run linting to catch style and quality issues
npm run lint

# Check TypeScript compilation
npx tsc --noEmit
```

### 2. Testing Requirements
```bash
# Run appropriate test suite based on changes
npm run test:run              # Basic test suite
npm run test:unit            # Unit tests only
npm run test:integration     # OCR integration tests
npm run test:performance     # Performance impact
npm run test:accuracy        # OCR accuracy validation
```

### 3. Build Verification
```bash
# Ensure production build works
npm run build

# Test build locally
npm run preview
```

## Component-Specific Testing

### OCR-Related Changes
```bash
# Test OCR functionality with real images
npm run test:real

# Validate OCR accuracy
npm run test:accuracy

# Check language detection
npm run test:ocr
```

### UI/Layout Changes
- Test responsive behavior (desktop/mobile)
- Verify glassmorphism effects work
- Check theme compatibility across all 11+ themes
- Test resize handles and scroll synchronization

### Algorithm Changes
- **CRITICAL**: Never modify `src/algorithms/MyersAlgorithm.ts` without explicit approval
- Test with large documents (500k+ characters)
- Verify performance benchmarks
- Test chunked rendering

### Performance Changes
```bash
# Run performance benchmarks
npm run test:performance

# Monitor memory usage
npm run dev # Check browser dev tools
```

## Manual Testing Checklist

### Core Functionality
- [ ] Document comparison works with text input
- [ ] OCR processing works with image upload
- [ ] Results display correctly in RedlineOutput
- [ ] Themes switch properly
- [ ] Responsive layout works (desktop/mobile)
- [ ] Export functionality (DOCX, copying) works

### Performance Testing
- [ ] Large document handling (test with >100k characters)
- [ ] OCR progress indicators work
- [ ] Memory cleanup after operations
- [ ] No browser crashes or freezes
- [ ] Cancellation mechanisms work

### Cross-Platform Testing (if applicable)
- [ ] Electron build works
- [ ] Tauri build works
- [ ] Web deployment works

## Pre-Production Steps

### Remove Development Code
- Remove test components from production builds
- Disable debug logging
- Remove development-only features
- Check for console.log statements

### Documentation Updates
- Update CHANGELOG.md with changes
- Update relevant documentation files
- Verify README.md accuracy

### Git Workflow
```bash
# Follow naming convention: YYYYMMDD_TYPE_X_Description
git add .
git commit -m "YYYYMMDD_COMMIT_X_Description of changes"
git push
```

## Critical Components - Extra Care Required

### High-Risk Files (Require Special Attention)
- `src/algorithms/MyersAlgorithm.ts` - Core comparison engine
- `src/services/OCRService.ts` - OCR functionality
- `src/components/ComparisonInterface.tsx` - Main UI coordination
- `src/components/RedlineOutput.tsx` - Results display with refs
- Theme system files - Affect entire application

### Error Recovery Protocol
If issues arise:
1. **STOP** - No additional changes
2. **DOCUMENT** - Record exact error and changes made
3. **ROLLBACK** - Revert to last working state if needed
4. **COMMUNICATE** - Report status and seek guidance

## Success Criteria
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Production build succeeds
- [ ] Manual testing confirms functionality
- [ ] No performance regressions
- [ ] Documentation updated
- [ ] Changes follow SSMR methodology