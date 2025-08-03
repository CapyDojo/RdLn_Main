import React, { useState, useEffect } from 'react';

interface DebugMessage {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const OCRDebugPanel: React.FC = () => {
  const [messages, setMessages] = useState<DebugMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Override console methods to capture OCR debug messages
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addMessage = (level: DebugMessage['level'], ...args: any[]) => {
      const message = args.join(' ');
      // Only capture OCR-related messages
      if (message.includes('🔧') || message.includes('✅') || message.includes('⚠️') || 
          message.includes('❌') || message.includes('OCR') || message.includes('Tesseract') ||
          message.includes('TAURI') || message.includes('tessdata')) {
        
        const debugMessage: DebugMessage = {
          timestamp: new Date().toLocaleTimeString(),
          level,
          message
        };
        
        setMessages(prev => [...prev.slice(-19), debugMessage]); // Keep last 20 messages
      }
    };

    console.log = (...args) => {
      originalLog(...args);
      addMessage('info', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addMessage('warning', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      addMessage('error', ...args);
    };

    // Add initial message
    addMessage('info', '🔧 OCR Debug Panel initialized');

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const getLevelColor = (level: DebugMessage['level']) => {
    switch (level) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const clearMessages = () => setMessages([]);

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
        title="Toggle OCR Debug Panel"
      >
        🔧 Debug {messages.length > 0 && `(${messages.length})`}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed top-16 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg z-40 overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center">
            <h3 className="font-semibold text-sm">OCR Debug Console</h3>
            <div className="flex gap-2">
              <button
                onClick={clearMessages}
                className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              >
                Clear
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-xs bg-red-200 px-2 py-1 rounded hover:bg-red-300"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-2 max-h-80 overflow-y-auto text-xs font-mono">
            {messages.length === 0 ? (
              <div className="text-gray-500 italic">No OCR debug messages yet...</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`mb-1 ${getLevelColor(msg.level)}`}>
                  <span className="text-gray-400">[{msg.timestamp}]</span> {msg.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};