# Qwen Code MCP Integration

This directory contains configuration files for integrating Qwen Code with the Model Context Protocol (MCP).

## Playwright MCP Integration

The `mcp.config.json` file configures Qwen Code to use Playwright MCP, which allows the AI to interact with web pages through structured accessibility snapshots.

To use Playwright MCP with Qwen Code:

1. Ensure Playwright MCP is installed as a dev dependency:
   ```bash
   npm install --save-dev @playwright/mcp
   ```

2. Run the Playwright MCP server:
   ```bash
   npm run mcp
   ```

3. Configure your Qwen Code client to use this configuration file.

The integration allows Qwen Code to:
- Navigate web pages
- Take screenshots
- Click elements
- Hover over elements
- Type text
- Evaluate JavaScript
- Wait for elements
- Access console messages
- Get structured accessibility snapshots