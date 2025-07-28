#!/usr/bin/env python3
"""
リアルタイムでCLIの動作を監視するツール
別のターミナルで実行してCLIの状態を監視します
"""

import os
import sys
import time
import psutil
import threading
from datetime import datetime
from pathlib import Path

# ログディレクトリ
LOG_DIR = Path(__file__).parent.parent / "logs"

class CLIMonitor:
    def __init__(self):
        self.monitoring = True
        self.log_files = {}
        self.last_positions = {}
        
    def find_bluelamp_processes(self):
        """BlueLamp CLIプロセスを検索"""
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time']):
            try:
                info = proc.info
                cmdline = info.get('cmdline', [])
                if cmdline and any('bluelamp' in str(cmd).lower() for cmd in cmdline):
                    processes.append({
                        'pid': info['pid'],
                        'name': info['name'],
                        'cmdline': ' '.join(cmdline),
                        'create_time': datetime.fromtimestamp(info['create_time']),
                        'memory': proc.memory_info().rss / 1024 / 1024,  # MB
                        'cpu': proc.cpu_percent(interval=0.1)
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return processes
    
    def monitor_log_file(self, filepath):
        """ログファイルの新しい行を監視"""
        if filepath not in self.log_files:
            try:
                self.log_files[filepath] = open(filepath, 'r')
                self.last_positions[filepath] = 0
                # ファイルの最後まで移動
                self.log_files[filepath].seek(0, 2)
                self.last_positions[filepath] = self.log_files[filepath].tell()
            except Exception as e:
                print(f"Error opening log file {filepath}: {e}")
                return []
        
        new_lines = []
        try:
            file_obj = self.log_files[filepath]
            file_obj.seek(self.last_positions[filepath])
            
            for line in file_obj:
                new_lines.append(line.strip())
            
            self.last_positions[filepath] = file_obj.tell()
        except Exception as e:
            print(f"Error reading log file: {e}")
        
        return new_lines
    
    def analyze_log_line(self, line):
        """ログ行を分析して重要な情報を抽出"""
        indicators = {
            'ERROR': '🔴',
            'WARNING': '🟡',
            'STUCK': '🚨',
            'RUNNING': '🟢',
            'AWAITING': '⏳',
            'FINISHED': '✅',
            'State Change': '📊',
            'Event:': '📨',
            'step': '👣',
            'Agent not stepping': '🛑'
        }
        
        for keyword, icon in indicators.items():
            if keyword in line:
                return f"{icon} {line}"
        
        return None
    
    def display_status(self, processes, log_updates):
        """ステータスを表示"""
        os.system('clear' if os.name != 'nt' else 'cls')
        print(f"=== BlueLamp CLI Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===\n")
        
        if not processes:
            print("⚠️  No BlueLamp CLI processes found")
        else:
            print("📊 Active Processes:")
            for proc in processes:
                print(f"  PID: {proc['pid']} | CPU: {proc['cpu']:.1f}% | Memory: {proc['memory']:.1f}MB")
                print(f"  Started: {proc['create_time'].strftime('%H:%M:%S')}")
                print(f"  Command: {proc['cmdline'][:80]}...")
                print()
        
        if log_updates:
            print("\n📝 Recent Log Activity:")
            for update in log_updates[-20:]:  # 最新20行
                print(f"  {update}")
        
        print("\n💡 Tips:")
        print("  - Ctrl+C to stop monitoring")
        print("  - If CLI is stuck, check for:")
        print("    • 'Agent not stepping' messages")
        print("    • State remaining in RUNNING for too long")
        print("    • High CPU usage without log activity")
    
    def run(self):
        """メイン監視ループ"""
        print("Starting BlueLamp CLI Monitor...")
        print("Looking for log files in:", LOG_DIR)
        
        # 最新のログファイルを探す
        if LOG_DIR.exists():
            log_files = sorted(LOG_DIR.glob("bluelamp_*.log"), 
                             key=lambda x: x.stat().st_mtime, 
                             reverse=True)
            if log_files:
                latest_log = log_files[0]
                print(f"Monitoring log file: {latest_log}")
            else:
                latest_log = None
                print("No log files found yet")
        else:
            latest_log = None
            print(f"Log directory not found: {LOG_DIR}")
        
        log_updates = []
        
        try:
            while self.monitoring:
                processes = self.find_bluelamp_processes()
                
                # ログファイルを監視
                if latest_log and latest_log.exists():
                    new_lines = self.monitor_log_file(str(latest_log))
                    for line in new_lines:
                        analyzed = self.analyze_log_line(line)
                        if analyzed:
                            log_updates.append(analyzed)
                            # 重要なメッセージは即座に表示
                            if any(x in analyzed for x in ['🔴', '🚨', '🛑']):
                                print(f"\n⚠️  Alert: {analyzed}")
                
                # ステータスを表示
                self.display_status(processes, log_updates)
                
                # 5秒待機
                time.sleep(5)
                
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")
        finally:
            # ファイルをクローズ
            for f in self.log_files.values():
                f.close()

def main():
    monitor = CLIMonitor()
    monitor.run()

if __name__ == "__main__":
    main()