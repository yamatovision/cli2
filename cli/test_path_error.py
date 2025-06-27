#!/usr/bin/env python3
"""
パスアクセスエラーのテストスクリプト
改善されたエラーハンドリングの動作を確認します
"""

import os
import sys
from pathlib import Path

# プロジェクトのルートディレクトリをPythonパスに追加
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from openhands.runtime.impl.cli.cli_runtime import CLIRuntime
from openhands.events.action import FileReadAction
from openhands.core.config import OpenHandsConfig


def test_path_access_error():
    """パスアクセスエラーのテスト"""
    print("=== パスアクセスエラーのテスト ===")
    
    # CLIRuntimeの設定
    config = OpenHandsConfig()
    workspace_path = os.path.join(project_root, "test_workspace")
    os.makedirs(workspace_path, exist_ok=True)
    
    runtime = CLIRuntime(config=config, workspace_path=workspace_path)
    runtime._runtime_initialized = True
    
    # テスト1: 作業ディレクトリ外のファイルアクセス
    print("\n1. 作業ディレクトリ外のファイルアクセステスト")
    try:
        action = FileReadAction(path="/etc/passwd")
        observation = runtime.read(action)
        print(f"結果: {observation.content}")
    except Exception as e:
        print(f"エラー: {e}")
    
    # テスト2: パストラバーサル攻撃
    print("\n2. パストラバーサル攻撃テスト")
    try:
        action = FileReadAction(path="../../../etc/passwd")
        observation = runtime.read(action)
        print(f"結果: {observation.content}")
    except Exception as e:
        print(f"エラー: {e}")
    
    # テスト3: 正常なファイルアクセス
    print("\n3. 正常なファイルアクセステスト")
    test_file = os.path.join(workspace_path, "test.txt")
    with open(test_file, "w") as f:
        f.write("テストファイルの内容")
    
    try:
        action = FileReadAction(path="test.txt")
        observation = runtime.read(action)
        print(f"結果: {observation.content}")
    except Exception as e:
        print(f"エラー: {e}")
    
    # クリーンアップ
    os.remove(test_file)
    os.rmdir(workspace_path)


if __name__ == "__main__":
    test_path_access_error()