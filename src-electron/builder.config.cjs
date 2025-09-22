/**
 * Electron Builder Configuration (CommonJS format)
 * Configured for full offline bundling with all assets
 */

const path = require('path');

module.exports = {
  appId: 'com.rdln.desktop',
  productName: 'RdLn',
  copyright: 'Copyright © 2025 RdLn Team',
  // Disable asar to avoid asar integrity update requiring winCodeSign
  asar: false,
  
  // Build directories
  directories: {
    output: 'dist-electron-new',
    buildResources: 'src-electron/build-resources'
  },
  
  // Files to include in the app
  files: [
    'dist/**/*',
    'src-electron/main.cjs',
    'src-electron/preload.cjs',
    'public/fonts/**/*',
    'public/tesseract/**/*',
    'public/tessdata/**/*',
    'public/images/**/*',
    'public/manifest.json',
    '!dist-electron',
    '!src-tauri',
    '!node_modules',
    '!tests',
    '!docs',
    '!scripts',
    '!*.md',
    '!vitest.config.ts',
    '!vite.config.ts'
  ],
  
  // Extra resources to copy
  extraResources: [
    {
      from: 'public/fonts',
      to: 'fonts'
    },
    {
      from: 'public/tesseract',
      to: 'tesseract'
    },
    {
      from: 'public/tessdata',
      to: 'tessdata'
    },
    {
      from: 'public/images',
      to: 'images'
    }
  ],
  
  // App metadata
  publish: null, // Disable auto-publish
  
  // Window configuration - multiple distribution options
  win: {
    target: [
      {
        target: 'nsis', // NSIS installer - professional and user-friendly
        arch: ['x64']
      },
      {
        target: 'dir', // Unpacked directory - for development/testing
        arch: ['x64']
      },
      {
        target: 'portable', // Single file version - for quick testing
        arch: ['x64']
      }
    ],
    icon: 'public/images/rdln-logo.png',
    requestedExecutionLevel: 'asInvoker'
  },

  // NSIS Installer Configuration
  nsis: {
    oneClick: false, // Allow user to choose install directory
    allowElevation: true, // Allow admin installation
    allowToChangeInstallationDirectory: true,
    // Note: Icons need to be .ico format, not .png
    // installerIcon: 'public/images/rdln-logo.ico',
    // uninstallerIcon: 'public/images/rdln-logo.ico',  
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'RdLn Document Comparison',
    displayLanguageSelector: false,
    runAfterFinish: true, // Launch app after installation
    menuCategory: 'Productivity',
    artifactName: 'RdLn-${version}-Setup.${ext}'
  },

  // Portable configuration
  portable: {
    artifactName: 'RdLn-${version}-Portable.${ext}'
  },
  
  
  // macOS configuration
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'public/images/rdln-logo.png',
    category: 'public.app-category.productivity',
    type: 'distribution'
  },
  
  // DMG configuration
  dmg: {
    title: '${productName} ${version}',
    icon: 'public/images/rdln-logo.png',
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ]
  },
  
  // Linux configuration
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      }
    ],
    icon: 'public/images/rdln-logo.png',
    category: 'Office',
    synopsis: 'Professional document comparison tool with OCR capabilities',
    description: 'Lightning-fast, professional-grade document comparison tool for corporate lawyers and legal professionals. Features advanced OCR for screenshot-to-text conversion and beautiful themes with glassmorphic effects.'
  },
  
  // Security settings
  protocols: [
    {
      name: 'RdLn Protocol',
      schemes: ['rdln']
    }
  ],
  
  // File associations
  fileAssociations: [
    {
      ext: 'rdln',
      name: 'RdLn Document',
      description: 'RdLn Document Comparison File',
      icon: 'public/images/rdln-logo.png'
    }
  ],
  
  // Compression settings for smaller bundle
  compression: 'maximum',
  
  // Ensure all assets are included
  asarUnpack: [
    'dist/**/*',
    'public/fonts/**/*',
    'public/tesseract/**/*',
    'public/tessdata/**/*'
  ],
  
  // Build artifacts
  artifactName: '${productName}-${version}-${arch}.${ext}',
  electronVersion: '37.2.5',
  
  // Build hooks
  beforeBuild: async (context) => {
    console.log('🔧 Running pre-build checks...');
    
    const fs = require('fs').promises;
    const requiredDirs = [
      'public/fonts',
      'public/tesseract', 
      'public/tessdata',
      'dist'
    ];
    
    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
        console.log(`✅ Found required directory: ${dir}`);
      } catch {
        console.warn(`⚠️  Missing directory: ${dir} - run download scripts first`);
      }
    }
  },
  
  afterSign: (context) => {
    console.log('✅ Build completed successfully');
    console.log(`📦 Output directory: ${context.outDir}`);
  }
};
