# Serena MCP Configuration for RdLn Project

This document explains how to use Serena MCP with the RdLn project.

## Prerequisites

- Python 3.12+
- uv (package manager)

## Installation

Serena MCP is installed on-demand using uvx:

```bash
uvx --from git+https://github.com/oraios/serena serena --help
```

## Configuration

The configuration has been set up with:

1. Global configuration at `%USERPROFILE%\.serena\serena_config.yml`
2. Project configuration at `.serena\project.yml`

## Starting the Server

You can start the Serena MCP server in several ways:

### Option 1: Using the batch script
```cmd
start-serena-server.bat
```

### Option 2: Direct command
```cmd
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project . --context desktop-app --mode interactive --mode editing
```

### Option 3: PowerShell script
```powershell
.\start-serena.ps1
```

## Web Dashboard

Once the server is running, you can access the web dashboard at:
http://127.0.0.1:24282/dashboard/index.html

## Testing the Configuration

Run the test script to verify everything is set up correctly:
```cmd
python test-serena-config.py
```

## Using Serena with MCP Clients

Serena can be used with various MCP clients like:
- Claude Code
- Claude Desktop
- VSCode/Cursor extensions
- Terminal-based clients
- Local GUIs
- Agent frameworks

Configure your MCP client to connect to the Serena server using the appropriate transport protocol (stdio or sse).