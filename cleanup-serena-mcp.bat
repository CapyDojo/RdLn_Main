@echo off
REM Comprehensive Serena MCP Cleanup Script
REM Removes all Serena MCP configurations and cache files

title Serena MCP Cleanup - Complete Removal
echo ========================================
echo Serena MCP Configuration Cleanup
echo Complete Removal from Qoder IDE
echo ========================================
echo.

echo [STEP 1] Stopping any running Serena processes...
taskkill /f /im python.exe 2>nul
taskkill /f /im uvx.exe 2>nul
echo [OK] Processes stopped

echo.
echo [STEP 2] Cleaning Qoder IDE cache...
if exist "%APPDATA%\Qoder\SharedClientCache\mcp.json" (
    echo [INFO] Backing up original Qoder MCP config...
    copy "%APPDATA%\Qoder\SharedClientCache\mcp.json" "%APPDATA%\Qoder\SharedClientCache\mcp.json.pre-cleanup.backup" >nul 2>&1
    echo [INFO] Removing Serena from Qoder cache...
    del "%APPDATA%\Qoder\SharedClientCache\mcp.json" >nul 2>&1
)

if exist "%APPDATA%\Qoder\logs" (
    echo [INFO] Clearing MCP logs...
    del "%APPDATA%\Qoder\logs\*mcp*" /q >nul 2>&1
)

echo.
echo [STEP 3] Removing project-level Serena files...
if exist ".qoder\mcp.json" (
    echo [INFO] Backing up project MCP config...
    move ".qoder\mcp.json" ".qoder\mcp.json.backup" >nul 2>&1
)

if exist ".qoder\mcp-fast.json" del ".qoder\mcp-fast.json" >nul 2>&1
if exist ".qoder\mcp-instant.json" del ".qoder\mcp-instant.json" >nul 2>&1
if exist "mcp-config.json" del "mcp-config.json" >nul 2>&1

echo.
echo [STEP 4] Removing setup and startup scripts...
if exist "start-serena-qoder.bat" del "start-serena-qoder.bat" >nul 2>&1
if exist "start-serena-qoder.ps1" del "start-serena-qoder.ps1" >nul 2>&1
if exist "setup-qoder-serena.bat" del "setup-qoder-serena.bat" >nul 2>&1
if exist "setup-serena-timeout-fix.bat" del "setup-serena-timeout-fix.bat" >nul 2>&1
if exist "fix-qoder-mcp-timeout.bat" del "fix-qoder-mcp-timeout.bat" >nul 2>&1

echo.
echo [STEP 5] Removing documentation and test files...
if exist "QODER_SERENA_INTEGRATION.md" del "QODER_SERENA_INTEGRATION.md" >nul 2>&1
if exist "QODER_SERENA_SETUP_COMPLETE.md" del "QODER_SERENA_SETUP_COMPLETE.md" >nul 2>&1
if exist "QODER_SERENA_QUICK_SETUP.md" del "QODER_SERENA_QUICK_SETUP.md" >nul 2>&1
if exist "SERENA_MCP_TIMEOUT_TROUBLESHOOTING.md" del "SERENA_MCP_TIMEOUT_TROUBLESHOOTING.md" >nul 2>&1
if exist "SERENA_ACTIVATION_COMPLETE.md" del "SERENA_ACTIVATION_COMPLETE.md" >nul 2>&1
if exist "test-qoder-serena-integration.py" del "test-qoder-serena-integration.py" >nul 2>&1

echo.
echo [STEP 6] Clearing Serena cache and data...
if exist "%USERPROFILE%\.serena" (
    echo [INFO] Removing Serena user data...
    rmdir /s /q "%USERPROFILE%\.serena" >nul 2>&1
)

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Removed files and configurations:
echo - Qoder IDE MCP cache
echo - Project-level MCP configs
echo - Setup and startup scripts  
echo - Documentation files
echo - Test scripts
echo - Serena user data and cache
echo.
echo Backup files created:
echo - .qoder\mcp.json.backup (if existed)
echo - %APPDATA%\Qoder\SharedClientCache\mcp.json.pre-cleanup.backup
echo.
echo Your system is now clean of Serena MCP configuration.
echo You can safely restart Qoder IDE.
echo.
pause