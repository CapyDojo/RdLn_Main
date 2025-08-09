/**
 * Tauri File Drop Handler
 * 
 * Handles global file drop events and routes them to the correct TextInputPanel
 * based on drop position to avoid infinite loops and multiple processing.
 */

let tauriListen: any = null;
let tauriReadFile: any = null;
let isSetup = false;

// Deduplication to prevent processing the same file multiple times
let lastProcessedFile: string | null = null;
let lastProcessedTime = 0;
const DEDUP_WINDOW_MS = 1000; // 1 second deduplication window

// Dynamically import Tauri APIs to avoid build errors in web mode
const initTauriApis = async () => {
    try {
        const eventModule = await import('@tauri-apps/api/event');
        const fsModule = await import('@tauri-apps/plugin-fs');

        tauriListen = eventModule.listen;
        tauriReadFile = fsModule.readFile;

        // APIs imported successfully
        return true;
    } catch (error) {
        // Running in web mode, APIs not available
        return false;
    }
};

export const setupGlobalTauriFileDrop = async () => {
    if (isSetup) {
        // Already setup, skipping
        return;
    }

    // Setting up global file drop handler

    const isAvailable = await initTauriApis();
    if (!isAvailable || !tauriListen) {
        // APIs not available
        return;
    }

    try {
        const unlisten = await tauriListen('tauri://drag-drop', async (event: any) => {
            // File drop event received

            const files = event.payload.paths as string[];
            const position = event.payload.position;

            const imageFiles = files.filter((path: string) =>
                /\.(png|jpg|jpeg|gif|bmp|webp|tiff)$/i.test(path)
            );

            if (imageFiles.length === 0) {
                // No image files found
                return;
            }

            // Deduplication check
            const currentFile = imageFiles[0];
            const currentTime = Date.now();

            if (lastProcessedFile === currentFile &&
                (currentTime - lastProcessedTime) < DEDUP_WINDOW_MS) {
                // Duplicate file drop detected, ignoring
                return;
            }

            lastProcessedFile = currentFile;
            lastProcessedTime = currentTime;

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
                // No target panel found for position
                return;
            }

            const panelTitle = targetPanel.getAttribute('data-panel-title');
            const instanceId = targetPanel.getAttribute('data-instance-id');

            // Process the file for this specific panel instance
            await processFileForPanel(imageFiles[0], targetPanel, panelTitle || 'Unknown');
        });

        isSetup = true;
        // Global file drop listener registered successfully

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

        // Processing file for panel
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
        // File processed and event dispatched

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
    // Global file drop cleaned up
};