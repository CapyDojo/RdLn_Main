# Serena User Guide for Kai - RdLn Project

**Date**: 2025-08-24  
**Project**: RdLn™ Document Comparison Tool  
**Status**: ✅ Ready for Use with Qoder IDE

## Table of Contents
1. [Overview](#overview)
2. [Setup and Activation](#setup-and-activation)
3. [Core Capabilities](#core-capabilities)
4. [Project-Specific Context](#project-specific-context)
5. [Common Commands and Usage Patterns](#common-commands-and-usage-patterns)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Features](#advanced-features)

---

## Overview

### What is Serena?
Serena is a powerful AI coding assistant that provides semantic code understanding through the Model Context Protocol (MCP). It's designed to work as an "IDE for coding agents," giving AI models deep understanding of your codebase structure, relationships, and context.

### Key Benefits for RdLn Development
- **Semantic Code Navigation**: Find symbols, references, and dependencies intelligently
- **Project-Aware Assistance**: Understands RdLn's React/TypeScript architecture
- **Performance-Optimized**: Designed for large codebases (RdLn handles 500k+ character documents)
- **Privacy-First**: All processing happens locally on your machine
- **Legal Domain Context**: Configured specifically for document comparison workflows

### Integration Status
✅ **Serena MCP is fully configured and tested with Qoder IDE**  
✅ **All verification tests passed (4/4)**  
✅ **Project-specific configuration optimized for RdLn**

---

## Setup and Activation

### Prerequisites Met
- ✅ Qoder IDE 0.1.16
- ✅ Serena MCP server configured
- ✅ STDIO transport setup
- ✅ uvx installation verified

### Activation Commands
Once Serena is connected in Qoder IDE, use these commands to activate the project:

```
"Activate this project with Serena"
```

```
"Run onboarding for this RdLn project"
```

```
"Get initial instructions for working with this codebase"
```

### Verification Commands
Test that Serena understands your project:

```
"Analyze the project structure and tell me about the key components"
```

```
"Find all symbols in the MyersAlgorithm file"
```

```
"List all files in the src/algorithms directory"
```

---

## Core Capabilities

### 🔍 Semantic Code Operations

| Command | Purpose | Example Usage |
|---------|---------|---------------|
| `find_symbol` | Search for functions, classes, variables by name | "Find the MyersAlgorithm class" |
| `find_referencing_symbols` | Find all references to a symbol | "Find all references to compareDocuments" |
| `replace_symbol_body` | Replace function/class definitions | "Replace the tokenize function implementation" |
| `get_symbols_overview` | Get overview of symbols in a file | "Show me all exports from ComparisonInterface.tsx" |

### 📁 Enhanced File Operations

| Command | Purpose | Example Usage |
|---------|---------|---------------|
| `read_file` | Read files with context understanding | "Read the OCRService.ts file" |
| `create_text_file` | Create new files with project awareness | "Create a new component in src/components" |
| `list_dir` | List directory contents | "List all files in src/services" |
| `search_for_pattern` | Search patterns across codebase | "Search for 'performance' in all TypeScript files" |

### ⚡ Development Tools

| Command | Purpose | Example Usage |
|---------|---------|---------------|
| `execute_shell_command` | Run development commands | "Run npm test for the OCR service" |
| `onboarding` | Get project-specific guidance | "Explain the RdLn architecture" |
| `write_memory` | Store project knowledge | "Remember this optimization pattern" |

---

## Project-Specific Context

### RdLn Architecture Understanding
Serena is configured with specific knowledge about:

#### **Core Components**
- **`ComparisonInterface.tsx`**: Main orchestration component
- **`TextInputPanel.tsx`**: Document input and OCR handling
- **`MyersAlgorithm.ts`**: Core diff engine (CRITICAL - handle with care)
- **`RedlineOutput.tsx`**: Chunked rendering with ref-based architecture
- **`OCRService.ts`**: Multi-language OCR processing

#### **Technology Stack**
- **Frontend**: React 18.3.1, TypeScript 5.5.3, Vite 7.0.5
- **Styling**: Tailwind CSS with Glassmorphism UI
- **Processing**: Myers algorithm, Tesseract.js OCR (5.0.4)
- **Desktop**: Electron 37.2.5
- **Testing**: Vitest, Playwright for e2e tests

#### **Performance Requirements**
- Must handle documents up to 500k+ characters efficiently
- Chunked rendering to prevent browser crashes
- Memory usage monitoring for performance tracking
- Client-side processing for confidentiality

#### **Architecture Patterns**
- **SSMR Methodology**: Safe, Step-by-step, Modular, Reversible
- **Component Modularization**: Layout components for performance
- **DOM Structure Normalization**: Visual consistency across panels
- **Responsive Design**: Mobile and desktop layout components

---

## Common Commands and Usage Patterns

### 🚀 Getting Started with a Task

**1. Understand the Current State**
```
"Get symbols overview for ComparisonInterface.tsx"
"Find all references to the useComparison hook"
"Show me the main entry points of this application"
```

**2. Explore Specific Functionality**
```
"Find the MyersAlgorithm class and show me its main methods"
"Search for 'chunked rendering' in the codebase"
"List all OCR-related files in the services directory"
```

**3. Analyze Dependencies**
```
"Find all components that import MyersAlgorithm"
"Show me what uses the RedlineOutput component"
"Find references to the performance monitoring utilities"
```

### 🔧 Development Workflows

**Performance Optimization**
```
"Find all performance monitoring calls in the codebase"
"Search for 'memory usage' patterns"
"Show me the chunked rendering implementation in RedlineOutput"
```

**OCR and Text Processing**
```
"Find the OCRService implementation"
"Search for text cleanup and formatting utilities"
"Show me the paragraph formatting workflow"
```

**UI and Component Development**
```
"Find all Tailwind CSS theme-related components"
"Search for button system implementations"
"Show me the modal animation configurations"
```

**Algorithm and Core Logic**
```
"Find the Myers algorithm implementation"
"Search for tokenization and diff logic"
"Show me the text comparison workflow"
```

### 🐛 Debugging and Investigation

**Error Investigation**
```
"Find all error handling in the OCR service"
"Search for try-catch blocks in the comparison logic"
"Show me memory cleanup implementations"
```

**Performance Issues**
```
"Find performance monitoring implementations"
"Search for large document handling patterns"
"Show me browser crash prevention code"
```

**UI Issues**
```
"Find theme-related CSS variable implementations"
"Search for responsive design patterns"
"Show me modal and tooltip positioning logic"
```

---

## Troubleshooting

### Common Issues and Solutions

#### **Serena Not Responding**
```
"Check if Serena onboarding has been performed"
"Activate this project and run initial setup"
```

#### **Context Not Loading**
```
"Think about collected information and project structure"
"Run project onboarding to refresh context"
```

#### **Symbol Finding Issues**
```
"Get symbols overview for [filename]"
"Search for pattern '[symbol name]' in TypeScript files"
```

### Debug Commands
```
"Check onboarding status for this project"
"Show me the current project memory"
"List all available tools and capabilities"
```

### Manual Server Restart
If needed, restart the Serena server:
```cmd
# Windows
start-serena-qoder.bat

# PowerShell
powershell -ExecutionPolicy Bypass -File start-serena-qoder.ps1
```

---

## Advanced Features

### 🧠 Memory and Context Management

**Project Memory**
```
"Write to memory: This optimization pattern works well for large documents"
"Remember: The MyersAlgorithm should never be modified without extensive testing"
"Store context: User prefers systematic documentation approaches"
```

**Context Retrieval**
```
"What do you remember about performance optimization patterns?"
"Recall previous discussions about OCR text processing"
"What context do you have about this user's preferences?"
```

### 🎯 Domain-Specific Commands

**Legal Document Processing**
```
"Find patterns for legal document comparison"
"Search for redlining and markup logic"
"Show me confidentiality and privacy implementations"
```

**Performance Analysis**
```
"Analyze memory usage patterns in large document processing"
"Find performance bottlenecks in the comparison algorithm"
"Show me chunked rendering optimizations"
```

**Architecture Analysis**
```
"Explain the component interaction flow"
"Analyze the separation of concerns in the codebase"
"Show me the modular architecture implementation"
```

### 🔄 Development Workflows

**Feature Development**
```
"Create a new component following RdLn patterns"
"Implement performance monitoring for this new feature"
"Add OCR support for this document type"
```

**Refactoring**
```
"Suggest improvements for this component structure"
"Optimize this algorithm while maintaining SSMR principles"
"Refactor this code following RdLn conventions"
```

**Testing and Validation**
```
"Generate unit tests for this component"
"Create performance tests for large document handling"
"Implement integration tests for OCR workflows"
```

---

## Best Practices for Working with Serena

### 🎯 Effective Command Patterns

**Be Specific**
- ❌ "Show me the code"
- ✅ "Show me the MyersAlgorithm implementation in src/algorithms"

**Use Project Context**
- ❌ "Find all references"
- ✅ "Find all references to the compareDocuments function in the RdLn project"

**Leverage Semantic Understanding**
- ❌ "Search for 'function'"
- ✅ "Find all functions that handle OCR text processing"

### 🔒 Safety Considerations

**Critical Components (Requires Extra Care)**
- `MyersAlgorithm.ts` - Core comparison logic
- `OCRService.ts` - OCR functionality  
- `ComparisonInterface.tsx` - Main UI coordination
- `RedlineOutput.tsx` - Complex ref-based architecture

**Safe Operations (Auto-approved)**
- Reading files and getting overviews
- Finding symbols and references
- Listing directories and searching patterns
- Getting project onboarding information

**Requires Approval**
- Modifying code implementations
- Creating new files
- Executing shell commands
- Replacing function bodies

### 📚 Documentation Integration

Serena has access to the comprehensive RdLn documentation including:
- Performance monitoring guides
- Text processing workflows  
- Button system architecture
- OCR modal animations
- Component interaction explanations

Use commands like:
```
"Reference the performance monitoring guide for this optimization"
"Follow the text processing workflow for this feature"
"Apply the button system patterns for this UI component"
```

---

## Conclusion

Serena is now fully integrated and optimized for your RdLn development workflow. It understands the project's architecture, performance requirements, and domain-specific needs. Use it as your intelligent coding partner to navigate the codebase, understand complex relationships, and maintain the high-quality standards of the RdLn document comparison tool.

**Remember**: Serena excels at understanding context and relationships. The more specific and project-aware your commands, the more valuable its assistance will be.

---

**Last Updated**: August 24, 2025  
**Configuration Status**: ✅ Complete and Verified  
**Integration**: Qoder IDE with STDIO transport  
**Project Context**: RdLn™ Document Comparison Tool