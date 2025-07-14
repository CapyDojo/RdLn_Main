# Guide: Text Processing and Formatting Pipeline

## 1. Overview

This document outlines the architectural pipeline for processing and formatting text within the application. The architecture is designed as a multi-stage assembly line, ensuring a clear separation of concerns between fetching raw text, cleaning it, and formatting it for display. This modular design makes the system easier to maintain, debug, and extend.

The pipeline consists of three primary stages, each handled by a dedicated service or utility:

1.  **Stage 1: OCR and Raw Text Extraction** (`OCRService.ts`)
2.  **Stage 2: OCR Text Cleanup Service** (`src/services/OCRTextCleanupService.ts`)
3.  **Stage 3: User Paste Formatting** (`paragraphFormatting.ts`)

## 2. The Three-Stage Pipeline

### Stage 1: OCR Service (`src/services/OCRService.ts`)

*   **Role:** The entry point for text derived from images or scanned documents.
*   **Input:** Image file (e.g., PNG, JPEG).
*   **Output:** Raw, unstructured text string.
*   **Key Responsibilities:**
    *   Performs Optical Character Recognition (OCR) to convert pixels into text characters.
    *   May include initial, low-level regex fixes for common OCR errors (e.g., mistaking `W` for `V`, `1` for `l`). This is a "first pass" cleanup.

### Stage 2: OCR Text Cleanup Service (`src/services/OCRTextCleanupService.ts`)

*   **Role:** The enhanced text processing service for OCR results with multi-language support
*   **Input:** Raw text string (typically from `OCRService`)
*   **Output:** Cleaned, normalized text string with reconstructed paragraphs
*   **Key Features:**
    *   Language-specific processing (CJK, European languages)
    *   Advanced character error correction
    *   Legal terminology fixes
    *   Punctuation normalization
    *   Intelligent paragraph reconstruction
    *   Configurable processing options

### Stage 3: Paragraph Formatting Utility (`src/utils/paragraphFormatting.ts`)

*   **Role:** The final, specialized "polishing" stage for user-pasted text.
*   **Input:** A block of text manually pasted by a user into a UI component (e.g., `TextInputPanel.tsx`).
*   **Output:** A perfectly formatted text string with correct paragraph breaks and line joins.
*   **Key Responsibilities:**
    *   Focuses exclusively on **structural formatting**, not character-level cleaning.
    *   Intelligently detects document structure (headers, body, clause headings, lists).
    *   Applies sophisticated rules (`isParagraphStart`, `shouldContinue`) to either join hard-wrapped lines or create new paragraphs.
    *   This is the logic we have recently been refining to handle complex legal document structures.

## 3. Data Flow Summary

The overall data flow for text originating from images can be visualized as follows:

`Image` -> **`OCRService`** -> `Raw Text` -> **`OCRTextCleanupService`** -> `Clean Text`

For the specific workflow of handling a user's paste action, the flow is:

`User Paste Action` -> **`TextInputPanel.tsx`** -> `Raw Pasted Text` -> **`paragraphFormatting.ts`** -> `Formatted Text for Display`

## 4. Conclusion

Understanding this separation is crucial for development:

*   If you are fixing a bug related to **misread characters from a scan**, look in `OCRTextCleanupService.ts`.
*   If you are fixing a bug related to **incorrect paragraph breaks or line joining from a user paste**, the work belongs in `paragraphFormatting.ts`.

This architecture ensures that our highly specialized paste-formatting logic does not interfere with the general-purpose text cleaning, and vice-versa.

Here is a concise recap of the architectural structure for the entire text pasting and formatting workflow.

The architecture is designed with a clear separation of concerns, dividing the work between a **UI Component** that handles user interaction and a dedicated **Formatting Utility** that contains the complex business logic.

### 1. The UI Component:

src/components/TextInputPanel.tsx

- **Role:** This is the user-facing entry point for the entire workflow.

- **Key Responsibility:** It renders the 
  
  ```
  <textarea>
  ```
  
   element that the user sees and types into.

- **Core Logic:** It contains the 
  
  ```
  handlePaste
  ```
  
   event handler. This function is triggered when the user pastes text. Its job is to:
  
  1. Intercept the paste event.
  
  2. Extract the **plain text** content from the clipboard.
  
  3. Pass this raw text to our formatting engine for processing.
  
  4. Receive the clean, formatted text back.
  
  5. Update its own state with the formatted text, which causes the 
     
     ```
     <textarea>
     ```
     
      to re-render and display the final result to the user.

### 2. The Formatting Engine:

src/utils/paragraphFormatting.ts

- **Role:** This is the "brain" of the operation. It has no knowledge of the UI; its sole purpose is to manipulate text.

- **Key Responsibility:** It exports the 
  
  formatPastedText() function.

- **Core Logic:** This function contains all the complex rules and regular expressions we have been building and refining. It performs the following steps:
  
  1. Takes a raw string of text as input.
  
  2. Splits the text into individual lines.
  
  3. Intelligently detects the boundary between the document's "header" and "body".
  
  4. Iterates through the lines, using our 
     
     isParagraphStart and 
     
     shouldContinue helper functions to make decisions.
  
  5. Applies different formatting rules depending on whether a line is in the header or the body.
  
  6. Reconstructs the text, joining lines or creating new paragraphs based on these rules.
  
  7. Returns a single, perfectly formatted string.

### The Workflow Summarized:

1. **Paste:** User pastes text into the 
   
   TextInputPanel component.

2. **Delegate:** 
   
   TextInputPanel's 
   
   ```
   handlePaste
   ```
   
    function captures the raw text and immediately sends it to the 
   
   formatPastedText function in 
   
   paragraphFormatting.ts.

3. **Process:** 
   
   formatPastedText applies all our logic (header/body detection, regex for lists, headings, line joining, etc.).

4. **Return & Render:** The clean text is returned to 
   
   TextInputPanel, which updates its state, and the user sees the final, formatted result.

This architecture is effective because it keeps the complex, non-UI logic isolated in a pure utility function, making it easy to test, maintain, and debug without having to worry about the React component lifecycle.
