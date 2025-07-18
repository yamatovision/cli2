#!/usr/bin/env python3
"""
OpenHands リアルタイム監視システム
現在のシステムに影響を与えずに、別ターミナルで実行状況を監視します
"""

import os
import time
import subprocess
from datetime import datetime
from pathlib import Path

class OpenHandsMonitor:
    def __init__(self):
        self.start_time = time.time()
        self.log_file = Path("logs/bluelamp_2025-07-16.log")
        self.last_log_position = 0
        self.current_command = "待機中"
        self.process_info = {}
        
    def clear_screen(self):
        """画面をクリア"""
        os.system('clear' if os.name == 'posix' else 'cls')
        
    def get_elapsed_time(self):
        """経過時間を取得"""
        elapsed = time.time() - self.start_time
        hours = int(elapsed // 3600)
        minutes = int((elapsed % 3600) // 60)
        seconds = int(elapsed % 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        
    def get_process_info(self):
        """OpenHandsプロセスの情報を取得（簡易版）"""
        try:
            # ps コマンドでプロセス情報を取得
            result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
            lines = result.stdout.split('\n')
            
            for line in lines:
                if 'bluelamp' in line.lower() or 'python' in line.lower():
                    parts = line.split()
                    if len(parts) >= 11:
                        return {
                            'pid': parts[1],
                            'cpu': float(parts[2]) if parts[2].replace('.', '').isdigit() else 0,
                            'memory': float(parts[3]) if parts[3].replace('.', '').isdigit() else 0,
                            'status': '🟢 実行中'
                        }
        except:
            pass
        return {'pid': 'N/A', 'cpu': 0, 'memory': 0, 'status': '🔴 未検出'}
        
    def read_new_logs(self):
        """新しいログエントリを読み取り"""
        if not self.log_file.exists():
            return []
            
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                f.seek(self.last_log_position)
                new_content = f.read()
                self.last_log_position = f.tell()
                
                if new_content:
                    lines = new_content.strip().split('\n')
                    return [line for line in lines if line.strip()]
        except:
            pass
        return []
        
    def extract_current_activity(self, log_lines):
        """ログから現在のアクティビティを抽出"""
        activity_keywords = [
            '実行中', 'コマンド', 'npm start', 'cd ', 'mkdir', 'git',
            'Starting', 'Running', 'Executing', 'Command'
        ]
        
        for line in reversed(log_lines):
            for keyword in activity_keywords:
                if keyword in line:
                    # ログの時刻部分を除去して、重要な部分だけ抽出
                    if '] ' in line:
                        activity = line.split('] ', 1)[-1][:60]
                        self.current_command = activity
                        return
                        
    def display_monitor(self):
        """監視画面を表示"""
        self.clear_screen()
        
        # 新しいログを読み取り
        new_logs = self.read_new_logs()
        if new_logs:
            self.extract_current_activity(new_logs)
            
        # プロセス情報を取得
        proc_info = self.get_process_info()
        
        # ヘッダー
        print("┌─────────────────────────────────────────────────────────┐")
        print("│                🔍 OpenHands リアルタイム監視             │")
        print("├─────────────────────────────────────────────────────────┤")
        
        # 基本情報
        current_time = datetime.now().strftime("%H:%M:%S")
        print(f"│ 📅 開始時刻: {datetime.fromtimestamp(self.start_time).strftime('%H:%M:%S'):<44} │")
        print(f"│ ⏱️  経過時間: {self.get_elapsed_time():<43} │")
        print(f"│ 🕐 現在時刻: {current_time:<44} │")
        print(f"│ 🎯 現在実行: {self.current_command[:44]:<44} │")
        print(f"│ 📊 プロセス: {proc_info['status']:<44} │")
        
        print("├─────────────────────────────────────────────────────────┤")
        
        # システム情報
        cpu_bar = "█" * int(proc_info['cpu'] / 10) + "░" * (10 - int(proc_info['cpu'] / 10))
        memory_bar = "█" * int(proc_info['memory'] / 50) + "░" * (10 - int(proc_info['memory'] / 50))
        
        print(f"│ 🖥️  CPU使用率: {cpu_bar} {proc_info['cpu']:.1f}%{'':<20} │")
        print(f"│ 💾 メモリ使用: {memory_bar} {proc_info['memory']:.0f}MB{'':<19} │")
        print(f"│ 🔢 プロセスID: {proc_info['pid']:<44} │")
        
        print("├─────────────────────────────────────────────────────────┤")
        
        # 最新ログ（最後の5行）
        print("│ 📋 最新ログ:                                            │")
        if new_logs:
            for log in new_logs[-3:]:  # 最新3行を表示
                log_display = log[:55] if len(log) > 55 else log
                print(f"│ {log_display:<55} │")
        else:
            print("│ (新しいログはありません)                                │")
            
        print("├─────────────────────────────────────────────────────────┤")
        print("│ 🔄 自動更新: 20秒間隔 | Ctrl+C で終了                   │")
        print("└─────────────────────────────────────────────────────────┘")
        
    def run(self):
        """監視を開始"""
        print("🚀 OpenHands監視システム開始...")
        print("📋 20秒ごとに自動更新されます")
        print("⚠️  Ctrl+C で終了できます")
        print()
        
        try:
            while True:
                self.display_monitor()
                time.sleep(20)  # 20秒間隔で更新
                
        except KeyboardInterrupt:
            print("\n\n🛑 監視を終了しました")
            print("👋 お疲れさまでした！")

if __name__ == "__main__":
    monitor = OpenHandsMonitor()
    monitor.run()