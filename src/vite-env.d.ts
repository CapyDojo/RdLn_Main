/// <reference types="vite/client" />

// Electron API declarations
declare global {
  interface Window {
    electronAPI?: {
      handleFileDrop: (filePath: string) => Promise<File>;
      getPlatform: () => string;
      getAppVersion: () => Promise<string>;
      readFile: (filePath: string) => Promise<Buffer>;
      fileExists: (filePath: string) => Promise<boolean>;
      getResourcePath: (relativePath: string) => string;
    };
    isElectron?: boolean;
    isOffline?: boolean;
    TESSERACT_CONFIG?: {
      langPath?: string;
      corePath?: string;
      workerPath?: string;
    };
    __TAURI__?: any;
  }
}
