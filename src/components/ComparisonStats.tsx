import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, FileText, ChevronDown, ChevronUp, Type, Hash, AlertTriangle, CheckCircle, Info, TrendingUp, HelpCircle } from 'lucide-react';
import { CustomTooltip } from './CustomTooltip';
import { BaseComponentProps } from '../types/components';
import { ComparisonStats as ComparisonStatsType } from '../types';

interface ComparisonStatsProps extends BaseComponentProps {
  stats: ComparisonStatsType;
}

// Impact classification for legal document changes
const getImpactLevel = (percentageChanged: number): 'low' | 'medium' | 'high' => {
  if (percentageChanged <= 10) return 'low';
  if (percentageChanged <= 30) return 'medium';
  return 'high';
};

const getImpactColor = (level: 'low' | 'medium' | 'high') => {
  switch (level) {
    case 'low': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' };
    case 'medium': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' };
    case 'high': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' };
  }
};

const getImpactIcon = (level: 'low' | 'medium' | 'high') => {
  switch (level) {
    case 'low': return CheckCircle;
    case 'medium': return Info;
    case 'high': return AlertTriangle;
  }
};

// Tooltip Component for Legal Explanations
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10 // Position above the trigger
      });
    }
    setIsVisible(true);
  };

  const tooltipPortal = isVisible ? createPortal(
    <div
      className="fixed pointer-events-none z-[99999]"
      style={{
        left: position.x - 144, // Center the 288px wide tooltip (144px offset)
        top: position.y,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="px-3 py-2 text-xs bg-gray-900 text-white rounded-lg shadow-xl w-72 max-w-sm pointer-events-auto">
        <div className="text-center leading-relaxed">{content}</div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div ref={triggerRef} className={`relative inline-block ${className}`}>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsVisible(false)}
          className="cursor-help"
        >
          {children}
        </div>
      </div>
      {tooltipPortal}
    </>
  );
};

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showText?: boolean;
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 60,
  strokeWidth = 6,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showText = true,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export const ComparisonStats: React.FC<ComparisonStatsProps> = ({
  stats,
  style,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const total = stats.additions + stats.deletions + stats.unchanged;
  const additionPercent = total > 0 ? (stats.additions / total) * 100 : 0;
  const deletionPercent = total > 0 ? (stats.deletions / total) * 100 : 0;

  // Calculate impact level and colors
  const impactPercentage = stats.wordStats?.percentageChanged ||
    (stats.totalChanges > 0 ? ((stats.totalChanges / total) * 100) : 0);
  const impactLevel = getImpactLevel(impactPercentage);
  const impactColors = getImpactColor(impactLevel);
  const ImpactIcon = getImpactIcon(impactLevel);

  const reviewWorkload = stats.wordStats?.reviewWorkload || stats.totalChanges;
  // The output document size should be unchanged + added (not total from input)
  const documentSize = stats.wordStats ? 
    (stats.wordStats.unchangedWords + stats.wordStats.addedWords) : 
    (stats.unchanged + stats.additions);
  const sizeLabel = stats.wordStats ? 'words' : 'elements';

  return (
    <div className={`space-y-4 w-full max-w-6xl mx-auto ${className || ''}`} style={style}>
      {/* Executive Summary Card */}
      <div className="glass-panel border border-theme-neutral-300 rounded-xl shadow-lg">
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center mb-4 relative">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-3xl" role="img" aria-label="Analysis panel">📊</span>
              <h3 className="text-2xl font-semibold text-theme-primary-900">Comparison Analysis</h3>
            </div>
            <div className="flex-1 flex justify-center">
              <Tooltip content={`${impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1)} Impact: ${impactLevel === 'low' ? 'Minor changes (≤10%), routine review recommended' : impactLevel === 'medium' ? 'Moderate changes (11-30%), careful review recommended' : 'Significant changes (>30%), thorough analysis recommended'}`}>
                <div className="glass-panel flex items-center gap-2 px-3 py-2 rounded-lg border border-theme-neutral-300 cursor-help">
                  <ImpactIcon className="w-4 h-4 text-theme-primary-600" />
                  <span className="text-sm font-medium text-theme-primary-900 capitalize">
                    {impactLevel} Impact
                  </span>
                  <HelpCircle className="w-3 h-3 text-theme-neutral-500 opacity-60" />
                </div>
              </Tooltip>
            </div>
            <div className="flex-1"></div>
          </div>
        </div>
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-theme-neutral-300 to-transparent mb-4 -mx-6" style={{ width: 'calc(100% + 3.9rem)' }}></div>
        <div className="px-6 pb-6">
          {/* Quick Action Summary */}
          <div className="grid grid-cols-3 items-center">
            <div className="col-start-2 flex justify-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-theme-primary-700 hover:bg-theme-primary-50 rounded-lg transition-colors duration-200"
              >
                <TrendingUp className="w-4 h-4" />
                {isExpanded ? 'Hide Details' : 'View Detailed Analysis'}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex justify-end items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-theme-neutral-600">
                  +{(stats.wordStats?.addedWords || stats.additions).toLocaleString()} added
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-theme-neutral-600">
                  -{(stats.wordStats?.deletedWords || stats.deletions).toLocaleString()} removed
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid - shown when expanded */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-theme-neutral-200">
              {/* Review Workload */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex items-center rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-4">
                      <Plus className="w-5 h-5" />
                      <span className="font-semibold text-base">
                        {(stats.wordStats?.addedWords || stats.additions).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 px-4 py-4">
                      <Minus className="w-5 h-5" />
                      <span className="font-semibold text-base">
                        {(stats.wordStats?.deletedWords || stats.deletions).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-theme-accent-700">{reviewWorkload.toLocaleString()}</p>
                  <Tooltip content="The total amount of content requiring review: all additions and deletions combined.">
                    <p className="text-sm text-theme-neutral-600 flex items-center gap-1">
                      Review workload ({sizeLabel})
                      <HelpCircle className="w-3 h-3 opacity-60" />
                    </p>
                  </Tooltip>
                </div>
              </div>

              {/* Document Size */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-4 bg-theme-primary-50 rounded-full">
                    <FileText className="w-8 h-8 text-theme-primary-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-theme-primary-700">{documentSize.toLocaleString()}</p>
                  <Tooltip content="The size of the final document after applying all changes (unchanged content + additions).">
                    <p className="text-sm text-theme-neutral-600 flex items-center gap-1">
                      Final document size ({sizeLabel})
                      <HelpCircle className="w-3 h-3 opacity-60" />
                    </p>
                  </Tooltip>
                </div>
              </div>

              {/* Change Impact */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <CircularProgress
                    percentage={impactPercentage}
                    color={impactLevel === 'low' ? '#059669' : impactLevel === 'medium' ? '#d97706' : '#dc2626'}
                    size={80}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-theme-primary-700">{impactPercentage.toFixed(1)}%</p>
                  <Tooltip content="The percentage of the total output content that has been modified. Use this to assess overall scope of modifications.">
                    <p className="text-sm text-theme-neutral-600 flex items-center gap-1">
                      Overall modification rate
                      <HelpCircle className="w-3 h-3 opacity-60" />
                    </p>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Analysis Section */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Additions and Deletions Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Additions Section */}
            <div className="glass-panel bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Plus className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 text-lg">Additions</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-green-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-700">{stats.additions}</div>
                  <div className="text-sm" style={{ color: '#059669' }}>Blocks</div>
                </div>
                {stats.wordStats && (
                  <div className="bg-green-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-700">{stats.wordStats.addedWords.toLocaleString()}</div>
                    <div className="text-sm" style={{ color: '#059669' }}>Words</div>
                  </div>
                )}
                {stats.characterStats && (
                  <div className="bg-green-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-700">{stats.characterStats.addedCharacters.toLocaleString()}</div>
                    <div className="text-sm" style={{ color: '#059669' }}>Characters</div>
                  </div>
                )}
              </div>
            </div>

            {/* Deletions Section */}
            <div className="glass-panel bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Minus className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-800 text-lg">Deletions</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-red-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-700">{stats.deletions}</div>
                  <div className="text-sm" style={{ color: '#dc2626' }}>Blocks</div>
                </div>
                {stats.wordStats && (
                  <div className="bg-red-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-700">{stats.wordStats.deletedWords.toLocaleString()}</div>
                    <div className="text-sm" style={{ color: '#dc2626' }}>Words</div>
                  </div>
                )}
                {stats.characterStats && (
                  <div className="bg-red-100 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-700">{stats.characterStats.deletedCharacters.toLocaleString()}</div>
                    <div className="text-sm" style={{ color: '#dc2626' }}>Characters</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Composition Section */}
          <div className="glass-panel border border-theme-neutral-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl" role="img" aria-label="Composition analysis">🧮</span>
              <div>
                <h4 className="font-semibold text-theme-primary-800 text-lg">Composition</h4>
                <p className="text-xs text-theme-neutral-600">Visual breakdown of changes across all levels</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Blocks Composition */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-theme-primary-800">BLOCKS</span>
                  <span className="text-sm text-theme-neutral-600">
                    {stats.additions + stats.deletions + stats.unchanged} total
                  </span>
                </div>
                <div className="flex rounded-full overflow-hidden h-3 bg-gray-200 shadow-inner mb-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                    style={{ width: `${additionPercent}%` }}
                    title={`${additionPercent.toFixed(1)}% additions`}
                  ></div>
                  <div
                    className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                    style={{ width: `${deletionPercent}%` }}
                    title={`${deletionPercent.toFixed(1)}% deletions`}
                  ></div>
                  <div
                    className="bg-gradient-to-r from-gray-300 to-gray-400"
                    style={{ width: `${100 - additionPercent - deletionPercent}%` }}
                    title={`${(100 - additionPercent - deletionPercent).toFixed(1)}% unchanged`}
                  ></div>
                </div>
                <div className="relative text-xs text-theme-neutral-600" style={{ height: '16px' }}>
                  {(() => {
                    const unchangedPercent = 100 - additionPercent - deletionPercent;

                    // Calculate actual segment positions
                    const additionStart = 0;
                    const additionEnd = additionPercent;
                    const deletionStart = additionPercent;
                    const deletionEnd = additionPercent + deletionPercent;
                    const unchangedStart = additionPercent + deletionPercent;
                    const unchangedEnd = 100;

                    // Simple sequential positioning - no overlaps
                    const minWidth = 12; // Minimum readable width
                    const unchangedMinWidth = 25; // Larger minimum for unchanged labels

                    // Reserve space for unchanged label first
                    const maxChangeSpace = 100 - unchangedMinWidth;

                    // Position labels sequentially from left to right
                    let currentPos = 0;

                    // Addition label
                    const additionPos = currentPos;
                    const additionWidth = Math.min(Math.max(minWidth, Math.max(additionPercent, 15)), maxChangeSpace / 2);
                    currentPos = additionPos + additionWidth;

                    // Deletion label  
                    const deletionPos = currentPos;
                    const deletionWidth = Math.min(Math.max(minWidth, Math.max(deletionPercent, 15)), maxChangeSpace - additionWidth);
                    currentPos = deletionPos + deletionWidth;

                    // Unchanged label gets remaining space (guaranteed minimum)
                    const unchangedPos = currentPos;
                    const unchangedWidth = 100 - unchangedPos;

                    return (
                      <>
                        {stats.additions > 0 && (
                          <div className="absolute left-0" style={{ left: `${additionPos}%`, width: `${additionWidth}%` }}>
                            <div className="text-left px-1 truncate">{stats.additions.toLocaleString()} added ({additionPercent.toFixed(1)}%)</div>
                          </div>
                        )}

                        {stats.deletions > 0 && (
                          <div className="absolute left-0" style={{ left: `${deletionPos}%`, width: `${deletionWidth}%` }}>
                            <div className="text-left px-1 truncate">{stats.deletions.toLocaleString()} deleted ({deletionPercent.toFixed(1)}%)</div>
                          </div>
                        )}

                        {stats.unchanged > 0 && (
                          <div className="absolute left-0" style={{ left: `${unchangedPos}%`, width: `${unchangedWidth}%` }}>
                            <div className="text-right px-1 truncate">{stats.unchanged.toLocaleString()} unchanged ({unchangedPercent.toFixed(1)}%)</div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Words Composition */}
              {stats.wordStats && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-theme-primary-800">WORDS</span>
                    <span className="text-sm text-theme-neutral-600">
                      {stats.wordStats.totalWords.toLocaleString()} total
                    </span>
                  </div>
                  <div className="flex rounded-full overflow-hidden h-3 bg-gray-200 shadow-inner mb-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                      style={{ width: `${(stats.wordStats.addedWords / stats.wordStats.totalWords) * 100}%` }}
                    ></div>
                    <div
                      className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                      style={{ width: `${(stats.wordStats.deletedWords / stats.wordStats.totalWords) * 100}%` }}
                    ></div>
                    <div
                      className="bg-gradient-to-r from-gray-300 to-gray-400"
                      style={{ width: `${(stats.wordStats.unchangedWords / stats.wordStats.totalWords) * 100}%` }}
                    ></div>
                  </div>
                  <div className="relative text-xs text-theme-neutral-600" style={{ height: '16px' }}>
                    {(() => {
                      // Calculate percentages for words
                      const wordAdditionPercent = (stats.wordStats.addedWords / stats.wordStats.totalWords) * 100;
                      const wordDeletionPercent = (stats.wordStats.deletedWords / stats.wordStats.totalWords) * 100;
                      const wordUnchangedPercent = (stats.wordStats.unchangedWords / stats.wordStats.totalWords) * 100;

                      // Calculate actual segment positions
                      const additionStart = 0;
                      const additionEnd = wordAdditionPercent;
                      const deletionStart = wordAdditionPercent;
                      const deletionEnd = wordAdditionPercent + wordDeletionPercent;
                      const unchangedStart = wordAdditionPercent + wordDeletionPercent;
                      const unchangedEnd = 100;

                      // Simple sequential positioning - no overlaps
                      const minWidth = 12; // Minimum readable width
                      const unchangedMinWidth = 25; // Larger minimum for unchanged labels

                      // Reserve space for unchanged label first
                      const maxChangeSpace = 100 - unchangedMinWidth;

                      // Position labels sequentially from left to right
                      let currentPos = 0;

                      // Addition label
                      const additionPos = currentPos;
                      const additionWidth = Math.min(Math.max(minWidth, Math.max(wordAdditionPercent, 15)), maxChangeSpace / 2);
                      currentPos = additionPos + additionWidth;

                      // Deletion label  
                      const deletionPos = currentPos;
                      const deletionWidth = Math.min(Math.max(minWidth, Math.max(wordDeletionPercent, 15)), maxChangeSpace - additionWidth);
                      currentPos = deletionPos + deletionWidth;

                      // Unchanged label gets remaining space (guaranteed minimum)
                      const unchangedPos = currentPos;
                      const unchangedWidth = 100 - unchangedPos;

                      return (
                        <>
                          {stats.wordStats.addedWords > 0 && (
                            <div className="absolute left-0" style={{ left: `${additionPos}%`, width: `${additionWidth}%` }}>
                              <div className="text-left px-1 truncate">{stats.wordStats.addedWords.toLocaleString()} added ({wordAdditionPercent.toFixed(1)}%)</div>
                            </div>
                          )}

                          {stats.wordStats.deletedWords > 0 && (
                            <div className="absolute left-0" style={{ left: `${deletionPos}%`, width: `${deletionWidth}%` }}>
                              <div className="text-left px-1 truncate">{stats.wordStats.deletedWords.toLocaleString()} deleted ({wordDeletionPercent.toFixed(1)}%)</div>
                            </div>
                          )}

                          {stats.wordStats.unchangedWords > 0 && (
                            <div className="absolute left-0" style={{ left: `${unchangedPos}%`, width: `${unchangedWidth}%` }}>
                              <div className="text-right px-1 truncate">{stats.wordStats.unchangedWords.toLocaleString()} unchanged ({wordUnchangedPercent.toFixed(1)}%)</div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Characters Composition */}
              {stats.characterStats && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-theme-primary-800">CHARACTERS</span>
                    <span className="text-sm text-theme-neutral-600">
                      {stats.characterStats.totalCharacters.toLocaleString()} total
                    </span>
                  </div>
                  <div className="flex rounded-full overflow-hidden h-3 bg-gray-200 shadow-inner mb-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                      style={{ width: `${(stats.characterStats.addedCharacters / stats.characterStats.totalCharacters) * 100}%` }}
                    ></div>
                    <div
                      className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                      style={{ width: `${(stats.characterStats.deletedCharacters / stats.characterStats.totalCharacters) * 100}%` }}
                    ></div>
                    <div
                      className="bg-gradient-to-r from-gray-300 to-gray-400"
                      style={{ width: `${(stats.characterStats.unchangedCharacters / stats.characterStats.totalCharacters) * 100}%` }}
                    ></div>
                  </div>
                  <div className="relative text-xs text-theme-neutral-600" style={{ height: '16px' }}>
                    {(() => {
                      // Calculate percentages for characters
                      const charAdditionPercent = (stats.characterStats.addedCharacters / stats.characterStats.totalCharacters) * 100;
                      const charDeletionPercent = (stats.characterStats.deletedCharacters / stats.characterStats.totalCharacters) * 100;
                      const charUnchangedPercent = (stats.characterStats.unchangedCharacters / stats.characterStats.totalCharacters) * 100;

                      // Calculate actual segment positions
                      const additionStart = 0;
                      const additionEnd = charAdditionPercent;
                      const deletionStart = charAdditionPercent;
                      const deletionEnd = charAdditionPercent + charDeletionPercent;
                      const unchangedStart = charAdditionPercent + charDeletionPercent;
                      const unchangedEnd = 100;

                      // Simple sequential positioning - no overlaps
                      const minWidth = 12; // Minimum readable width
                      const unchangedMinWidth = 25; // Larger minimum for unchanged labels

                      // Reserve space for unchanged label first
                      const maxChangeSpace = 100 - unchangedMinWidth;

                      // Position labels sequentially from left to right
                      let currentPos = 0;

                      // Addition label
                      const additionPos = currentPos;
                      const additionWidth = Math.min(Math.max(minWidth, Math.max(charAdditionPercent, 15)), maxChangeSpace / 2);
                      currentPos = additionPos + additionWidth;

                      // Deletion label  
                      const deletionPos = currentPos;
                      const deletionWidth = Math.min(Math.max(minWidth, Math.max(charDeletionPercent, 15)), maxChangeSpace - additionWidth);
                      currentPos = deletionPos + deletionWidth;

                      // Unchanged label gets remaining space (guaranteed minimum)
                      const unchangedPos = currentPos;
                      const unchangedWidth = 100 - unchangedPos;

                      return (
                        <>
                          {stats.characterStats.addedCharacters > 0 && (
                            <div className="absolute left-0" style={{ left: `${additionPos}%`, width: `${additionWidth}%` }}>
                              <div className="text-left px-1 truncate">{stats.characterStats.addedCharacters.toLocaleString()} added ({charAdditionPercent.toFixed(1)}%)</div>
                            </div>
                          )}

                          {stats.characterStats.deletedCharacters > 0 && (
                            <div className="absolute left-0" style={{ left: `${deletionPos}%`, width: `${deletionWidth}%` }}>
                              <div className="text-left px-1 truncate">{stats.characterStats.deletedCharacters.toLocaleString()} deleted ({charDeletionPercent.toFixed(1)}%)</div>
                            </div>
                          )}

                          {stats.characterStats.unchangedCharacters > 0 && (
                            <div className="absolute left-0" style={{ left: `${unchangedPos}%`, width: `${unchangedWidth}%` }}>
                              <div className="text-right px-1 truncate">{stats.characterStats.unchangedCharacters.toLocaleString()} unchanged ({charUnchangedPercent.toFixed(1)}%)</div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};