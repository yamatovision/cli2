#!/usr/bin/env python3
"""
無限ループ根本原因調査用デバッグスクリプト

このスクリプトは以下を調査します：
1. CmdRunActionが無限実行する根本原因
2. Runtime層のタイムアウトが効かない理由
3. プロセス状態の詳細追跡
"""

import os
import sys
import time
import logging
from pathlib import Path

# OpenHandsのパスを追加
sys.path.insert(0, str(Path(__file__).parent))

from openhands.core.logger import openhands_logger
from openhands.controller.agent_controller import AgentController
from openhands.runtime.impl.cli.cli_runtime import CLIRuntime

class InfiniteLoopDebugger:
    """無限ループ調査用デバッガー"""
    
    def __init__(self):
        self.setup_debug_logging()
        
    def setup_debug_logging(self):
        """デバッグ用ログ設定"""
        # ターミナル出力用ハンドラー
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        
        # 詳細フォーマット
        formatter = logging.Formatter(
            '🔍 [%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] %(message)s',
            datefmt='%H:%M:%S'
        )
        console_handler.setFormatter(formatter)
        
        # OpenHandsロガーに追加
        openhands_logger.addHandler(console_handler)
        openhands_logger.setLevel(logging.DEBUG)
        
        print("🚀 無限ループ根本原因調査デバッガー開始")
        print("=" * 60)
    
    def investigate_runtime_timeout(self):
        """Runtime層タイムアウト調査"""
        print("\n📋 Runtime層タイムアウト設定調査:")
        
        try:
            from openhands.core.config import OpenHandsConfig
            config = OpenHandsConfig()
            
            print(f"  - sandbox.timeout: {getattr(config.sandbox, 'timeout', 'None')}")
            print(f"  - sandbox.timeout_seconds: {getattr(config.sandbox, 'timeout_seconds', 'None')}")
            
            # CLIRuntimeの設定確認
            runtime = CLIRuntime(config)
            print(f"  - CLIRuntime.config.sandbox.timeout: {runtime.config.sandbox.timeout}")
            
        except Exception as e:
            print(f"  ❌ エラー: {e}")
    
    def investigate_action_timeout(self):
        """CmdRunActionタイムアウト調査"""
        print("\n📋 CmdRunActionタイムアウト設定調査:")
        
        try:
            from openhands.events.action import CmdRunAction
            
            # デフォルトアクション作成
            action = CmdRunAction(command="echo test")
            print(f"  - action.timeout (デフォルト): {action.timeout}")
            print(f"  - action.blocking: {action.blocking}")
            
            # タイムアウト設定テスト
            action.set_hard_timeout(60.0)
            print(f"  - action.timeout (設定後): {action.timeout}")
            print(f"  - action.blocking (設定後): {action.blocking}")
            
        except Exception as e:
            print(f"  ❌ エラー: {e}")
    
    def investigate_current_processes(self):
        """現在のプロセス状況調査"""
        print("\n📋 現在のプロセス状況:")
        
        import subprocess
        try:
            # OpenHandsプロセス検索
            result = subprocess.run(
                ['ps', 'aux'], 
                capture_output=True, 
                text=True
            )
            
            lines = result.stdout.split('\n')
            openhands_processes = [line for line in lines if 'openhands' in line.lower()]
            
            print(f"  - OpenHandsプロセス数: {len(openhands_processes)}")
            for i, proc in enumerate(openhands_processes):
                print(f"    {i+1}. {proc}")
                
        except Exception as e:
            print(f"  ❌ エラー: {e}")
    
    def investigate_session_logs(self):
        """セッションログ調査"""
        print("\n📋 セッションログ調査:")
        
        session_dir = Path.home() / ".openhands" / "sessions"
        print(f"  - セッションディレクトリ: {session_dir}")
        
        if session_dir.exists():
            sessions = list(session_dir.iterdir())
            print(f"  - セッション数: {len(sessions)}")
            
            for session in sessions[-3:]:  # 最新3セッション
                if session.is_dir():
                    events_dir = session / "events"
                    if events_dir.exists():
                        events = list(events_dir.glob("*.json"))
                        print(f"    - {session.name}: {len(events)} events")
                        
                        # 最新イベント確認
                        if events:
                            latest_event = max(events, key=lambda x: x.stat().st_mtime)
                            mtime = time.ctime(latest_event.stat().st_mtime)
                            print(f"      最新: {latest_event.name} ({mtime})")
        else:
            print("  ❌ セッションディレクトリが存在しません")
    
    def add_runtime_debug_logging(self):
        """Runtime層にデバッグログ追加"""
        print("\n🔧 Runtime層デバッグログ追加:")
        
        # CLIRuntimeにパッチを当てる
        original_execute_shell_command = CLIRuntime._execute_shell_command
        
        def debug_execute_shell_command(self, command: str, timeout: float):
            print(f"🚀 [DEBUG] コマンド実行開始: '{command}' (timeout: {timeout}s)")
            start_time = time.time()
            
            try:
                result = original_execute_shell_command(self, command, timeout)
                elapsed = time.time() - start_time
                print(f"✅ [DEBUG] コマンド完了: {elapsed:.2f}s (exit_code: {result.exit_code})")
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                print(f"❌ [DEBUG] コマンドエラー: {elapsed:.2f}s - {e}")
                raise
        
        # パッチ適用
        CLIRuntime._execute_shell_command = debug_execute_shell_command
        print("  ✅ Runtime層デバッグログパッチ適用完了")
    
    def add_controller_debug_logging(self):
        """Controller層にデバッグログ追加"""
        print("\n🔧 Controller層デバッグログ追加:")
        
        # AgentControllerにパッチを当てる
        original_pending_action_getter = AgentController._pending_action.fget
        
        def debug_pending_action_getter(self):
            result = original_pending_action_getter(self)
            if result:
                action_id = getattr(result, 'id', 'unknown')
                action_type = type(result).__name__
                
                if hasattr(self, '_pending_action_info') and self._pending_action_info:
                    _, timestamp = self._pending_action_info
                    elapsed = time.time() - timestamp
                    print(f"🔄 [DEBUG] pending_action取得: {action_type}(id={action_id}) - {elapsed:.1f}s経過")
            
            return result
        
        # パッチ適用
        AgentController._pending_action = property(debug_pending_action_getter)
        print("  ✅ Controller層デバッグログパッチ適用完了")
    
    def run_investigation(self):
        """調査実行"""
        print("🔍 無限ループ根本原因調査開始\n")
        
        self.investigate_runtime_timeout()
        self.investigate_action_timeout()
        self.investigate_current_processes()
        self.investigate_session_logs()
        
        print("\n🔧 デバッグログパッチ適用:")
        self.add_runtime_debug_logging()
        self.add_controller_debug_logging()
        
        print("\n" + "=" * 60)
        print("✅ 調査完了 - デバッグログが有効になりました")
        print("次回のCmdRunAction実行時に詳細ログが出力されます")
        print("=" * 60)

if __name__ == "__main__":
    debugger = InfiniteLoopDebugger()
    debugger.run_investigation()