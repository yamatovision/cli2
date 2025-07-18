#!/usr/bin/env python3
"""
コマンド実行後のスタック問題を調査
ユーザー確認後の実際のコマンド実行フェーズでの問題を特定
"""

import subprocess
import time
import threading
import signal
import sys
import os
from pathlib import Path
import pexpect

class PostExecutionStackTester:
    def __init__(self):
        self.cli_path = Path("/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2")
        self.backend_path = Path("/Users/tatsuya/Desktop/variantsupporter/backend")
        self.test_server_process = None
    
    def setup_port_conflict(self):
        """ポート競合環境をセットアップ"""
        print("🔧 ポート競合環境セットアップ...")
        
        test_server_code = '''
import http.server
import socketserver
import signal
import sys

PORT = 3001
Handler = http.server.SimpleHTTPRequestHandler

def signal_handler(sig, frame):
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Test server on port {PORT}")
        httpd.serve_forever()
except:
    sys.exit(1)
'''
        
        self.test_server_process = subprocess.Popen([
            sys.executable, '-c', test_server_code
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        time.sleep(2)
        return True
    
    def test_with_pexpect(self):
        """pexpectを使用してユーザーインタラクションを自動化"""
        print("🧪 pexpectによる自動化テスト")
        print("=" * 50)
        
        # タスクファイル作成
        task_content = f"""
TASK: サーバー起動コマンドを実行してください。

以下のコマンドを実行してください：
cd {self.backend_path} && npm start

このコマンドはポート競合エラーを発生させます。
エラー後の動作を確認してください。
"""
        
        task_file = self.cli_path / "auto_test_task.txt"
        with open(task_file, 'w') as f:
            f.write(task_content)
        
        try:
            # OpenHandsをpexpectで起動
            cmd = f"cd {self.cli_path} && source test_env/bin/activate && python3 -m openhands.cli.main_session --task {task_file} --agent-cls OrchestratorAgent --max-iterations 5"
            
            print(f"   実行コマンド: {cmd}")
            
            # pexpectでプロセス起動
            child = pexpect.spawn('/bin/bash', ['-c', cmd], timeout=300)
            child.logfile_read = sys.stdout.buffer  # 出力をリアルタイム表示
            
            interaction_log = []
            
            # ユーザー確認プロンプトを待機
            print("\n👁️  ユーザー確認プロンプト待機中...")
            
            try:
                # 最初の確認プロンプト
                index = child.expect([
                    r'実行を進めていいですか？.*>',
                    r'h\(はい\)/i\(いいえ\)/t\(つねに許可\).*>',
                    pexpect.TIMEOUT,
                    pexpect.EOF
                ], timeout=60)
                
                if index in [0, 1]:
                    print("✅ ユーザー確認プロンプト検出")
                    interaction_log.append("USER_PROMPT_DETECTED")
                    
                    # 「t」(つねに許可)を送信
                    print("📤 't'(つねに許可)を送信")
                    child.send('t\n')
                    interaction_log.append("SENT_ALWAYS_ALLOW")
                    
                    # コマンド実行開始を待機
                    print("👁️  コマンド実行開始待機...")
                    
                    # npm startの実行とエラーを待機
                    start_time = time.time()
                    command_executed = False
                    error_detected = False
                    
                    while time.time() - start_time < 120:  # 2分間監視
                        try:
                            index = child.expect([
                                r'npm start',
                                r'EADDRINUSE',
                                r'address already in use',
                                r'Error:',
                                r'エラー',
                                r'実行を進めていいですか？',
                                pexpect.TIMEOUT,
                                pexpect.EOF
                            ], timeout=10)
                            
                            if index == 0:
                                print("✅ npm startコマンド実行検出")
                                command_executed = True
                                interaction_log.append("COMMAND_EXECUTED")
                            
                            elif index in [1, 2, 3, 4]:
                                print("✅ エラー検出")
                                error_detected = True
                                interaction_log.append("ERROR_DETECTED")
                            
                            elif index == 5:
                                print("📤 追加の確認プロンプトに't'を送信")
                                child.send('t\n')
                                interaction_log.append("SENT_ADDITIONAL_ALLOW")
                            
                            elif index == 6:  # TIMEOUT
                                print("⏰ 10秒間応答なし")
                                if command_executed and error_detected:
                                    print("🚨 コマンド実行後にスタック検出！")
                                    interaction_log.append("STACK_AFTER_ERROR")
                                    break
                            
                            elif index == 7:  # EOF
                                print("✅ プロセス正常終了")
                                interaction_log.append("PROCESS_ENDED")
                                break
                        
                        except pexpect.TIMEOUT:
                            print("⏰ タイムアウト継続...")
                            if command_executed and error_detected:
                                print("🚨 エラー後のスタック確認")
                                interaction_log.append("CONFIRMED_STACK")
                                break
                
                elif index == 2:  # TIMEOUT
                    print("❌ ユーザー確認プロンプトが表示されませんでした")
                    interaction_log.append("NO_USER_PROMPT")
                
                elif index == 3:  # EOF
                    print("❌ プロセスが予期せず終了しました")
                    interaction_log.append("UNEXPECTED_EXIT")
            
            except Exception as e:
                print(f"❌ pexpectエラー: {e}")
                interaction_log.append(f"PEXPECT_ERROR: {e}")
            
            finally:
                try:
                    child.close()
                except:
                    pass
            
            # 結果分析
            print(f"\n📊 インタラクションログ:")
            for i, log in enumerate(interaction_log, 1):
                print(f"   {i}. {log}")
            
            # スタック判定
            stack_indicators = [
                "STACK_AFTER_ERROR",
                "CONFIRMED_STACK"
            ]
            
            is_stack = any(indicator in interaction_log for indicator in stack_indicators)
            
            print(f"\n🎯 結果:")
            if is_stack:
                print("   🚨 コマンド実行後のスタックを確認")
                print("   問題：エラー発生後にOpenHandsが応答停止")
            else:
                print("   ✅ スタック問題は検出されませんでした")
            
            return {
                'stack_detected': is_stack,
                'interaction_log': interaction_log,
                'command_executed': command_executed,
                'error_detected': error_detected
            }
        
        except Exception as e:
            print(f"❌ テスト実行エラー: {e}")
            return {'error': str(e)}
        
        finally:
            if task_file.exists():
                task_file.unlink()
    
    def analyze_bash_session_during_execution(self):
        """実行中のBashSessionの状態を分析"""
        print("\n🔍 実行中BashSession状態分析")
        print("=" * 50)
        
        # BashSessionのログ出力を有効化する修正を提案
        bash_py_path = self.cli_path / "openhands/runtime/utils/bash.py"
        
        print("💡 BashSession監視の提案:")
        print("   1. execute()メソッドにデバッグログを追加")
        print("   2. while should_continue()ループの状態監視")
        print("   3. プロセス終了検出の改善")
        
        # 監視用のパッチコードを生成
        monitoring_patch = '''
# BashSession監視パッチ (bash.py の execute メソッドに追加)

import time
import threading

def execute_with_monitoring(self, command: str, timeout: int = -1, stream: bool = False):
    """監視機能付きのexecute"""
    
    print(f"[MONITOR] コマンド実行開始: {command}")
    start_time = time.time()
    
    # 元のexecuteメソッドを呼び出し
    result = self.original_execute(command, timeout, stream)
    
    execution_time = time.time() - start_time
    print(f"[MONITOR] コマンド実行完了: {execution_time:.2f}秒")
    print(f"[MONITOR] 終了コード: {result.exit_code}")
    
    return result
'''
        
        print(f"\n📄 監視パッチコード例:")
        print(monitoring_patch)
        
        return True
    
    def cleanup(self):
        """リソースクリーンアップ"""
        if self.test_server_process:
            try:
                self.test_server_process.terminate()
                self.test_server_process.wait(timeout=3)
            except:
                try:
                    self.test_server_process.kill()
                except:
                    pass
    
    def run_comprehensive_test(self):
        """包括的なポスト実行テスト"""
        print("🎯 コマンド実行後スタック問題調査")
        print("=" * 60)
        
        try:
            # 1. 環境セットアップ
            self.setup_port_conflict()
            
            # 2. pexpectによる自動化テスト
            result = self.test_with_pexpect()
            
            # 3. BashSession分析
            self.analyze_bash_session_during_execution()
            
            return result
        
        finally:
            self.cleanup()

def main():
    # pexpectの可用性確認
    try:
        import pexpect
    except ImportError:
        print("❌ pexpectが必要です: pip install pexpect")
        return
    
    tester = PostExecutionStackTester()
    
    try:
        result = tester.run_comprehensive_test()
        
        print(f"\n🎯 最終結論:")
        if result and result.get('stack_detected'):
            print("   真の問題を特定：コマンド実行後のスタック")
            print("   次のステップ：BashSessionの修正実装")
        else:
            print("   スタック問題の再現に失敗")
            print("   環境や条件を再確認が必要")
    
    except KeyboardInterrupt:
        print("\n⏹️  テスト中断")
    except Exception as e:
        print(f"\n💥 テストエラー: {e}")
    finally:
        tester.cleanup()

if __name__ == "__main__":
    main()