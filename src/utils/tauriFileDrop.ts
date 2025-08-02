/**
 * Tauri File Drop Handler
 * 
 * Handles global file drop events and routes them to the correct TextInputPanel
 * based on drop position to avoid infinite loops and multiple processing.
 */

let tauriListen: any = null;
let tauriReadFile: any = null;
let isSetup = false;

// Dynamically import Tauri APIs to avoid build errors in web mode
const initTauriApis = async () => {
  try {
    const eventModule = await import('@tauri-apps/api/event');
    const fsModule = await import('@tauri-apps/plugin-fs');
    
    tauriListen = eventModule.listen;
    tauriReadFile = fsModule.readFile;
    
    console.log('🔧 TAURI GLOBAL: APIs imported successfully');
    return true;
  } catch (error) {
    console.log('🔧 TAURI GLOBAL: Running in web mode, APIs not available');
    return false;
  }
};

export const setupGlobalTauriFileDrop = async () => {
  if (isSetup) {
    console.log('🔧 TAURI GLOBAL: Already setup, skipping');
    return;
  }
  
  console.log('🔧 TAURI GLOBAL: Setting up global file drop handler');
  
  const isAvailable = await initTauriApis();
  if (!isAvailable || !tauriListen) {
    console.log('🔧 TAURI GLOBAL: APIs not available');
    return;
  }

  try {
    const unlisten = await tauriListen('tauri://drag-drop', async (event: any) => {
      console.log('🔧 TAURI GLOBAL: File drop event received');
      
      const files = event.payload.paths as string[];
      const position = event.payload.position;
      
      console.log('🔧 TAURI GLOBAL: Files:', files.length);
      console.log('🔧 TAURI GLOBAL: Position:', position);
      
      const imageFiles = files.filter((path: string) => 
        /\.(png|jpg|jpeg|gif|bmp|webp|tiff)$/i.test(path)
      );
      
      if (imageFiles.length === 0) {
        console.log('🔧 TAURI GLOBAL: No image files found');
        return;
      }
      
      // Find which TextInputPanel the file was dropped on
      const textInputPanels = document.querySelectorAll('[data-text-input-panel]');
      let targetPanel: Element | null = null;
      
      for (const panel of textInputPanels) {
        const rect = panel.getBoundingClientRect();
        if (position.x >= rect.left && position.x <= rect.right &&
            position.y >= rect.top && position.y <= rect.bottom) {
          targetPanel = panel;
          break;
        }
      }
      
      if (!targetPanel) {
        console.log('🔧 TAURI GLOBAL: No target panel found for position', position);
        return;
      }
      
      const panelTitle = targetPanel.getAttribute('data-panel-title');
      console.log('🔧 TAURI GLOBAL: Target panel:', panelTitle);
      
      // Process the file for this specific panel
      await processFileForPanel(imageFiles[0], targetPanel, panelTitle || 'Unknown');
    });
    
    isSetup = true;
    console.log('🔧 TAURI GLOBAL: Global file drop listener registered successfully');
    
    // Store cleanup function globally
    (window as any).__TAURI_FILE_DROP_CLEANUP__ = unlisten;
  } catch (error) {
    console.error('🔧 TAURI GLOBAL: Failed to setup global file drop:', error);
  }
};

const processFileForPanel = async (imagePath: string, targetPanel: Element, panelTitle: string) => {
  try {
    if (!tauriReadFile) {
      throw new Error('Tauri FS API not available');
    }
    
    console.log(`🔧 TAURI GLOBAL: Processing file for ${panelTitle}:`, imagePath);
    const fileBytes = await tauriReadFile(imagePath);
    
    const blob = new Blob([fileBytes], { 
      type: `image/${imagePath.split('.').pop()?.toLowerCase() || 'png'}` 
    });
    
    const fileName = imagePath.split(/[\\/]/).pop() || 'image.png';
    const file = new File([blob], fileName, { type: blob.type });
    
    // Dispatch a custom event to the target panel
    const customEvent = new CustomEvent('tauri-file-processed', {
      detail: { file, imagePath, panelTitle }
    });
    
    targetPanel.dispatchEvent(customEvent);
    console.log(`🔧 TAURI GLOBAL: File processed and event dispatched to ${panelTitle}`);
    
  } catch (error) {
    console.error(`🔧 TAURI GLOBAL: Failed to process file for ${panelTitle}:`, error);
    
    // Dispatch error event
    const errorEvent = new CustomEvent('tauri-file-error', {
      detail: { error: String(error), imagePath, panelTitle }
    });
    targetPanel.dispatchEvent(errorEvent);
  }
};

export const cleanupGlobalTauriFileDrop = () => {
  const cleanup = (window as any).__TAURI_FILE_DROP_CLEANUP__;
  if (cleanup) {
    cleanup();
    (window as any).__TAURI_FILE_DROP_CLEANUP__ = null;
  }
  isSetup = false;
  console.log('🔧 TAURI GLOBAL: Global file drop cleaned up');
};