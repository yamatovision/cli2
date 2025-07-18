#!/usr/bin/env python3
"""
OpenHandsスタック問題の深層調査
エラー分類が正しく動作しているのにスタックする理由を特定
"""

import subprocess
import time
import threading
import signal
import sys
import json
from pathlib import Path

class DeepStackInvestigator:
    def __init__(self):
        self.cli_path = Path("/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2")
        self.backend_path = Path("/Users/tatsuya/Desktop/variantsupporter/backend")
        self.monitoring = False
        self.test_server_process = None
    
    def investigate_agent_state_transition(self):
        """AgentStateの遷移メカニズムを詳細調査"""
        print("🔍 AgentState遷移メカニズム調査")
        print("=" * 50)
        
        # set_agent_state_to メソッドの実装を確認
        controller_file = self.cli_path / "openhands/controller/agent_controller.py"
        
        try:
            with open(controller_file, 'r') as f:
                content = f.read()
            
            lines = content.split('\n')
            
            # set_agent_state_to メソッドを検索
            method_start = None
            method_lines = []
            
            for i, line in enumerate(lines):
                if 'def set_agent_state_to' in line:
                    method_start = i
                elif method_start is not None:
                    if line.strip() == '' and (i + 1 < len(lines) and lines[i + 1].strip().startswith('def ')):
                        break
                    method_lines.append((i + 1, line))
            
            if method_start is not None:
                print("📋 set_agent_state_to メソッド実装:")
                print("-" * 40)
                for line_num, line in method_lines[:20]:  # 最初の20行
                    print(f"{line_num:3d}: {line}")
                print("-" * 40)
                
                # 非同期処理の確認
                async_patterns = ['async', 'await', 'asyncio']
                async_found = []
                for line_num, line in method_lines:
                    for pattern in async_patterns:
                        if pattern in line.lower():
                            async_found.append((line_num, pattern, line.strip()))
                
                if async_found:
                    print(f"\n🔍 非同期処理パターン: {len(async_found)}箇所")
                    for line_num, pattern, line in async_found:
                        print(f"   L{line_num} [{pattern}]: {line}")
                
                return True
            else:
                print("❌ set_agent_state_to メソッドが見つかりません")
                return False
                
        except Exception as e:
            print(f"❌ AgentController調査エラー: {e}")
            return False
    
    def investigate_asyncio_task_execution(self):
        """asyncio.create_task の実行タイミングを調査"""
        print("\n🔍 asyncio.create_task 実行タイミング調査")
        print("=" * 50)
        
        # create_task の呼び出し箇所を確認
        loop_file = self.cli_path / "openhands/core/loop.py"
        
        try:
            with open(loop_file, 'r') as f:
                content = f.read()
            
            lines = content.split('\n')
            create_task_calls = []
            
            for i, line in enumerate(lines):
                if 'create_task' in line:
                    create_task_calls.append((i + 1, line.strip()))
            
            print(f"📋 create_task 呼び出し箇所: {len(create_task_calls)}箇所")
            for line_num, line in create_task_calls:
                print(f"   L{line_num}: {line}")
            
            # 問題の可能性：create_taskが即座に実行されない
            print("\n🤔 潜在的問題:")
            print("   1. create_task は非同期タスクをスケジュールするだけ")
            print("   2. 実際の実行は次のイベントループサイクルで行われる")
            print("   3. while ループが同じイベントループで実行されている場合、")
            print("      状態変更が反映される前にループが継続する可能性")
            
            return len(create_task_calls) > 0
            
        except Exception as e:
            print(f"❌ asyncio調査エラー: {e}")
            return False
    
    def investigate_event_loop_timing(self):
        """イベントループのタイミング問題を調査"""
        print("\n🔍 イベントループタイミング問題調査")
        print("=" * 50)
        
        # メインループの詳細を確認
        loop_file = self.cli_path / "openhands/core/loop.py"
        
        try:
            with open(loop_file, 'r') as f:
                content = f.read()
            
            # while ループ周辺のコードを詳細確認
            lines = content.split('\n')
            while_loop_context = []
            
            for i, line in enumerate(lines):
                if 'while controller.state.agent_state not in end_states:' in line:
                    # 前後10行を取得
                    start = max(0, i - 10)
                    end = min(len(lines), i + 10)
                    
                    for j in range(start, end):
                        marker = " >>> " if j == i else "     "
                        while_loop_context.append(f"{marker}L{j+1:2d}: {lines[j]}")
                    break
            
            if while_loop_context:
                print("📋 while ループ周辺コード:")
                print("-" * 40)
                for line in while_loop_context:
                    print(line)
                print("-" * 40)
                
                print("\n🎯 タイミング問題の可能性:")
                print("   1. await asyncio.sleep(1) の間に状態変更が完了しない")
                print("   2. controller.state.agent_state の読み取りタイミング")
                print("   3. 非同期タスクの実行順序の問題")
                
                return True
            
        except Exception as e:
            print(f"❌ イベントループ調査エラー: {e}")
        
        return False
    
    def investigate_controller_state_mechanism(self):
        """Controllerの状態管理メカニズムを調査"""
        print("\n🔍 Controller状態管理メカニズム調査")
        print("=" * 50)
        
        # State クラスの実装を確認
        state_files = [
            "openhands/controller/state/state.py",
            "openhands/controller/agent_controller.py"
        ]
        
        state_properties = []
        
        for file_path in state_files:
            full_path = self.cli_path / file_path
            if not full_path.exists():
                continue
            
            try:
                with open(full_path, 'r') as f:
                    content = f.read()
                
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if 'agent_state' in line.lower() and ('def ' in line or '@property' in line or '=' in line):
                        state_properties.append({
                            'file': file_path,
                            'line_num': i + 1,
                            'content': line.strip()
                        })
            except Exception as e:
                print(f"   ⚠️  {file_path}読み込みエラー: {e}")
        
        print(f"📋 agent_state関連プロパティ: {len(state_properties)}箇所")
        for prop in state_properties:
            print(f"   {prop['file']}:L{prop['line_num']}: {prop['content']}")
        
        # 状態変更の同期性を確認
        print("\n🤔 状態変更の同期性問題:")
        print("   1. controller.state.agent_state の読み取りは同期的")
        print("   2. set_agent_state_to() の実行は非同期的")
        print("   3. 状態変更の完了を待機する仕組みがない")
        
        return len(state_properties) > 0
    
    def create_timing_test_scenario(self):
        """タイミング問題を検証するテストシナリオを作成"""
        print("\n🧪 タイミング問題検証テストシナリオ")
        print("=" * 50)
        
        test_code = '''
import asyncio
from openhands.core.schema import AgentState

class MockController:
    def __init__(self):
        self.state = MockState()
    
    async def set_agent_state_to(self, new_state):
        print(f"  [Task] 状態変更開始: {new_state}")
        await asyncio.sleep(0.1)  # 状態変更の処理時間をシミュレート
        self.state.agent_state = new_state
        print(f"  [Task] 状態変更完了: {new_state}")

class MockState:
    def __init__(self):
        self.agent_state = AgentState.RUNNING
        self.last_error = ""

async def simulate_timing_issue():
    """タイミング問題のシミュレーション"""
    controller = MockController()
    end_states = [AgentState.ERROR, AgentState.FINISHED]
    
    print("🎭 タイミング問題シミュレーション開始")
    print(f"   初期状態: {controller.state.agent_state}")
    print(f"   終了条件: {end_states}")
    
    # エラー発生をシミュレート
    print("\\n📨 エラー発生 -> 非同期状態変更開始")
    asyncio.create_task(controller.set_agent_state_to(AgentState.ERROR))
    
    # メインループをシミュレート
    loop_count = 0
    max_loops = 10
    
    print("\\n🔄 メインループ開始")
    while controller.state.agent_state not in end_states and loop_count < max_loops:
        loop_count += 1
        print(f"  [Loop {loop_count}] 現在の状態: {controller.state.agent_state}")
        print(f"  [Loop {loop_count}] 終了条件チェック: {controller.state.agent_state in end_states}")
        
        await asyncio.sleep(1)  # 元のコードと同じ待機時間
    
    print(f"\\n✅ ループ終了")
    print(f"   最終状態: {controller.state.agent_state}")
    print(f"   ループ回数: {loop_count}")
    print(f"   正常終了: {controller.state.agent_state in end_states}")

if __name__ == "__main__":
    asyncio.run(simulate_timing_issue())
'''
        
        # テストファイルを作成
        test_file = self.cli_path / "timing_test.py"
        with open(test_file, 'w') as f:
            f.write(test_code)
        
        print("📄 テストファイル作成: timing_test.py")
        print("   実行コマンド: python3 timing_test.py")
        
        return str(test_file)
    
    def run_comprehensive_investigation(self):
        """包括的な深層調査"""
        print("🎯 OpenHandsスタック問題 深層調査")
        print("=" * 60)
        
        results = {
            'agent_state_transition': self.investigate_agent_state_transition(),
            'asyncio_task_execution': self.investigate_asyncio_task_execution(),
            'event_loop_timing': self.investigate_event_loop_timing(),
            'controller_state_mechanism': self.investigate_controller_state_mechanism()
        }
        
        # テストシナリオ作成
        test_file = self.create_timing_test_scenario()
        
        print(f"\n📊 深層調査結果:")
        for category, result in results.items():
            status = "✅ 調査完了" if result else "❌ 調査失敗"
            print(f"   {category}: {status}")
        
        print(f"\n💡 仮説:")
        print("   1. エラー分類は正しく動作している")
        print("   2. asyncio.create_task() による状態変更は非同期")
        print("   3. while ループの状態チェックが状態変更完了前に実行される")
        print("   4. 結果として無限ループが発生する")
        
        print(f"\n🧪 検証方法:")
        print(f"   1. タイミングテスト実行: python3 {test_file}")
        print("   2. 実際のOpenHands実行時のログ監視")
        print("   3. 状態変更の同期化修正")
        
        return results, test_file

def main():
    investigator = DeepStackInvestigator()
    results, test_file = investigator.run_comprehensive_investigation()
    
    print(f"\n🎯 次のステップ:")
    print("   1. タイミングテストの実行")
    print("   2. 状態変更の同期化修正の実装")
    print("   3. 修正版のテスト実行")

if __name__ == "__main__":
    main()