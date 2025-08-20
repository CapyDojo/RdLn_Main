#!/usr/bin/env python3
"""
Test script to verify Serena MCP configuration
"""

import subprocess
import sys
import os

def test_serena_installation():
    """Test if Serena is properly installed"""
    try:
        # Test if serena command is available
        result = subprocess.run([
            'uvx', '--from', 'git+https://github.com/oraios/serena', 
            'serena', '--help'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("[PASS] Serena is properly installed")
            return True
        else:
            print("[FAIL] Failed to run Serena command")
            print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"[ERROR] Error testing Serena installation: {e}")
        return False

def test_project_config():
    """Test if project configuration exists"""
    project_config_path = os.path.join('.serena', 'project.yml')
    if os.path.exists(project_config_path):
        print("[PASS] Project configuration found")
        return True
    else:
        print("[FAIL] Project configuration not found")
        return False

def test_global_config():
    """Test if global configuration exists"""
    home_dir = os.path.expanduser('~')
    global_config_path = os.path.join(home_dir, '.serena', 'serena_config.yml')
    if os.path.exists(global_config_path):
        print("[PASS] Global configuration found")
        return True
    else:
        print("[FAIL] Global configuration not found")
        return False

def main():
    print("Testing Serena MCP Configuration...")
    print("=" * 40)
    
    tests = [
        test_serena_installation,
        test_global_config,
        test_project_config
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"Tests passed: {passed}/{len(tests)}")
    
    if passed == len(tests):
        print("\n[SUCCESS] All tests passed! Serena MCP is properly configured.")
        return 0
    else:
        print("\n[FAILURE] Some tests failed. Please check the configuration.")
        return 1

if __name__ == '__main__':
    sys.exit(main())