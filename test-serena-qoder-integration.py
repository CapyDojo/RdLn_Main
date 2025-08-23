#!/usr/bin/env python3
"""
Test script to verify Serena MCP integration with Qoder IDE
"""

import subprocess
import sys
import os
import json
import time

def test_qoder_mcp_config():
    """Test if Qoder MCP configuration files exist"""
    config_files = [
        '.qoder/mcp.json',
        'mcp-config.json'
    ]
    
    found_configs = []
    for config_file in config_files:
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    found_configs.append(config_file)
                    print(f"[PASS] Found valid MCP config: {config_file}")
            except json.JSONDecodeError:
                print(f"[FAIL] Invalid JSON in {config_file}")
                return False
            except Exception as e:
                print(f"[ERROR] Error reading {config_file}: {e}")
                return False
    
    if found_configs:
        print(f"[INFO] Available MCP configurations: {', '.join(found_configs)}")
        return True
    else:
        print("[FAIL] No MCP configuration files found")
        return False

def test_serena_installation():
    """Test if Serena is properly installed and accessible"""
    try:
        result = subprocess.run([
            'uvx', '--from', 'git+https://github.com/oraios/serena', 
            'serena', '--help'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("[PASS] Serena is properly installed and accessible")
            return True
        else:
            print("[FAIL] Failed to run Serena command")
            print(f"Error: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("[FAIL] Serena command timed out")
        return False
    except Exception as e:
        print(f"[ERROR] Error testing Serena installation: {e}")
        return False

def test_startup_scripts():
    """Test if startup scripts exist and are accessible"""
    scripts = [
        'start-serena-qoder.bat',
        'start-serena-qoder.ps1'
    ]
    
    found_scripts = []
    for script in scripts:
        if os.path.exists(script):
            found_scripts.append(script)
            print(f"[PASS] Found startup script: {script}")
    
    if found_scripts:
        print(f"[INFO] Available startup scripts: {', '.join(found_scripts)}")
        return True
    else:
        print("[FAIL] No startup scripts found")
        return False

def test_project_structure():
    """Test if project has the expected structure for Serena"""
    required_dirs = ['src', 'src/components', 'src/services']
    optional_dirs = ['tests', 'src/algorithms']
    
    missing_required = []
    for dir_path in required_dirs:
        if not os.path.exists(dir_path):
            missing_required.append(dir_path)
    
    if missing_required:
        print(f"[FAIL] Missing required directories: {', '.join(missing_required)}")
        return False
    else:
        print("[PASS] Project structure is compatible with Serena")
        
    found_optional = []
    for dir_path in optional_dirs:
        if os.path.exists(dir_path):
            found_optional.append(dir_path)
    
    if found_optional:
        print(f"[INFO] Found optional directories: {', '.join(found_optional)}")
    
    return True

def main():
    print("Testing Serena MCP Integration with Qoder IDE...")
    print("=" * 55)
    
    tests = [
        ("MCP Configuration", test_qoder_mcp_config),
        ("Serena Installation", test_serena_installation), 
        ("Startup Scripts", test_startup_scripts),
        ("Project Structure", test_project_structure)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n--- Testing {test_name} ---")
        if test_func():
            passed += 1
        print()
    
    print("=" * 55)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("\n[SUCCESS] All tests passed! Serena MCP is ready for Qoder IDE.")
        print("\nNext steps:")
        print("1. Start Qoder IDE")
        print("2. Go to MCP settings in Qoder")
        print("3. Add the Serena MCP server using one of the config files")
        print("4. Or run: start-serena-qoder.bat to start the server manually")
        return 0
    else:
        print(f"\n[FAILURE] {total - passed} tests failed. Please check the configuration.")
        return 1

if __name__ == '__main__':
    sys.exit(main())