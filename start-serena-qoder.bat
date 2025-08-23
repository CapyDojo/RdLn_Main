@echo off
REM Serena MCP Server Startup Script for Qoder IDE
REM This script starts Serena MCP server in STDIO mode for Qoder integration

title Serena MCP Server - Qoder IDE Integration
echo ========================================
echo Serena MCP Server for Qoder IDE
echo ========================================
echo Project: RdLn MVP Stream
echo Transport: STDIO
echo Context: desktop-app
echo ========================================
echo.

echo [INFO] Starting Serena MCP server...
echo [INFO] This will run in STDIO mode for Qoder IDE integration
echo.

uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project . --context desktop-app --mode interactive --mode editing --transport stdio

echo.
echo [INFO] Serena MCP server has ended.
echo [INFO] If this was unexpected, check the error messages above.
echo.
pause