# Start Serena MCP Server for RdLn Project
Write-Host "Starting Serena MCP Server for RdLn Project..."
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project . --context desktop-app --mode interactive --mode editing