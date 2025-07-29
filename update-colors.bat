@echo off
echo Updating color preview from TypeScript theme files...
node generate-color-preview.js
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Color preview updated successfully!
    echo 🎨 Open color-preview.html in your browser to see the changes
) else (
    echo.
    echo ❌ Error updating color preview
)
pause