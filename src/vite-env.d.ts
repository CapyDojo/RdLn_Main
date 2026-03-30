/// <reference types="vite/client" />

// Electron API declarations
declare global {
  interface Window {
    electronAPI?: {
      handleFileDrop: (filePath: string | { path: string } | File) => Promise<File>;
      getPlatform: () => Promise<string>;
      getAppVersion: () => Promise<string>;
      readFile: (filePath: string) => Promise<{ buffer: number[]; name: string; type: string }>;
      fileExists: (filePath: string) => Promise<boolean>;
      getResourcePath: (relativePath: string) => Promise<string>;
      setZoomFactor: (factor: number) => Promise<number>;
      getZoomFactor: () => Promise<number>;
      notifyZoomChange: (factor: number) => void;
      getPathForFile: (file: File) => string;
      compareInWord: (payload: { basePath: string; changedPath: string }) => Promise<{ ok: boolean; code?: string; message: string }>;
    };
    isElectron?: boolean;
    isOffline?: boolean;
    TESSERACT_CONFIG?: {
      langPath?: string;
      corePath?: string;
      workerPath?: string;
    };
    __TAURI__?: unknown;
  }
}
