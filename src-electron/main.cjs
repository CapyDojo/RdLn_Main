// PERFORMANCE PROFILING: Start timing the entire app startup
console.time('🚀 TOTAL-APP-STARTUP');
console.log('⏱️  STARTUP: Process started at', new Date().toISOString());

const { app, BrowserWindow, Menu, screen, ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

console.time('📦 MODULE-IMPORTS');
console.timeEnd('📦 MODULE-IMPORTS');

let mainWindow;

function createWindow() {
  console.time('🖥️  WINDOW-CREATION');
  console.log('⏱️  WINDOW: createWindow() called at', new Date().toISOString());
  
  // Get primary display dimensions
  console.time('📐 SCREEN-DETECTION');
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  console.timeEnd('📐 SCREEN-DETECTION');
  
  // Calculate window size - use 90% of screen width and full height minus taskbar
  const windowWidth = Math.min(1400, Math.floor(screenWidth * 0.9));
  const windowHeight = Math.floor(screenHeight * 0.95);
  
  // Create the browser window
  console.time('🏗️  BROWSERWINDOW-INIT');
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
      zoomFactor: 1.0
    },
    icon: path.join(__dirname, '../public/images/rdln-logo.png'),
    title: 'RdLn - Document Comparison Tool',
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });
  console.timeEnd('🏗️  BROWSERWINDOW-INIT');

  // Load the app
  console.time('📄 HTML-LOADING');
  console.log('⏱️  LOAD: Starting to load HTML at', new Date().toISOString());
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    const htmlPath = path.join(__dirname, '../dist/index-electron.html');
    console.log('⏱️  LOAD: Loading HTML from:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }

  // Track when DOM is ready
  mainWindow.webContents.once('dom-ready', () => {
    console.timeEnd('📄 HTML-LOADING');
    console.time('⚡ DOM-TO-READY-TO-SHOW');
    console.log('⏱️  DOM: DOM ready at', new Date().toISOString());
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.timeEnd('⚡ DOM-TO-READY-TO-SHOW');
    console.timeEnd('🖥️  WINDOW-CREATION');
    console.timeEnd('🚀 TOTAL-APP-STARTUP');
    console.log('✅ READY: Window visible at', new Date().toISOString());
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle file drops - Electron's built-in file drop support
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow local file protocol for dropped files
    if (parsedUrl.protocol === 'file:') {
      event.preventDefault();
      // Handle file drop via IPC
      const filePath = parsedUrl.pathname;
      if (filePath.match(/\.(png|jpg|jpeg|gif|bmp|webp|tiff)$/i)) {
        mainWindow.webContents.send('file-dropped', filePath);
      }
    }
  });

  // Enable zoom functionality
  mainWindow.webContents.on('dom-ready', () => {
    // Handle zoom with Ctrl+Scroll
    mainWindow.webContents.executeJavaScript(`
      let zoomLevel = 1.0;
      
      document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          
          const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
          zoomLevel = Math.max(0.25, Math.min(3.0, zoomLevel + zoomDelta));
          
          document.body.style.zoom = zoomLevel;
          console.log('Zoom level:', zoomLevel);
          
          // Notify renderer process about zoom change
          if (typeof electronAPI !== 'undefined' && electronAPI.notifyZoomChange) {
            electronAPI.notifyZoomChange(zoomLevel);
          }
        }
      }, { passive: false });
      
      // Handle keyboard zoom shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
          if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            zoomLevel = Math.min(3.0, zoomLevel + 0.1);
            document.body.style.zoom = zoomLevel;
            // Notify renderer process
            if (typeof electronAPI !== 'undefined' && electronAPI.notifyZoomChange) {
              electronAPI.notifyZoomChange(zoomLevel);
            }
          } else if (e.key === '-') {
            e.preventDefault();
            zoomLevel = Math.max(0.25, zoomLevel - 0.1);
            document.body.style.zoom = zoomLevel;
            // Notify renderer process
            if (typeof electronAPI !== 'undefined' && electronAPI.notifyZoomChange) {
              electronAPI.notifyZoomChange(zoomLevel);
            }
          } else if (e.key === '0') {
            e.preventDefault();
            zoomLevel = 1.0;
            document.body.style.zoom = zoomLevel;
            // Notify renderer process
            if (typeof electronAPI !== 'undefined' && electronAPI.notifyZoomChange) {
              electronAPI.notifyZoomChange(zoomLevel);
            }
          }
        }
      });
    `);
  });

  // Enable drag and drop
  mainWindow.webContents.on('dom-ready', () => {
    // Enable file drops
    mainWindow.webContents.executeJavaScript(`
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      
      document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => 
          /\\.(png|jpg|jpeg|gif|bmp|webp|tiff)$/i.test(file.name)
        );
        
        if (imageFiles.length > 0) {
          window.electronAPI.handleFileDrop(imageFiles[0].path);
        }
      });
    `);
  });
}

// App event handlers
console.time('🔧 APP-READY-WAIT');
console.log('⏱️  APP: Waiting for app.whenReady() at', new Date().toISOString());

app.whenReady().then(() => {
  console.timeEnd('🔧 APP-READY-WAIT');
  console.log('⏱️  APP: app.whenReady() fired at', new Date().toISOString());
  
  createWindow();

  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Create application menu (optional)
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Image...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // TODO: Implement file picker for images
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { 
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              zoomLevel = Math.min(3.0, zoomLevel + 0.1);
              document.body.style.zoom = zoomLevel;
            `);
          }
        },
        { 
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              zoomLevel = Math.max(0.25, zoomLevel - 0.1);
              document.body.style.zoom = zoomLevel;
            `);
          }
        },
        { 
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              zoomLevel = 1.0;
              document.body.style.zoom = zoomLevel;
            `);
          }
        },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for secure file operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    const fileType = `image/${path.extname(filePath).slice(1).toLowerCase()}`;
    
    return {
      buffer: Array.from(buffer), // Convert buffer to array for JSON serialization
      name: fileName,
      type: fileType
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-resource-path', (event, relativePath) => {
  if (isDev) {
    return path.join(process.cwd(), 'public', relativePath);
  } else {
    return path.join(process.resourcesPath, 'app', 'dist', relativePath);
  }
});

app.whenReady().then(() => {
  createMenu();
});