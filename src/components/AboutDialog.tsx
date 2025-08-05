/*
 * RdLn™ - Professional Document Comparison Tool
 * Copyright (c) 2025 RdLn Team. All rights reserved.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 */

import React, { useState } from 'react';
import { Info, X, ExternalLink } from 'lucide-react';

export const AboutDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* About Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        title="About RdLn™"
        aria-label="About RdLn"
      >
        <Info size={18} className="text-current opacity-70 hover:opacity-100" />
      </button>

      {/* Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dialog */}
          <div className="glass-panel relative w-full max-w-lg rounded-xl p-6 text-current">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">About RdLn™</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-sm">
              {/* Logo and Version */}
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={window.isElectron ? "./images/rdln-logo.png" : "/images/rdln-logo.png"} 
                  alt="RdLn Logo" 
                  className="w-12 h-12 rounded-lg shadow-sm"
                />
                <div>
                  <div className="font-medium">RdLn™</div>
                  <div className="text-xs opacity-70">Version 0.5.0 Beta</div>
                </div>
              </div>

              {/* Description */}
              <p className="leading-relaxed">
                Professional document comparison tool with advanced OCR capabilities. 
                Built for legal professionals and organizations requiring precise document analysis 
                with complete confidentiality through client-side processing.
              </p>

              {/* Copyright */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="font-medium mb-2">Copyright & License</h3>
                <div className="text-xs space-y-1 opacity-80">
                  <p>© {currentYear} RdLn Team. All rights reserved.</p>
                  <p>RdLn™ is a trademark of RdLn Team.</p>
                  <p>
                    Licensed under the{' '}
                    <a 
                      href="https://www.gnu.org/licenses/agpl-3.0.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline inline-flex items-center gap-1"
                    >
                      GNU AGPL v3.0
                      <ExternalLink size={10} />
                    </a>
                  </p>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="font-medium mb-2">Legal Notice</h3>
                <div className="text-xs space-y-1 opacity-80">
                  <p>
                    This program is distributed in the hope that it will be useful, 
                    but WITHOUT ANY WARRANTY; without even the implied warranty of 
                    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
                  </p>
                  <p>
                    See the GNU Affero General Public License for more details.
                  </p>
                </div>
              </div>

              {/* Source Code Notice (AGPL Requirement) */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="font-medium mb-2">Source Code</h3>
                <div className="text-xs opacity-80">
                  <p>
                    The complete source code for this application is available under the terms 
                    of the GNU AGPL v3.0 license. For source code access and license details, 
                    please contact the RdLn Team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};