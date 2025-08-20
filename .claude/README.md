# Claude Code + Serena MCP Integration

This integration enables Claude Code to use Serena MCP for enhanced semantic code understanding and editing capabilities.

## What's Included

1. **Serena MCP Server Configuration** - Configured to run on port 8000
2. **Claude Code Permissions** - Updated to allow Serena MCP tool usage
3. **Semantic Code Tools** - Claude can now use powerful code understanding tools

## How It Works

Serena provides Claude Code with IDE-like capabilities:
- Find symbols and their references semantically (not just text search)
- Replace function/class definitions precisely
- Navigate the codebase intelligently
- Execute development tasks

## Quick Start

1. **Start the Serena MCP Server**:
   ```cmd
   start-serena-server.bat
   ```

2. **Use Claude Code** with the new capabilities:
   - Ask Claude to "find all references to the MyersAlgorithm class"
   - Request "show me the definition of the useComparison hook"
   - Instruct Claude to "replace the implementation of compareDocuments"
   - Have Claude "search for all occurrences of 'performance' in the codebase"

## Available Tools

Claude Code can now use these Serena tools:
- `find_symbol` - Search for symbols by name
- `find_referencing_symbols` - Find all references to a symbol
- `replace_symbol_body` - Replace a symbol's full definition
- `read_file` - Read any file in the project
- `create_text_file` - Create new files
- `execute_shell_command` - Run shell commands
- `list_dir` - List directory contents
- `search_for_pattern` - Search across the project
- `get_symbols_overview` - Get symbols in a file
- And many more...

## Documentation

See `CLAUD_CODE_SERENA_INTEGRATION.md` for detailed information about the integration.

## Testing

Run `python test-serena-claude-integration.py` to verify the integration is working correctly.