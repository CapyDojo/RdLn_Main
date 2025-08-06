import React, { useRef, useCallback, useState, useEffect } from 'react';
import { FileText, Image, AlertCircle, Loader, ChevronDown, Languages } from 'lucide-react';
import { Sparkles } from '../icons';
import { useOCR } from '../hooks/useOCR';
import { OCRLanguage } from '../types/ocr-types';
import { LanguageSettingsDropdown } from './LanguageSettingsDropdown';
import { useLayout } from '../contexts/LayoutContext';
import { BaseComponentProps } from '../types/components';
import { useComponentPerformance } from '../utils/performanceUtils.tsx';
import { formatPastedText, formatRtfHtmlPaste } from '../utils/paragraphFormatting';
import { analyzePasteContext, getFormattingLevel, PasteContext, FormatLevel } from '../utils/pastePDFdetection';
import { useFontSize } from '../contexts/FontSizeContext';

// Tauri v2 file drop support using proper imports
let tauriListen: any = null;
let tauriReadFile: any = null;

// Dynamically import Tauri APIs to avoid build errors in web mode
const initTauriApis = async () => {
  try {
    const eventModule = await import('@tauri-apps/api/event');
    const fsModule = await import('@tauri-apps/plugin-fs');

    tauriListen = eventModule.listen;
    tauriReadFile = fsModule.readFile;

    console.log('🔧 TAURI DEBUG: Event and FS APIs imported successfully');
    return true;
  } catch (error) {
    console.log('🔧 TAURI DEBUG: Running in web mode, Tauri APIs not available');
    return false;
  }
};

interface TextInputPanelProps extends BaseComponentProps {
  title: string;
  value: string;
  onChange: ((value: string) => void) | ((value: string, isPasteAction?: boolean) => void);
  placeholder: string;
  disabled?: boolean;
  height?: number;
  iconEmoji?: string;
}

export const TextInputPanel: React.FC<TextInputPanelProps> = ({
  title,
  value,
  onChange,
  placeholder,
  disabled = false,
  height = 400,
  iconEmoji,
  style,
  className,
  ...props
}) => {
  const performanceTracker = useComponentPerformance(props, 'TextInputPanel', {
    category: 'input',
    autoTrackRender: true,
    autoTrackInteractions: true
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAutoFormatEnabled, setIsAutoFormatEnabled] = useState(true);
  const { fontSize } = useFontSize();

  const toggleAutoFormat = () => {
    setIsAutoFormatEnabled(prev => !prev);
  };

  const segmentedControlRef = useRef<HTMLDivElement>(null);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [controlRect, setControlRect] = useState<DOMRect | null>(null);

  // Detect layout to conditionally apply dynamic scaling behavior
  const { currentLayout } = useLayout();
  const isDynamicScaling = currentLayout === 'current';

  // Check for mobile viewport
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768); // Standard mobile breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Mobile view shows only emoji, desktop shows full instructions
  const renderPlaceholderContent = () => {
    if (isMobileView) {
      return (
        <div className="text-center text-theme-neutral-400 max-w-sm">
          <br />
          <br />
          <br />
          <br />
          <br />
          <span className="text-6xl block" role="img" aria-label="Document">🤖</span>
          <br />
          <p className="text-lg mt-2 font-sans"><i>Paste (Ctrl+V)<br></br>your screenshot for OCR</i></p>
        </div>
      );
    }
    return (
      <div className="text-center text-theme-neutral-400 max-w-sm">
        <br />
        <br />
        <br />
        <br />
        <span className="text-6xl mb-3 block" role="img" aria-label="Document">📑</span>
        <br></br>
        <p className="text-lg font-sans"><i>
          PASTE (Ctrl+V) your screenshot</i>
        </p>
        <p className="text-lg font-sans">
          <i>to extract text with OCR</i>
        </p>
        <br></br>
        <p className="text-base mt-1 text-theme-primary-400 font-sans">
          <i>Supports {supportedLanguages.length} languages including English, Chinese, Japanese, German, French, Arabic & more</i>
        </p>
      </div>
    );
  };

  const {
    isProcessing,
    progress,
    error,
    detectedLanguages,
    selectedLanguages,
    autoDetect,
    supportedLanguages,
    extractTextFromImage,
    resetOCRState,
    clearDetectedLanguages,
    setSelectedLanguages,
    setAutoDetect
  } = useOCR();

  // Shared OCR processing function for both HTML5 and Tauri file drops
  const processImageWithOCR = useCallback(async (imageFile: File) => {
    const callStack = new Error().stack;
    console.log(`🔍 GHOST DEBUG: processImageWithOCR called for ${instanceId.current}`);
    console.log(`🔍 GHOST DEBUG: File: ${imageFile.name}, Current value length: ${value.length}`);
    console.log(`🔍 GHOST DEBUG: Call stack:`, callStack?.split('\n').slice(0, 5).join('\n'));

    try {
      const extractedText = await performanceTracker.trackOperation('ocr_extraction', async () => {
        return await extractTextFromImage(imageFile);
      });

      console.log(`🔍 GHOST DEBUG: OCR extracted ${extractedText.length} chars, adding to ${value.length} existing chars`);
      onChange(value + (value ? '\n\n' : '') + extractedText);

      performanceTracker.trackMetric('ocr_result', {
        extractedLength: extractedText.length,
        fileSize: imageFile.size,
        instanceId: instanceId.current
      });
    } catch (error: any) {
      console.error(`🔍 GHOST DEBUG: OCR failed for ${instanceId.current}:`, error);

      // PRODUCTION FIX: Provide user-friendly error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userFriendlyMessage = 'Failed to extract text from image: Unknown error';

      if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'Failed to extract text from image: Processing timeout - try a smaller image or restart the application';
      } else if (errorMessage.includes('Worker')) {
        userFriendlyMessage = 'Failed to extract text from image: OCR engine initialization failed - please restart the application';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = 'Failed to extract text from image: Unable to load language files - check your internet connection';
      } else if (errorMessage.includes('language')) {
        userFriendlyMessage = 'Failed to extract text from image: Language detection failed - the image may not contain readable text';
      } else {
        userFriendlyMessage = `Failed to extract text from image: ${errorMessage}`;
      }

      // Show error to user (you may want to implement a proper error display mechanism)
      console.error('USER ERROR:', userFriendlyMessage);

      performanceTracker.trackMetric('ocr_error', {
        error: error.message,
        userMessage: userFriendlyMessage,
        instanceId: instanceId.current
      });
    }
  }, [performanceTracker, extractTextFromImage, value, onChange]);

  // Generate unique instance ID for this component
  const instanceId = useRef(`${title}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Store processImageWithOCR in a ref to avoid re-renders
  const processImageWithOCRRef = useRef(processImageWithOCR);
  processImageWithOCRRef.current = processImageWithOCR;

  // Track if component is mounted to prevent ghost OCR
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      console.log(`🔍 GHOST DEBUG: Component ${instanceId.current} unmounting`);
    };
  }, []);

  // Tauri file drop - local event listeners with ghost OCR debugging
  useEffect(() => {
    const currentInstanceId = instanceId.current;
    console.log(`🔍 GHOST DEBUG: Setting up listeners for ${currentInstanceId} - FINAL ATTEMPT`);

    // Set up local event listeners for this panel
    const handleFileProcessed = async (event: CustomEvent) => {
      const { file, panelTitle } = event.detail;
      console.log(`🔍 GHOST DEBUG: Event triggered for ${currentInstanceId}, file: ${file.name}`);

      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log(`🔍 GHOST DEBUG: Component ${currentInstanceId} unmounted, ignoring OCR`);
        return;
      }

      try {
        console.log(`🔍 GHOST DEBUG: Starting OCR for ${currentInstanceId}`);
        await processImageWithOCRRef.current(file);

        // Double-check if still mounted after async operation
        if (!isMountedRef.current) {
          console.log(`🔍 GHOST DEBUG: Component ${currentInstanceId} unmounted during OCR, ignoring result`);
          return;
        }

        console.log(`🔍 GHOST DEBUG: OCR completed for ${currentInstanceId}`);

        performanceTracker.trackMetric('tauri_file_drop_success', {
          filePath: file.name,
          fileSize: file.size,
          panelTitle: title,
          instanceId: currentInstanceId
        });
      } catch (error) {
        console.error(`🔍 GHOST DEBUG: OCR failed for ${currentInstanceId}:`, error);
        performanceTracker.trackMetric('tauri_drop_error', {
          error: String(error),
          panelTitle: title,
          instanceId: currentInstanceId
        });
      }
    };

    const handleFileError = (event: CustomEvent) => {
      const { error, panelTitle } = event.detail;
      console.error(`🔍 GHOST DEBUG: File error for ${currentInstanceId}:`, error);
      performanceTracker.trackMetric('tauri_drop_error', {
        error,
        panelTitle: title,
        instanceId: currentInstanceId
      });
    };

    // Add event listeners to this panel's div using unique instance ID
    const panelDiv = document.querySelector(`[data-instance-id="${currentInstanceId}"]`);
    if (panelDiv) {
      console.log(`🔍 GHOST DEBUG: Adding listeners to DOM element for ${currentInstanceId}`);
      panelDiv.addEventListener('tauri-file-processed', handleFileProcessed as EventListener);
      panelDiv.addEventListener('tauri-file-error', handleFileError as EventListener);

      return () => {
        console.log(`🔍 GHOST DEBUG: Cleaning up listeners for ${currentInstanceId}`);
        panelDiv.removeEventListener('tauri-file-processed', handleFileProcessed as EventListener);
        panelDiv.removeEventListener('tauri-file-error', handleFileError as EventListener);
      };
    } else {
      console.warn(`🔍 GHOST DEBUG: No DOM element found for ${currentInstanceId}`);
    }
  }, [title]); // ONLY title dependency - nothing else!

  // Clear detected languages when content is cleared
  useEffect(() => {
    if (!value.trim() && detectedLanguages.length > 0) {
      clearDetectedLanguages();
    }
  }, [value, detectedLanguages.length, clearDetectedLanguages]);

  // Update sliding indicator width based on badge visibility
  useEffect(() => {
    if (segmentedControlRef.current) {
      const badgeWidth = !autoDetect && selectedLanguages.length > 0 ? 25 : 0; // Approximate badge width
      segmentedControlRef.current.style.setProperty('--manual-badge-width', `${badgeWidth}px`);
    }
  }, [autoDetect, selectedLanguages.length]);

  // Track input performance metrics
  useEffect(() => {
    try {
      if (performanceTracker?.trackMetric) {
        performanceTracker.trackMetric('text_length', value.length);
      }
    } catch (error) {
      console.warn('Performance metrics tracking failed:', error);
    }
  }, [value.length, performanceTracker]);

  // Apply font size to textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.setAttribute('data-user-font-size', fontSize);
    }
  }, [fontSize]);


  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    const textItem = items.find(item => item.type.startsWith('text/plain'));

    // Get plain text content for analysis
    const plainText = textItem ? e.clipboardData.getData('text/plain') : '';
    const normalizedText = plainText.replace(/\r\n/g, '\n');

    // Analyze paste context to determine if content was originally formatted
    const pasteContext = analyzePasteContext(items, normalizedText);

    performanceTracker.trackMetric('paste_operation', {
      hasImage: !!imageItem,
      hasText: !!textItem,
      itemCount: items.length,
      sourceType: pasteContext.sourceType,
      detectedSource: pasteContext.detectedSource
    });

    if (textItem && !imageItem) {
      e.preventDefault();

      // Use intelligent format detection to determine formatting level
      const formatLevel = getFormattingLevel(pasteContext, isAutoFormatEnabled);

      let processedText: string;
      switch (formatLevel) {
        case 'PDF_Paste_Format':
          processedText = formatPastedText(normalizedText);
          break;
        case 'RTF_HTML_Paste_Format':
          processedText = formatRtfHtmlPaste(normalizedText);
          break;
        case 'None':
        default:
          processedText = normalizedText;
          break;
      }

      console.log(`[Paste] Source: ${pasteContext.detectedSource}, Format level: ${formatLevel}`);

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = textarea.value.substring(0, start) + processedText + textarea.value.substring(end);

        if (onChange.length > 1) {
          (onChange as (value: string, isPasteAction?: boolean) => void)(newValue, true);
        } else {
          onChange(newValue);
        }

        setTimeout(() => {
          textarea.setSelectionRange(start + processedText.length, start + processedText.length);
          textarea.focus();
        }, 0);
      } else {
        onChange(processedText);
      }
    }

    if (imageItem) {
      e.preventDefault();
      try {
        const imageFile = imageItem.getAsFile();
        if (!imageFile) return;

        const extractedText = await performanceTracker.trackOperation('ocr_extraction', async () => {
          return await extractTextFromImage(imageFile);
        });

        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newValue =
            textarea.value.substring(0, start) +
            (start > 0 && textarea.value[start - 1] !== '\n' ? '\n\n' : '') +
            extractedText +
            (end < textarea.value.length && textarea.value[end] !== '\n' ? '\n\n' : '') +
            textarea.value.substring(end);

          if (onChange.length > 1) {
            (onChange as (value: string, isPasteAction?: boolean) => void)(newValue, true);
          } else {
            onChange(newValue);
          }

          setTimeout(() => {
            const newCursorPos = start + extractedText.length + (start > 0 ? 2 : 0);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
          }, 0);
        } else {
          onChange(extractedText);
        }
      } catch (error: any) {
        console.error('OCR failed:', error);
        performanceTracker.trackMetric('ocr_error', { error: error.message });
      }
    }
  }, [performanceTracker, extractTextFromImage, onChange, isAutoFormatEnabled]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    performanceTracker.trackMetric('drop_operation', {
      fileCount: files.length,
      hasImage: !!imageFile
    });

    if (imageFile) {
      await processImageWithOCR(imageFile);
    }
  }, [performanceTracker, processImageWithOCR]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleLanguageToggle = (languageCode: OCRLanguage) => {
    if (selectedLanguages.includes(languageCode)) {
      setSelectedLanguages(selectedLanguages.filter(lang => lang !== languageCode));
    } else {
      setSelectedLanguages([...selectedLanguages, languageCode]);
    }
  };

  const getLanguageDisplayName = (languageCode: OCRLanguage) => {
    const lang = supportedLanguages.find(l => l.code === languageCode);
    return lang ? `${lang.flag} ${lang.name}` : languageCode;
  };

  const getLanguageShortName = (languageCode: OCRLanguage) => {
    const lang = supportedLanguages.find(l => l.code === languageCode);
    return lang ? `${lang.flag} ${lang.name.split(' ')[0]}` : languageCode;
  };

  // Language code to country code mapping for badge display
  const getLanguageAbbreviation = (languageCode: OCRLanguage): string => {
    const abbreviationMap: Record<OCRLanguage, string> = {
      eng: 'EN',
      chi_sim: 'CN',
      chi_tra: 'TW',
      deu: 'DE',
      fra: 'FR',
      spa: 'ES',
      jpn: 'JP',
      kor: 'KR',
      ara: 'SA',
      rus: 'RU'
    };
    return abbreviationMap[languageCode] || languageCode.toUpperCase();
  };

  // Generate display text for selected languages badge (with truncation)
  const getSelectedLanguagesDisplay = (): string => {
    if (selectedLanguages.length === 0) return '0';

    const abbreviations = selectedLanguages.map(getLanguageAbbreviation);

    if (abbreviations.length <= 3) {
      return abbreviations.join(', ');
    } else {
      const shown = abbreviations.slice(0, 3).join(', ');
      const remaining = abbreviations.length - 3;
      return `${shown} +${remaining}`;
    }
  };

  // Generate full display text for selected languages (no truncation)
  const getSelectedLanguagesFullDisplay = (): string => {
    if (selectedLanguages.length === 0) return '';

    const abbreviations = selectedLanguages.map(getLanguageAbbreviation);
    return abbreviations.join(', ');
  };

  return (
    <div
      className="glass-panel glass-content-panel overflow-hidden transition-all duration-300"
      style={style}
      data-text-input-panel
      data-panel-title={title}
      data-instance-id={instanceId.current}
    >
      <div className="glass-panel-header-footer px-4 py-3 border-b border-theme-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {iconEmoji ? (
            <span className="text-5xl" role="img" aria-label="Input panel">{iconEmoji}</span>
          ) : (
            <FileText className="w-5 h-5 text-theme-primary-900" />
          )}
          <h3 className="text-3xl font-semibold text-theme-primary-900">{title}</h3>
          <button
            onClick={toggleAutoFormat}
            className={`flex items-center justify-center p-3 rounded-lg backdrop-blur-sm border transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${isAutoFormatEnabled
              ? 'bg-theme-primary-500 border-transparent text-white hover:shadow-lg'
              : 'bg-theme-neutral-200/70 border-transparent hover:border-theme-neutral-300/50 text-theme-neutral-800 hover:shadow-theme-neutral-200/50'}`}
            title={`Auto-format paragraphs on paste: ${isAutoFormatEnabled ? 'ON' : 'OFF'}`}
          >
            <Sparkles className={`w-5 h-5 transition-all duration-300 ${isAutoFormatEnabled ? 'text-white' : 'text-theme-neutral-500'}`} />
          </button>

          {isProcessing && (
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 text-theme-primary-600 animate-spin" />
              <span className="text-sm text-theme-primary-600">Processing... {progress}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* OCR Language Segmented Control */}
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-theme-neutral-700 hidden sm:inline">OCR Languages</span>
            <div className="segmented-control" ref={segmentedControlRef} role="group" aria-label="OCR Language Detection Mode">
              <button
                onClick={() => {
                  setAutoDetect(true);
                  setShowLanguageSettings(false); // Always close dropdown when switching to Auto
                }}
                className={`segment ${autoDetect ? 'active' : ''}`}
                aria-pressed={autoDetect}
                aria-label="Automatic language detection"
                title="Automatically detect document language"
              >
                🤖 Auto
              </button>
              <button
                onClick={() => {
                  if (!autoDetect) {
                    // Already in manual mode, just toggle dropdown
                    setShowLanguageSettings(!showLanguageSettings);
                  } else {
                    // Switching from auto to manual, open dropdown
                    setAutoDetect(false);
                    setShowLanguageSettings(true);
                  }

                  // Update control position for dropdown
                  if (segmentedControlRef.current) {
                    const rect = segmentedControlRef.current.getBoundingClientRect();
                    setControlRect(rect);
                  }
                }}
                className={`segment flex items-center gap-1 ${!autoDetect ? 'active' : ''}`}
                aria-pressed={!autoDetect}
                aria-expanded={!autoDetect && showLanguageSettings}
                aria-label={`Manual language selection${!autoDetect && selectedLanguages.length > 0 ? ` (${selectedLanguages.length} selected)` : ''}`}
                title={`Manually select OCR languages${!autoDetect && selectedLanguages.length > 0 ? ` - ${selectedLanguages.length} languages selected` : ''}`}
              >
                ☰
                {!autoDetect && selectedLanguages.length > 0 && (
                  <span className="text-xs bg-theme-primary-100 text-theme-primary-800 px-1.5 py-0.5 rounded-full ml-1">
                    {getSelectedLanguagesDisplay()}
                  </span>
                )}
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${showLanguageSettings ? 'rotate-180' : ''
                    }`}
                  aria-hidden="true"
                />
              </button>
              <div className={`sliding-indicator ${autoDetect ? 'to-left' : 'to-right'}`} aria-hidden="true"></div>
            </div>

            {/* Show dropdown arrow when manual mode */}
          </div>
        </div>
      </div>






      <div
        className="glass-panel-inner-content overflow-y-auto"
        style={{
          height: isDynamicScaling ? 'auto' : `${height - 70}px`, // Match RedlineOutput: calculate height minus header
          minHeight: '200px',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            console.log(`🔍 GHOST DEBUG: Manual text change in ${instanceId.current}: ${value.length} → ${newValue.length}`);
            if (onChange.length > 1) {
              (onChange as (value: string, isPasteAction?: boolean) => void)(newValue, false);
            } else {
              (onChange as (value: string) => void)(newValue);
            }
          }}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          placeholder={isProcessing ? '' : placeholder}
          disabled={disabled || isProcessing}
          className="glass-input-field user-text-area w-full h-full py-6 px-8 resize-none focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent font-serif text-theme-neutral-800 leading-relaxed disabled:cursor-not-allowed transition-colors libertinus-math-text border-0 bg-transparent"
          style={{ minHeight: '200px' }}
        />

        {/* Enhanced OCR Progress Bar */}
        {isProcessing && (
          <div className="absolute top-2 left-2 right-2 bg-white/90 dark:bg-black/80 backdrop-blur-md border border-white/30 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Image className="w-5 h-5 text-theme-primary-600 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-theme-primary-500 rounded-full animate-ping"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-theme-neutral-800">
                    {progress < 30 ? 'Initializing OCR...' :
                      progress < 60 ? 'Detecting language...' :
                        progress < 90 ? 'Extracting text...' : 'Finalizing...'}
                  </span>
                  <span className="text-xs text-theme-neutral-600 font-mono">{progress}%</span>
                </div>
                <div className="w-full bg-theme-neutral-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-theme-primary-500 to-theme-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            {detectedLanguages.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-white/20">
                <Languages className="w-4 h-4 text-theme-secondary-600" />
                <span className="text-xs text-theme-neutral-700 font-medium">
                  Detected: {detectedLanguages.map(getLanguageShortName).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* OCR Error */}
        {error && (
          <div className="absolute top-2 left-2 right-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={resetOCRState}
                className="ml-auto text-xs text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* OCR Instructions - Only show when not processing and no content */}
        {!value && !isProcessing && (
          <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
            {renderPlaceholderContent()}
          </div>
        )}

      </div>



      {/* Consolidated Language Status - Shows detection and selection */}
      {((detectedLanguages.length > 0 && !isProcessing && value.trim()) || (!autoDetect && selectedLanguages.length > 0)) && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-white/30 rounded-lg text-xs shadow-sm">
          <Languages className="w-3 h-3 text-theme-secondary-600" />
          <div className="flex items-center gap-2">
            {/* Show detected languages when available */}
            {detectedLanguages.length > 0 && !isProcessing && value.trim() && (
              <div className="flex items-center gap-1">
                <span className="text-theme-secondary-700 font-medium">Detected:</span>
                <span className="text-theme-secondary-600">
                  {detectedLanguages.slice(0, 2).map(getLanguageShortName).join(', ')}
                  {detectedLanguages.length > 2 && ` +${detectedLanguages.length - 2}`}
                </span>
              </div>
            )}

            {/* Show separator if both detected and selected are present */}
            {detectedLanguages.length > 0 && !isProcessing && value.trim() && !autoDetect && selectedLanguages.length > 0 && (
              <span className="text-theme-neutral-400">|</span>
            )}

            {/* Show selected languages when in manual mode */}
            {!autoDetect && selectedLanguages.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-theme-primary-700 font-medium">Selected:</span>
                <span className="text-theme-primary-600">
                  {getSelectedLanguagesFullDisplay()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Consolidated Language Status - Shows detection and selection */}
      {((detectedLanguages.length > 0 && !isProcessing && value.trim()) || (!autoDetect && selectedLanguages.length > 0)) && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-white/30 rounded-lg text-xs shadow-sm">
          <Languages className="w-3 h-3 text-theme-secondary-600" />
          <div className="flex items-center gap-2">
            {/* Show detected languages when available */}
            {detectedLanguages.length > 0 && !isProcessing && value.trim() && (
              <div className="flex items-center gap-1">
                <span className="text-theme-secondary-700 font-medium">Detected:</span>
                <span className="text-theme-secondary-600">
                  {detectedLanguages.slice(0, 2).map(getLanguageShortName).join(', ')}
                  {detectedLanguages.length > 2 && ` +${detectedLanguages.length - 2}`}
                </span>
              </div>
            )}

            {/* Show separator if both detected and selected are present */}
            {detectedLanguages.length > 0 && !isProcessing && value.trim() && !autoDetect && selectedLanguages.length > 0 && (
              <span className="text-theme-neutral-400">|</span>
            )}

            {/* Show selected languages when in manual mode */}
            {!autoDetect && selectedLanguages.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-theme-primary-700 font-medium">Selected:</span>
                <span className="text-theme-primary-600">
                  {getSelectedLanguagesFullDisplay()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Consolidated Language Status - Shows detection and selection */}
      {((detectedLanguages.length > 0 && !isProcessing && value.trim()) || (!autoDetect && selectedLanguages.length > 0)) && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-white/30 rounded-lg text-xs shadow-sm">
          <Languages className="w-3 h-3 text-theme-secondary-600" />
          <div className="flex items-center gap-2">
            {/* Show detected languages when available */}
            {detectedLanguages.length > 0 && !isProcessing && value.trim() && (
              <div className="flex items-center gap-1">
                <span className="text-theme-secondary-700 font-medium">Detected:</span>
                <span className="text-theme-secondary-600">
                  {detectedLanguages.slice(0, 2).map(getLanguageShortName).join(', ')}
                  {detectedLanguages.length > 2 && ` +${detectedLanguages.length - 2}`}
                </span>
              </div>
            )}

            {/* Show separator if both detected and selected are present */}
            {detectedLanguages.length > 0 && !isProcessing && value.trim() && !autoDetect && selectedLanguages.length > 0 && (
              <span className="text-theme-neutral-400">|</span>
            )}

            {/* Show selected languages when in manual mode */}
            {!autoDetect && selectedLanguages.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-theme-primary-700 font-medium">Selected:</span>
                <span className="text-theme-primary-600">
                  {getSelectedLanguagesFullDisplay()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Language Settings Dropdown */}
      <LanguageSettingsDropdown
        isOpen={!autoDetect && showLanguageSettings}
        onClose={() => setShowLanguageSettings(false)}
        controlRect={controlRect}
        controlRef={segmentedControlRef}
        detectedLanguages={detectedLanguages}
        selectedLanguages={selectedLanguages}
        supportedLanguages={supportedLanguages}
        value={value}
        onLanguageToggle={handleLanguageToggle}
        onSetSelectedLanguages={setSelectedLanguages}
        getLanguageDisplayName={getLanguageDisplayName}
      />
    </div>
  );
};
