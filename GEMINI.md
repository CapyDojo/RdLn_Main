# GEMINI.md: RdLn™ Document Comparison Tool

## Project Overview

RdLn™ is a professional-grade document comparison tool designed for legal professionals and organizations requiring precise document analysis. It provides a modern, glassmorphism UI and features client-side document processing for complete confidentiality.

**Key Features:**

*   **Professional Document Comparison:** Utilizes the Myers algorithm for an optimized diff engine.
*   **OCR Integration:** Supports multi-language optical character recognition (50+ languages).
*   **Modern UI:** Features a glassmorphism interface with a themeable design system.
*   **Client-Side Processing:** Ensures data privacy with no server uploads.
*   **Performance Optimized:** Handles large documents with chunked rendering.
*   **Cross-Platform:** Available as a web app and as a desktop app for Windows, macOS, and Linux (using Tauri and Electron).

**Architecture:**

*   **Frontend:** React, TypeScript, Vite, and Tailwind CSS.
*   **State Management:** The project is in the process of adopting a global state management solution (see `ARCHITECTURE_REFACTOR_ROADMAP.md`).
*   **Component-Based:** The UI is built with a clear component hierarchy.
*   **Service Layer:** Business logic is being decoupled into a dedicated service layer (e.g., `OCRService.js`).
*   **Testing:** The project uses Vitest for unit and integration testing, and Playwright for end-to-end testing.

## Building and Running

**Installation:**

```bash
npm install
```

**Development:**

*   **Web App:**
    ```bash
    npm run dev
    ```
*   **Tauri App:**
    ```bash
    npm run tauri:dev
    ```
*   **Electron App:**
    ```bash
    npm run electron:dev
    ```

**Building for Production:**

*   **Web App:**
    ```bash
    npm run build
    ```
*   **Tauri App:**
    ```bash
    npm run tauri:build
    ```
*   **Electron App:**
    ```bash
    npm run electron:build
    ```

**Testing:**

*   **Run all tests:**
    ```bash
    npm test
    ```
*   **Run unit tests:**
    ```bash
    npm run test:unit
    ```
*   **Run integration tests:**
    ```bash
    npm run test:integration
    ```
*   **Run E2E tests:**
    ```bash
    npm run test:e2e
    ```

## Development Conventions

*   **SSMR Approach:** Changes should be Safe, Step-by-step, Modular, and Reversible.
*   **Visual Consistency:** Maintain DOM structure parity between components.
*   **Performance First:** Optimize for large document handling.
*   **TypeScript:** Maintain full type safety throughout the codebase.
*   **Error Handling:** Implement robust error handling with error boundaries and `try...catch` blocks.
*   **Testing:** Follow the testing hierarchy outlined in `ARCHITECTURE_REFACTOR_ROADMAP.md`.
*   **Documentation:** Keep documentation up-to-date with architectural decisions and new patterns.
