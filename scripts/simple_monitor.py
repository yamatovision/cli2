#!/usr/bin/env python3
"""
psutil不要の簡易監視スクリプト
"""

import os
import subprocess
import time
from datetime import datetime
from pathlib import Path

class SimpleMonitor:
    def __init__(self):
        self.log_dir = Path(__file__).parent.parent / "logs"
        self.last_log_position = {}
        
    def find_bluelamp_processes(self):
        """psコマンドでBlueLampプロセスを検索"""
        try:
            result = subprocess.run(
                ['ps', 'aux'], 
                capture_output=True, 
                text=True
            )
            
            processes = []
            for line in result.stdout.split('\n'):
                if 'bluelamp' in line.lower() and 'grep' not in line:
                    parts = line.split()
                    if len(parts) >= 11:
                        processes.append({
                            'pid': parts[1],
                            'cpu': parts[2],
                            'mem': parts[3],
                            'command': ' '.join(parts[10:])[:80]
                        })
            return processes
        except:
            return []
    
    def monitor_log_file(self, filepath):
        """ログファイルの新しい行を取得"""
        if not os.path.exists(filepath):
            return []
            
        # ファイルサイズを取得
        current_size = os.path.getsize(filepath)
        
        # 初回読み込みの場合
        if filepath not in self.last_log_position:
            self.last_log_position[filepath] = current_size
            return []
        
        # 新しい内容がない場合
        if current_size <= self.last_log_position[filepath]:
            return []
        
        # 新しい行を読む
        new_lines = []
        try:
            with open(filepath, 'r') as f:
                f.seek(self.last_log_position[filepath])
                new_lines = f.readlines()
                self.last_log_position[filepath] = f.tell()
        except:
            pass
            
        return new_lines
    
    def analyze_log_line(self, line):
        """重要なログ行を検出"""
        important_patterns = [
            ('ERROR', '🔴 エラー'),
            ('WARNING', '🟡 警告'),
            ('STUCK', '🚨 スタック'),
            ('Agent not stepping', '🛑 停止'),
            ('RUNNING', '🟢 実行中'),
            ('AWAITING', '⏳ 待機中'),
            ('FINISHED', '✅ 完了')
        ]
        
        for pattern, label in important_patterns:
            if pattern in line:
                return f"{label}: {line.strip()[:100]}..."
        return None
    
    def display_status(self, processes, important_logs):
        """ステータス表示"""
        os.system('clear')
        print(f"=== BlueLamp 簡易モニター - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===\n")
        
        if not processes:
            print("⚠️  BlueLamp CLIプロセスが見つかりません")
        else:
            print("📊 アクティブプロセス:")
            for proc in processes:
                print(f"  PID: {proc['pid']} | CPU: {proc['cpu']}% | MEM: {proc['mem']}%")
                print(f"  コマンド: {proc['command']}")
                print()
        
        if important_logs:
            print("\n📝 重要なログ活動:")
            for log in important_logs[-15:]:  # 最新15行
                print(f"  {log}")
        
        print("\n💡 操作方法:")
        print("  - Ctrl+C で監視を停止")
        print("  - ログファイル:", self.log_dir)
    
    def run(self):
        """メイン監視ループ"""
        print("BlueLamp 簡易モニターを開始...")
        print(f"ログディレクトリ: {self.log_dir}")
        
        # 最新のログファイルを探す
        log_file = None
        if self.log_dir.exists():
            log_files = sorted(
                self.log_dir.glob("bluelamp_*.log"),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            if log_files:
                log_file = log_files[0]
                print(f"監視ログファイル: {log_file}")
        
        important_logs = []
        
        try:
            while True:
                # プロセス情報を取得
                processes = self.find_bluelamp_processes()
                
                # ログファイルを監視
                if log_file and log_file.exists():
                    new_lines = self.monitor_log_file(str(log_file))
                    for line in new_lines:
                        analyzed = self.analyze_log_line(line)
                        if analyzed:
                            important_logs.append(analyzed)
                            # 重要なメッセージは即座に表示
                            if any(x in analyzed for x in ['🔴', '🚨', '🛑']):
                                print(f"\n⚠️  {analyzed}")
                
                # ステータスを表示
                self.display_status(processes, important_logs)
                
                # 5秒待機
                time.sleep(5)
                
        except KeyboardInterrupt:
            print("\n\n監視を停止しました。")

if __name__ == "__main__":
    monitor = SimpleMonitor()
    monitor.run()