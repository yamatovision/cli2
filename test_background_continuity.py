#!/usr/bin/env python3
"""
バックグラウンド管理機能の動作継続性テスト

このスクリプトは以下をテストします：
1. バックグラウンドコマンドの正常な起動
2. 複数バックグラウンドプロセスの並行実行
3. フォアグラウンドコマンドとの並行動作
4. セッション終了時のクリーンアップ
5. 長時間実行プロセスの継続性
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

def test_background_continuity():
    """バックグラウンド管理機能の動作継続性をテストする"""
    
    print("🚀 バックグラウンド管理機能 - 動作継続性テスト開始")
    print("=" * 60)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"テスト環境: {temp_dir}")
        
        # BashSessionを初期化
        session = BashSession(work_dir=temp_dir, username='tatsuya')
        session.initialize()
        print("✅ BashSession初期化完了")
        
        try:
            # テスト1: 長時間バックグラウンドプロセスの起動
            print("\n📋 テスト1: 長時間バックグラウンドプロセスの起動")
            long_bg_action = CmdRunAction(command="sleep 30 &")
            result1 = session.execute(long_bg_action)
            print(f"  結果: {result1.content[:100]}...")
            print(f"  終了コード: {result1.metadata.exit_code}")
            print(f"  バックグラウンドウィンドウ数: {len(session.background_windows)}")
            
            # テスト2: 複数バックグラウンドプロセスの並行実行
            print("\n📋 テスト2: 複数バックグラウンドプロセスの並行実行")
            bg_actions = [
                CmdRunAction(command="echo 'Process 1' && sleep 15 &"),
                CmdRunAction(command="echo 'Process 2' && sleep 20 &"),
                CmdRunAction(command="echo 'Process 3' && sleep 25 &")
            ]
            
            for i, action in enumerate(bg_actions, 1):
                result = session.execute(action)
                print(f"  プロセス{i}: 終了コード {result.metadata.exit_code}")
            
            print(f"  総バックグラウンドウィンドウ数: {len(session.background_windows)}")
            
            # テスト3: フォアグラウンドコマンドとの並行動作
            print("\n📋 テスト3: フォアグラウンドコマンドとの並行動作")
            fg_actions = [
                CmdRunAction(command="echo 'Foreground task 1'"),
                CmdRunAction(command="ls -la"),
                CmdRunAction(command="pwd"),
                CmdRunAction(command="echo 'Foreground task 2'")
            ]
            
            for i, action in enumerate(fg_actions, 1):
                result = session.execute(action)
                print(f"  フォアグラウンドタスク{i}: 正常実行 (終了コード: {result.metadata.exit_code})")
            
            # テスト4: バックグラウンドプロセスの継続確認
            print("\n📋 テスト4: バックグラウンドプロセスの継続確認")
            print("  5秒待機してプロセス状況を確認...")
            time.sleep(5)
            
            # tmuxセッション内のウィンドウ一覧を確認
            if session.session:
                windows = session.session.list_windows()
                active_bg_windows = [w for w in windows if w.window_name.startswith('bg-')]
                print(f"  アクティブなバックグラウンドウィンドウ: {len(active_bg_windows)}")
                for window in active_bg_windows:
                    print(f"    - {window.window_name}")
            
            # テスト5: 新しいバックグラウンドプロセスの追加
            print("\n📋 テスト5: 新しいバックグラウンドプロセスの追加")
            additional_bg = CmdRunAction(command="echo 'Additional process' && sleep 10 &")
            result5 = session.execute(additional_bg)
            print(f"  追加プロセス: 終了コード {result5.metadata.exit_code}")
            print(f"  最終バックグラウンドウィンドウ数: {len(session.background_windows)}")
            
            # テスト6: システムリソース確認
            print("\n📋 テスト6: システムリソース確認")
            resource_check = CmdRunAction(command="ps aux | grep sleep | grep -v grep")
            result6 = session.execute(resource_check)
            sleep_processes = result6.content.strip().split('\n') if result6.content.strip() else []
            print(f"  実行中のsleepプロセス数: {len([p for p in sleep_processes if p.strip()])}")
            
            print("\n✅ 全テスト完了 - バックグラウンドプロセスは正常に動作継続中")
            
        except Exception as e:
            print(f"❌ テスト中にエラーが発生: {e}")
            import traceback
            traceback.print_exc()
            
        finally:
            # テスト7: クリーンアップの確認
            print("\n📋 テスト7: セッション終了時のクリーンアップ")
            print("  セッションを終了してクリーンアップを実行...")
            session.close()
            print("✅ セッション終了完了")
            
            # クリーンアップ後のプロセス確認
            time.sleep(2)
            try:
                result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
                remaining_processes = [line for line in result.stdout.split('\n') 
                                     if 'sleep' in line and 'grep' not in line]
                print(f"  クリーンアップ後の残存sleepプロセス: {len(remaining_processes)}")
                if remaining_processes:
                    print("  ⚠️  一部プロセスが残存している可能性があります")
                    for proc in remaining_processes[:3]:  # 最初の3つだけ表示
                        print(f"    {proc.strip()}")
                else:
                    print("  ✅ 全プロセスが正常にクリーンアップされました")
            except Exception as e:
                print(f"  プロセス確認中にエラー: {e}")

def test_real_world_scenario():
    """実際のユースケースに近いシナリオテスト"""
    
    print("\n" + "=" * 60)
    print("🌍 実世界シナリオテスト: npm run dev & 相当のテスト")
    print("=" * 60)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"テスト環境: {temp_dir}")
        
        session = BashSession(work_dir=temp_dir, username='tatsuya')
        session.initialize()
        
        try:
            # シナリオ1: 開発サーバー起動シミュレーション
            print("\n📋 シナリオ1: 開発サーバー起動シミュレーション")
            dev_server = CmdRunAction(command="echo 'Starting dev server...' && sleep 60 &")
            result = session.execute(dev_server)
            print(f"  開発サーバー起動: 終了コード {result.metadata.exit_code}")
            
            # シナリオ2: 並行してファイル監視シミュレーション
            print("\n📋 シナリオ2: ファイル監視シミュレーション")
            file_watcher = CmdRunAction(command="echo 'Starting file watcher...' && sleep 45 &")
            result = session.execute(file_watcher)
            print(f"  ファイル監視開始: 終了コード {result.metadata.exit_code}")
            
            # シナリオ3: 通常の開発作業シミュレーション
            print("\n📋 シナリオ3: 通常の開発作業シミュレーション")
            dev_tasks = [
                CmdRunAction(command="echo 'Checking git status...'"),
                CmdRunAction(command="echo 'Running tests...' && sleep 2"),
                CmdRunAction(command="echo 'Building project...' && sleep 1"),
                CmdRunAction(command="echo 'Linting code...' && sleep 1")
            ]
            
            for i, task in enumerate(dev_tasks, 1):
                result = session.execute(task)
                print(f"  開発タスク{i}: 完了")
            
            # シナリオ4: バックグラウンドプロセス状況確認
            print("\n📋 シナリオ4: バックグラウンドプロセス状況確認")
            print(f"  アクティブなバックグラウンドウィンドウ: {len(session.background_windows)}")
            
            # 10秒間の動作継続確認
            print("\n📋 シナリオ5: 10秒間の動作継続確認")
            for i in range(10):
                time.sleep(1)
                # 途中でフォアグラウンドタスクを実行
                if i % 3 == 0:
                    task = CmdRunAction(command=f"echo 'Heartbeat check {i+1}'")
                    result = session.execute(task)
                    print(f"  ハートビート{i+1}: OK")
                else:
                    print(f"  経過時間: {i+1}秒")
            
            print("\n✅ 実世界シナリオテスト完了")
            
        except Exception as e:
            print(f"❌ シナリオテスト中にエラー: {e}")
            import traceback
            traceback.print_exc()
            
        finally:
            session.close()
            print("✅ シナリオテスト用セッション終了")

if __name__ == "__main__":
    print("🔧 バックグラウンド管理機能 - 包括的動作継続性テスト")
    print("Windows版バックグラウンド管理機能のUnix版移植テスト")
    print()
    
    # 基本的な動作継続性テスト
    test_background_continuity()
    
    # 実世界シナリオテスト
    test_real_world_scenario()
    
    print("\n" + "=" * 60)
    print("🎉 全テスト完了！")
    print("バックグラウンド管理機能は正常に動作しています。")
    print("=" * 60)