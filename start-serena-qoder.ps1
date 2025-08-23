# Serena MCP Server Startup Script for Qoder IDE
# This script starts Serena MCP server in STDIO mode for Qoder integration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Serena MCP Server for Qoder IDE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project: RdLn MVP Stream" -ForegroundColor Green
Write-Host "Transport: STDIO" -ForegroundColor Green  
Write-Host "Context: desktop-app" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Starting Serena MCP server..." -ForegroundColor Blue
Write-Host "[INFO] This will run in STDIO mode for Qoder IDE integration" -ForegroundColor Blue
Write-Host ""

try {
    uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project . --context desktop-app --mode interactive --mode editing --transport stdio
} catch {
    Write-Host "[ERROR] Failed to start Serena MCP server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[HELP] Make sure uvx is installed and accessible in your PATH" -ForegroundColor Yellow
    Write-Host "[HELP] Try running: pip install uvx" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[INFO] Serena MCP server has ended." -ForegroundColor Blue
Write-Host "[INFO] If this was unexpected, check the error messages above." -ForegroundColor Blue
Write-Host ""
Read-Host "Press Enter to continue"