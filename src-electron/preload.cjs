const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File drop handling - use IPC to main process
  handleFileDrop: async (filePath) => {
    try {
      const fileData = await ipcRenderer.invoke('read-file', filePath);
      
      // Create File object from the received data
      const blob = new Blob([fileData.buffer], { type: fileData.type });
      const file = new File([blob], fileData.name, { type: fileData.type });
      
      // Dispatch custom event to React app
      const event = new CustomEvent('electron-file-drop', {
        detail: { file, filePath }
      });
      document.dispatchEvent(event);
      
      return file;
    } catch (error) {
      console.error('Failed to read dropped file:', error);
      throw error;
    }
  },

  // Platform detection
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File system access for OCR assets - use IPC
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // Check if file exists - use IPC
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  
  // Get resource path for bundled assets - use IPC
  getResourcePath: (relativePath) => ipcRenderer.invoke('get-resource-path', relativePath),
  
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