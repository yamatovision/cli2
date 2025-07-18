#!/usr/bin/env python3
"""
OpenHandsスタック問題の真の原因調査
bash.py以外の可能性を調査
"""

import subprocess
import time
import json
from pathlib import Path

class RealCauseInvestigator:
    def __init__(self):
        self.cli_path = Path("/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2")
    
    def check_agent_controller_behavior(self):
        """AgentControllerの動作を調査"""
        print("🔍 AgentController動作調査")
        
        controller_path = self.cli_path / "openhands/controller/agent_controller.py"
        
        # AgentControllerでのBashSession呼び出し箇所を確認
        try:
            with open(controller_path, 'r') as f:
                content = f.read()
            
            # execute関連の呼び出しを検索
            lines = content.split('\n')
            execute_calls = []
            
            for i, line in enumerate(lines):
                if 'execute' in line.lower() and ('bash' in line.lower() or 'cmd' in line.lower()):
                    execute_calls.append({
                        'line_num': i + 1,
                        'content': line.strip()
                    })
            
            print(f"   AgentControllerでのexecute呼び出し: {len(execute_calls)}箇所")
            for call in execute_calls[:5]:  # 最初の5つを表示
                print(f"     L{call['line_num']}: {call['content']}")
            
            return len(execute_calls) > 0
            
        except Exception as e:
            print(f"   ❌ AgentController調査エラー: {e}")
            return False
    
    def check_event_stream_behavior(self):
        """EventStreamの動作を調査"""
        print("🔍 EventStream動作調査")
        
        # EventStreamでのブロッキング処理を確認
        event_files = [
            "openhands/events/stream.py",
            "openhands/events/event.py",
            "openhands/controller/agent_controller.py"
        ]
        
        blocking_patterns = [
            'await',
            'wait',
            'block',
            'sleep',
            'timeout',
            'while',
            'for'
        ]
        
        blocking_locations = []
        
        for file_path in event_files:
            full_path = self.cli_path / file_path
            if not full_path.exists():
                continue
                
            try:
                with open(full_path, 'r') as f:
                    lines = f.readlines()
                
                for i, line in enumerate(lines):
                    for pattern in blocking_patterns:
                        if pattern in line.lower() and 'execute' in line.lower():
                            blocking_locations.append({
                                'file': file_path,
                                'line_num': i + 1,
                                'content': line.strip(),
                                'pattern': pattern
                            })
            except Exception as e:
                print(f"   ⚠️  {file_path}読み込みエラー: {e}")
        
        print(f"   潜在的ブロッキング箇所: {len(blocking_locations)}箇所")
        for loc in blocking_locations[:3]:  # 最初の3つを表示
            print(f"     {loc['file']}:L{loc['line_num']} [{loc['pattern']}]: {loc['content']}")
        
        return len(blocking_locations) > 0
    
    def check_runtime_initialization(self):
        """Runtime初期化プロセスを調査"""
        print("🔍 Runtime初期化調査")
        
        runtime_files = [
            "openhands/runtime/base.py",
            "openhands/runtime/docker/docker_runtime.py",
            "openhands/core/setup.py"
        ]
        
        init_issues = []
        
        for file_path in runtime_files:
            full_path = self.cli_path / file_path
            if not full_path.exists():
                continue
            
            try:
                with open(full_path, 'r') as f:
                    content = f.read()
                
                # 初期化関連の問題パターンを検索
                problem_patterns = [
                    'initialize',
                    'connect',
                    'setup',
                    'start',
                    'create_runtime'
                ]
                
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    for pattern in problem_patterns:
                        if pattern in line.lower() and ('bash' in line.lower() or 'session' in line.lower()):
                            init_issues.append({
                                'file': file_path,
                                'line_num': i + 1,
                                'content': line.strip(),
                                'pattern': pattern
                            })
            except Exception as e:
                print(f"   ⚠️  {file_path}読み込みエラー: {e}")
        
        print(f"   Runtime初期化関連箇所: {len(init_issues)}箇所")
        for issue in init_issues[:3]:  # 最初の3つを表示
            print(f"     {issue['file']}:L{issue['line_num']} [{issue['pattern']}]: {issue['content']}")
        
        return len(init_issues) > 0
    
    def check_loop_behavior(self):
        """メインループの動作を調査"""
        print("🔍 メインループ動作調査")
        
        loop_file = self.cli_path / "openhands/core/loop.py"
        
        if not loop_file.exists():
            print("   ❌ loop.pyが見つかりません")
            return False
        
        try:
            with open(loop_file, 'r') as f:
                content = f.read()
            
            # 無限ループの可能性を調査
            lines = content.split('\n')
            loop_issues = []
            
            for i, line in enumerate(lines):
                if 'while' in line.lower():
                    # whileループの条件を確認
                    loop_issues.append({
                        'line_num': i + 1,
                        'content': line.strip(),
                        'type': 'while_loop'
                    })
                elif 'await asyncio.sleep' in line.lower():
                    # 非同期待機を確認
                    loop_issues.append({
                        'line_num': i + 1,
                        'content': line.strip(),
                        'type': 'async_sleep'
                    })
            
            print(f"   ループ関連箇所: {len(loop_issues)}箇所")
            for issue in loop_issues:
                print(f"     L{issue['line_num']} [{issue['type']}]: {issue['content']}")
            
            return len(loop_issues) > 0
            
        except Exception as e:
            print(f"   ❌ loop.py調査エラー: {e}")
            return False
    
    def analyze_git_changes(self):
        """Git変更履歴から問題箇所を特定"""
        print("🔍 Git変更履歴分析")
        
        try:
            # 最近のコミット履歴を取得
            result = subprocess.run([
                'git', 'log', '--oneline', '-10'
            ], cwd=self.cli_path, capture_output=True, text=True)
            
            if result.returncode == 0:
                commits = result.stdout.strip().split('\n')
                print(f"   最近のコミット: {len(commits)}件")
                for commit in commits[:3]:
                    print(f"     {commit}")
            
            # 変更されたファイルを確認
            result = subprocess.run([
                'git', 'diff', '--name-only', 'HEAD~5', 'HEAD'
            ], cwd=self.cli_path, capture_output=True, text=True)
            
            if result.returncode == 0:
                changed_files = result.stdout.strip().split('\n')
                print(f"   変更されたファイル: {len(changed_files)}件")
                
                # bash.py以外の重要な変更を確認
                important_changes = []
                for file in changed_files:
                    if file and 'bash.py' not in file:
                        if any(keyword in file.lower() for keyword in ['controller', 'loop', 'runtime', 'agent']):
                            important_changes.append(file)
                
                print(f"   重要な変更ファイル: {len(important_changes)}件")
                for file in important_changes:
                    print(f"     {file}")
                
                return len(important_changes) > 0
            
        except Exception as e:
            print(f"   ⚠️  Git分析エラー: {e}")
        
        return False
    
    def run_comprehensive_investigation(self):
        """包括的な原因調査"""
        print("🎯 OpenHandsスタック問題 真の原因調査")
        print("=" * 50)
        
        results = {
            'agent_controller': self.check_agent_controller_behavior(),
            'event_stream': self.check_event_stream_behavior(),
            'runtime_init': self.check_runtime_initialization(),
            'main_loop': self.check_loop_behavior(),
            'git_changes': self.analyze_git_changes()
        }
        
        print("\n📊 調査結果サマリー:")
        for category, result in results.items():
            status = "✅ 問題箇所発見" if result else "❌ 問題なし"
            print(f"   {category}: {status}")
        
        # 最も可能性の高い原因を特定
        if results['main_loop']:
            print("\n🎯 最有力候補: メインループでの無限待機")
        elif results['agent_controller']:
            print("\n🎯 最有力候補: AgentControllerでのブロッキング")
        elif results['runtime_init']:
            print("\n🎯 最有力候補: Runtime初期化での問題")
        else:
            print("\n🤔 明確な原因が特定できませんでした")
        
        return results

def main():
    investigator = RealCauseInvestigator()
    results = investigator.run_comprehensive_investigation()
    
    print("\n💡 次のステップ:")
    if any(results.values()):
        print("   1. 特定された問題箇所の詳細調査")
        print("   2. 該当コードの修正実装")
        print("   3. テスト環境での動作確認")
    else:
        print("   1. より詳細なログ分析")
        print("   2. 実際のOpenHands実行時の監視")
        print("   3. プロファイリングツールの使用")

if __name__ == "__main__":
    main()