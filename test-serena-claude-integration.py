#!/usr/bin/env python3
"""
Test script to verify Serena MCP integration with Claude Code
"""

import subprocess
import sys
import os
import time
import requests

def test_serena_server_running():
    """Test if Serena MCP server is running on port 8000"""
    try:
        # Check if port 8000 is listening
        response = requests.get('http://127.0.0.1:8000', timeout=5)
        # For an SSE MCP server, we expect it to be running even if it returns 404 for the root
        # Let's check if it's actually listening
        if response.status_code in [404, 501]:
            # This is expected for an MCP server, let's verify it's actually the right server
            headers = response.headers
            if 'server' in headers and 'uvicorn' in headers['server'].lower():
                print("[PASS] Serena MCP server is running on port 8000")
                return True
            else:
                print("[FAIL] Port 8000 is in use but may not be the Serena MCP server")
                return False
        else:
            print(f"[FAIL] Unexpected response from port 8000: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("[FAIL] Cannot connect to port 8000")
        return False
    except Exception as e:
        print(f"[ERROR] Error testing Serena server: {e}")
        return False

def test_claude_config():
    """Test if Claude configuration includes Serena permissions"""
    claude_config_path = os.path.join('.claude', 'settings.local.json')
    if os.path.exists(claude_config_path):
        try:
            with open(claude_config_path, 'r') as f:
                content = f.read()
                if 'mcp__serena' in content:
                    print("[PASS] Claude configuration includes Serena permissions")
                    return True
                else:
                    print("[FAIL] Claude configuration missing Serena permissions")
                    return False
        except Exception as e:
            print(f"[ERROR] Error reading Claude configuration: {e}")
            return False
    else:
        print("[FAIL] Claude configuration file not found")
        return False

def test_mcp_config():
    """Test if MCP configuration file exists and is valid"""
    mcp_config_path = os.path.join('.claude', 'mcp', 'serena.json')
    if os.path.exists(mcp_config_path):
        try:
            with open(mcp_config_path, 'r') as f:
                import json
                json.load(f)  # Validate JSON
                print("[PASS] MCP configuration file exists and is valid")
                return True
        except json.JSONDecodeError:
            print("[FAIL] MCP configuration file is not valid JSON")
            return False
        except Exception as e:
            print(f"[ERROR] Error reading MCP configuration: {e}")
            return False
    else:
        print("[FAIL] MCP configuration file not found")
        return False

def main():
    print("Testing Serena MCP Integration with Claude Code...")
    print("=" * 50)
    
    tests = [
        test_mcp_config,
        test_claude_config,
        test_serena_server_running
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"Tests passed: {passed}/{len(tests)}")
    
    if passed == len(tests):
        print("\n[SUCCESS] All tests passed! Serena MCP is properly integrated with Claude Code.")
        print("\nYou can now use Claude Code with enhanced semantic code understanding capabilities.")
        return 0
    else:
        print("\n[FAILURE] Some tests failed. Please check the configuration.")
        return 1

if __name__ == '__main__':
    sys.exit(main())