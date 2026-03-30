const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('rdlnPrototype', {
  pickDocx: () => ipcRenderer.invoke('prototype:pick-docx'),
  compareInWord: payload => ipcRenderer.invoke('prototype:compare-in-word', payload),
  getEnvironment: () => ipcRenderer.invoke('prototype:get-environment'),
  getPathForFile: file => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return '';
    }
  }
});
