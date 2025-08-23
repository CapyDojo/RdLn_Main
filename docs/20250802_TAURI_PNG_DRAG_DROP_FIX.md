# Tauri PNG Drag and Drop Fix

## Issue Analysis

The PNG drag and drop functionality wasn't working in the Tauri build due to several issues:

1. **Missing File System Permissions**: Tauri capabilities didn't include `fs:default` permission
2. **Incorrect File Reading**: Code was trying to use `fetch` with `file://` protocol instead of Tauri FS API
3. **Missing File Drop Configuration**: Window configuration didn't have `fileDropEnabled: true`
4. **Incomplete API Imports**: Missing proper Tauri FS plugin import

## Fixes Applied

### 1. Updated Tauri Capabilities (`src-tauri/capabilities/main.json`)
```json
{
  "permissions": [
    "core:event:default",
    "core:window:default", 
    "core:app:default",
    "shell:default",
    "fs:default",        // ✅ Added for file system access
    "dialog:default"     // ✅ Added for file dialogs
  ]
}
```

### 2. Fixed File Drop Implementation (`src/components/TextInputPanel.tsx`)

**Before:**
```typescript
// Trying to use fetch with file:// protocol (doesn't work in Tauri)
const response = await fetch(`file://${imagePath}`);
const blob = await response.blob();
```

**After:**
```typescript
// Using Tauri invoke to call FS plugin
const fileBytes = await tauriInvoke('plugin:fs|read_file', { 
  path: imagePath 
});
const uint8Array = new Uint8Array(fileBytes);
const blob = new Blob([uint8Array], { 
  type: `image/${imagePath.split('.').pop()?.toLowerCase() || 'png'}` 
});
```

### 3. Tauri Window Configuration
**Note**: In Tauri v2, file drop is enabled by default when proper permissions are set. No additional window configuration needed.

### 4. Added File Upload Button Fallback
- Added a file input button as backup for users who prefer clicking
- Maintains same OCR processing workflow
- Provides better UX for accessibility

## Testing

### Manual Testing Steps:
1. **Build Tauri app**: `npm run tauri build` or `npm run tauri dev`
2. **Test drag and drop**: Drag a PNG file onto either input panel
3. **Test file button**: Click the image button in panel header to select file
4. **Verify OCR**: Confirm text extraction works properly

### Debug Script:
Run `test-tauri-drag-drop.js` in browser console to verify:
- Tauri environment detection
- API availability
- Event handler registration

## Expected Behavior

1. **Drag PNG file** onto input panel → OCR extracts text automatically
2. **Click image button** → File dialog opens → Select PNG → OCR processes
3. **Paste screenshot** → Existing clipboard OCR continues to work
4. **Error handling** → Clear error messages if file reading fails

## Technical Details

### File Drop Event Flow:
1. User drags PNG file onto window
2. Tauri emits `tauri://file-drop` event with file paths
3. Component filters for image files (`.png`, `.jpg`, etc.)
4. Uses `tauriInvoke('plugin:fs|read_file')` to read file as bytes
5. Converts to File object for OCR processing
6. Existing OCR workflow handles text extraction

### Supported Image Formats:
- PNG, JPG, JPEG, GIF, BMP, WEBP, TIFF

### Performance Tracking:
- `tauri_file_drop_success`: Successful file processing
- `tauri_drop_error`: File processing errors
- Integrates with existing OCR performance metrics

## Rollback Plan

If issues occur, revert these files:
1. `src-tauri/capabilities/main.json`
2. `src-tauri/tauri.conf.json` 
3. `src/components/TextInputPanel.tsx` (file drop section only)

The HTML5 drag and drop fallback will continue working in web mode.