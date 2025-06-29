#!/usr/bin/env python3
"""
CTRL+C終了テスト用スクリプト

このスクリプトは修正されたCTRL+C処理をテストするためのものです。
実際のBlueLamp CLIアプリケーションを起動し、CTRL+C動作を確認します。
"""

import subprocess
import sys
import time
import signal
import os

def test_ctrl_c_basic():
    """基本的なCTRL+C終了テスト"""
    print("=== CTRL+C基本テスト開始 ===")
    print("1. BlueLamp CLIを起動します")
    print("2. プロンプトが表示されたらCTRL+Cを押してください")
    print("3. 1-2秒以内に終了することを確認してください")
    print("4. ログ出力を確認してください")
    print()
    
    # 現在のディレクトリを確認
    current_dir = os.getcwd()
    print(f"現在のディレクトリ: {current_dir}")
    
    # BlueLamp CLIを起動
    try:
        # Poetry環境でPython実行
        poetry_cmd = "/Users/tatsuya/.local/bin/poetry"
        
        # CLIモジュールを起動
        cmd = [poetry_cmd, "run", "python", "-m", "openhands.cli.main", "--help"]
        print(f"実行コマンド: {' '.join(cmd)}")
        print()
        
        # まずヘルプを表示してモジュールが正常に動作するか確認
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✅ モジュールは正常に動作します")
            print("次に実際のCLIを起動します...")
            print()
            
            # 実際のCLI起動（インタラクティブモード）
            cmd_interactive = [poetry_cmd, "run", "python", "-m", "openhands.cli.main"]
            print(f"実行コマンド: {' '.join(cmd_interactive)}")
            print("プロンプトが表示されたらCTRL+Cを押してテストしてください")
            print("=" * 50)
            
            # インタラクティブモードで起動
            subprocess.run(cmd_interactive)
            
        else:
            print("❌ モジュールの起動に失敗しました")
            print(f"エラー: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ タイムアウトしました")
        return False
    except FileNotFoundError:
        print("❌ poetryが見つかりません")
        return False
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        return False
    
    return True

def main():
    """メイン関数"""
    print("CTRL+C終了機能テストスクリプト")
    print("=" * 40)
    print()
    
    # 基本テスト実行
    success = test_ctrl_c_basic()
    
    if success:
        print("\n✅ テスト完了")
        print("CTRL+C動作が期待通りに動作したかを確認してください")
    else:
        print("\n❌ テスト失敗")
        sys.exit(1)

if __name__ == "__main__":
    main()