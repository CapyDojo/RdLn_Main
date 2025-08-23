# Architectural Refactor Roadmap

## Overview

This document outlines a strategic plan for refactoring the application architecture based on the 10 high-impact suggestions. The work is organized into focused sprints to deliver incremental improvements and maintain momentum.

---

## Sprint 1: Foundational Logic & State

**Goal:** Decouple business logic from the UI and establish a predictable, global state management solution. This is the most critical first step as it will define how data flows through the application.

**Key Tasks:**
1.  **Implement Global State Management (#4):**
    *   Choose and install a state management library (e.g., Zustand for simplicity, Redux Toolkit for robustness).
    *   Create an initial "store" for a key piece of application state (e.g., the document content or user settings).
    *   Refactor one or two components to use the new global store instead of local state or prop drilling.

2.  **Create a Dedicated Service Layer (#5):** (Completed)
    *   `src/services` directory created.
    *   `OcrService.ts` module created and Tesseract.js related logic consolidated into it.
    *   Components refactored to use `OcrService`.

3.  **Isolate Business Logic (#3):**
    *   Review `MyersAlgorithm.ts` and ensure it has no UI-related code.
    *   Identify any other complex business logic currently inside a React component and plan to extract it into a custom hook (`src/hooks`) or a utility module (`src/utils`).

---

## Sprint 2: Code Structure & UI Consistency

**Goal:** Reorganize the codebase for better long-term maintainability and create a consistent, reusable set of UI components.

**Key Tasks:**
1.  **Adopt a Feature-Based Directory Structure (#1):**
    *   Create a `src/features` directory.
    *   Identify a small, self-contained feature (e.g., "settings" or "theme-switcher").
    *   Move all components, hooks, and styles related to that feature into a new directory like `src/features/settings/`.
    *   Update imports and ensure the application still works correctly. This will serve as a template for migrating larger features later.

2.  **Build a Reusable Component Library (#6):**
    *   Identify 2-3 common, repeated UI elements in the app (e.g., Button, Modal, InputField).
    *   Create generic, reusable versions of these components in the `src/components/` directory.
    *   Replace the old, one-off implementations with the new, reusable components.

---

## Sprint 3: Stability & Quality Assurance

**Goal:** Make the application more robust by implementing comprehensive error handling and establishing a clear, effective testing strategy.

**Key Tasks:**
1.  **Implement Robust Error Handling (#8):**
    *   Create a global React "Error Boundary" component.
    *   Wrap the main `App` component with this Error Boundary to catch and gracefully handle any rendering errors.
    *   Add `try...catch` blocks to critical operations in your `services` (like the OCR service) to handle promise rejections and other runtime errors.

2.  **Establish a Clear Testing Hierarchy (#7):**
    *   Write unit tests for the logic you extracted in Sprint 1 (e.g., test the functions in your new `OcrService` or other utility modules).
    *   Write a unit test for one of the new reusable UI components created in Sprint 2.
    *   Plan one simple integration test (e.g., test that clicking a button correctly calls a function from a service).

---

## Ongoing Initiatives (To be integrated into all sprints)

These are not one-time tasks but continuous practices to maintain throughout the project.

*   **Prioritize Security (#9):** At the end of each sprint, run `npm audit` to check for new vulnerabilities in dependencies.
*   **Document Your Architecture (#10):** At the end of each sprint, spend 30 minutes updating the `docs` directory with any significant decisions made or new patterns established.
*   **Centralize Application Configuration (#2):** As you work, if you encounter hard-coded configuration values, move them to a central `src/config` directory. Keep build-related files (`vite.config.ts`, etc.) in the project root.
