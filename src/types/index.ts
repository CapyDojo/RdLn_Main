/**
 * Type definitions for the document comparison system.
 * Provides interfaces for diff operations, comparison results, and application state.
 */

// =============================================================================
// CORE DIFF TYPES
// =============================================================================

/**
 * Represents the type of change detected in a diff operation.
 * Used to categorize how text content has been modified between documents.
 */
export type DiffChangeType = 'added' | 'removed' | 'unchanged' | 'changed';

/**
 * Represents a single change detected during document comparison.
 * Contains the change type, content, and metadata for rendering diff results.
 */
export interface DiffChange {
  /** The type of change that occurred */
  type: DiffChangeType;
  
  /** 
   * Primary content for the change.
   * - For 'added': the new text that was added
   * - For 'removed': the text that was deleted
   * - For 'unchanged': the text that remained the same
   * - For 'changed': not used (see originalContent/revisedContent)
   */
  content: string;
  
  /** 
   * Original text content before the change.
   * Only populated when type is 'changed'.
   */
  originalContent?: string;
  
  /** 
   * Revised text content after the change.
   * Only populated when type is 'changed'.
   */
  revisedContent?: string;
  
  /** 
   * Sequential index of this change in the diff sequence.
   * Used for ordering and identification purposes.
   */
  index: number;
}

// =============================================================================
// COMPARISON RESULT TYPES
// =============================================================================

/**
 * Statistical summary of changes found during document comparison.
 * Provides counts for different types of modifications.
 */
export interface ComparisonStats {
  /** Number of text segments that were added */
  additions: number;
  
  /** Number of text segments that were removed */
  deletions: number;
  
  /** Number of text segments that remained unchanged */
  unchanged: number;
  
  /** Number of text segments that were changed/substituted */
  changed: number;
  
  /** Total number of changes (additions + deletions) - legacy field for backward compatibility */
  totalChanges: number;
  
  /** Word-level statistics */
  wordStats?: {
    /** Number of words that were added (includes words from substitutions) */
    addedWords: number;
    
    /** Number of words that were removed (includes words from substitutions) */
    deletedWords: number;
    
    /** Number of words that remained unchanged */
    unchangedWords: number;
    
    /** Total words in the comparison */
    totalWords: number;
    
    /** Total review workload: words that need to be reviewed (added + deleted) */
    reviewWorkload: number;
    
    /** Percentage of document that changed */
    percentageChanged: number;
  };
  
  /** Character-level statistics */
  characterStats?: {
    /** Number of characters that were added (includes chars from substitutions) */
    addedCharacters: number;
    
    /** Number of characters that were removed (includes chars from substitutions) */
    deletedCharacters: number;
    
    /** Number of characters that remained unchanged */
    unchangedCharacters: number;
    
    /** Total characters in the comparison */
    totalCharacters: number;
    
    /** Total characters excluding spaces */
    totalCharactersNoSpaces: number;
    
    /** Total review workload: characters that need to be reviewed (added + deleted) */
    reviewWorkload: number;
    
    /** Percentage of document that changed (by characters) */
    percentageChanged: number;
  };
}

/**
 * Complete result of a document comparison operation.
 * Contains both the detailed changes and statistical summary.
 */
export interface ComparisonResult {
  /** Array of all changes detected, in sequential order */
  changes: DiffChange[];
  
  /** Statistical summary of the comparison results */
  stats: ComparisonStats;
}

// =============================================================================
// APPLICATION STATE TYPES
// =============================================================================

/**
 * Represents the current state of the document comparison interface.
 * Manages user input, processing status, results, and error handling.
 */
export interface ComparisonState {
  /** Original document text for comparison */
  originalText: string;
  
  /** Revised document text for comparison */
  revisedText: string;
  
  /** 
   * Result of the comparison operation.
   * null when no comparison has been performed yet.
   */
  result: ComparisonResult | null;
  
  /** 
   * Indicates whether a comparison operation is currently in progress.
   * Used to show loading states and prevent concurrent operations.
   */
  isProcessing: boolean;
  
  /** 
   * Error message from the last comparison operation.
   * null when no error has occurred.
   */
  error: string | null;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Type guard helper for checking if a change is a content-modifying change.
 * Useful for filtering changes that actually alter document content.
 */
export type ContentModifyingChange = Extract<DiffChangeType, 'added' | 'removed' | 'changed'>;

/**
 * Type helper for changes that represent actual modifications to content.
 * Excludes 'unchanged' entries which represent preserved content.
 */
export type ModificationChange = DiffChange & {
  type: ContentModifyingChange;
};

/**
 * Partial comparison state for updates.
 * Useful for state management operations that only modify specific fields.
 */
export type ComparisonStateUpdate = Partial<ComparisonState>;
