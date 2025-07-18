#!/usr/bin/env python3
"""
実際のOpenHands実行環境でのスタック問題監視
"""

import subprocess
import time
import threading
import signal
import sys
import json
import os
from pathlib import Path

class RealExecutionMonitor:
    def __init__(self):
        self.cli_path = Path("/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2")
        self.backend_path = Path("/Users/tatsuya/Desktop/variantsupporter/backend")
        self.monitoring = False
        self.openhands_process = None
        self.test_server_process = None
        self.log_data = []
    
    def setup_port_conflict_environment(self):
        """ポート競合環境をセットアップ"""
        print("🔧 ポート競合環境セットアップ中...")
        
        test_server_code = '''
import http.server
import socketserver
import signal
import sys

PORT = 3001
Handler = http.server.SimpleHTTPRequestHandler

def signal_handler(sig, frame):
    print("\\nTest server stopping...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Test server running on port {PORT}")
        httpd.serve_forever()
except Exception as e:
    print(f"Test server error: {e}")
    sys.exit(1)
'''
        
        self.test_server_process = subprocess.Popen([
            sys.executable, '-c', test_server_code
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        time.sleep(2)
        
        # ポート確認
        try:
            result = subprocess.run(['lsof', '-i', ':3001'], 
                                  capture_output=True, text=True, timeout=5)
            if result.stdout:
                print("✅ ポート3001が占有されました")
                return True
            else:
                print("❌ ポート占有失敗")
                return False
        except:
            print("❌ ポート確認失敗")
            return False
    
    def create_test_task(self):
        """OpenHandsに実行させるテストタスクを作成"""
        task_content = f"""
TASK: サーバー起動コマンドを実行してください。

以下のコマンドを実行してください：
cd {self.backend_path} && npm start

このコマンドはポート3001でサーバーを起動しようとしますが、
既にポート3001が使用中のためエラーが発生するはずです。

エラーが発生した場合の動作を確認したいと思います。
"""
        
        task_file = self.cli_path / "test_task.txt"
        with open(task_file, 'w') as f:
            f.write(task_content)
        
        return str(task_file)
    
    def start_openhands_with_monitoring(self, task_file):
        """OpenHandsを監視付きで起動"""
        print("🚀 OpenHands起動中...")
        
        # OpenHandsの起動コマンド
        openhands_cmd = [
            sys.executable, '-m', 'openhands.cli.main_session',
            '--task', task_file,
            '--agent-cls', 'OrchestratorAgent',
            '--max-iterations', '10'
        ]
        
        print(f"   実行コマンド: {' '.join(openhands_cmd)}")
        
        # 環境変数を設定
        env = os.environ.copy()
        env['BLUELAMP_COMMAND'] = 'bluelamp'
        
        try:
            self.openhands_process = subprocess.Popen(
                openhands_cmd,
                cwd=self.cli_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=env,
                bufsize=1,
                universal_newlines=True
            )
            
            print("✅ OpenHandsプロセス開始")
            return True
            
        except Exception as e:
            print(f"❌ OpenHands起動エラー: {e}")
            return False
    
    def monitor_openhands_execution(self, timeout=300):
        """OpenHandsの実行を監視"""
        print(f"👁️  OpenHands実行監視開始 ({timeout}秒)")
        
        if not self.openhands_process:
            print("❌ OpenHandsプロセスが存在しません")
            return False
        
        start_time = time.time()
        output_lines = []
        error_lines = []
        
        # 非ブロッキング読み取り用のスレッド
        def read_stdout():
            try:
                for line in iter(self.openhands_process.stdout.readline, ''):
                    if line:
                        output_lines.append((time.time(), 'stdout', line.strip()))
                        print(f"[OUT] {line.strip()}")
            except:
                pass
        
        def read_stderr():
            try:
                for line in iter(self.openhands_process.stderr.readline, ''):
                    if line:
                        error_lines.append((time.time(), 'stderr', line.strip()))
                        print(f"[ERR] {line.strip()}")
            except:
                pass
        
        stdout_thread = threading.Thread(target=read_stdout, daemon=True)
        stderr_thread = threading.Thread(target=read_stderr, daemon=True)
        
        stdout_thread.start()
        stderr_thread.start()
        
        # メイン監視ループ
        last_output_time = start_time
        no_output_threshold = 30  # 30秒間出力がない場合はスタックと判定
        
        while time.time() - start_time < timeout:
            # プロセス状態確認
            poll_result = self.openhands_process.poll()
            if poll_result is not None:
                print(f"✅ OpenHandsプロセス終了 (終了コード: {poll_result})")
                break
            
            # 出力確認
            current_time = time.time()
            if output_lines or error_lines:
                last_output_time = current_time
            
            # スタック検出
            if current_time - last_output_time > no_output_threshold:
                print(f"🚨 スタック検出！ {no_output_threshold}秒間出力なし")
                
                # プロセス情報を取得
                try:
                    ps_result = subprocess.run([
                        'ps', 'aux'
                    ], capture_output=True, text=True)
                    
                    openhands_processes = []
                    for line in ps_result.stdout.split('\\n'):
                        if 'openhands' in line.lower() or 'python' in line:
                            openhands_processes.append(line)
                    
                    print("📊 関連プロセス:")
                    for proc in openhands_processes[:5]:
                        print(f"   {proc}")
                
                except:
                    pass
                
                # スタック状態で終了
                print("⏹️  スタック状態のため監視終了")
                return {
                    'status': 'STUCK',
                    'output_lines': output_lines,
                    'error_lines': error_lines,
                    'stuck_time': current_time - last_output_time
                }
            
            time.sleep(1)
        
        # タイムアウト
        if time.time() - start_time >= timeout:
            print(f"⏰ 監視タイムアウト ({timeout}秒)")
            return {
                'status': 'TIMEOUT',
                'output_lines': output_lines,
                'error_lines': error_lines
            }
        
        # 正常終了
        return {
            'status': 'COMPLETED',
            'output_lines': output_lines,
            'error_lines': error_lines,
            'exit_code': poll_result
        }
    
    def cleanup(self):
        """リソースのクリーンアップ"""
        print("🧹 クリーンアップ中...")
        
        if self.openhands_process:
            try:
                self.openhands_process.terminate()
                self.openhands_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.openhands_process.kill()
            except:
                pass
        
        if self.test_server_process:
            try:
                self.test_server_process.terminate()
                self.test_server_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.test_server_process.kill()
            except:
                pass
        
        # テストファイルを削除
        test_files = [
            self.cli_path / "test_task.txt"
        ]
        
        for file in test_files:
            if file.exists():
                file.unlink()
    
    def run_comprehensive_monitoring(self):
        """包括的な実行監視"""
        print("🎯 OpenHands実行環境スタック問題監視")
        print("=" * 60)
        
        try:
            # 1. ポート競合環境セットアップ
            if not self.setup_port_conflict_environment():
                print("❌ 環境セットアップ失敗")
                return False
            
            # 2. テストタスク作成
            task_file = self.create_test_task()
            print(f"📄 テストタスク作成: {task_file}")
            
            # 3. OpenHands起動
            if not self.start_openhands_with_monitoring(task_file):
                print("❌ OpenHands起動失敗")
                return False
            
            # 4. 実行監視
            result = self.monitor_openhands_execution(timeout=120)  # 2分間監視
            
            # 5. 結果分析
            print(f"\\n📊 監視結果:")
            print(f"   ステータス: {result['status']}")
            print(f"   出力行数: {len(result['output_lines'])}")
            print(f"   エラー行数: {len(result['error_lines'])}")
            
            if result['status'] == 'STUCK':
                print(f"   スタック時間: {result['stuck_time']:.1f}秒")
                print("\\n🚨 スタック問題を確認しました！")
                
                # 最後の出力を表示
                if result['output_lines']:
                    print("\\n📝 最後の出力:")
                    for timestamp, stream, line in result['output_lines'][-5:]:
                        print(f"   [{stream}] {line}")
                
                if result['error_lines']:
                    print("\\n📝 最後のエラー:")
                    for timestamp, stream, line in result['error_lines'][-5:]:
                        print(f"   [{stream}] {line}")
            
            elif result['status'] == 'COMPLETED':
                print("\\n✅ 正常終了しました")
                print(f"   終了コード: {result.get('exit_code', 'N/A')}")
            
            return result
            
        except KeyboardInterrupt:
            print("\\n⏹️  ユーザーによる中断")
            return {'status': 'INTERRUPTED'}
        
        except Exception as e:
            print(f"\\n💥 監視エラー: {e}")
            return {'status': 'ERROR', 'error': str(e)}
        
        finally:
            self.cleanup()
    
    def signal_handler(self, signum, frame):
        """シグナルハンドラー"""
        print("\\n⏹️  監視を中断中...")
        self.cleanup()
        sys.exit(0)

def main():
    monitor = RealExecutionMonitor()
    
    # シグナルハンドラー設定
    signal.signal(signal.SIGINT, monitor.signal_handler)
    signal.signal(signal.SIGTERM, monitor.signal_handler)
    
    result = monitor.run_comprehensive_monitoring()
    
    print(f"\\n🎯 結論:")
    if result.get('status') == 'STUCK':
        print("   OpenHandsスタック問題を実際に確認しました")
        print("   根本原因の修正が必要です")
    elif result.get('status') == 'COMPLETED':
        print("   OpenHandsは正常に動作しました")
        print("   問題は他の要因にある可能性があります")
    else:
        print("   監視が完了しませんでした")
        print("   環境や設定を確認してください")

if __name__ == "__main__":
    main()