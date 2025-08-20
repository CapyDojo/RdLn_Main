@echo off
REM Serena MCP Server Startup Script for RdLn Project
REM This script will start the server and keep the window open for logs

title Serena MCP Server - RdLn Project
echo ========================================
echo Serena MCP Server for RdLn Project
echo ========================================
echo Starting server...
echo.

uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project . --context desktop-app --mode interactive --mode editing

echo.
echo Server process ended. Press any key to close this window.
pause >nul