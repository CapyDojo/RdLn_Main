# RdLn™ Document Comparison Tool

*Professional-grade document comparison with modern glassmorphism UI*

## Copyright & Legal

**RdLn™** is a trademark of RdLn Team.  
**Copyright © 2025 RdLn Team. All rights reserved.**

**PROPRIETARY SOFTWARE** - This software is proprietary and confidential to RdLn Team. All rights are reserved.

Unauthorized copying, distribution, modification, or use of this software is strictly prohibited and may be unlawful. This software is provided "AS IS" without warranty of any kind, express or implied.

## Overview

RdLn™ is a sophisticated document comparison tool designed for legal professionals and organizations requiring precise document analysis. Built with React, TypeScript, and modern UI technologies, it provides client-side document processing with complete confidentiality.

## ✨ Latest Updates - Version 0.2.6

### SSMR Refactoring Program (Steps 1-7B) ✅
- **🏗️ COMPONENT MODULARIZATION**: Complete extraction of layout components for better performance
- **📱 MOBILE OPTIMIZATION**: Dedicated mobile and desktop layout components for enhanced customization
- **⚡ PERFORMANCE GAINS**: ~350 lines extracted from ComparisonInterface, reduced DOM complexity
- **🛡️ SSMR METHODOLOGY**: Safe, Step-by-step, Modular, Reversible approach with zero breaking changes
- **📊 MONITORING INTEGRATION**: Multi-layered performance tracking with memory usage monitoring

### Recent Updates - Version 0.2.5
- **🌊 Waterfall Theme Selector**: Elegant cascading hover effect with physics-based animations
- **🎨 AUTHENTIC PREVIEWS**: Theme cards display using actual colors and styling
- **✨ 3D ANIMATIONS**: Cards "waterfall down" with bounce physics and "roll back up" in reverse

## 🚀 Key Features

- **Unified Redlining**: Official production red/green color scheme across themes
- **Professional Document Comparison**: Myers algorithm-based diff engine optimized for legal documents
- **OCR Integration**: Multi-language optical character recognition with 50+ language support
- **Glassmorphism UI**: Modern, professional interface with consistent visual effects
- **Client-Side Processing**: Complete confidentiality with no server uploads
- **Performance Optimized**: Chunked rendering for large documents (500k+ characters)
- **System Protection**: Smart resource management prevents browser crashes

## 🏗️ Architecture

### Core Components
- **ComparisonInterface**: Main orchestration component (streamlined with extracted layouts)
- **DesktopInputLayout**: Desktop side-by-side input layout with shared resize handle
- **MobileInputLayout**: Mobile stacked input layout with vertical resize handle
- **ProcessingDisplay**: Modularized processing states with progress bars
- **OutputLayout**: RedlineOutput display with resize handle and stats
- **TextInputPanel**: Input areas with OCR and drag-drop support
- **RedlineOutput**: Chunked rendering for diff visualization
- **MyersAlgorithm**: Core comparison engine

### Visual Consistency
- **Unified DOM Structure**: All panels use identical component architecture
- **Background Normalization**: CSS rules ensure consistent glassmorphism effects
- **Chunk Optimization**: Streamlined rendering prevents compound glass effects

## 🛠️ Development

### First Clone Setup (Windows)
```powershell
# From the repository root
npm ci
npm run download:all
npm run copy:tesseract

# Start web development
npm run dev

# Or start Electron desktop development
npm run electron:dev

# Optional: install browsers for e2e tests
npx playwright install
```

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Windows / Electron Notes
- Prefer native Windows commands (PowerShell/Batch) for local tasks.
- Desktop development: `npm run electron:dev`.
- Windows packaging: `npm run electron:build:win`; app at `dist-electron-new/win-unpacked/RdLn.exe`.
- Tauri is on hold — avoid `npm run tauri:*` until re-enabled.

### Helpful Scripts
- `npm run check`: Runs lint + unit tests.
- `npm run check:strict`: Same as check, but fails on warnings.
- `npm run smoke`: Fast subset tests for pages/services (verbose).
- `npm run pack:win`: Windows Electron packaging shortcut.

### Development Guidelines
- **SSMR Approach**: Safe, Step-by-step, Modular, Reversible changes
- **Visual Consistency**: Maintain DOM structure parity between components
- **Performance First**: Optimize for large document handling
- **TypeScript**: Full type safety throughout the codebase
- **Tauri Status**: On hold. Use Electron paths for desktop development/builds.
- **Definition of Done**: See `AGENTS.md` → Definition of Done.

### AI-Assisted Development with Serena MCP

This project is configured to work with Serena MCP, an AI coding agent that provides semantic understanding of the codebase.

#### Quick Setup:
1. Ensure you have Python 3.12+ and uv installed
2. Run the configuration test: `python test-serena-config.py`
3. Start the server: `start-serena-server.bat`
4. Connect your MCP client to the server

See `SERENA-README.md` for detailed instructions and `SERENA-USAGE.md` for examples.

## 📚 Documentation

- `GLASS_PANEL_VISUAL_CONSISTENCY_FIX.md` - Detailed technical handoff
- `DEVELOPMENT_GUIDELINES.md` - Comprehensive development standards
- `CHANGELOG.md` - Complete version history
- `TESTING_README.md` - Testing procedures and frameworks
- `AGENTS.md` - Repository Guidelines (contributor guide)
- `docs/DevRules/Agent_Rules.md` - Agent rules (mandatory)
- `docs/DevRules/DEVELOPMENT_GUIDELINES.md` - Dev rules (mandatory)

## 🎯 Production Ready

✅ **Visual Consistency**: All panels display identical glassmorphism effects  
✅ **Performance Optimized**: Handles enterprise-scale documents efficiently  
✅ **Error Handling**: Robust error boundaries and graceful degradation  
✅ **TypeScript**: Zero compilation errors, full type safety  
✅ **Cross-Browser**: Compatible with modern browsers  

---

## License

This project is proprietary software owned by RdLn Team. See the [LICENSE](LICENSE) file for full terms and conditions.

## Trademarks

RdLn™ is a trademark of RdLn Team.

---

*For technical support or contributions, please refer to the comprehensive documentation included in this repository.*
