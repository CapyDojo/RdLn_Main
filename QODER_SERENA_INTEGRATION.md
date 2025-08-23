# Serena MCP Integration with Qoder IDE

This document explains how to set up and use Serena MCP with Qoder IDE for enhanced coding capabilities in the RdLn project.

## What is Serena MCP?

Serena is a powerful, free, and open-source coding agent toolkit that provides semantic code retrieval and editing capabilities. It acts as an "IDE for a coding agent," giving AI models powerful tools to understand and modify codebases directly through the Model Context Protocol (MCP).

Key features:
- **Semantic Code Operations** using Language Servers (LSP)
- **Multi-Language Support** (Python, TypeScript/JavaScript, Go, Rust, C#, Java, etc.)
- **Autonomous Capabilities** (execute shell commands, run tests, perform editing operations)
- **Project Context Understanding** for more accurate assistance

## Setup Instructions

### Step 1: Prerequisites

Ensure you have the following installed:
- **Python 3.8+** with pip
- **Node.js 20.x** (for the RdLn project)
- **uvx** (Python package runner)

Install uvx if you haven't already:
```cmd
pip install uvx
```

### Step 2: Configure MCP in Qoder IDE

1. **Open Qoder IDE** and navigate to your RdLn project workspace
2. **Access MCP Settings**:
   - Go to Settings/Preferences in Qoder
   - Look for "MCP" or "Model Context Protocol" section
   - Or use the MCP page/panel in Qoder IDE

3. **Add Serena MCP Server**:
   - Click "Add MCP Server" or similar option
   - Use one of these configuration methods:

#### Method A: Using the Configuration File
Import the MCP configuration from one of these files:
- `.qoder/mcp.json` (Qoder-specific format)
- `mcp-config.json` (Standard format)

#### Method B: Manual Configuration
- **Name**: `Serena`
- **Type**: `STDIO`
- **Command**: `uvx`
- **Arguments**: 
  ```
  --from
  git+https://github.com/oraios/serena
  serena
  start-mcp-server
  --project
  .
  --context
  desktop-app
  --mode
  interactive
  --mode
  editing
  --transport
  stdio
  ```

### Step 3: Start the Server

You can start the Serena MCP server using one of these methods:

#### Option 1: Through Qoder IDE
Once configured, Qoder should automatically start the Serena MCP server when needed.

#### Option 2: Manual Startup (Windows)
```cmd
# Using batch script
start-serena-qoder.bat

# Using PowerShell script  
powershell -ExecutionPolicy Bypass -File start-serena-qoder.ps1
```

#### Option 3: Direct Command
```cmd
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project . --context desktop-app --mode interactive --mode editing --transport stdio
```

## Available Capabilities

With Serena MCP, Qoder can now use these powerful semantic code tools:

### Semantic Code Operations
- **`find_symbol`** - Search for symbols (functions, classes, variables) by name
- **`find_referencing_symbols`** - Find all references to a symbol
- **`replace_symbol_body`** - Replace the full definition of a symbol
- **`get_symbols_overview`** - Get an overview of symbols in a file

### File Operations
- **`read_file`** - Read any file in the project
- **`create_text_file`** - Create new files
- **`list_dir`** - List directory contents
- **`search_for_pattern`** - Search for text patterns across the project

### Development Tools
- **`execute_shell_command`** - Run shell commands
- **`onboarding`** - Project onboarding and setup information
- **`initial_instructions`** - Get project-specific instructions

## Example Commands for Qoder

You can ask Qoder with Serena to:

1. **"Find all references to the MyersAlgorithm class"**
2. **"Show me the definition of the useComparison hook"**
3. **"Replace the implementation of the compareDocuments function"**
4. **"List all files in the src/algorithms directory"**
5. **"Search for all occurrences of 'performance' in the codebase"**
6. **"Run the unit tests for the OCR service"**
7. **"Create a new component file in src/components"**

## Benefits for RdLn Development

With Serena MCP, Qoder can:
- **Understand code semantically** (symbols, references) rather than just text
- **Make precise edits** to function/class definitions
- **Navigate the codebase efficiently** using LSP capabilities
- **Execute development tasks autonomously**
- **Provide more accurate assistance** based on project context
- **Maintain code quality** through semantic understanding

## Project-Specific Context

Serena is configured with context about the RdLn project:
- **Technology Stack**: React 18.3.1, TypeScript 5.5.3, Vite 7.0.5
- **Key Components**: ComparisonInterface, TextInputPanel, MyersAlgorithm, RedlineOutput
- **Architecture**: Modular React application with semantic document comparison
- **Performance Requirements**: Handle 500k+ character documents efficiently

## Troubleshooting

### Server Won't Start
1. **Check uvx installation**:
   ```cmd
   uvx --version
   ```

2. **Verify Serena access**:
   ```cmd
   uvx --from git+https://github.com/oraios/serena serena --help
   ```

3. **Check project directory**: Ensure you're in the RdLn project root

### Qoder Can't Connect
1. **Verify MCP configuration** in Qoder settings
2. **Check transport type** is set to `STDIO`
3. **Restart Qoder IDE** after configuration changes

### Permission Issues
1. **Run as administrator** if needed on Windows
2. **Check file permissions** for the project directory
3. **Verify PowerShell execution policy**:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## Verification

Run the test script to verify everything is working:
```cmd
python test-serena-qoder-integration.py
```

This will check:
- MCP configuration files exist and are valid
- Serena is properly installed and accessible
- Startup scripts are available
- Project structure is compatible

## Security and Privacy

- **Local Processing**: All Serena operations run locally on your machine
- **No Data Upload**: Your code never leaves your development environment
- **Project Isolation**: Serena operates within your project context only
- **Permission Control**: You can control which operations require approval

## Support and Resources

- **Serena GitHub**: https://github.com/oraios/serena
- **MCP Documentation**: https://modelcontextprotocol.io/
- **Qoder IDE Documentation**: https://docs.qoder.com/
- **Project Issues**: Report issues in the RdLn project repository

---

## Configuration Files Reference

### `.qoder/mcp.json`
Complete MCP server configuration with approval settings for Qoder IDE.

### `mcp-config.json`  
Simplified configuration file compatible with standard MCP clients.

### `start-serena-qoder.bat`
Windows batch script to start Serena MCP server with proper logging.

### `start-serena-qoder.ps1`
PowerShell script with enhanced error handling and colored output.

### `test-serena-qoder-integration.py`
Comprehensive test script to verify the integration works correctly.

The integration has been successfully configured and is ready for use with Qoder IDE.