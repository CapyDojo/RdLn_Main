import React, { useRef, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Image, AlertCircle, Loader, ChevronDown, Languages } from 'lucide-react';
import { useOCR } from '../hooks/useOCR';
import { OCRLanguage } from '../types/ocr-types';
import { LanguageSettingsDropdown } from './LanguageSettingsDropdown';
import { CustomTooltip } from './CustomTooltip';
import { useLayout } from '../contexts/LayoutContext';
import { BaseComponentProps, LocalInputFileSource } from '../types/components';
import { useComponentPerformance } from '../utils/performanceUtils.tsx';
import { DEV_CONFIG } from '../config/appConfig';
import { formatPastedText, formatRtfHtmlPaste } from '../utils/paragraphFormatting';
import { analyzePasteContext, getFormattingLevel } from '../utils/pastePDFdetection';
import { useFontSize } from '../contexts/FontSizeContext';
import { FileProcessingService } from '../services/FileProcessingService';

import { trackEvent } from '../services/AnalyticsService';

// Tauri-specific helpers removed (unused)

interface TextInputPanelProps extends BaseComponentProps {
  title: string;
  value: string;
  onChange: ((value: string) => void) | ((value: string, isPasteAction?: boolean) => void);
  placeholder: string;
  disabled?: boolean;
  height?: number;
  iconEmoji?: string;
  onFileSourceChange?: (source: LocalInputFileSource | null) => void;
  linkedFileSource?: LocalInputFileSource | null;
  disconnectedFileSource?: LocalInputFileSource | null;
}

export const TextInputPanel: React.FC<TextInputPanelProps> = ({
  title,
  value,
  onChange,
  placeholder,
  disabled = false,
  height = 400,
  iconEmoji,
  onFileSourceChange,
  linkedFileSource = null,
  disconnectedFileSource = null,
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
  const panelRef = useRef<HTMLDivElement>(null);
  const [isAutoFormatEnabled, setIsAutoFormatEnabled] = useState(true);
  // Pilcrow now styled purely via theme classes (no runtime reads)
  const { fontSize } = useFontSize();
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0, width: 0, initialTop: 0, initialLeft: 0 });
  const [modalAnimated, setModalAnimated] = useState(false);
  const [isZoomUpdate, setIsZoomUpdate] = useState(false);
  const lastWindowSize = useRef({ width: window.innerWidth, height: window.innerHeight });

  // File processing service
  const fileProcessingService = useRef<FileProcessingService>(new FileProcessingService());
  const updateFileSource = useCallback((source: LocalInputFileSource | null) => {
    onFileSourceChange?.(source);
  }, [onFileSourceChange]);

  const getLocalFileSource = useCallback((file: File, fileType: LocalInputFileSource['fileType']): LocalInputFileSource | null => {
    if (!window.isElectron) {
      return null;
    }

    const fileWithPath = file as File & { path?: string };
    const filePath = window.electronAPI?.getPathForFile?.(file) || fileWithPath.path || '';
    if (!filePath) {
      return null;
    }

    return {
      filePath,
      fileName: file.name || filePath.split(/[\\/]/).pop() || 'document',
      fileType
    };
  }, []);

  const replacePanelContentFromImportedFile = useCallback((
    content: string,
    source: LocalInputFileSource | null
  ) => {
    if (onChange.length > 1) {
      (onChange as (value: string, isPasteAction?: boolean) => void)(content, true);
    } else {
      onChange(content);
    }

    updateFileSource(source ? { ...source, importedText: content } : null);

    const textarea = textareaRef.current;
    if (textarea) {
      setTimeout(() => {
        const cursorPosition = content.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
        textarea.focus();
      }, 0);
    }
  }, [onChange, updateFileSource]);

  const toggleAutoFormat = () => setIsAutoFormatEnabled(prev => !prev);

  // Removed color sync effect – colors now come from CSS variables via classes

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
          <span className="text-6xl block" role="img" aria-label="Document">⛶</span>
          <br />
          <p className="text-lg mt-2 font-sans"><i>Drop files here (supports .DOCX, .PDF, .PNG, .TXT)<br></br>or paste screenshots (Ctrl+V / Cmd+V)<br></br>for OCR in {supportedLanguages.length} languages</i></p>
        </div >
      );
    }
    return (
      <div className="text-center text-theme-neutral-400 max-w-sm">
        <br />
        <br />
        <br />
        <br />
        <span className="text-6xl mb-3 block" role="img" aria-label="Document">⛶</span>
        <br></br>
        <p className="text-lg font-sans"><i>
          Drop files here (supports .DOCX, .PDF, .PNG, .TXT)<br></br>or<br></br>Paste screenshots (Ctrl+V / Cmd+V)<br></br>for OCR in {supportedLanguages.length} languages</i>
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
    setAutoDetect,
    currentPhase,
    startTime,
    cancelOperation
  } = useOCR();

  // Shared OCR processing function for both HTML5 and Tauri file drops
  const processImageWithOCR = useCallback(async (imageFile: File) => {
    try {
      const extractedText = await performanceTracker.trackOperation('ocr_extraction', async () => {
        // Track OCR start
        trackEvent.ocrStarted('auto', 0); // Confidence is unknown at start
        return await extractTextFromImage(imageFile);
      });

      updateFileSource(null);
      onChange(value + (value ? '\n\n' : '') + extractedText);

      performanceTracker.trackMetric('ocr_result', {
        extractedLength: extractedText.length,
        fileSize: imageFile.size,
        instanceId: instanceId.current
      });
    } catch (error: any) {
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

      // Track OCR failure
      trackEvent.ocrFailed('auto', errorMessage);
    }
  }, [performanceTracker, extractTextFromImage, value, onChange, updateFileSource]);

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
    };
  }, []);

  // Tauri file drop - local event listeners with ghost OCR debugging
  useEffect(() => {
    const currentInstanceId = instanceId.current;

    // Set up local event listeners for this panel
    const handleFileProcessed = async (event: CustomEvent) => {
      const { file, panelTitle } = event.detail;

      // Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      try {
        await processImageWithOCRRef.current(file);

        // Double-check if still mounted after async operation
        if (!isMountedRef.current) {
          return;
        }

        performanceTracker.trackMetric('tauri_file_drop_success', {
          filePath: file.name,
          fileSize: file.size,
          panelTitle: title,
          instanceId: currentInstanceId
        });
      } catch (error) {
        performanceTracker.trackMetric('tauri_drop_error', {
          error: String(error),
          panelTitle: title,
          instanceId: currentInstanceId
        });
      }
    };

    const handleDocxProcessed = async (event: CustomEvent) => {
      const { content, fileName, filePath, panelTitle } = event.detail;

      // Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      try {
        replacePanelContentFromImportedFile(
          content,
          filePath ? {
            filePath,
            fileName: fileName || filePath.split(/[\\/]/).pop() || 'document.docx',
            fileType: 'docx'
          } : null
        );

        // Double-check if still mounted after async operation
        if (!isMountedRef.current) {
          return;
        }

        performanceTracker.trackMetric('tauri_docx_drop_success', {
          fileName: fileName,
          panelTitle: title,
          instanceId: currentInstanceId
        });
      } catch (error) {
        performanceTracker.trackMetric('tauri_docx_drop_error', {
          error: String(error),
          panelTitle: title,
          instanceId: currentInstanceId
        });
      }
    };

    const handleFileError = (event: CustomEvent) => {
      const { error, panelTitle } = event.detail;
      performanceTracker.trackMetric('tauri_drop_error', {
        error,
        panelTitle: title,
        instanceId: currentInstanceId
      });
    };

    // Add event listeners to this panel's div using unique instance ID
    const panelDiv = document.querySelector(`[data-instance-id="${currentInstanceId}"]`);
    if (panelDiv) {
      panelDiv.addEventListener('tauri-file-processed', handleFileProcessed as unknown as EventListener);
      panelDiv.addEventListener('tauri-docx-processed', handleDocxProcessed as unknown as EventListener);
      panelDiv.addEventListener('tauri-file-error', handleFileError as unknown as EventListener);

      return () => {
        panelDiv.removeEventListener('tauri-file-processed', handleFileProcessed as unknown as EventListener);
        panelDiv.removeEventListener('tauri-docx-processed', handleDocxProcessed as unknown as EventListener);
        panelDiv.removeEventListener('tauri-file-error', handleFileError as unknown as EventListener);
      };
    }
  }, [title, replacePanelContentFromImportedFile, performanceTracker]); // Keep deps explicit for file-source updates

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

    // Check for file attachments (including DOCX and TXT)
    const fileItems = items.filter(item => item.kind === 'file');
    const docxFileItem = fileItems.find(item => {
      // Get the file to check its type
      const file = item.getAsFile();
      if (!file) return false;
      return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.toLowerCase().endsWith('.docx');
    });

    const pdfFileItem = fileItems.find(item => {
      // Get the file to check its type
      const file = item.getAsFile();
      if (!file) return false;
      return file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');
    });

    const txtFileItem = fileItems.find(item => {
      // Get the file to check its type
      const file = item.getAsFile();
      if (!file) return false;
      return file.type === 'text/plain' ||
        file.name.toLowerCase().endsWith('.txt');
    });

    // Get plain text content for analysis
    const plainText = textItem ? e.clipboardData.getData('text/plain') : '';
    const normalizedText = plainText.replace(/\r\n/g, '\n');

    // Analyze paste context to determine if content was originally formatted
    const pasteContext = analyzePasteContext(items, normalizedText);

    performanceTracker.trackMetric('paste_operation', {
      hasImage: !!imageItem,
      hasText: !!textItem,
      hasDocx: !!docxFileItem,
      hasPdf: !!pdfFileItem,
      hasTxt: !!txtFileItem,
      itemCount: items.length,
      sourceType: pasteContext.sourceType,
      detectedSource: pasteContext.detectedSource
    });

    // Track document upload via paste
    if (imageItem) {
      trackEvent.documentUpload('paste', 'image');
    } else if (docxFileItem) {
      trackEvent.documentUpload('paste', 'docx');
    } else if (pdfFileItem) {
      trackEvent.documentUpload('paste', 'pdf');
    } else if (txtFileItem) {
      trackEvent.documentUpload('paste', 'txt');
    } else if (textItem) {
      trackEvent.documentUpload('paste', 'text');
    }

    // Process DOCX file if present
    if (docxFileItem) {
      e.preventDefault();
      try {
        const docxFile = docxFileItem.getAsFile();
        if (!docxFile) return;

        const result = await fileProcessingService.current.processFile(docxFile);
        const localFileSource = getLocalFileSource(docxFile, 'docx');
        replacePanelContentFromImportedFile(result.content, localFileSource);
        return; // Exit after processing DOCX
      } catch (error: any) {
        console.error('DOCX processing failed:', error);
        // Show error to user
        alert(error.message || 'Failed to process DOCX file from clipboard. Please try another file.');
        performanceTracker.trackMetric('docx_paste_error', { error: error.message });
        return;
      }
    }

    // Process PDF file if present
    if (pdfFileItem) {
      e.preventDefault();
      try {
        const pdfFile = pdfFileItem.getAsFile();
        if (!pdfFile) return;

        const result = await fileProcessingService.current.processFile(pdfFile);
        replacePanelContentFromImportedFile(result.content, getLocalFileSource(pdfFile, 'pdf'));
        return; // Exit after processing PDF
      } catch (error: any) {
        console.error('PDF processing failed:', error);
        // Show error to user
        alert(error.message || 'Failed to process PDF file from clipboard. Please try another file.');
        performanceTracker.trackMetric('pdf_paste_error', { error: error.message });
        return;
      }
    }

    // Process TXT file if present
    if (txtFileItem) {
      e.preventDefault();
      try {
        const txtFile = txtFileItem.getAsFile();
        if (!txtFile) return;

        const result = await fileProcessingService.current.processFile(txtFile);
        replacePanelContentFromImportedFile(result.content, getLocalFileSource(txtFile, 'txt'));
        return; // Exit after processing TXT
      } catch (error: any) {
        console.error('TXT processing failed:', error);
        // Show error to user
        alert(error.message || 'Failed to process TXT file from clipboard. Please try another file.');
        performanceTracker.trackMetric('txt_paste_error', { error: error.message });
        return;
      }
    }

    if (textItem && !imageItem) {
      e.preventDefault();

      // Use intelligent format detection to determine formatting level
      const formatLevel = getFormattingLevel(pasteContext, isAutoFormatEnabled);

      updateFileSource(null);
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
  }, [performanceTracker, extractTextFromImage, onChange, isAutoFormatEnabled, getLocalFileSource, updateFileSource, replacePanelContentFromImportedFile]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    const docxFile = files.find(file =>
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    );
    const pdfFile = files.find(file =>
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    );
    const txtFile = files.find(file =>
      file.type === 'text/plain' ||
      file.name.toLowerCase().endsWith('.txt')
    );

    performanceTracker.trackMetric('drop_operation', {
      fileCount: files.length,
      hasImage: !!imageFile,
      hasDocx: !!docxFile,
      hasPdf: !!pdfFile,
      hasTxt: !!txtFile
    });

    // Track document upload
    if (imageFile) {
      trackEvent.documentUpload('drag_drop', imageFile.type);
    } else if (docxFile) {
      trackEvent.documentUpload('drag_drop', 'docx');
    } else if (pdfFile) {
      trackEvent.documentUpload('drag_drop', 'pdf');
    } else if (txtFile) {
      trackEvent.documentUpload('drag_drop', 'txt');
    }

    // Process DOCX file if present
    if (docxFile) {
      try {
        const result = await fileProcessingService.current.processFile(docxFile);
        const localFileSource = getLocalFileSource(docxFile, 'docx');
        replacePanelContentFromImportedFile(result.content, localFileSource);
        return; // Exit after processing DOCX
      } catch (error: any) {
        console.error('DOCX processing failed:', error);
        // Show error to user
        alert(error.message || 'Failed to process DOCX file. Please try another file.');
        performanceTracker.trackMetric('docx_error', { error: error.message });
        return;
      }
    }

    // Process PDF file if present
    if (pdfFile) {
      try {
        const result = await fileProcessingService.current.processFile(pdfFile);
        replacePanelContentFromImportedFile(result.content, getLocalFileSource(pdfFile, 'pdf'));
        return; // Exit after processing PDF
      } catch (error: any) {
        console.error('PDF processing failed:', error);
        // Show error to user
        alert(error.message || 'Failed to process PDF file. Please try another file.');
        performanceTracker.trackMetric('pdf_error', { error: error.message });
        return;
      }
    }

    // Process TXT file if present
    if (txtFile) {
      try {
        const result = await fileProcessingService.current.processFile(txtFile);
        replacePanelContentFromImportedFile(result.content, getLocalFileSource(txtFile, 'txt'));
        return; // Exit after processing TXT
      } catch (error: any) {
        console.error('TXT processing failed:', error);
        // Show error to user
        alert(error.message || 'Failed to process TXT file. Please try another file.');
        performanceTracker.trackMetric('txt_error', { error: error.message });
        return;
      }
    }

    // Process image file if present (existing OCR functionality)
    if (imageFile) {
      await processImageWithOCR(imageFile);
    }
  }, [performanceTracker, processImageWithOCR, onChange, getLocalFileSource, updateFileSource, replacePanelContentFromImportedFile]);

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
      rus: 'RU',
      osd: 'OSD'
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

  // Calculate modal position relative to this panel (getBoundingClientRect handles zoom/scroll automatically)
  const calculateModalPosition = useCallback(() => {
    if (!panelRef.current || !textareaRef.current) return { top: 100, left: 20, width: 400, initialTop: 100, initialLeft: 20 };

    // getBoundingClientRect() automatically accounts for zoom and scroll
    const panelRect = panelRef.current.getBoundingClientRect();
    const textareaRect = textareaRef.current.getBoundingClientRect();

    return {
      // Final position: below the header
      top: panelRect.top + 80,
      left: panelRect.left + 10,
      width: panelRect.width - 20,
      // Initial position: center of textarea for animation
      initialTop: textareaRect.top + textareaRect.height / 2,
      initialLeft: textareaRect.left + textareaRect.width / 2
    };
  }, []);

  // Update modal position (for scroll/zoom events) - like tooltip's updateTooltipPosition
  const updateModalPosition = useCallback(() => {
    if (!isProcessing) return;

    const position = calculateModalPosition();
    setModalPosition(position);
  }, [isProcessing, calculateModalPosition]);

  // Update modal position when OCR starts
  useEffect(() => {
    if (isProcessing && panelRef.current && textareaRef.current) {
      const position = calculateModalPosition();
      setModalPosition(position);
      setModalAnimated(false);

      // Trigger animation to final position after a short delay
      setTimeout(() => {
        setModalAnimated(true);
      }, 100);
    } else {
      setModalAnimated(false);
    }
  }, [isProcessing, calculateModalPosition]);

  // Handle scroll/zoom/resize events to maintain proper positioning (like CustomTooltip)
  useEffect(() => {
    const handleScroll = () => {
      setIsZoomUpdate(false); // Scroll = bouncy animation
      updateModalPosition();
    };

    const handleResize = () => {
      // Detect if this is a zoom (window size changed) vs window resize
      const currentSize = { width: window.innerWidth, height: window.innerHeight };
      const sizeChanged = currentSize.width !== lastWindowSize.current.width ||
        currentSize.height !== lastWindowSize.current.height;

      if (sizeChanged) {
        setIsZoomUpdate(true); // Zoom = no animation
        lastWindowSize.current = currentSize;
      } else {
        setIsZoomUpdate(false); // Regular resize = bouncy animation
      }

      updateModalPosition();

      // Reset zoom flag after update
      setTimeout(() => setIsZoomUpdate(false), 50);
    };

    // Add event listeners when modal is visible
    if (isProcessing) {
      // For fixed positioning, we need to track when elements move in viewport
      // This happens during window scroll, resize, or internal container scroll

      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });

      // Find and listen to all scrollable containers in the app (same as tooltip)
      const scrollableContainers: HTMLElement[] = [];

      // App-specific scroll containers based on useScrollSync patterns
      const containerSelectors = [
        '[data-panel-id] .glass-panel-inner-content', // Desktop Option C layout
        '[data-panel-id][data-input-panel]',          // Mobile layout wrapper
        '[data-panel-id] textarea',                   // Textarea scroll
        '.scroll-container',                          // General scroll containers
        '[data-testid="scroll-container"]'            // Test scroll containers
      ];

      containerSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        elements.forEach(element => {
          // Only add if it's actually scrollable
          if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
            scrollableContainers.push(element);
          }
        });
      });

      // Add scroll listeners to all detected scrollable containers
      scrollableContainers.forEach(container => {
        container.addEventListener('scroll', handleScroll, { passive: true });
      });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);

        // Clean up container scroll listeners
        scrollableContainers.forEach(container => {
          container.removeEventListener('scroll', handleScroll);
        });
      };
    }
  }, [isProcessing, updateModalPosition]);

  return (
    <div
      ref={panelRef}
      className="glass-panel glass-content-panel overflow-hidden transition-all duration-300"
      style={style}
      data-text-input-panel
      data-panel-title={title}
      data-instance-id={instanceId.current}
    >
      <div className="glass-panel-header-footer px-4 py-3 flex items-start justify-between relative">
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-theme-neutral-300 to-transparent"></div>
        <div className="flex items-start gap-2">
          <div className="pt-1">
            {iconEmoji ? (
              <span className="text-3.5xl" role="img" aria-label="Input panel">{iconEmoji}</span>
            ) : (
              <FileText className="w-5 h-5 text-theme-primary-900" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="!text-2.5xl font-semibold text-theme-primary-900">{title}</h3>
            {linkedFileSource && (
              <div
                className="inline-flex max-w-full items-start gap-2 rounded-2xl border border-theme-primary-200/70 bg-theme-primary-50/90 px-3 py-2 text-xs font-medium leading-5 text-theme-primary-900"
                title={`Linked source file: ${linkedFileSource.fileName}`}
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="break-all">{title.replace(/&nbsp;|\s+/g, ' ').trim()}: {linkedFileSource.fileName}</span>
              </div>
            )}
            {!linkedFileSource && disconnectedFileSource && (
              <div className="max-w-full space-y-2">
                <div
                  className="inline-flex max-w-full items-start gap-2 rounded-2xl border border-amber-300/80 bg-amber-50/95 px-3 py-2 text-xs font-medium leading-5 text-amber-900"
                  title={`Edited after import: ${disconnectedFileSource.fileName}`}
                >
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="break-all">{title.replace(/&nbsp;|\s+/g, ' ').trim()}: {disconnectedFileSource.fileName}</span>
                  <span className="rounded-full bg-amber-200/90 px-2 py-0.5 text-[10px] uppercase tracking-wide">Edited</span>
                </div>
                <div className="text-xs leading-5 text-amber-900">
                  Text was edited in RdLn. Word native compare requires the original local source files.
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <CustomTooltip
              content={`Enable when pasting broken PDF paragraphs. \n\n RdLn will fix them for you!\n`}
              status={isAutoFormatEnabled ? 'ON' : 'OFF'}
            >
              <button
                onClick={toggleAutoFormat}
                className={`flex items-center justify-center w-14 h-12 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] active:shadow-inner active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary-400/60 ${isAutoFormatEnabled
                  ? 'bg-theme-primary-700 border-transparent hover:shadow-lg hover:shadow-theme-accent-200/30 shadow-theme-accent-200/20'
                  : 'bg-theme-neutral-900/20 dark:bg-theme-neutral-100/5 border-theme-neutral-600/50 dark:border-theme-neutral-400/40 hover:border-theme-neutral-500/70 dark:hover:border-theme-neutral-300/60 hover:bg-theme-neutral-800/25 dark:hover:bg-theme-neutral-100/10'}`}
                aria-pressed={isAutoFormatEnabled}
                aria-label={`Auto paragraph formatting ${isAutoFormatEnabled ? 'on' : 'off'}`}
              >
                {/* Stylized sparkles + pilcrow with better contrast */}
                <span className="inline-flex items-center leading-none">
                  <span
                    className="mr-0 select-none"
                    style={{ fontSize: '14px', marginLeft: '-2px' }}
                    aria-hidden="true"
                  >
                    ✨
                  </span>
                  <span
                    className={`select-none transition-all duration-300 transform ${isAutoFormatEnabled
                      ? 'scale-110 text-pilcrow-on'
                      : 'scale-90 opacity-30 text-pilcrow-off'}`}
                    style={{
                      fontSize: '28px',
                      fontWeight: 900,
                      lineHeight: 1,
                      marginRight: '2px'
                    }}
                  >
                    ¶
                  </span>
                </span>
              </button>
            </CustomTooltip>
            {isAutoFormatEnabled && (
              <span
                className="absolute w-2 h-2 rounded-full animate-pulse"
                style={{
                  backgroundColor: 'var(--autoformat-pilcrow-on)',
                  top: '2px',
                  right: '2px'
                }}
                aria-hidden="true"
              />
            )}
          </div>


          {isProcessing && (
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 text-theme-primary-600 animate-spin" />
              <span className="text-sm text-theme-primary-600">Processing... {progress}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* OCR Language Segmented Control */}
          <div className="flex flex-col items-center gap-0">
            <span className="text-sm font-medium text-theme-neutral-700 hidden sm:block mb-1 text-center">OCR Languages</span>
            <div className="segmented-control relative z-[10001]" ref={segmentedControlRef} role="group" aria-label="OCR Language Detection Mode">
              <CustomTooltip content="Automatically detect document language" placement="bottom-left" status={autoDetect ? 'ON' : 'OFF'}>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    setAutoDetect(true);
                    setShowLanguageSettings(false); // Always close dropdown when switching to Auto
                  }}

                  className={`segment ${autoDetect ? 'active' : ''}`}
                  aria-pressed={autoDetect}
                  aria-label="Automatic language detection"
                >
                  🤖 Auto
                </button>
              </CustomTooltip>
              <CustomTooltip
                content={`Manually select OCR languages${!autoDetect && selectedLanguages.length > 0 ? ` - ${selectedLanguages.length} ${selectedLanguages.length === 1 ? 'language' : 'languages'} selected` : ''}`}
                placement="bottom-left"
              >
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
              </CustomTooltip>
              <div className={`sliding-indicator ${autoDetect ? 'to-left' : 'to-right'}`} aria-hidden="true"></div>
            </div>

            {/* Show dropdown arrow when manual mode */}
          </div>
        </div>
      </div>






      <div
        className="glass-panel-inner-content overflow-y-auto"
        style={{
          height: `${height - 70}px`, // FIXED: Always use fixed height so container can scroll when textarea content exceeds height
          minHeight: '200px', // Minimum usable height
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
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
          className="glass-input-field user-text-area user-input-typography w-full py-6 px-8 resize-none focus:ring-2 focus:ring-theme-primary-500 focus:border-transparent text-theme-neutral-800 disabled:cursor-not-allowed transition-colors border-0 bg-transparent"
          style={{
            minHeight: '200px',
            lineHeight: '2',
            height: 'auto', // Allow textarea to grow
            overflow: 'hidden' // Hide textarea scrollbar - container will scroll instead
          }}
        />


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

      {/* OCR Progress Modal - Rendered as Portal like tooltips */}
      {isProcessing && currentPhase && createPortal(
        <div
          className="glass-panel py-1.5 rounded-lg text-xs font-medium bg-theme-neutral-50/95 text-theme-primary-800 shadow-xl backdrop-blur-md border border-theme-neutral-200/50 shadow-theme-primary-900/20 p-5"
          style={{
            position: 'fixed',
            top: modalAnimated ? `${modalPosition.top}px` : `${modalPosition.initialTop}px`,
            left: modalAnimated ? `${modalPosition.left}px` : `${modalPosition.initialLeft}px`,
            width: modalAnimated ? `${modalPosition.width}px` : '0px',
            transform: modalAnimated ? 'scale(1)' : 'scale(0)',
            transformOrigin: 'center',
            // Slightly reduced bounce for scroll/initial spawn, no transition for zoom
            transition: isZoomUpdate ? 'none' : 'all 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)',
            opacity: modalAnimated ? 1 : 0,
            zIndex: 9000, // Under RdLnMemorySidePanel (9999) and ThemeSelector (10000)
            pointerEvents: 'all'
          }}
        >
          {/* Simplified Progress Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Simple Extraction Icon */}
            <div className="relative flex-shrink-0 mt-1">
              <div className="relative">
                <div className="w-7 h-7 bg-gradient-to-r from-theme-primary-500 to-theme-primary-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                  <Image className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -inset-1 bg-theme-primary-400/30 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Progress Information */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-theme-neutral-800">
                    Text Extraction
                  </h4>
                  <span className="text-xs bg-gradient-to-r from-theme-primary-100 to-theme-primary-50 text-theme-primary-700 px-2.5 py-1 rounded-full font-medium border border-theme-primary-200">
                    {currentPhase.subPhase.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-theme-neutral-700 font-mono font-semibold">
                    {progress}%
                  </span>
                  {currentPhase.cancellable && (
                    <button
                      onClick={cancelOperation}
                      className="text-xs text-theme-neutral-400 hover:text-red-600 px-2.5 py-1.5 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium border border-transparent hover:border-red-200"
                      title="Cancel OCR operation"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Description with Time */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <p className="text-xs text-theme-neutral-600 leading-relaxed flex-1">
                  {currentPhase.description}
                </p>
                {currentPhase.estimatedTimeRemaining && currentPhase.estimatedTimeRemaining > 1000 && (
                  <div className="flex items-center gap-1.5 bg-theme-neutral-100 px-2 py-1 rounded-md">
                    <div className="w-1.5 h-1.5 bg-theme-primary-500 rounded-full animate-pulse" />
                    <span className="text-xs text-theme-neutral-600 font-mono whitespace-nowrap">
                      {currentPhase.estimatedTimeRemaining > 60000 ?
                        `~${Math.ceil(currentPhase.estimatedTimeRemaining / 60000)}m` :
                        `~${Math.ceil(currentPhase.estimatedTimeRemaining / 1000)}s`
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Simplified Progress Bar */}
              <div className="relative">
                {/* Progress Background */}
                <div className="relative w-full h-4 bg-theme-neutral-100 rounded-full overflow-hidden shadow-inner border border-theme-neutral-200">
                  {/* Dynamic Progress Fill with Gradient */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-theme-primary-500 via-theme-primary-600 to-theme-secondary-500 shadow-sm"
                    style={{ width: `${progress}%` }}
                  >
                    {/* Animated Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_ease-in-out_infinite] rounded-full" />

                    {/* Progress Highlight */}
                    <div className="absolute right-0 top-0 w-3 h-full bg-white/40 rounded-r-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Language Detection Results - Removed to simplify UI */}

          {/* Smart Performance Dashboard */}
          {startTime && (
            <div className="flex items-center justify-between pt-3 border-t border-theme-neutral-200/50 mt-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-theme-neutral-600">
                  ⏱️ {Math.ceil((Date.now() - startTime) / 1000)}s elapsed
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${(Date.now() - startTime) < 10000 ? 'bg-green-400' :
                    (Date.now() - startTime) < 20000 ? 'bg-yellow-400' : 'bg-orange-400'
                    }`} />
                  <span className="text-xs text-theme-neutral-600 font-medium">
                    {(Date.now() - startTime) < 10000 ? 'Fast' :
                      (Date.now() - startTime) < 20000 ? 'Normal' : 'Slower than usual'}
                  </span>
                </div>
              </div>

              {/* Live Processing Rate */}
              <div className="text-xs text-theme-neutral-500">
                📈 {(progress / ((Date.now() - startTime) / 1000)).toFixed(1)}% per sec
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default TextInputPanel;


