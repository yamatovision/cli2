#!/usr/bin/env python3
"""
CLIがハングアップする問題をデバッグするためのスクリプト
使用方法: python scripts/debug_hanging_issue.py
"""

import asyncio
import logging
import sys
import time
import traceback
from datetime import datetime
from typing import List, Optional

sys.path.insert(0, '/Users/tatsuya/Desktop/BlueLamp/cli')

from core.agents import AgentController
from core.logger import openhands_logger as logger
from core.schema import AgentState

# デバッグ用のカスタムログハンドラー
class DebugHandler(logging.Handler):
    def __init__(self, filename='cli_debug.log'):
        super().__init__()
        self.filename = filename
        self.file = open(filename, 'a')
        self.file.write(f"\n\n{'='*80}\n")
        self.file.write(f"Debug session started at {datetime.now()}\n")
        self.file.write(f"{'='*80}\n\n")
        
    def emit(self, record):
        try:
            msg = self.format(record)
            self.file.write(f"[{datetime.now().strftime('%H:%M:%S.%f')[:-3]}] {msg}\n")
            self.file.flush()
        except Exception:
            pass
    
    def close(self):
        self.file.close()

class CLIDebugger:
    def __init__(self):
        self.debug_handler = DebugHandler()
        self.setup_logging()
        self.state_history: List[tuple[float, str]] = []
        self.event_history: List[tuple[float, str, str]] = []
        self.stuck_threshold = 60  # 60秒以上同じ状態なら問題とみなす
        
    def setup_logging(self):
        """詳細なデバッグログを設定"""
        # 既存のロガーにデバッグハンドラーを追加
        logger.addHandler(self.debug_handler)
        logger.setLevel(logging.DEBUG)
        
        # フォーマッターを設定
        formatter = logging.Formatter(
            '%(levelname)s - %(name)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        self.debug_handler.setFormatter(formatter)
        
    def log_state_change(self, controller: AgentController, event_type: str):
        """エージェントの状態変更をログに記録"""
        current_time = time.time()
        current_state = controller.get_agent_state()
        
        self.state_history.append((current_time, current_state.name))
        
        logger.debug(
            f"State Change - Event: {event_type}, "
            f"State: {current_state.name}, "
            f"Iteration: {controller.state.iteration_flag.current_value}, "
            f"Pending Action: {controller._pending_action is not None}"
        )
        
        # スタック検出
        if len(self.state_history) > 1:
            last_time, last_state = self.state_history[-2]
            if current_state.name == last_state and current_time - last_time > self.stuck_threshold:
                logger.warning(
                    f"POTENTIAL STUCK DETECTED: Agent has been in {current_state.name} "
                    f"state for {current_time - last_time:.1f} seconds"
                )
                self.dump_debug_info(controller)
    
    def log_event(self, event_type: str, event_details: str):
        """イベントをログに記録"""
        current_time = time.time()
        self.event_history.append((current_time, event_type, event_details))
        logger.debug(f"Event: {event_type} - {event_details}")
    
    def dump_debug_info(self, controller: Optional[AgentController] = None):
        """デバッグ情報をダンプ"""
        logger.info("=== DEBUG INFO DUMP ===")
        
        # 最近の状態履歴
        logger.info("Recent State History:")
        for timestamp, state in self.state_history[-10:]:
            logger.info(f"  {datetime.fromtimestamp(timestamp).strftime('%H:%M:%S')} - {state}")
        
        # 最近のイベント履歴
        logger.info("Recent Event History:")
        for timestamp, event_type, details in self.event_history[-20:]:
            logger.info(f"  {datetime.fromtimestamp(timestamp).strftime('%H:%M:%S')} - {event_type}: {details}")
        
        # 現在のスタックトレース
        logger.info("Current Stack Trace:")
        for line in traceback.format_stack():
            logger.info(f"  {line.strip()}")
        
        # コントローラー情報
        if controller:
            logger.info(f"Controller State: {controller.get_agent_state()}")
            logger.info(f"Pending Action: {controller._pending_action}")
            logger.info(f"Delegate: {controller.delegate is not None}")
            logger.info(f"Closed: {controller._closed}")
            
    def monitor_loop(self, loop_func, check_interval=5):
        """ループ関数を監視して定期的に状態をチェック"""
        async def monitored_loop(*args, **kwargs):
            monitor_task = asyncio.create_task(self._monitor_task(check_interval))
            try:
                result = await loop_func(*args, **kwargs)
                return result
            finally:
                monitor_task.cancel()
                
        return monitored_loop
    
    async def _monitor_task(self, interval):
        """定期的にデバッグ情報を出力"""
        while True:
            await asyncio.sleep(interval)
            logger.debug(f"Monitor heartbeat - {datetime.now().strftime('%H:%M:%S')}")
            
            # アクティブなタスクをチェック
            tasks = asyncio.all_tasks()
            logger.debug(f"Active tasks: {len(tasks)}")
            for task in tasks:
                if not task.done():
                    logger.debug(f"  Task: {task.get_name()} - {task._state}")

def create_debug_wrapper():
    """デバッグラッパーを作成"""
    debugger = CLIDebugger()
    
    logger.info("CLI Debug Mode Enabled")
    logger.info("Debug log will be written to cli_debug.log")
    logger.info("Monitor interval: 5 seconds")
    
    return debugger

if __name__ == "__main__":
    print("CLI Debugger Tool")
    print("このスクリプトをCLIと一緒に使用するには、以下のようにCLIを起動してください：")
    print("\n環境変数を設定してデバッグモードで起動:")
    print("  export DEBUG=true")
    print("  export LOG_LEVEL=DEBUG")
    print("  export LOG_TO_FILE=true")
    print("  export LOG_ALL_EVENTS=true")
    print("  bluelamp")
    print("\nまたは一行で:")
    print("  DEBUG=true LOG_LEVEL=DEBUG LOG_TO_FILE=true LOG_ALL_EVENTS=true bluelamp")
    print("\nログは以下の場所に保存されます:")
    print("  - cli/logs/bluelamp_YYYY-MM-DD.log")
    print("  - cli_debug.log (このスクリプトで作成)")