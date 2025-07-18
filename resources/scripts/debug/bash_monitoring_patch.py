#!/usr/bin/env python3
"""
BashSessionに監視機能を追加してスタック問題を特定
"""

import shutil
from pathlib import Path

class BashMonitoringPatcher:
    def __init__(self):
        self.cli_path = Path("/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2")
        self.bash_py_path = self.cli_path / "openhands/runtime/utils/bash.py"
        self.backup_path = self.cli_path / "bash_py_backup.py"
    
    def create_backup(self):
        """元のbash.pyをバックアップ"""
        print("💾 bash.pyをバックアップ中...")
        shutil.copy2(self.bash_py_path, self.backup_path)
        print(f"   バックアップ作成: {self.backup_path}")
        return True
    
    def add_monitoring_to_execute(self):
        """executeメソッドに監視機能を追加"""
        print("🔧 executeメソッドに監視機能を追加中...")
        
        try:
            with open(self.bash_py_path, 'r') as f:
                content = f.read()
            
            # executeメソッドの開始部分を見つけて監視コードを追加
            monitoring_code = '''
        # === MONITORING PATCH START ===
        import time
        import threading
        
        print(f"[BASH_MONITOR] コマンド実行開始: {command}")
        print(f"[BASH_MONITOR] タイムアウト: {timeout}")
        print(f"[BASH_MONITOR] ストリーム: {stream}")
        
        monitor_start_time = time.time()
        
        def monitor_thread():
            """監視スレッド"""
            last_check = time.time()
            while True:
                time.sleep(5)  # 5秒間隔でチェック
                current_time = time.time()
                elapsed = current_time - monitor_start_time
                print(f"[BASH_MONITOR] 実行時間: {elapsed:.1f}秒")
                
                if elapsed > 60:  # 60秒以上の場合は警告
                    print(f"[BASH_MONITOR] ⚠️  長時間実行中: {elapsed:.1f}秒")
                
                if elapsed > 120:  # 120秒以上の場合はスタック疑い
                    print(f"[BASH_MONITOR] 🚨 スタック疑い: {elapsed:.1f}秒")
                    break
        
        # 監視スレッドを開始
        monitor = threading.Thread(target=monitor_thread, daemon=True)
        monitor.start()
        # === MONITORING PATCH END ===
'''
            
            # executeメソッドの定義を見つける
            lines = content.split('\n')
            modified_lines = []
            
            for i, line in enumerate(lines):
                modified_lines.append(line)
                
                # executeメソッドの開始を検出
                if 'def execute(' in line and 'self' in line:
                    # 次の行（通常はdocstring）の後に監視コードを挿入
                    j = i + 1
                    while j < len(lines) and (lines[j].strip().startswith('"""') or lines[j].strip().startswith("'''")):
                        modified_lines.append(lines[j])
                        j += 1
                        if lines[j-1].strip().endswith('"""') or lines[j-1].strip().endswith("'''"):
                            break
                    
                    # 監視コードを挿入
                    for monitor_line in monitoring_code.split('\n'):
                        modified_lines.append(monitor_line)
                    
                    break
            
            # 残りの行を追加
            if i < len(lines) - 1:
                modified_lines.extend(lines[i+1:])
            
            # ファイルに書き戻し
            with open(self.bash_py_path, 'w') as f:
                f.write('\n'.join(modified_lines))
            
            print("✅ 監視機能を追加しました")
            return True
            
        except Exception as e:
            print(f"❌ 監視機能追加エラー: {e}")
            return False
    
    def add_monitoring_to_while_loop(self):
        """while should_continue()ループに監視を追加"""
        print("🔧 while should_continue()ループに監視を追加中...")
        
        try:
            with open(self.bash_py_path, 'r') as f:
                content = f.read()
            
            # while should_continue()ループを見つけて監視を追加
            loop_monitoring = '''
            # === LOOP MONITORING PATCH START ===
            loop_iteration = 0
            loop_start_time = time.time()
            # === LOOP MONITORING PATCH END ===
'''
            
            loop_body_monitoring = '''
                # === LOOP BODY MONITORING START ===
                loop_iteration += 1
                loop_elapsed = time.time() - loop_start_time
                
                if loop_iteration % 10 == 0:  # 10回に1回ログ出力
                    print(f"[LOOP_MONITOR] ループ回数: {loop_iteration}, 経過時間: {loop_elapsed:.1f}秒")
                
                if loop_elapsed > 30:  # 30秒以上の場合は詳細ログ
                    print(f"[LOOP_MONITOR] 🚨 長時間ループ: {loop_elapsed:.1f}秒, 回数: {loop_iteration}")
                    print(f"[LOOP_MONITOR] should_continue(): {should_continue()}")
                    print(f"[LOOP_MONITOR] プロセス状態: {self.process.poll() if hasattr(self, 'process') and self.process else 'N/A'}")
                # === LOOP BODY MONITORING END ===
'''
            
            # while should_continue()の箇所を見つけて監視コードを追加
            modified_content = content
            
            # while should_continue()の前に初期化コードを追加
            modified_content = modified_content.replace(
                'while should_continue():',
                loop_monitoring + '\n        while should_continue():'
            )
            
            # ループ本体の最初に監視コードを追加
            # 通常、while文の次の行はインデントされているので、そこに追加
            lines = modified_content.split('\n')
            modified_lines = []
            
            for i, line in enumerate(lines):
                modified_lines.append(line)
                
                if 'while should_continue():' in line:
                    # 次の行のインデントレベルを確認
                    if i + 1 < len(lines):
                        next_line = lines[i + 1]
                        indent = len(next_line) - len(next_line.lstrip())
                        
                        # 監視コードを適切なインデントで追加
                        for monitor_line in loop_body_monitoring.split('\n'):
                            if monitor_line.strip():
                                modified_lines.append(' ' * indent + monitor_line.strip())
                            else:
                                modified_lines.append('')
            
            # ファイルに書き戻し
            with open(self.bash_py_path, 'w') as f:
                f.write('\n'.join(modified_lines))
            
            print("✅ ループ監視機能を追加しました")
            return True
            
        except Exception as e:
            print(f"❌ ループ監視機能追加エラー: {e}")
            return False
    
    def restore_backup(self):
        """バックアップから復元"""
        print("🔄 bash.pyをバックアップから復元中...")
        
        if self.backup_path.exists():
            shutil.copy2(self.backup_path, self.bash_py_path)
            print("✅ 復元完了")
            return True
        else:
            print("❌ バックアップファイルが見つかりません")
            return False
    
    def create_test_script(self):
        """監視機能付きでテストするスクリプトを作成"""
        test_script = f'''#!/bin/bash
cd {self.cli_path}
source test_env/bin/activate

# ポート3001を占有するテストサーバーを起動
python3 -c "
import http.server
import socketserver
import threading
import time

PORT = 3001
Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    try:
        with socketserver.TCPServer(('', PORT), Handler) as httpd:
            print(f'Test server on port {{PORT}}')
            httpd.serve_forever()
    except:
        pass

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(2)
print('Test server started')
time.sleep(300)  # 5分間維持
" &

TEST_SERVER_PID=$!
sleep 3

# テストタスクファイル作成
cat > test_monitoring_task.txt << 'EOF'
TASK: サーバー起動コマンドを実行してください。

以下のコマンドを実行してください：
cd /Users/tatsuya/Desktop/variantsupporter/backend && npm start

このコマンドはポート競合エラーを発生させます。
監視ログを確認してスタック箇所を特定してください。
EOF

echo "🚀 監視機能付きOpenHands実行開始"
echo "   ユーザー確認プロンプトで 't' を入力してください"
echo "   監視ログに注目してください"

# OpenHands実行
python3 -m openhands.cli.main_session \\
    --task test_monitoring_task.txt \\
    --agent-cls OrchestratorAgent \\
    --max-iterations 5

# クリーンアップ
kill $TEST_SERVER_PID 2>/dev/null
rm -f test_monitoring_task.txt

echo "✅ テスト完了"
'''
        
        test_script_path = self.cli_path / "run_monitoring_test.sh"
        with open(test_script_path, 'w') as f:
            f.write(test_script)
        
        # 実行権限を付与
        test_script_path.chmod(0o755)
        
        print(f"📄 テストスクリプト作成: {test_script_path}")
        return str(test_script_path)
    
    def apply_monitoring_patch(self):
        """監視パッチを適用"""
        print("🎯 BashSession監視パッチ適用")
        print("=" * 50)
        
        try:
            # 1. バックアップ作成
            if not self.create_backup():
                return False
            
            # 2. executeメソッドに監視追加
            if not self.add_monitoring_to_execute():
                self.restore_backup()
                return False
            
            # 3. whileループに監視追加
            if not self.add_monitoring_to_while_loop():
                self.restore_backup()
                return False
            
            # 4. テストスクリプト作成
            test_script = self.create_test_script()
            
            print(f"\n✅ 監視パッチ適用完了")
            print(f"\n🧪 テスト実行方法:")
            print(f"   {test_script}")
            print(f"\n📋 監視ポイント:")
            print("   - [BASH_MONITOR] コマンド実行の進行状況")
            print("   - [LOOP_MONITOR] while should_continue()ループの状態")
            print("   - スタック発生箇所の特定")
            
            print(f"\n🔄 復元方法:")
            print(f"   python3 -c \"from bash_monitoring_patch import BashMonitoringPatcher; BashMonitoringPatcher().restore_backup()\"")
            
            return True
            
        except Exception as e:
            print(f"❌ パッチ適用エラー: {e}")
            self.restore_backup()
            return False

def main():
    patcher = BashMonitoringPatcher()
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'restore':
        patcher.restore_backup()
    else:
        patcher.apply_monitoring_patch()

if __name__ == "__main__":
    main()