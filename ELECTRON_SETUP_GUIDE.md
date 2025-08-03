# Electron Setup Guide - Full Offline Bundle

This guide explains how to build RdLn as an Electron desktop application with complete offline functionality, including all fonts and OCR language files.

## 🎯 What This Setup Provides

✅ **Complete Offline Functionality** - No internet required  
✅ **All Google Fonts Bundled** - Professional typography offline  
✅ **50+ OCR Languages** - Full Tesseract.js language support  
✅ **Native File Drop** - Drag & drop PNG files from Windows Explorer  
✅ **Cross-Platform Builds** - Windows, macOS, Linux support  
✅ **Tauri Compatibility** - Both build systems coexist peacefully  

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
npm run setup:electron
```

### Option 2: Manual Setup
```bash
# Install dependencies
npm install

# Download all assets
npm run download:all

# Start development
npm run electron:dev

# Build for production
npm run electron:build:win
```

## 📋 Available Commands

### Development
- `npm run electron:dev` - Start development server with Electron
- `npm run tauri:dev` - Start Tauri development (existing)

### Building
- `npm run electron:build` - Build for all platforms
- `npm run electron:build:win` - Build Windows executable (.exe)
- `npm run electron:build:mac` - Build macOS application (.dmg)
- `npm run electron:build:linux` - Build Linux packages (.AppImage, .deb)

### Asset Management
- `npm run download:fonts` - Download Google Fonts locally
- `npm run download:tesseract` - Download Tesseract OCR assets
- `npm run download:all` - Download all assets
- `npm run setup:electron` - Complete automated setup

## 📁 Directory Structure

```
├── src-electron/              # Electron-specific files
│   ├── main.js               # Main Electron process
│   ├── preload.js            # Secure API bridge
│   └── builder.config.js     # Build configuration
├── src-tauri/                # Tauri files (unchanged)
├── public/
│   ├── fonts/                # Local Google Fonts
│   │   ├── fonts.css         # Combined font styles
│   │   └── *.woff2           # Font files
│   ├── tesseract/            # Tesseract core files
│   │   ├── tesseract-core.wasm.js
│   │   └── worker.min.js
│   ├── tessdata/             # OCR language files
│   │   ├── eng.traineddata   # English
│   │   ├── chi_sim.traineddata # Chinese Simplified
│   │   └── [50+ other languages]
│   └── index-electron.html   # Electron-specific HTML
└── scripts/
    ├── download-fonts.js     # Font download script
    ├── download-tesseract-assets.js
    └── setup-electron.js     # Complete setup
```

## 🔧 How It Works

### Offline Asset Loading

**Fonts**: Local CSS file replaces Google Fonts CDN
```html
<!-- Before (CDN) -->
<link href="https://fonts.googleapis.com/css2?family=Inter..." rel="stylesheet">

<!-- After (Local) -->
<link rel="stylesheet" href="./fonts/fonts.css">
```

**OCR Assets**: Tesseract.js configured for local files
```javascript
// Automatic configuration in Electron
window.TESSERACT_CONFIG = {
  langPath: './tessdata/',
  corePath: './tesseract/',
  workerPath: './tesseract/worker.min.js'
};
```

### File Drop Integration

Electron's native file drop works seamlessly with your existing React components:

1. **Native Drop**: Files dropped onto Electron window
2. **Event Bridge**: Preload script converts to File objects  
3. **React Integration**: Dispatches custom events to TextInputPanel
4. **OCR Processing**: Uses local Tesseract assets

## 📊 Bundle Size

| Component | Size | Description |
|-----------|------|-------------|
| Fonts | ~2MB | Inter, Crimson Text, Libre Baskerville, Libertinus Math |
| Tesseract Core | ~5MB | WASM files and worker scripts |
| Language Files | ~200MB | 50+ language .traineddata files |
| **Total Bundle** | **~250MB** | Complete offline functionality |

## 🔍 Testing

### Development Testing
```bash
npm run electron:dev
```
1. App opens in Electron window
2. Drag PNG file from Windows Explorer
3. Verify OCR processing works offline
4. Test with different languages

### Production Testing
```bash
npm run electron:build:win
cd dist-electron
# Run the .exe file
```
1. Install/run the built executable
2. Disconnect internet
3. Test full functionality offline

## 🚨 Troubleshooting

### OCR Not Working
```bash
# Re-download Tesseract assets
npm run download:tesseract

# Verify files exist
ls public/tessdata/
ls public/tesseract/
```

### Fonts Not Loading
```bash
# Re-download fonts
npm run download:fonts

# Check fonts directory
ls public/fonts/
```

### Build Failures
```bash
# Clean and reinstall
rm -rf node_modules dist dist-electron
npm install
npm run setup:electron
```

### File Drop Not Working
- Ensure you're testing with PNG/JPG files
- Check browser console for file drop events
- Verify Electron preload script is loaded

## 🔄 Switching Between Tauri and Electron

Both build systems coexist without conflicts:

**Tauri Development**:
```bash
npm run tauri:dev    # Your existing setup
npm run tauri:build  # Your existing build
```

**Electron Development**:
```bash
npm run electron:dev    # New Electron setup
npm run electron:build # New Electron build
```

**Shared Resources**:
- React source code works identically
- OCR language files in `public/tessdata/` used by both
- No conflicts or interference

## 🎯 Production Deployment

### Windows Distribution
```bash
npm run electron:build:win
```
Creates:
- `RdLn-{version}-win32-x64.exe` (Installer)
- `RdLn-{version}-portable.exe` (Portable)

### Multi-Platform
```bash
npm run electron:build
```
Creates packages for all supported platforms.

## 📈 Performance

- **Cold Start**: ~3-5 seconds (due to asset loading)
- **OCR Speed**: Identical to web version
- **Memory Usage**: ~200-400MB (includes Chromium)
- **File Drop**: Instant response
- **Offline**: 100% functional without internet

## 🔒 Security

- **Sandboxed Renderer**: React app runs in isolated context
- **Secure Preload**: Limited API exposure via contextBridge
- **No Node Access**: Renderer has no direct Node.js access
- **CSP Compatible**: Works with existing Content Security Policy

## 🎉 Success Indicators

✅ Electron window opens on `npm run electron:dev`  
✅ App works identically to web version  
✅ File drag & drop from Explorer works  
✅ OCR processes images offline  
✅ All fonts load correctly offline  
✅ Production build creates working .exe  
✅ Tauri setup remains untouched  

Ready for beta testing with complete offline functionality!