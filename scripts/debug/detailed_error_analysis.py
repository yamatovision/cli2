#!/usr/bin/env python3
"""
エラー分類ロジックの詳細分析とポート競合時の動作検証
"""

import subprocess
import time
import json
import re
from pathlib import Path

class ErrorClassificationAnalyzer:
    def __init__(self):
        self.cli_path = Path("/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2")
        self.backend_path = Path("/Users/tatsuya/Desktop/variantsupporter/backend")
    
    def analyze_error_classification_logic(self):
        """現在のエラー分類ロジックを詳細分析"""
        print("🔍 エラー分類ロジック詳細分析")
        print("=" * 50)
        
        loop_file = self.cli_path / "openhands/core/loop.py"
        
        try:
            with open(loop_file, 'r') as f:
                content = f.read()
            
            # status_callback関数を抽出
            lines = content.split('\n')
            callback_start = None
            callback_end = None
            
            for i, line in enumerate(lines):
                if 'def status_callback' in line:
                    callback_start = i
                elif callback_start is not None and line.strip() == '' and lines[i+1].strip().startswith('if hasattr'):
                    callback_end = i
                    break
            
            if callback_start and callback_end:
                callback_code = '\n'.join(lines[callback_start:callback_end])
                print("📋 現在のstatus_callback実装:")
                print("-" * 30)
                for i, line in enumerate(lines[callback_start:callback_end], callback_start + 1):
                    print(f"{i:3d}: {line}")
                print("-" * 30)
                
                # 回復可能エラーのパターンを抽出
                recoverable_patterns = self.extract_recoverable_patterns(callback_code)
                print(f"\n🔍 回復可能エラーパターン: {len(recoverable_patterns)}個")
                for i, pattern in enumerate(recoverable_patterns, 1):
                    print(f"   {i}. {pattern}")
                
                return recoverable_patterns
            else:
                print("❌ status_callback関数が見つかりません")
                return []
                
        except Exception as e:
            print(f"❌ ファイル読み込みエラー: {e}")
            return []
    
    def extract_recoverable_patterns(self, callback_code):
        """回復可能エラーのパターンを抽出"""
        patterns = []
        
        # 条件文から回復可能パターンを抽出
        lines = callback_code.split('\n')
        for line in lines:
            if 'is_recoverable = True' in line:
                # 前の行の条件を確認
                prev_line_idx = lines.index(line) - 1
                if prev_line_idx >= 0:
                    condition_line = lines[prev_line_idx].strip()
                    if condition_line.startswith('if '):
                        patterns.append(condition_line)
            
            # recoverable_patterns配列からも抽出
            if 'recoverable_patterns = [' in line:
                # 配列の内容を抽出
                array_start = lines.index(line)
                for i in range(array_start, len(lines)):
                    if ']' in lines[i]:
                        array_end = i
                        break
                
                array_content = '\n'.join(lines[array_start:array_end+1])
                # 文字列パターンを抽出
                string_patterns = re.findall(r"'([^']+)'", array_content)
                patterns.extend(string_patterns)
        
        return patterns
    
    def simulate_port_conflict_error(self):
        """ポート競合エラーの実際のメッセージを取得"""
        print("\n🧪 ポート競合エラーメッセージの実際の取得")
        print("=" * 50)
        
        # テストサーバーでポート3001を占有
        test_server_process = None
        try:
            # ポート占有
            test_server_code = '''
import http.server
import socketserver
PORT = 3001
Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Test server on port {PORT}")
    httpd.serve_forever()
'''
            
            test_server_process = subprocess.Popen([
                'python3', '-c', test_server_code
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            time.sleep(2)  # サーバー起動待機
            
            # npm startを実行してエラーメッセージを取得
            print("   npm start実行中...")
            result = subprocess.run([
                'npm', 'start'
            ], cwd=self.backend_path, capture_output=True, text=True, timeout=10)
            
            error_message = result.stderr
            print(f"   実際のエラーメッセージ:")
            print(f"   標準エラー出力:")
            print("   " + "-" * 40)
            for line in error_message.split('\n')[:10]:  # 最初の10行
                if line.strip():
                    print(f"   {line}")
            print("   " + "-" * 40)
            
            return error_message
            
        except subprocess.TimeoutExpired:
            print("   ⏰ npm startがタイムアウト")
            return "TIMEOUT_ERROR"
        except Exception as e:
            print(f"   ❌ エラー取得失敗: {e}")
            return ""
        finally:
            if test_server_process:
                test_server_process.terminate()
                try:
                    test_server_process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    test_server_process.kill()
    
    def test_error_classification(self, error_message, recoverable_patterns):
        """実際のエラーメッセージが回復可能に分類されるかテスト"""
        print("\n🔬 エラー分類テスト")
        print("=" * 50)
        
        if not error_message or error_message == "TIMEOUT_ERROR":
            print("   ❌ 有効なエラーメッセージがありません")
            return False
        
        # 現在のロジックをシミュレート
        is_recoverable = False
        matched_patterns = []
        
        # 1. 特定条件のチェック
        if 'LLMMalformedActionError' in error_message and 'Invalid path' in error_message:
            is_recoverable = True
            matched_patterns.append("LLMMalformedActionError + Invalid path")
        
        # 2. 一般的な回復可能パターンのチェック
        general_patterns = [
            'You can only work with files in',
            'Invalid path',
            'Path access restricted'
        ]
        
        for pattern in general_patterns:
            if pattern in error_message:
                is_recoverable = True
                matched_patterns.append(pattern)
        
        print(f"   エラー分類結果: {'回復可能' if is_recoverable else '回復不可能'}")
        if matched_patterns:
            print(f"   マッチしたパターン: {matched_patterns}")
        else:
            print("   マッチしたパターン: なし")
        
        # ポート競合特有のパターンをチェック
        port_conflict_patterns = [
            'EADDRINUSE',
            'address already in use',
            'Address already in use',
            'listen EADDRINUSE',
            'port.*already.*use',
            'bind.*address.*use'
        ]
        
        port_conflict_detected = []
        for pattern in port_conflict_patterns:
            if re.search(pattern, error_message, re.IGNORECASE):
                port_conflict_detected.append(pattern)
        
        print(f"   ポート競合パターン検出: {port_conflict_detected}")
        
        return {
            'is_recoverable': is_recoverable,
            'matched_patterns': matched_patterns,
            'port_conflict_detected': port_conflict_detected,
            'should_be_recoverable': len(port_conflict_detected) == 0  # ポート競合は回復不可能であるべき
        }
    
    def simulate_agent_state_flow(self, is_recoverable):
        """エラー分類結果に基づくAgentStateフローをシミュレート"""
        print(f"\n🎭 AgentStateフローシミュレーション (回復可能: {is_recoverable})")
        print("=" * 50)
        
        # 現在のロジックをシミュレート
        if is_recoverable:
            print("   📋 回復可能エラーの処理フロー:")
            print("   1. is_recoverable = True")
            print("   2. controller.state.last_error = ''  # エラーをクリア")
            print("   3. AgentState.ERROR に設定されない")
            print("   4. メインループ継続: while controller.state.agent_state not in end_states")
            print("   5. await asyncio.sleep(1)  # 1秒待機")
            print("   6. ループ継続... (無限ループの可能性)")
            print()
            print("   🚨 問題点:")
            print("   - エラーが解決されていないのにエラー状態がクリアされる")
            print("   - 終了条件に到達しない")
            print("   - 無限ループでスタック")
            
            return "INFINITE_LOOP"
        else:
            print("   📋 回復不可能エラーの処理フロー:")
            print("   1. is_recoverable = False")
            print("   2. controller.state.last_error = msg")
            print("   3. asyncio.create_task(controller.set_agent_state_to(AgentState.ERROR))")
            print("   4. AgentState.ERROR が end_states に含まれる")
            print("   5. メインループ終了: while controller.state.agent_state not in end_states")
            print("   6. 正常終了")
            print()
            print("   ✅ 期待される動作:")
            print("   - エラー状態が適切に設定される")
            print("   - ループが正常に終了する")
            print("   - AIが応答可能状態に戻る")
            
            return "PROPER_TERMINATION"
    
    def check_end_states_definition(self):
        """end_statesの定義を確認"""
        print("\n🔍 end_states定義確認")
        print("=" * 50)
        
        # AgentStateの定義を確認
        schema_file = self.cli_path / "openhands/core/schema.py"
        
        try:
            with open(schema_file, 'r') as f:
                content = f.read()
            
            # AgentStateの定義を抽出
            if 'class AgentState' in content or 'AgentState =' in content:
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if 'AgentState' in line and ('class' in line or '=' in line):
                        print(f"   AgentState定義 (L{i+1}): {line.strip()}")
                        
                        # 次の数行も表示
                        for j in range(1, 10):
                            if i + j < len(lines):
                                next_line = lines[i + j].strip()
                                if next_line and not next_line.startswith('#'):
                                    print(f"   L{i+j+1}: {next_line}")
                                    if 'ERROR' in next_line:
                                        print(f"   ✅ ERROR状態が定義されています")
                                if next_line == '' or next_line.startswith('class '):
                                    break
            
            # end_statesの使用箇所を確認
            main_files = [
                "openhands/cli/main.py",
                "openhands/cli/main_session/main.py"
            ]
            
            for file_path in main_files:
                full_path = self.cli_path / file_path
                if full_path.exists():
                    with open(full_path, 'r') as f:
                        file_content = f.read()
                    
                    if 'end_states' in file_content:
                        print(f"\n   {file_path}でのend_states使用:")
                        lines = file_content.split('\n')
                        for i, line in enumerate(lines):
                            if 'end_states' in line:
                                print(f"   L{i+1}: {line.strip()}")
            
        except Exception as e:
            print(f"   ❌ schema.py読み込みエラー: {e}")
    
    def run_comprehensive_analysis(self):
        """包括的なエラー分析"""
        print("🎯 エラー分類ロジック包括分析")
        print("=" * 60)
        
        # 1. エラー分類ロジック分析
        recoverable_patterns = self.analyze_error_classification_logic()
        
        # 2. 実際のポート競合エラー取得
        error_message = self.simulate_port_conflict_error()
        
        # 3. エラー分類テスト
        classification_result = self.test_error_classification(error_message, recoverable_patterns)
        
        # 4. AgentStateフローシミュレーション
        if classification_result:
            flow_result = self.simulate_agent_state_flow(classification_result['is_recoverable'])
        else:
            flow_result = "UNKNOWN"
        
        # 5. end_states定義確認
        self.check_end_states_definition()
        
        # 6. 総合結果
        print(f"\n📊 総合分析結果")
        print("=" * 50)
        
        if classification_result:
            print(f"   ポート競合エラーの分類: {'回復可能' if classification_result['is_recoverable'] else '回復不可能'}")
            print(f"   正しい分類であるべき: {'回復不可能' if classification_result['port_conflict_detected'] else '不明'}")
            print(f"   AgentStateフロー: {flow_result}")
            
            if classification_result['is_recoverable'] and classification_result['port_conflict_detected']:
                print("\n🚨 問題発見:")
                print("   ポート競合エラーが回復可能として分類されています")
                print("   これによりメインループが終了せず、スタックが発生します")
                
                print("\n💡 修正提案:")
                print("   1. ポート競合パターンを回復不可能エラーに追加")
                print("   2. エラー分類ロジックの見直し")
                print("   3. タイムアウト機能の追加")
            else:
                print("\n✅ エラー分類は適切です")
        
        return {
            'recoverable_patterns': recoverable_patterns,
            'error_message': error_message,
            'classification_result': classification_result,
            'flow_result': flow_result
        }

def main():
    analyzer = ErrorClassificationAnalyzer()
    results = analyzer.run_comprehensive_analysis()
    
    print(f"\n🎯 次のアクション:")
    if results['classification_result'] and results['classification_result']['is_recoverable'] and results['classification_result']['port_conflict_detected']:
        print("   1. エラー分類ロジックの修正実装")
        print("   2. ポート競合パターンの追加")
        print("   3. 修正版のテスト実行")
    else:
        print("   1. より詳細な調査が必要")
        print("   2. 他の原因の可能性を検討")

if __name__ == "__main__":
    main()