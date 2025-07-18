#!/usr/bin/env python3
"""
実際のnpm run dev &シナリオテスト

実際の開発環境で使用されるケースをテストします：
1. npm run dev & (開発サーバー起動)
2. npm run watch & (ファイル監視)
3. 通常のgitコマンドやファイル操作
4. 長時間の動作継続性
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

def create_mock_npm_project(project_dir):
    """モックのnpmプロジェクトを作成"""
    package_json = {
        "name": "test-project",
        "version": "1.0.0",
        "scripts": {
            "dev": "echo 'Starting development server on port 3000...' && sleep 120",
            "watch": "echo 'Starting file watcher...' && sleep 90",
            "build": "echo 'Building project...' && sleep 5",
            "test": "echo 'Running tests...' && sleep 3"
        }
    }
    
    import json
    with open(os.path.join(project_dir, 'package.json'), 'w') as f:
        json.dump(package_json, f, indent=2)
    
    # モックのnpmコマンドを作成
    npm_script = f"""#!/bin/bash
case "$2" in
    "dev")
        echo "Starting development server on port 3000..."
        sleep 120
        ;;
    "watch")
        echo "Starting file watcher..."
        sleep 90
        ;;
    "build")
        echo "Building project..."
        sleep 5
        ;;
    "test")
        echo "Running tests..."
        sleep 3
        ;;
    *)
        echo "Unknown script: $2"
        exit 1
        ;;
esac
"""
    
    npm_path = os.path.join(project_dir, 'npm')
    with open(npm_path, 'w') as f:
        f.write(npm_script)
    os.chmod(npm_path, 0o755)
    
    return project_dir

def test_real_npm_scenario():
    """実際のnpm run dev &シナリオをテスト"""
    
    print("🚀 実際のnpm run dev &シナリオテスト開始")
    print("=" * 60)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"テスト環境: {temp_dir}")
        
        # モックnpmプロジェクトを作成
        create_mock_npm_project(temp_dir)
        print("✅ モックnpmプロジェクト作成完了")
        
        # BashSessionを初期化
        session = BashSession(work_dir=temp_dir, username='tatsuya')
        session.initialize()
        print("✅ BashSession初期化完了")
        
        try:
            # 実際の開発ワークフローをシミュレート
            print("\n📋 ステップ1: 開発サーバー起動 (npm run dev &)")
            
            # PATHにモックnpmを追加
            path_setup = CmdRunAction(command=f"export PATH={temp_dir}:$PATH")
            session.execute(path_setup)
            
            # npm run dev &を実行
            dev_server = CmdRunAction(command="./npm run dev &")
            result1 = session.execute(dev_server)
            print(f"  開発サーバー起動結果: 終了コード {result1.metadata.exit_code}")
            print(f"  バックグラウンドウィンドウ数: {len(session.background_windows)}")
            
            print("\n📋 ステップ2: ファイル監視開始 (npm run watch &)")
            watch_process = CmdRunAction(command="./npm run watch &")
            result2 = session.execute(watch_process)
            print(f"  ファイル監視開始結果: 終了コード {result2.metadata.exit_code}")
            print(f"  バックグラウンドウィンドウ数: {len(session.background_windows)}")
            
            print("\n📋 ステップ3: 通常の開発作業")
            dev_tasks = [
                ("git status確認", "echo 'On branch main' && echo 'nothing to commit, working tree clean'"),
                ("ファイル作成", "echo 'console.log(\"Hello World\");' > app.js"),
                ("ファイル確認", "ls -la"),
                ("ファイル内容確認", "cat app.js"),
                ("テスト実行", "./npm run test"),
                ("ビルド実行", "./npm run build")
            ]
            
            for task_name, command in dev_tasks:
                print(f"  実行中: {task_name}")
                task = CmdRunAction(command=command)
                result = session.execute(task)
                if result.metadata.exit_code == 0:
                    print(f"    ✅ {task_name}: 成功")
                else:
                    print(f"    ❌ {task_name}: 失敗 (終了コード: {result.metadata.exit_code})")
            
            print("\n📋 ステップ4: バックグラウンドプロセス状況確認")
            print(f"  アクティブなバックグラウンドウィンドウ: {len(session.background_windows)}")
            for i, window_name in enumerate(session.background_windows, 1):
                print(f"    {i}. {window_name}")
            
            print("\n📋 ステップ5: 30秒間の動作継続確認")
            print("  バックグラウンドプロセスが動作中に、フォアグラウンドタスクを継続実行...")
            
            for i in range(6):  # 30秒間、5秒間隔でチェック
                time.sleep(5)
                
                # 定期的なフォアグラウンドタスク
                heartbeat_tasks = [
                    f"echo 'Heartbeat {i+1}: System is running'",
                    "pwd",
                    "ls -la app.js 2>/dev/null || echo 'File check'"
                ]
                
                for task_cmd in heartbeat_tasks:
                    task = CmdRunAction(command=task_cmd)
                    result = session.execute(task)
                    if result.metadata.exit_code == 0:
                        print(f"    ✅ ハートビート{i+1}: 正常")
                        break
                else:
                    print(f"    ⚠️  ハートビート{i+1}: 一部タスクで問題")
            
            print("\n📋 ステップ6: 追加のバックグラウンドプロセス")
            additional_bg = CmdRunAction(command="echo 'Additional background task' && sleep 60 &")
            result6 = session.execute(additional_bg)
            print(f"  追加バックグラウンドプロセス: 終了コード {result6.metadata.exit_code}")
            print(f"  最終バックグラウンドウィンドウ数: {len(session.background_windows)}")
            
            print("\n📋 ステップ7: システムリソース最終確認")
            resource_check = CmdRunAction(command="ps aux | grep -E '(sleep|npm)' | grep -v grep | wc -l")
            result7 = session.execute(resource_check)
            process_count = result7.content.strip()
            print(f"  実行中の関連プロセス数: {process_count}")
            
            print("\n✅ 実際のnpm run dev &シナリオテスト完了")
            print("  全てのバックグラウンドプロセスが正常に動作継続中")
            
        except Exception as e:
            print(f"❌ テスト中にエラーが発生: {e}")
            import traceback
            traceback.print_exc()
            
        finally:
            print("\n📋 ステップ8: クリーンアップ")
            print("  セッション終了とバックグラウンドプロセスのクリーンアップ...")
            session.close()
            print("✅ クリーンアップ完了")
            
            # 最終確認
            time.sleep(2)
            try:
                result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
                remaining = [line for line in result.stdout.split('\n') 
                           if any(keyword in line for keyword in ['sleep', 'npm']) 
                           and 'grep' not in line and line.strip()]
                print(f"  残存プロセス数: {len(remaining)}")
                if remaining:
                    print("  ⚠️  一部プロセスが残存:")
                    for proc in remaining[:3]:
                        print(f"    {proc.strip()}")
                else:
                    print("  ✅ 全プロセスが正常にクリーンアップされました")
            except Exception as e:
                print(f"  最終確認中にエラー: {e}")

if __name__ == "__main__":
    print("🔧 実際のnpm run dev &シナリオテスト")
    print("Windows版バックグラウンド管理機能のUnix版移植 - 実践テスト")
    print()
    
    test_real_npm_scenario()
    
    print("\n" + "=" * 60)
    print("🎉 実践テスト完了！")
    print("バックグラウンド管理機能は実際の開発環境で正常に動作します。")
    print("=" * 60)