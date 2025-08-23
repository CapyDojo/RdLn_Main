# RdLn Development Commands

## Essential Development Commands

### Development Server
```bash
npm run dev                    # Start development server on localhost:5173
npm run preview               # Preview production build
```

### Building & Production
```bash
npm run build                 # Standard web build
npm run build:web             # Explicit web build for Netlify
```

### Testing Commands
```bash
npm run test                  # Run tests in watch mode
npm run test:run              # Run tests once
npm run test:coverage         # Run tests with coverage reports
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests with OCR config
npm run test:performance      # Performance benchmarking tests
npm run test:accuracy         # OCR accuracy validation tests
npm run test:ocr              # All OCR-specific tests
npm run test:real             # Real OCR tests without coverage
npm run test:e2e              # Playwright end-to-end tests
npm run test:e2e:ui           # Playwright with UI
```

### Code Quality
```bash
npm run lint                  # ESLint code quality checks
```

### Cross-Platform Builds
```bash
# Electron
npm run electron:dev          # Electron development mode
npm run electron:build        # Build Electron app (cross-platform)
npm run electron:build:win    # Windows-specific Electron build

# Tauri
npm run tauri:dev             # Tauri development mode
npm run tauri:build           # Build Tauri desktop app
```

### Asset Management
```bash
npm run download:fonts        # Download Google Fonts
npm run download:tesseract    # Download Tesseract OCR assets
npm run download:all          # Download all external assets
```

## Windows-Specific Commands
```cmd
# File operations
dir                          # List directory contents
md [folder]                  # Create directory
del [file]                   # Delete file
move [src] [dest]            # Move/rename file
copy [src] [dest]            # Copy file

# Git operations
git status                   # Check repository status
git add .                    # Stage all changes
git commit -m "message"      # Commit changes
git push                     # Push to remote
git pull                     # Pull from remote
git log --oneline            # View commit history

# Process management
taskkill /f /pid [PID]       # Kill process by PID
taskkill /f /im [name.exe]   # Kill process by name
```

## Development Workflow Commands
```bash
# Quick development cycle
npm run dev                  # 1. Start dev server
npm run lint                 # 2. Check code quality
npm run test:run            # 3. Run tests
npm run build               # 4. Build for production

# OCR development cycle
npm run test:ocr            # Test OCR functionality
npm run test:real           # Test with real images
npm run test:accuracy       # Validate OCR accuracy
```