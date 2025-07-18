#!/usr/bin/env python3
"""
簡易版無限ループ調査スクリプト
依存関係なしで基本調査を実行
"""

import os
import sys
import time
import subprocess
from pathlib import Path

def investigate_processes():
    """プロセス調査"""
    print("🔍 現在のOpenHandsプロセス:")
    print("=" * 50)
    
    try:
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        
        openhands_processes = []
        for line in lines:
            if 'openhands' in line.lower() or 'bluelamp' in line.lower():
                openhands_processes.append(line)
        
        if openhands_processes:
            for i, proc in enumerate(openhands_processes):
                print(f"{i+1}. {proc}")
        else:
            print("OpenHandsプロセスが見つかりません")
            
    except Exception as e:
        print(f"エラー: {e}")

def investigate_sessions():
    """セッション調査"""
    print("\n🔍 セッション状況:")
    print("=" * 50)
    
    session_dir = Path.home() / ".openhands" / "sessions"
    print(f"セッションディレクトリ: {session_dir}")
    
    if session_dir.exists():
        sessions = list(session_dir.iterdir())
        print(f"セッション数: {len(sessions)}")
        
        for session in sorted(sessions, key=lambda x: x.stat().st_mtime, reverse=True)[:3]:
            if session.is_dir():
                events_dir = session / "events"
                if events_dir.exists():
                    events = list(events_dir.glob("*.json"))
                    mtime = time.ctime(session.stat().st_mtime)
                    print(f"  - {session.name}: {len(events)} events (更新: {mtime})")
                    
                    # 最新イベントの内容確認
                    if events:
                        latest_event = max(events, key=lambda x: x.stat().st_mtime)
                        try:
                            with open(latest_event, 'r') as f:
                                content = f.read()
                                if 'CmdRunAction' in content:
                                    print(f"    📋 最新: {latest_event.name} (CmdRunAction含む)")
                                    # CmdRunActionの詳細抽出
                                    if '"id":' in content:
                                        import re
                                        id_match = re.search(r'"id":\s*(\d+)', content)
                                        if id_match:
                                            action_id = id_match.group(1)
                                            print(f"    🎯 Action ID: {action_id}")
                        except Exception as e:
                            print(f"    ❌ ファイル読み込みエラー: {e}")
    else:
        print("セッションディレクトリが存在しません")

def investigate_config():
    """設定調査"""
    print("\n🔍 環境変数設定:")
    print("=" * 50)
    
    env_vars = [
        'LOG_LEVEL', 'DEBUG', 'LOG_TO_FILE', 'LOG_JSON',
        'OPENHANDS_TIMEOUT', 'SANDBOX_TIMEOUT'
    ]
    
    for var in env_vars:
        value = os.getenv(var, 'None')
        print(f"  {var}: {value}")

def investigate_runtime_files():
    """Runtime関連ファイル調査"""
    print("\n🔍 Runtime実装ファイル:")
    print("=" * 50)
    
    files_to_check = [
        'openhands/runtime/impl/cli/cli_runtime.py',
        'openhands/controller/agent_controller.py',
        'openhands/events/action/commands.py'
    ]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            stat = os.stat(file_path)
            mtime = time.ctime(stat.st_mtime)
            size = stat.st_size
            print(f"  ✅ {file_path} ({size} bytes, 更新: {mtime})")
        else:
            print(f"  ❌ {file_path} (存在しません)")

def check_timeout_implementation():
    """タイムアウト実装確認"""
    print("\n🔍 タイムアウト実装確認:")
    print("=" * 50)
    
    cli_runtime_file = 'openhands/runtime/impl/cli/cli_runtime.py'
    if os.path.exists(cli_runtime_file):
        with open(cli_runtime_file, 'r') as f:
            content = f.read()
            
        # タイムアウト関連コード検索
        timeout_patterns = [
            'timeout is not None',
            'time.monotonic() - start_time',
            '_safe_terminate_process',
            'timed_out = True'
        ]
        
        print("Runtime層タイムアウト実装:")
        for pattern in timeout_patterns:
            if pattern in content:
                print(f"  ✅ {pattern} - 実装済み")
            else:
                print(f"  ❌ {pattern} - 未実装")
    
    controller_file = 'openhands/controller/agent_controller.py'
    if os.path.exists(controller_file):
        with open(controller_file, 'r') as f:
            content = f.read()
            
        print("\nController層タイムアウト実装:")
        if 'elapsed_time > 300.0' in content:
            print("  ✅ 5分タイムアウト - 実装済み")
        else:
            print("  ❌ 5分タイムアウト - 未実装")
            
        if 'CONTROLLER_FORCE_TIMEOUT' in content:
            print("  ✅ 強制タイムアウトログ - 実装済み")
        else:
            print("  ❌ 強制タイムアウトログ - 未実装")

def main():
    """メイン調査実行"""
    print("🚀 無限ループ根本原因調査 (簡易版)")
    print("=" * 60)
    
    investigate_processes()
    investigate_sessions()
    investigate_config()
    investigate_runtime_files()
    check_timeout_implementation()
    
    print("\n" + "=" * 60)
    print("✅ 基本調査完了")
    print("\n📋 次のステップ:")
    print("1. 現在実行中のプロセスを確認")
    print("2. セッションログで無限実行中のCmdRunActionを特定")
    print("3. Runtime層のタイムアウト設定を確認")
    print("4. 実際のコマンド実行でデバッグログを確認")
    print("=" * 60)

if __name__ == "__main__":
    main()