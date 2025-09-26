const { contextBridge, ipcRenderer } = require('electron');

// Security: Define allowed IPC channels
const ALLOWED_CHANNELS = [
  'read-file',
  'file-exists', 
  'get-platform',
  'get-app-version',
  'get-resource-path',
  'set-zoom-factor',
  'get-zoom-factor'
];

// Security: Validate IPC channel
function validateChannel(channel) {
  if (!ALLOWED_CHANNELS.includes(channel)) {
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  }
}

// Security: Sanitize file paths
function sanitizeFilePath(filePath) {
  if (typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }

  if (filePath.includes('..') || filePath.includes('~')) {
    throw new Error('Invalid file path');
  }

  return filePath;
}

function normalizeDropPayload(payload) {
  if (!payload) {
    throw new Error('Missing drop payload');
  }

  if (typeof payload === 'string') {
    return { mode: 'path', path: sanitizeFilePath(payload) };
  }

  if (typeof payload === 'object') {
    if (typeof payload.path === 'string') {
      return { mode: 'path', path: sanitizeFilePath(payload.path) };
    }
    if ((payload instanceof Blob) || (typeof payload.arrayBuffer === 'function' && typeof payload.name === 'string')) {
      return { mode: 'file', file: payload };
    }
  }

  throw new Error('Unsupported drop payload');
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File drop handling - use IPC to main process with security validation
  handleFileDrop: async (fileInput) => {
    try {
      const normalized = normalizeDropPayload(fileInput);
      let file = null;
      let sourcePath = null;

      if (normalized.mode === 'path') {
        sourcePath = normalized.path;
        validateChannel('read-file');
        const fileData = await ipcRenderer.invoke('read-file', sourcePath);
        if (!fileData || !fileData.buffer || !fileData.name) {
          throw new Error('Invalid file data received');
        }
        const BlobCtor = (typeof window !== 'undefined' && window.Blob) ? window.Blob : Blob;
        const FileCtor = (typeof window !== 'undefined' && window.File) ? window.File : null;
        const blob = new BlobCtor([Uint8Array.from(fileData.buffer)], { type: fileData.type });
        file = FileCtor
          ? new FileCtor([blob], fileData.name, { type: fileData.type })
          : Object.assign(blob, { name: fileData.name, lastModified: Date.now() });
      } else {
        file = normalized.file;
        if (typeof file?.arrayBuffer !== 'function') {
          const BlobCtor = (typeof window !== 'undefined' && window.Blob) ? window.Blob : Blob;
          const blob = new BlobCtor([], { type: 'application/octet-stream' });
          file = Object.assign(blob, { name: 'dropped-file', lastModified: Date.now() });
        }
      }

      const event = new CustomEvent('electron-file-drop', {
        detail: { file, filePath: sourcePath }
      });
      document.dispatchEvent(event);

      return file;
    } catch (error) {
      console.error('Failed to read dropped file:', error);
      throw error;
    }
  },

  // Platform detection with validation
  getPlatform: () => {
    validateChannel('get-platform');
    return ipcRenderer.invoke('get-platform');
  },
  
  // App info with validation
  getAppVersion: () => {
    validateChannel('get-app-version');
    return ipcRenderer.invoke('get-app-version');
  },
  
  // File system access for OCR assets - use IPC with validation
  readFile: (filePath) => {
    const sanitizedPath = sanitizeFilePath(filePath);
    validateChannel('read-file');
    return ipcRenderer.invoke('read-file', sanitizedPath);
  },
  
  // Check if file exists - use IPC with validation
  fileExists: (filePath) => {
    const sanitizedPath = sanitizeFilePath(filePath);
    validateChannel('file-exists');
    return ipcRenderer.invoke('file-exists', sanitizedPath);
  },
  
  // Get resource path for bundled assets - use IPC with validation
  getResourcePath: (relativePath) => {
    const sanitizedPath = sanitizeFilePath(relativePath);
    validateChannel('get-resource-path');
    return ipcRenderer.invoke('get-resource-path', sanitizedPath);
  },
  
  // Native zoom functionality with validation
  setZoomFactor: (factor) => {
    if (typeof factor !== 'number' || factor <= 0 || factor > 5) {
      throw new Error('Invalid zoom factor');
    }
    validateChannel('set-zoom-factor');
    return ipcRenderer.invoke('set-zoom-factor', factor);
  },
  
  getZoomFactor: () => {
    validateChannel('get-zoom-factor');
    return ipcRenderer.invoke('get-zoom-factor');
  },
  
  // Zoom change notification for dropdown positioning
  notifyZoomChange: (zoomLevel) => {
    const event = new CustomEvent('electron-zoom-change', { detail: { zoomLevel } });
    document.dispatchEvent(event);
  }
});

// Listen for file drop events from main process
ipcRenderer.on('file-dropped', (event, filePath) => {
  window.electronAPI.handleFileDrop(filePath);
});

// Set global flag to indicate Electron environment
window.isElectron = true;


