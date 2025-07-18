#!/usr/bin/env python3
"""
OpenHandsスタック問題の再現テスト
実際にポート競合を発生させてスタック状況を観察
"""

import subprocess
import time
import threading
import signal
import sys
from pathlib import Path

class StackReproductionTest:
    def __init__(self):
        self.backend_path = Path("/Users/tatsuya/Desktop/variantsupporter/backend")
        self.monitoring = False
        self.test_server_process = None
    
    def setup_port_conflict(self):
        """ポート3001に競合を発生させる"""
        print("🔧 ポート3001競合環境をセットアップ中...")
        
        # 簡単なテストサーバーでポート3001を占有
        test_server_code = '''
import http.server
import socketserver
import sys

PORT = 3001
Handler = http.server.SimpleHTTPRequestHandler

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Test server serving at port {PORT}")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("Test server stopped")
    sys.exit(0)
except Exception as e:
    print(f"Test server error: {e}")
    sys.exit(1)
'''
        
        # テストサーバーをバックグラウンドで起動
        self.test_server_process = subprocess.Popen([
            sys.executable, '-c', test_server_code
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        time.sleep(2)  # サーバー起動を待機
        
        # ポート占有確認
        try:
            result = subprocess.run(['lsof', '-i', ':3001'], 
                                  capture_output=True, text=True, timeout=5)
            if result.stdout:
                print("✅ ポート3001が正常に占有されました")
                print(f"   占有プロセス: {result.stdout.strip()}")
                return True
            else:
                print("❌ ポート3001の占有に失敗")
                return False
        except:
            print("❌ ポート確認に失敗")
            return False
    
    def cleanup_port_conflict(self):
        """テストサーバーを停止"""
        if self.test_server_process:
            print("🧹 テストサーバーを停止中...")
            self.test_server_process.terminate()
            try:
                self.test_server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.test_server_process.kill()
            self.test_server_process = None
    
    def test_npm_start_with_conflict(self):
        """ポート競合状態でnpm startを実行"""
        print("🧪 ポート競合状態でnpm start実行テスト")
        
        if not self.backend_path.exists():
            print(f"❌ バックエンドパスが存在しません: {self.backend_path}")
            return False
        
        # npm startを実行（タイムアウト付き）
        try:
            print("   npm start実行中...")
            result = subprocess.run([
                'npm', 'start'
            ], cwd=self.backend_path, capture_output=True, text=True, timeout=30)
            
            print(f"   終了コード: {result.returncode}")
            print(f"   標準出力: {result.stdout[:500]}...")
            print(f"   標準エラー: {result.stderr[:500]}...")
            
            return result.returncode != 0  # エラーが発生すればTrue
            
        except subprocess.TimeoutExpired:
            print("⏰ npm startがタイムアウト（30秒）")
            return True  # タイムアウト = スタック発生
        except Exception as e:
            print(f"❌ npm start実行エラー: {e}")
            return False
    
    def test_bash_session_behavior(self):
        """BashSessionの動作をシミュレート"""
        print("🔍 BashSessionの動作シミュレーション")
        
        # tmuxセッションを作成してテスト
        try:
            # 新しいtmuxセッションを作成
            session_name = f"test-session-{int(time.time())}"
            subprocess.run(['tmux', 'new-session', '-d', '-s', session_name], 
                          check=True)
            
            print(f"   tmuxセッション作成: {session_name}")
            
            # セッション内でnpm startを実行
            subprocess.run(['tmux', 'send-keys', '-t', session_name, 
                           f'cd {self.backend_path}', 'Enter'], check=True)
            
            time.sleep(1)
            
            subprocess.run(['tmux', 'send-keys', '-t', session_name, 
                           'npm start', 'Enter'], check=True)
            
            print("   npm startコマンド送信完了")
            
            # 10秒間セッションの状態を監視
            for i in range(10):
                time.sleep(1)
                
                # セッションの内容を取得
                result = subprocess.run(['tmux', 'capture-pane', '-t', session_name, '-p'], 
                                      capture_output=True, text=True)
                
                content = result.stdout
                print(f"   [{i+1}秒] セッション内容: {content[-100:].strip()}")
                
                # プロンプトが戻ったかチェック
                if content.strip().endswith('$') or content.strip().endswith('#'):
                    print("   ✅ プロンプトが復帰しました")
                    break
                elif 'EADDRINUSE' in content or 'Address already in use' in content:
                    print("   🚨 ポート競合エラーを検出")
                elif i == 9:
                    print("   ⚠️  10秒経過してもプロンプトが復帰しません（スタック状態）")
            
            # セッションをクリーンアップ
            subprocess.run(['tmux', 'kill-session', '-t', session_name])
            print(f"   tmuxセッション削除: {session_name}")
            
            return True
            
        except Exception as e:
            print(f"❌ BashSessionテストエラー: {e}")
            return False
    
    def run_comprehensive_test(self):
        """包括的なスタック再現テスト"""
        print("🎯 OpenHandsスタック問題 再現テスト開始")
        print("=" * 50)
        
        try:
            # 1. ポート競合環境をセットアップ
            if not self.setup_port_conflict():
                print("❌ テスト環境のセットアップに失敗")
                return False
            
            # 2. npm startの直接実行テスト
            conflict_detected = self.test_npm_start_with_conflict()
            
            # 3. BashSessionの動作シミュレーション
            bash_test_result = self.test_bash_session_behavior()
            
            print("\n📊 テスト結果サマリー:")
            print(f"   ポート競合検出: {'✅' if conflict_detected else '❌'}")
            print(f"   BashSessionテスト: {'✅' if bash_test_result else '❌'}")
            
            return conflict_detected and bash_test_result
            
        finally:
            # クリーンアップ
            self.cleanup_port_conflict()
    
    def signal_handler(self, signum, frame):
        """シグナルハンドラー"""
        print("\n⏹️  テストを中断中...")
        self.cleanup_port_conflict()
        sys.exit(0)

def main():
    test = StackReproductionTest()
    
    # シグナルハンドラーを設定
    signal.signal(signal.SIGINT, test.signal_handler)
    signal.signal(signal.SIGTERM, test.signal_handler)
    
    try:
        success = test.run_comprehensive_test()
        if success:
            print("\n✅ スタック問題の再現に成功")
            print("   根本原因の特定に進むことができます")
        else:
            print("\n❌ スタック問題の再現に失敗")
            print("   環境設定を確認してください")
    except Exception as e:
        print(f"\n💥 テスト実行中にエラー: {e}")
        test.cleanup_port_conflict()

if __name__ == "__main__":
    main()