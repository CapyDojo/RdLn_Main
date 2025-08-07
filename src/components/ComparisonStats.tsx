import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, Plus, Minus, FileText, ChevronDown, ChevronUp, Type, Hash, AlertTriangle, CheckCircle, Info, TrendingUp, HelpCircle } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(true);
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
  const documentSize = stats.wordStats?.totalWords || total;
  const sizeLabel = stats.wordStats ? 'words' : 'elements';

  return (
    <div className={`space-y-4 ${className || ''}`} style={style}>
      {/* Executive Summary Card */}
      <div className="glass-panel border border-theme-neutral-300 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl" role="img" aria-label="Analysis panel">📊</span>
            <h3 className="text-2xl font-semibold text-theme-primary-900">Comparison Analysis</h3>
          </div>
          <Tooltip content={`${impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1)} Impact: ${impactLevel === 'low' ? 'Minor changes (≤10%), routine review expected' : impactLevel === 'medium' ? 'Moderate changes (11-30%), careful review required' : 'Significant changes (>30%), thorough legal analysis needed'}`}>
            <div className="glass-panel flex items-center gap-2 px-3 py-2 rounded-lg border border-theme-neutral-300 cursor-help">
              <ImpactIcon className="w-4 h-4 text-theme-primary-600" />
              <span className="text-sm font-medium text-theme-primary-900 capitalize">
                {impactLevel} Impact
              </span>
              <HelpCircle className="w-3 h-3 text-theme-neutral-500 opacity-60" />
            </div>
          </Tooltip>
        </div>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Review Workload */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <CircularProgress 
                percentage={Math.min((reviewWorkload / documentSize) * 100, 100)} 
                color="#dc2626" 
                size={80}
              />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-theme-accent-700">{reviewWorkload}</p>
              <Tooltip content="The total amount of content that requires attorney review, including all additions and deletions. This represents your billable review workload.">
                <p className="text-sm text-theme-neutral-600 flex items-center gap-1">
                  Review Load ({sizeLabel})
                  <HelpCircle className="w-3 h-3 opacity-60" />
                </p>
              </Tooltip>
              <p className="text-xs text-theme-neutral-500">Requires attorney review</p>
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
              <p className="text-2xl font-bold text-theme-primary-700">{documentSize}</p>
              <Tooltip content="The total size of the document being compared, representing the complete scope of content under legal review.">
                <p className="text-sm text-theme-neutral-600 flex items-center gap-1">
                  Document Size ({sizeLabel})
                  <HelpCircle className="w-3 h-3 opacity-60" />
                </p>
              </Tooltip>
              <p className="text-xs text-theme-neutral-500">Total content volume</p>
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
              <Tooltip content="The percentage of the document that has been modified. Legal professionals use this to assess the scope of changes and estimate review time.">
                <p className="text-sm text-theme-neutral-600 flex items-center gap-1">
                  Document Changed
                  <HelpCircle className="w-3 h-3 opacity-60" />
                </p>
              </Tooltip>
              <p className="text-xs text-theme-neutral-500">Overall modification rate</p>
            </div>
          </div>
        </div>
        
        {/* Quick Action Summary */}
        <div className="flex items-center justify-between pt-4 border-t border-theme-neutral-200">
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
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-theme-neutral-600">
                +{stats.wordStats?.addedWords || stats.additions} added
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-theme-neutral-600">
                -{stats.wordStats?.deletedWords || stats.deletions} removed
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed Analysis Section */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Change Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Additions Card */}
            <div className="glass-panel bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Plus className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Additions</h4>
                    <p className="text-xs text-green-600">Content added to document</p>
                  </div>
                </div>
                <CircularProgress 
                  percentage={additionPercent} 
                  color="#059669" 
                  size={50}
                  showText={false}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Blocks:</span>
                  <span className="font-bold text-green-800">{stats.additions}</span>
                </div>
                {stats.wordStats && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Words:</span>
                    <span className="font-bold text-green-800">{stats.wordStats.addedWords}</span>
                  </div>
                )}
                {stats.characterStats && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Characters:</span>
                    <span className="font-bold text-green-800">{stats.characterStats.addedCharacters}</span>
                  </div>
                )}
                <div className="text-xs text-green-600 bg-green-100 rounded px-2 py-1">
                  {additionPercent.toFixed(1)}% of total document
                </div>
              </div>
            </div>
            
            {/* Deletions Card */}
            <div className="glass-panel bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Minus className="w-5 h-5 text-red-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800">Deletions</h4>
                    <p className="text-xs text-red-600">Content removed from document</p>
                  </div>
                </div>
                <CircularProgress 
                  percentage={deletionPercent} 
                  color="#dc2626" 
                  size={50}
                  showText={false}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Blocks:</span>
                  <span className="font-bold text-red-800">{stats.deletions}</span>
                </div>
                {stats.wordStats && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-700">Words:</span>
                    <span className="font-bold text-red-800">{stats.wordStats.deletedWords}</span>
                  </div>
                )}
                {stats.characterStats && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-700">Characters:</span>
                    <span className="font-bold text-red-800">{stats.characterStats.deletedCharacters}</span>
                  </div>
                )}
                <div className="text-xs text-red-600 bg-red-100 rounded px-2 py-1">
                  {deletionPercent.toFixed(1)}% of total document
                </div>
              </div>
            </div>
          </div>
          
          {/* Detailed Statistics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Word Statistics */}
            {stats.wordStats && (
              <div className="glass-panel border border-theme-neutral-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Type className="w-5 h-5 text-blue-700" />
                  </div>
                  <Tooltip content="Word-level analysis provides precise measurement of textual changes, essential for legal document review and compliance tracking.">
                    <div>
                      <h4 className="font-semibold text-theme-primary-800 flex items-center gap-1">
                        Word Analysis
                        <HelpCircle className="w-3 h-3 opacity-60" />
                      </h4>
                      <p className="text-xs text-theme-neutral-600">Detailed word-level breakdown</p>
                    </div>
                  </Tooltip>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-700">{stats.wordStats.addedWords}</div>
                      <div className="text-xs text-green-600">Added</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-red-700">{stats.wordStats.deletedWords}</div>
                      <div className="text-xs text-red-600">Deleted</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-gray-700">{stats.wordStats.unchangedWords}</div>
                      <div className="text-xs text-gray-600">Unchanged</div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-theme-neutral-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-theme-neutral-600">Total Words:</span>
                      <span className="font-semibold">{stats.wordStats.totalWords}</span>
                    </div>
                    <div className="flex justify-between">
                      <Tooltip content="The number of words that require legal review - additions plus deletions. This directly correlates to billable review time.">
                        <span className="text-sm text-theme-neutral-600 flex items-center gap-1">
                          Review Workload:
                          <HelpCircle className="w-3 h-3 opacity-60" />
                        </span>
                      </Tooltip>
                      <span className="font-semibold text-theme-accent-700">{stats.wordStats.reviewWorkload}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Character Statistics */}
            {stats.characterStats && (
              <div className="glass-panel border border-theme-neutral-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Hash className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-theme-primary-800">Character Analysis</h4>
                    <p className="text-xs text-theme-neutral-600">Character-level precision metrics</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-700">{stats.characterStats.addedCharacters}</div>
                      <div className="text-xs text-green-600">Added</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-red-700">{stats.characterStats.deletedCharacters}</div>
                      <div className="text-xs text-red-600">Deleted</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-gray-700">{stats.characterStats.unchangedCharacters}</div>
                      <div className="text-xs text-gray-600">Unchanged</div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-theme-neutral-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-theme-neutral-600">Total Characters:</span>
                      <span className="font-semibold">{stats.characterStats.totalCharacters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-theme-neutral-600">Review Workload:</span>
                      <span className="font-semibold text-theme-accent-700">{stats.characterStats.reviewWorkload}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Visual Document Composition */}
          <div className="glass-panel border border-theme-neutral-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-theme-primary-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-theme-primary-700" />
              </div>
              <div>
                <h4 className="font-semibold text-theme-primary-800">Document Composition</h4>
                <p className="text-xs text-theme-neutral-600">Visual breakdown of changes</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Enhanced Progress Bar */}
              <div className="relative">
                <div className="flex rounded-full overflow-hidden h-4 bg-gray-200 shadow-inner">
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
                
                {/* Legend */}
                <div className="flex justify-center gap-6 mt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                    <span>Added ({additionPercent.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full"></div>
                    <span>Deleted ({deletionPercent.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
                    <span>Unchanged ({(100 - additionPercent - deletionPercent).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};