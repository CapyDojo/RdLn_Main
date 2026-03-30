// PERFORMANCE PROFILING: Start timing the entire app startup
console.time('?? TOTAL-APP-STARTUP');
console.log('??  STARTUP: Process started at', new Date().toISOString());

const { app, BrowserWindow, Menu, screen, ipcMain, protocol } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
// Treat non-packaged runs as development; also honor NODE_ENV
const isDev = process.env.NODE_ENV === 'development' || (typeof app !== 'undefined' && !app.isPackaged);

// --- minimal file logger for packaged diagnostics ---
let __logPath = null;
let __logReady = false;
const __logQueue = [];
async function __initLogger() {
  try {
    let base = null;
    try { base = app.getPath('userData'); } catch { base = null; }
    // Allow forcing temp logging for diagnostics
    if (process.env.RDLN_LOG_TO_TEMP === '1') {
      base = os.tmpdir();
    }
    if (!base) { base = os.tmpdir(); }
    __logPath = path.join(base, 'rdln-electron.log');
    await fs.writeFile(__logPath, `\n=== RdLn Electron Log start ${new Date().toISOString()} ===\n`, { flag: 'a' });
    __logReady = true;
    while (__logQueue.length) {
      const m = __logQueue.shift();
      await fs.writeFile(__logPath, m + "\n", { flag: 'a' });
    }
  } catch (_) {
    // best-effort
  }
}
function __writeLog(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  if (__logReady && __logPath) {
    fs.writeFile(__logPath, line + "\n", { flag: 'a' }).catch(() => {});
  } else {
    __logQueue.push(line);
  }
}
app.on('ready', __initLogger);

const ASSET_PROTOCOL = 'rdln';

protocol.registerSchemesAsPrivileged([{ scheme: ASSET_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

async function registerAssetProtocol() {
  if (!protocol || typeof protocol.handle !== 'function') {
    return;
  }

  const distRoot = path.join(__dirname, '../dist');
  const resourceRoots = {
    tesseract: path.join(distRoot, 'tesseract'),
    tessdata: path.join(distRoot, 'tessdata')
  };

  const resolveUnderRoot = (root, requestPath) => {
    const normalized = path
      .normalize(requestPath || '.')
      .replace(/^(\.\.(\\|\/))+/, '');
    const resolved = path.join(root, normalized);
    if (!resolved.startsWith(root)) {
      throw new Error('Path traversal attempt rejected');
    }
    return resolved;
  };

  try {
    await protocol.handle(ASSET_PROTOCOL, async request => {
      try {
        const url = new URL(request.url);
        const resourceRoot = resourceRoots[url.hostname];
        if (!resourceRoot) {
          __writeLog('[protocol] Unknown host for url: ' + request.url);
          return new Response('Not Found', { status: 404 });
        }

        const relativePath = url.pathname.replace(/^\//, '');
        const filePath = resolveUnderRoot(resourceRoot, relativePath);
        __writeLog('[protocol] Serving ' + request.url + ' -> ' + filePath);
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
          '.js': 'application/javascript',
          '.mjs': 'application/javascript',
          '.cjs': 'application/javascript',
          '.json': 'application/json',
          '.wasm': 'application/wasm',
          '.traineddata': 'application/octet-stream'
        };

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentTypes[ext] || 'application/octet-stream'
          }
        });
      } catch (error) {
        __writeLog('[protocol] Asset fetch failed: ' + (error && error.stack ? error.stack : String(error)));
        return new Response('Not Found', { status: 404 });
      }
    });
    __writeLog('[protocol] Registered ' + ASSET_PROTOCOL + ':// handler');
  } catch (error) {
    __writeLog('[protocol] Failed to register handler: ' + (error && error.stack ? error.stack : String(error)));
  }
}

process.on('uncaughtException', (err) => {
  try { __writeLog(`uncaughtException: ${err?.stack || err}`); } catch {}
});
process.on('unhandledRejection', (reason) => {
  try { __writeLog(`unhandledRejection: ${reason?.stack || reason}`); } catch {}
});

console.time('?? MODULE-IMPORTS');
console.timeEnd('?? MODULE-IMPORTS');

let mainWindow;
let currentZoomFactor = 1.0;
let handleZoomChange;

function escapeForPowerShell(value) {
  return String(value).replace(/'/g, "''");
}

function isDocxPath(filePath) {
  return path.extname(filePath || '').toLowerCase() === '.docx';
}

function buildWordCompareScript(basePath, changedPath) {
  const safeBasePath = escapeForPowerShell(basePath);
  const safeChangedPath = escapeForPowerShell(changedPath);

  return `
$ErrorActionPreference = 'Stop'
$baseFile = '${safeBasePath}'
$changedFile = '${safeChangedPath}'

if (-not (Test-Path -LiteralPath $baseFile)) { throw 'Original file not found.' }
if (-not (Test-Path -LiteralPath $changedFile)) { throw 'Revised file not found.' }

$baseItem = Get-Item -LiteralPath $baseFile
if ($baseItem.IsReadOnly) {
  $baseItem.IsReadOnly = $false
}

$wdDoNotSaveChanges = 0
$wdCompareTargetNew = 2

$word = $null
$document = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $true
  $document = $word.Documents.Open($baseFile, $false, $false)
  $null = $document.Compare($changedFile, [ref]'RdLn Comparison', [ref]$wdCompareTargetNew, [ref]$true, [ref]$true)
  $word.ActiveDocument.Saved = 1
  $document.Close([ref]$wdDoNotSaveChanges)
}
finally {
  if ($document -ne $null) {
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) | Out-Null } catch {}
  }
  if ($word -ne $null) {
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null } catch {}
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
`.trim();
}

async function validateWordComparePaths(basePath, changedPath) {
  if (process.platform !== 'win32') {
    return {
      ok: false,
      code: 'UNSUPPORTED_PLATFORM',
      message: 'External Word Compare is available only on Windows.'
    };
  }

  if (!basePath || !changedPath) {
    return {
      ok: false,
      code: 'MISSING_FILES',
      message: 'Choose both an original and revised DOCX file.'
    };
  }

  if (!isDocxPath(basePath) || !isDocxPath(changedPath)) {
    return {
      ok: false,
      code: 'UNSUPPORTED_FILE_TYPE',
      message: 'External Word Compare is available only for DOCX files.'
    };
  }

  if (path.resolve(basePath) === path.resolve(changedPath)) {
    return {
      ok: false,
      code: 'SAME_FILE',
      message: 'Choose two different DOCX files to use External Word Compare.'
    };
  }

  try {
    await fs.access(basePath);
    await fs.access(changedPath);
  } catch {
    return {
      ok: false,
      code: 'FILE_NOT_FOUND',
      message: 'One or both selected files could not be found on disk.'
    };
  }

  return { ok: true };
}

async function launchWordCompare(basePath, changedPath) {
  const validation = await validateWordComparePaths(basePath, changedPath);
  if (!validation.ok) {
    return validation;
  }

  return await new Promise(resolve => {
    const script = buildWordCompareScript(basePath, changedPath);
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      script
    ], {
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', error => {
      resolve({
        ok: false,
        code: 'WORD_COMPARE_START_FAILED',
        message: `Microsoft Word could not be launched: ${error.message}`
      });
    });

    child.on('close', code => {
      if (code === 0) {
        resolve({
          ok: true,
          code: 'WORD_COMPARE_LAUNCHED',
          message: 'Microsoft Word comparison launched successfully.'
        });
        return;
      }

      const detail = (stderr || stdout || '').trim();
      resolve({
        ok: false,
        code: 'WORD_COMPARE_FAILED',
        message: detail || 'Microsoft Word could not be launched on this computer.'
      });
    });
  });
}

function createWindow() {
  console.time('???  WINDOW-CREATION');
  console.log('??  WINDOW: createWindow() called at', new Date().toISOString());
  
  // Get primary display dimensions
  console.time('?? SCREEN-DETECTION');
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  console.timeEnd('?? SCREEN-DETECTION');
  
  // Calculate window size - use 90% of screen width and full height minus taskbar
  const windowWidth = Math.min(1400, Math.floor(screenWidth * 0.9));
  const windowHeight = Math.floor(screenHeight * 0.95);
  
  // Create the browser window
  console.time('???  BROWSERWINDOW-INIT');
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
    title: 'RdLn Beta - Document Comparison Tool',
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });
  console.timeEnd('???  BROWSERWINDOW-INIT');

  // Load the app
  console.time('?? HTML-LOADING');
  console.log('??  LOAD: Starting to load HTML at', new Date().toISOString());
  
  if (isDev) {
    // In dev, load Vite server with simple retry until it�s ready
    const devUrl = 'http://localhost:5173';
    const tryLoad = async (attempt = 1) => {
      try {
        await mainWindow.loadURL(devUrl);
        mainWindow.webContents.openDevTools();
      } catch (e) {
        const delay = Math.min(1500, 200 * attempt);
        setTimeout(() => tryLoad(attempt + 1), delay);
      }
    };
    tryLoad();
  } else {
    const htmlPath = path.join(__dirname, '../dist/index-electron.html');
    console.log('??  LOAD: Loading HTML from:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }

  // Track when DOM is ready
  mainWindow.webContents.once('dom-ready', () => {
    console.timeEnd('?? HTML-LOADING');
    console.time('? DOM-TO-READY-TO-SHOW');
    console.log('??  DOM: DOM ready at', new Date().toISOString());
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.timeEnd('? DOM-TO-READY-TO-SHOW');
    console.timeEnd('???  WINDOW-CREATION');
    console.timeEnd('?? TOTAL-APP-STARTUP');
    console.log('? READY: Window visible at', new Date().toISOString());
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

  // Native Electron zoom functionality - replaces CSS zoom for better coordinate handling
  // Set up zoom change handler
  handleZoomChange = (newZoomFactor) => {
    currentZoomFactor = Math.max(0.25, Math.min(3.0, newZoomFactor));
    mainWindow.webContents.setZoomFactor(currentZoomFactor);
    
    // Notify renderer process about zoom change
    mainWindow.webContents.executeJavaScript(`
      document.dispatchEvent(new CustomEvent('electron-zoom-change', {
        detail: { zoomLevel: ${currentZoomFactor} }
      }));
    `);
    
    console.log('?? Native Electron zoom level:', currentZoomFactor);
  };

  mainWindow.webContents.on('dom-ready', () => {
    // Handle zoom with Ctrl+Scroll using native zoom - with dynamic zoom tracking
    mainWindow.webContents.executeJavaScript(`
      // Track current zoom level in renderer process
      let rendererZoomLevel = 1.0;
      
      // Listen for zoom changes from main process
      document.addEventListener('electron-zoom-change', (event) => {
        rendererZoomLevel = event.detail.zoomLevel;
        console.log('?? Renderer zoom level updated:', rendererZoomLevel);
      });
      
      // Sync initial zoom level
      if (typeof electronAPI !== 'undefined' && electronAPI.getZoomFactor) {
        electronAPI.getZoomFactor().then(factor => {
          rendererZoomLevel = factor;
          console.log('?? Initial renderer zoom level:', rendererZoomLevel);
        });  
      }
      
      document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          
          const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
          const newZoomLevel = Math.max(0.25, Math.min(3.0, rendererZoomLevel + zoomDelta));
          
          // Request zoom change from main process
          if (typeof electronAPI !== 'undefined' && electronAPI.setZoomFactor) {
            electronAPI.setZoomFactor(newZoomLevel);
          }
        }
      }, { passive: false });
      
      // Handle keyboard zoom shortcuts using native zoom
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
          let newZoomLevel = rendererZoomLevel;
          
          if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            newZoomLevel = Math.min(3.0, rendererZoomLevel + 0.1);
          } else if (e.key === '-') {
            e.preventDefault();
            newZoomLevel = Math.max(0.25, rendererZoomLevel - 0.1);
          } else if (e.key === '0') {
            e.preventDefault();
            newZoomLevel = 1.0;
          }
          
          if (newZoomLevel !== rendererZoomLevel) {
            // Request zoom change from main process
            if (typeof electronAPI !== 'undefined' && electronAPI.setZoomFactor) {
              electronAPI.setZoomFactor(newZoomLevel);
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
console.time('APP-READY-WAIT');
console.log('APP: Waiting for app.whenReady() at', new Date().toISOString());

app.whenReady().then(async () => {
  console.timeEnd('APP-READY-WAIT');
  console.log('APP: app.whenReady() fired at', new Date().toISOString());

  await registerAssetProtocol();

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

// Attach logging to any created BrowserWindow
app.on('browser-window-created', (event, win) => {
  try {
    win.webContents.on('console-message', (e, level, message, line, sourceId) => {
      __writeLog(`renderer console[${level}]: ${message} (${sourceId}:${line})`);
    });
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      __writeLog(`did-fail-load: code=${errorCode} desc=${errorDescription} url=${validatedURL} main=${isMainFrame}`);
    });
    win.webContents.on('crashed', () => {
      __writeLog('renderer crashed');
    });
    win.webContents.on('render-process-gone', (e, details) => {
      __writeLog(`render-process-gone: ${JSON.stringify(details)}`);
    });
    win.on('unresponsive', () => {
      __writeLog('window unresponsive');
    });
  } catch (_) {
    // ignore
  }
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
            handleZoomChange(currentZoomFactor + 0.1);
          }
        },
        { 
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            handleZoomChange(currentZoomFactor - 0.1);
          }
        },
        { 
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            handleZoomChange(1.0);
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

// Zoom IPC handlers for native zoom functionality
ipcMain.handle('set-zoom-factor', async (event, factor) => {
  if (mainWindow && typeof factor === 'number' && factor > 0) {
    handleZoomChange(factor);
    return currentZoomFactor;
  }
  throw new Error('Invalid zoom factor or window not available');
});

ipcMain.handle('get-zoom-factor', () => {
  return currentZoomFactor;
});

ipcMain.handle('compare-in-word', async (event, payload) => {
  const basePath = payload?.basePath || '';
  const changedPath = payload?.changedPath || '';
  return await launchWordCompare(basePath, changedPath);
});

app.whenReady().then(async () => {
  createMenu();
});





