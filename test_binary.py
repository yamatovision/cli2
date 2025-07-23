#!/usr/bin/env python3
"""
バイナリ動作テスト用の最小限のスクリプト
"""

import sys
import os

# 基本的な環境情報の表示
print("=== BlueLamp Binary Test ===")
print(f"Python version: {sys.version}")
print(f"Executable: {sys.executable}")
print(f"Frozen: {getattr(sys, 'frozen', False)}")

# バイナリモードの確認
if getattr(sys, 'frozen', False):
    print(f"Binary mode detected")
    print(f"MEIPASS: {sys._MEIPASS}")
    
# 簡単なインポートテスト
try:
    print("\n--- Import Test ---")
    import extensions.cli
    print("✓ extensions.cli imported")
    
    from extensions.cli.main import main
    print("✓ main function imported")
    
    # 引数チェック
    if "--version" in sys.argv:
        print("\nBlueLamp CLI v1.4.1")
        sys.exit(0)
    elif "--help" in sys.argv or "-h" in sys.argv:
        print("\nUsage: bluelamp [options]")
        print("Options:")
        print("  -h, --help     Show this help message")
        print("  --version      Show version information")
        sys.exit(0)
    else:
        print("\nStarting BlueLamp CLI...")
        main()
        
except Exception as e:
    print(f"\n❌ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)