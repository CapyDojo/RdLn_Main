# Serena MCP Integration with Claude Code

This document explains how to use Serena MCP with Claude Code for enhanced coding capabilities in the RdLn project.

## What is Serena MCP?

Serena is a powerful, free, and open-source coding agent toolkit that provides semantic code retrieval and editing capabilities. It acts as an "IDE for a coding agent," giving AI models powerful tools to understand and modify codebases directly.

Key features:
- Semantic Code Operations using Language Servers (LSP)
- Multi-Language Support (Python, TypeScript/JavaScript, Go, Rust, C#, Java, etc.)
- Autonomous Capabilities (execute shell commands, run tests, perform editing operations)

## Configuration

The Serena MCP server is configured to run on port 8000 and is automatically available to Claude Code through the MCP configuration.

### Configuration Files

1. **`.claude/mcp/serena.json`** - MCP server configuration for Serena
2. **`.claude/settings.local.json`** - Permission settings for Claude Code

## Starting the Server

The Serena MCP server should start automatically when Claude Code connects. However, you can also start it manually:

```cmd
# Using the batch script (recommended)
start-serena-server.bat

# Or directly with uvx
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project . --context desktop-app --mode interactive --mode editing
```

## Web Dashboard

Once the server is running, you can access the web dashboard at:
http://127.0.0.1:8000/dashboard/index.html

## Using Serena with Claude Code

Claude Code can now use Serena's powerful semantic code tools:

### Semantic Code Operations
- `find_symbol` - Search for symbols (functions, classes, variables) by name
- `find_referencing_symbols` - Find all references to a symbol
- `replace_symbol_body` - Replace the full definition of a symbol
- `get_symbols_overview` - Get an overview of symbols in a file

### File Operations
- `read_file` - Read any file in the project
- `create_text_file` - Create new files
- `list_dir` - List directory contents
- `search_for_pattern` - Search for text patterns across the project

### Development Tools
- `execute_shell_command` - Run shell commands
- `onboarding` - Project onboarding and setup information
- `initial_instructions` - Get project-specific instructions

## Example Commands for Claude

You can ask Claude Code to:

1. "Find all references to the MyersAlgorithm class"
2. "Show me the definition of the useComparison hook"
3. "Replace the implementation of the compareDocuments function"
4. "List all files in the src/algorithms directory"
5. "Search for all occurrences of 'performance' in the codebase"
6. "Run the unit tests for the OCR service"
7. "Create a new component file in src/components"

## Benefits

With Serena MCP, Claude Code can:
- Understand code at the semantic level (symbols, references) rather than just text
- Make precise edits to function/class definitions
- Navigate the codebase efficiently
- Execute development tasks autonomously
- Provide more accurate and context-aware assistance

## Troubleshooting

If Serena isn't working with Claude Code:

1. Check if the server is running:
   ```cmd
   tasklist | findstr python
   ```

2. Restart the server:
   ```cmd
   start-serena-server.bat
   ```

3. Verify the configuration in `.claude/mcp/serena.json`

4. Check that the permissions in `.claude/settings.local.json` include the Serena tools