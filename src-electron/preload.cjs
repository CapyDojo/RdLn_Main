const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File drop handling
  handleFileDrop: (filePath) => {
    // Read file and convert to File object for the React app
    return fs.readFile(filePath)
      .then(buffer => {
        const fileName = path.basename(filePath);
        const fileType = `image/${path.extname(filePath).slice(1).toLowerCase()}`;
        
        // Create a Blob from the buffer
        const blob = new Blob([buffer], { type: fileType });
        
        // Create File object
        const file = new File([blob], fileName, { type: fileType });
        
        // Dispatch custom event to React app
        const event = new CustomEvent('electron-file-drop', {
          detail: { file, filePath }
        });
        document.dispatchEvent(event);
        
        return file;
      })
      .catch(error => {
        console.error('Failed to read dropped file:', error);
        throw error;
      });
  },

  // Platform detection
  getPlatform: () => process.platform,
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File system access for OCR assets
  readFile: (filePath) => fs.readFile(filePath),
  
  // Check if file exists
  fileExists: (filePath) => fs.access(filePath).then(() => true).catch(() => false),
  
  // Get resource path for bundled assets
  getResourcePath: (relativePath) => {
    if (process.env.NODE_ENV === 'development') {
      return path.join(process.cwd(), 'public', relativePath);
    } else {
      return path.join(process.resourcesPath, 'app', 'dist', relativePath);
    }
  }
});

// Listen for file drop events from main process
ipcRenderer.on('file-dropped', (event, filePath) => {
  window.electronAPI.handleFileDrop(filePath);
});

// Set global flag to indicate Electron environment
window.isElectron = true;