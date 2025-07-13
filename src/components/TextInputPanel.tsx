import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { FileText, Image, AlertCircle, Loader, ChevronDown, Languages } from 'lucide-react';
import { MagicWand, Sparkles } from '../icons';
import { useOCR } from '../hooks/useOCR';
import { OCRLanguage } from '../types/ocr-types';
import { LanguageSettingsDropdown } from './LanguageSettingsDropdown';
import { useLayout } from '../contexts/LayoutContext';
import { BaseComponentProps } from '../types/components';
import { useComponentPerformance } from '../utils/performanceUtils.tsx';
import { formatPastedText } from '../utils/paragraphFormatting';

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

  const handleReconstructParagraphs = () => {
    const reconstructed = formatPastedText(value);
    if (onChange.length > 1) {
      (onChange as (value: string, isPasteAction?: boolean) => void)(reconstructed, false);
    } else {
      onChange(reconstructed);
    }
  };

  const segmentedControlRef = useRef<HTMLDivElement>(null);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [controlRect, setControlRect] = useState<DOMRect | null>(null);
  
  // Detect layout to conditionally apply dynamic scaling behavior
  const { currentLayout } = useLayout();
  const isDynamicScaling = currentLayout === 'option-c' || currentLayout === 'current';
  
  
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
  

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    const textItem = items.find(item => item.type.startsWith('text/plain'));
    
    // Track paste operation type
    performanceTracker.trackMetric('paste_operation', {
      hasImage: !!imageItem,
      hasText: !!textItem,
      itemCount: items.length
    });
    
    if (textItem && !imageItem) {
      e.preventDefault(); // Prevent default paste

      // Get the plain text from the clipboard.
      const plainText = e.clipboardData.getData('text/plain');

      // CRITICAL: Normalize line endings to ensure consistent behavior.
      const normalizedText = plainText.replace(/\r\n/g, '\n');

      // Use the proven formatter, just like in SmartPasteTest.tsx.
      const formattedText = formatPastedText(normalizedText);

      // Insert the formatted text at the current cursor position
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = value;
        const newValue = currentValue.substring(0, start) + formattedText + currentValue.substring(end);

        if (onChange.length > 1) {
          (onChange as (value: string, isPasteAction?: boolean) => void)(newValue, true);
        } else {
          onChange(newValue);
        }

        // Set cursor position after the newly inserted text
        setTimeout(() => {
          const newCursorPos = start + formattedText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      } else {
        // Fallback if the ref is not available for some reason
        onChange(value + formattedText);
      }
    }
    
    if (imageItem) {
      e.preventDefault();
      
      try {
        const imageFile = imageItem.getAsFile();
        if (!imageFile) return;

        // Track OCR operation
        const extractedText = await performanceTracker.trackOperation('ocr_extraction', async () => {
          return await extractTextFromImage(imageFile);
        });
        
        performanceTracker.trackMetric('ocr_result', {
          extractedLength: extractedText.length,
          imageSize: imageFile.size
        });
        
        // Insert extracted text at cursor position or append to existing text
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const currentValue = value;
          
          const newValue = 
            currentValue.substring(0, start) + 
            (start > 0 && currentValue[start - 1] !== '\n' ? '\n\n' : '') +
            extractedText + 
            (end < currentValue.length && currentValue[end] !== '\n' ? '\n\n' : '') +
            currentValue.substring(end);
          
          // Use enhanced onChange to trigger auto-compare
          if (onChange.length > 1) {
            (onChange as (value: string, isPasteAction?: boolean) => void)(newValue, true);
          } else {
            onChange(newValue);
          }
          
          // Set cursor position after inserted text
          setTimeout(() => {
            const newCursorPos = start + extractedText.length + (start > 0 ? 2 : 0);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
          }, 0);
        } else {
          // Fallback: append to existing text
          const newValue = value + (value ? '\n\n' : '') + extractedText;
          if (onChange.length > 1) {
            (onChange as (value: string, isPasteAction?: boolean) => void)(newValue, true);
          } else {
            onChange(newValue);
          }
        }
      } catch (error) {
        console.error('OCR failed:', error);
        performanceTracker.trackMetric('ocr_error', { error: error.message });
      }
    }
  }, [performanceTracker, extractTextFromImage, value, onChange]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    performanceTracker.trackMetric('drop_operation', {
      fileCount: files.length,
      hasImage: !!imageFile
    });
    
    if (imageFile) {
      try {
        const extractedText = await performanceTracker.trackOperation('ocr_drop', async () => {
          return await extractTextFromImage(imageFile);
        });
        
        onChange(value + (value ? '\n\n' : '') + extractedText);
        
        performanceTracker.trackMetric('drop_ocr_result', {
          extractedLength: extractedText.length,
          fileSize: imageFile.size
        });
      } catch (error) {
        console.error('OCR failed:', error);
        performanceTracker.trackMetric('drop_ocr_error', { error: error.message });
      }
    }
  }, [performanceTracker, extractTextFromImage, value, onChange]);

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

  return (
    <div className="glass-panel glass-content-panel overflow-hidden shadow-lg transition-all duration-300">
      <div className="glass-panel-header-footer px-4 py-3 border-b border-theme-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {iconEmoji ? (
            <span className="text-xl" role="img" aria-label="Input panel">{iconEmoji}</span>
          ) : (
            <FileText className="w-5 h-5 text-theme-primary-900" />
          )}
          <h3 className="text-lg font-semibold text-theme-primary-900">{title}</h3>
          <button
            onClick={handleReconstructParagraphs}
            className="flex items-center justify-center p-2 rounded-lg bg-theme-neutral-100/70 backdrop-blur-sm border border-transparent hover:border-theme-neutral-300/50 transition-colors duration-200"
            title="Reconstruct Paragraphs"
          >
            <Sparkles />
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
            <span className="text-sm font-medium text-theme-neutral-700 hidden sm:inline">OCR Language</span>
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
                ⚙️ Manual
                {!autoDetect && selectedLanguages.length > 0 && (
                  <span className="text-xs bg-theme-primary-100 text-theme-primary-800 px-1.5 py-0.5 rounded-full ml-1">
                    {selectedLanguages.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    showLanguageSettings ? 'rotate-180' : ''
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

      

      
      

      <div className="glass-panel-inner-content relative" style={isDynamicScaling ? { minHeight: '200px' } : { height: `${height}px`, minHeight: '200px' }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            // Try to call enhanced onChange if it exists, otherwise use regular onChange
            try {
              onChange(newValue);
            } catch (error) {
              // Fallback to regular onChange if enhanced version doesn't work
              onChange(newValue);
            }
          }}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          placeholder={isProcessing ? '' : placeholder}
          disabled={disabled || isProcessing}
          className={`glass-input-field w-full py-6 px-8 resize-none focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent font-serif text-theme-neutral-800 leading-relaxed disabled:cursor-not-allowed transition-colors libertinus-math-text border-0 bg-transparent ${
            isDynamicScaling ? '' : 'h-full'
          }`}
          style={isDynamicScaling ? {} : { height: '100%' }}
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
            <div className="text-center text-theme-neutral-400 max-w-sm">
              <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-1 font-serif libertinus-math-placeholder">Paste text or screenshot</p>
              
              <p className="text-sm font-serif libertinus-math-placeholder"><i>
                Take a screenshot and paste (Ctrl+V) to</i>   
              </p>
              <p className="text-sm font-serif libertinus-math-placeholder">
                <i>extract text with OCR</i>             
              </p>
              <br></br>
              <p className="text-xs mt-1 text-theme-primary-400 font-serif libertinus-math-placeholder">
                <i>Supports {supportedLanguages.length} languages including Chinese, German, French, Arabic, Japanese, Korean & more</i>
              </p>
            </div>
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
                  {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''}
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
                  {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''}
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
                  {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''}
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
