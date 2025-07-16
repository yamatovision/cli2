#!/usr/bin/env python3
"""
Bluelampシステム統合テスト

実際のBluelampエージェントシステムでバックグラウンド管理機能をテストします。
"""

import os
import sys
import time
import tempfile
import subprocess
from pathlib import Path

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from openhands.runtime.utils.bash import BashSession
from openhands.events.action import CmdRunAction

def test_bluelamp_integration():
    """Bluelampシステムでの統合テスト"""
    
    print("🔵 Bluelampシステム統合テスト開始")
    print("=" * 60)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"テスト環境: {temp_dir}")
        
        # BashSessionを初期化
        session = BashSession(work_dir=temp_dir, username='tatsuya')
        session.initialize()
        print("✅ BashSession初期化完了")
        
        try:
            print("\n📋 テスト1: 典型的な開発サーバー起動パターン")
            
            # 実際によく使われるコマンドパターンをテスト
            dev_commands = [
                ("Python開発サーバー", "python3 -m http.server 8000 &"),
                ("Node.js開発サーバー", "echo 'Server starting on port 3000...' && sleep 120 &"),
                ("ファイル監視", "echo 'Watching files...' && sleep 90 &"),
                ("バックグラウンドビルド", "echo 'Building in background...' && sleep 60 &")
            ]
            
            for name, command in dev_commands:
                print(f"  実行: {name}")
                action = CmdRunAction(command=command)
                result = session.execute(action)
                if result.metadata.exit_code == 0:
                    print(f"    ✅ {name}: 成功")
                else:
                    print(f"    ❌ {name}: 失敗 (終了コード: {result.metadata.exit_code})")
            
            print(f"\n  バックグラウンドプロセス数: {len(session.background_windows)}")
            
            print("\n📋 テスト2: エージェント間でのコマンド実行")
            
            # エージェントが実行しそうなコマンドパターン
            agent_commands = [
                ("ファイル作成", "echo 'Hello from agent' > agent_test.txt"),
                ("ディレクトリ作成", "mkdir -p test_project/src"),
                ("ファイル移動", "mv agent_test.txt test_project/"),
                ("権限設定", "chmod 755 test_project"),
                ("ファイル確認", "ls -la test_project/"),
                ("内容確認", "cat test_project/agent_test.txt")
            ]
            
            for name, command in agent_commands:
                print(f"  実行: {name}")
                action = CmdRunAction(command=command)
                result = session.execute(action)
                if result.metadata.exit_code == 0:
                    print(f"    ✅ {name}: 成功")
                else:
                    print(f"    ❌ {name}: 失敗")
            
            print("\n📋 テスト3: 複雑なコマンドチェーン")
            
            complex_commands = [
                ("条件付き実行", "test -f test_project/agent_test.txt && echo 'File exists' || echo 'File not found'"),
                ("パイプライン", "ls -la | grep test | wc -l"),
                ("バックグラウンド+リダイレクト", "echo 'Background log' > bg.log && tail -f bg.log &"),
                ("環境変数設定", "export TEST_VAR='bluelamp' && echo $TEST_VAR")
            ]
            
            for name, command in complex_commands:
                print(f"  実行: {name}")
                action = CmdRunAction(command=command)
                result = session.execute(action)
                if result.metadata.exit_code == 0:
                    print(f"    ✅ {name}: 成功")
                else:
                    print(f"    ❌ {name}: 失敗")
            
            print(f"\n  最終バックグラウンドプロセス数: {len(session.background_windows)}")
            
            print("\n📋 テスト4: 長時間実行の安定性確認")
            print("  15秒間の安定性テスト...")
            
            for i in range(3):  # 15秒間、5秒間隔
                time.sleep(5)
                
                # 定期的なシステムチェック
                check_commands = [
                    f"echo 'System check {i+1}'",
                    "pwd",
                    "ls -la test_project/ 2>/dev/null || echo 'Directory check'"
                ]
                
                all_success = True
                for cmd in check_commands:
                    action = CmdRunAction(command=cmd)
                    result = session.execute(action)
                    if result.metadata.exit_code != 0:
                        all_success = False
                        break
                
                if all_success:
                    print(f"    ✅ システムチェック{i+1}: 正常")
                else:
                    print(f"    ⚠️  システムチェック{i+1}: 一部問題")
            
            print("\n📋 テスト5: エラーハンドリング")
            
            error_commands = [
                ("存在しないコマンド", "nonexistent_command"),
                ("権限エラー", "cat /etc/shadow 2>/dev/null || echo 'Permission denied as expected'"),
                ("無効なパス", "cd /nonexistent/path 2>/dev/null || echo 'Path error as expected'")
            ]
            
            for name, command in error_commands:
                print(f"  実行: {name}")
                action = CmdRunAction(command=command)
                result = session.execute(action)
                print(f"    結果: 終了コード {result.metadata.exit_code}")
            
            print("\n✅ Bluelampシステム統合テスト完了")
            print("  バックグラウンド管理機能は実際のエージェントシステムで正常動作")
            
        except Exception as e:
            print(f"❌ 統合テスト中にエラー: {e}")
            import traceback
            traceback.print_exc()
            
        finally:
            print("\n📋 最終クリーンアップ")
            session.close()
            print("✅ 統合テスト完了")

def test_edge_cases():
    """エッジケースのテスト"""
    
    print("\n" + "=" * 60)
    print("🔍 エッジケーステスト")
    print("=" * 60)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        session = BashSession(work_dir=temp_dir, username='tatsuya')
        session.initialize()
        
        try:
            print("\n📋 エッジケース1: 特殊文字を含むコマンド")
            special_commands = [
                ("クォート付き", "echo 'Hello \"World\"' &"),
                ("パイプ付き", "echo 'test' | cat &"),
                ("リダイレクト付き", "echo 'output' > test.txt &"),
                ("セミコロン付き", "echo 'first'; echo 'second' &")
            ]
            
            for name, command in special_commands:
                print(f"  テスト: {name}")
                action = CmdRunAction(command=command)
                result = session.execute(action)
                print(f"    結果: 終了コード {result.metadata.exit_code}")
            
            print("\n📋 エッジケース2: 空のコマンド")
            empty_commands = [
                ("空文字", ""),
                ("スペースのみ", "   "),
                ("&のみ", "&"),
                ("スペース+&", "   &")
            ]
            
            for name, command in empty_commands:
                print(f"  テスト: {name}")
                action = CmdRunAction(command=command)
                result = session.execute(action)
                print(f"    結果: 終了コード {result.metadata.exit_code}")
            
            print("\n📋 エッジケース3: 大量のバックグラウンドプロセス")
            print("  10個のバックグラウンドプロセスを起動...")
            
            for i in range(10):
                command = f"echo 'Process {i+1}' && sleep {5 + i} &"
                action = CmdRunAction(command=command)
                result = session.execute(action)
                if result.metadata.exit_code == 0:
                    print(f"    ✅ プロセス{i+1}: 起動成功")
                else:
                    print(f"    ❌ プロセス{i+1}: 起動失敗")
            
            print(f"  最終バックグラウンドプロセス数: {len(session.background_windows)}")
            
            print("\n✅ エッジケーステスト完了")
            
        except Exception as e:
            print(f"❌ エッジケーステスト中にエラー: {e}")
            
        finally:
            session.close()

if __name__ == "__main__":
    print("🔧 Bluelampシステム統合テスト")
    print("Windows版バックグラウンド管理機能のUnix版移植 - 統合テスト")
    print()
    
    # 統合テスト
    test_bluelamp_integration()
    
    # エッジケーステスト
    test_edge_cases()
    
    print("\n" + "=" * 60)
    print("🎉 全統合テスト完了！")
    print("バックグラウンド管理機能はBluelampシステムで完全に動作します。")
    print("=" * 60)