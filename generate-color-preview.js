#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to extract color values from TypeScript theme files
function extractColorsFromThemeFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract theme name, displayName, and description
        const nameMatch = content.match(/name:\s*['"`]([^'"`]+)['"`]/);
        const displayNameMatch = content.match(/displayName:\s*['"`]([^'"`]+)['"`]/);
        const descriptionMatch = content.match(/description:\s*['"`]([^'"`]+)['"`]/);
        
        const themeName = nameMatch ? nameMatch[1] : path.basename(filePath, '.ts');
        const displayName = displayNameMatch ? displayNameMatch[1] : themeName;
        const description = descriptionMatch ? descriptionMatch[1] : 'Theme description';
        
        // More robust extraction - find colors object with proper brace matching
        const colorsStartMatch = content.match(/colors:\s*{/);
        if (!colorsStartMatch) {
            console.warn(`No colors object found in ${filePath}`);
            return null;
        }
        
        const startIndex = colorsStartMatch.index + colorsStartMatch[0].length;
        let braceCount = 1;
        let endIndex = startIndex;
        
        // Find the matching closing brace
        for (let i = startIndex; i < content.length && braceCount > 0; i++) {
            if (content[i] === '{') braceCount++;
            else if (content[i] === '}') braceCount--;
            endIndex = i;
        }
        
        if (braceCount !== 0) {
            console.warn(`Unmatched braces in colors object in ${filePath}`);
            return null;
        }
        
        const colorsContent = content.substring(startIndex, endIndex);
        
        // Extract each color palette with better regex
        const palettes = {};
        
        // Find all palette definitions (primary, secondary, accent, neutral)
        const paletteMatches = [...colorsContent.matchAll(/(\w+):\s*{([^}]*(?:{[^}]*}[^}]*)*)}/g)];
        
        for (const match of paletteMatches) {
            const paletteName = match[1];
            const paletteContent = match[2];
            
            // Extract individual color values
            const colors = {};
            const colorMatches = [...paletteContent.matchAll(/(\d+):\s*['"`]([^'"`]+)['"`]/g)];
            
            for (const colorMatch of colorMatches) {
                colors[colorMatch[1]] = colorMatch[2];
            }
            
            if (Object.keys(colors).length > 0) {
                palettes[paletteName] = colors;
            }
        }
        
        return {
            name: themeName,
            displayName: displayName,
            description: description,
            colors: palettes
        };
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return null;
    }
}

// Function to generate the HTML content
function generateHTML(themes) {
    const themesJson = JSON.stringify(themes, null, 8);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RdLn Theme Color Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #334155;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #64748b;
            margin: 0;
        }
        
        .refresh-info {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background: #e0f2fe;
            border: 1px solid #0284c7;
            border-radius: 8px;
            color: #0369a1;
            font-size: 14px;
        }
        
        .tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        
        .tab {
            padding: 8px 16px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 6px 6px 0 0;
            cursor: pointer;
            font-size: 14px;
            color: #475569;
            transition: all 0.2s;
        }
        
        .tab:hover {
            background: #e2e8f0;
        }
        
        .tab.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }
        
        .theme-content {
            display: none;
        }
        
        .theme-content.active {
            display: block;
        }
        
        .theme-header {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        
        .theme-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 8px 0;
        }
        
        .theme-description {
            color: #64748b;
            margin: 0;
            font-size: 16px;
        }
        
        .color-section {
            margin-bottom: 40px;
        }
        
        .color-section h2 {
            margin-bottom: 15px;
            color: #334155;
            font-size: 20px;
            font-weight: 600;
        }
        
        .color-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 12px;
        }
        
        .color-swatch {
            text-align: center;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .color-swatch:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.15);
        }
        
        .color-box {
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            position: relative;
        }
        
        .color-box:hover::after {
            content: 'Click to copy';
            position: absolute;
            bottom: 4px;
            right: 4px;
            font-size: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        .color-info {
            padding: 12px;
            background: white;
            font-size: 11px;
            color: #475569;
        }
        
        .color-code {
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-weight: 700;
            font-size: 12px;
            margin-bottom: 4px;
        }
        
        .color-name {
            font-size: 10px;
            color: #64748b;
        }
        
        .copy-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        
        .copy-notification.show {
            transform: translateX(0);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>RdLn Theme Color Palettes</h1>
        <p>Dynamic color preview from TypeScript theme definitions</p>
    </div>
    
    <div class="refresh-info">
        🔄 Colors are automatically synced from TypeScript files. Run <code>node generate-color-preview.js</code> to refresh after theme changes.
    </div>
    
    <div class="tabs" id="tabs"></div>
    
    <div id="theme-contents"></div>
    
    <div class="copy-notification" id="copyNotification">
        Color copied to clipboard!
    </div>
    
    <script>
        // Theme definitions extracted from TypeScript files
        const themes = ${themesJson};

        // Utility functions
        function getContrastColor(hexColor) {
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                const notification = document.getElementById('copyNotification');
                notification.classList.add('show');
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 2000);
            });
        }

        function createColorSwatch(colorCode, colorName, paletteType, shade) {
            const contrastColor = getContrastColor(colorCode);
            return \`
                <div class="color-swatch">
                    <div class="color-box" 
                         style="background-color: \${colorCode}; color: \${contrastColor};"
                         onclick="copyToClipboard('\${colorCode}')"
                         title="Click to copy \${colorCode}">
                        \${shade}
                    </div>
                    <div class="color-info">
                        <div class="color-code">\${colorCode}</div>
                        <div class="color-name">\${paletteType}-\${shade}</div>
                    </div>
                </div>
            \`;
        }

        function createColorSection(title, colors) {
            if (!colors || Object.keys(colors).length === 0) {
                return '';
            }
            
            const swatches = Object.entries(colors).map(([shade, color]) => 
                createColorSwatch(color, \`\${title.toLowerCase()}-\${shade}\`, title.toLowerCase(), shade)
            ).join('');
            
            return \`
                <div class="color-section">
                    <h2>\${title} Colors</h2>
                    <div class="color-grid">
                        \${swatches}
                    </div>
                </div>
            \`;
        }

        function createThemeContent(themeKey, theme) {
            return \`
                <div class="theme-content" id="theme-\${themeKey}">
                    <div class="theme-header">
                        <h2 class="theme-title">\${theme.displayName}</h2>
                        <p class="theme-description">\${theme.description}</p>
                    </div>
                    \${createColorSection('Primary', theme.colors.primary)}
                    \${createColorSection('Secondary', theme.colors.secondary)}
                    \${createColorSection('Accent', theme.colors.accent)}
                    \${createColorSection('Neutral', theme.colors.neutral)}
                </div>
            \`;
        }

        function createTab(themeKey, theme, isActive = false) {
            return \`
                <div class="tab \${isActive ? 'active' : ''}" 
                     onclick="switchTheme('\${themeKey}')" 
                     data-theme="\${themeKey}">
                    \${theme.displayName}
                </div>
            \`;
        }

        function switchTheme(themeKey) {
            // Update active tab
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(\`[data-theme="\${themeKey}"]\`).classList.add('active');

            // Update active content
            document.querySelectorAll('.theme-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(\`theme-\${themeKey}\`).classList.add('active');
        }

        // Initialize the page
        function init() {
            const tabsContainer = document.getElementById('tabs');
            const contentsContainer = document.getElementById('theme-contents');

            // Create tabs
            const tabs = Object.entries(themes).map(([key, theme], index) => 
                createTab(key, theme, index === 0)
            ).join('');
            tabsContainer.innerHTML = tabs;

            // Create theme contents
            const contents = Object.entries(themes).map(([key, theme]) => 
                createThemeContent(key, theme)
            ).join('');
            contentsContainer.innerHTML = contents;

            // Show first theme by default
            const firstThemeKey = Object.keys(themes)[0];
            if (firstThemeKey) {
                document.getElementById(\`theme-\${firstThemeKey}\`).classList.add('active');
            }
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>`;
}

// Main execution
function main() {
    const themesDir = path.join(__dirname, 'src', 'themes', 'definitions');
    const themes = {};
    
    try {
        const files = fs.readdirSync(themesDir);
        const tsFiles = files.filter(file => file.endsWith('.ts'));
        
        console.log(`Found ${tsFiles.length} theme files:`);
        
        for (const file of tsFiles) {
            const filePath = path.join(themesDir, file);
            console.log(`Processing: ${file}`);
            
            const themeData = extractColorsFromThemeFile(filePath);
            if (themeData) {
                themes[themeData.name] = themeData;
                console.log(`✓ Extracted ${Object.keys(themeData.colors).length} color palettes from ${themeData.displayName}`);
            }
        }
        
        if (Object.keys(themes).length === 0) {
            console.error('No themes were successfully extracted!');
            process.exit(1);
        }
        
        const html = generateHTML(themes);
        fs.writeFileSync('color-preview.html', html);
        
        console.log(`\\n✅ Generated color-preview.html with ${Object.keys(themes).length} themes`);
        console.log('🎨 Open color-preview.html in your browser to view the color palettes');
        console.log('🔄 Run this script again after making changes to theme files');
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();