#!/usr/bin/env python3
"""
OpenHandsスタック問題の根本原因分析ツール
実際のプロセス状態とtmuxセッションを監視
"""

import subprocess
import time
import json
import threading
from datetime import datetime

class StackAnalyzer:
    def __init__(self):
        self.monitoring = False
        self.log_data = []
    
    def get_tmux_sessions(self):
        """現在のtmuxセッション一覧を取得"""
        try:
            result = subprocess.run(['tmux', 'list-sessions', '-F', '#{session_name}:#{session_created}:#{session_windows}'], 
                                  capture_output=True, text=True)
            return result.stdout.strip().split('\n') if result.stdout.strip() else []
        except:
            return []
    
    def get_tmux_windows(self, session_name):
        """指定セッションのウィンドウ一覧を取得"""
        try:
            result = subprocess.run(['tmux', 'list-windows', '-t', session_name, '-F', '#{window_name}:#{window_active}:#{window_panes}'], 
                                  capture_output=True, text=True)
            return result.stdout.strip().split('\n') if result.stdout.strip() else []
        except:
            return []
    
    def get_port_usage(self):
        """ポート3001の使用状況を確認"""
        try:
            result = subprocess.run(['lsof', '-i', ':3001'], capture_output=True, text=True)
            return result.stdout.strip()
        except:
            return ""
    
    def get_node_processes(self):
        """nodeプロセス一覧を取得"""
        try:
            result = subprocess.run(['pgrep', '-fl', 'node'], capture_output=True, text=True)
            return result.stdout.strip().split('\n') if result.stdout.strip() else []
        except:
            return []
    
    def capture_system_state(self):
        """システム状態のスナップショットを取得"""
        timestamp = datetime.now().isoformat()
        
        state = {
            'timestamp': timestamp,
            'tmux_sessions': self.get_tmux_sessions(),
            'port_3001': self.get_port_usage(),
            'node_processes': self.get_node_processes(),
            'tmux_details': {}
        }
        
        # 各tmuxセッションの詳細を取得
        for session_info in state['tmux_sessions']:
            if ':' in session_info:
                session_name = session_info.split(':')[0]
                state['tmux_details'][session_name] = self.get_tmux_windows(session_name)
        
        return state
    
    def monitor_continuously(self, duration=300):  # 5分間監視
        """継続的にシステム状態を監視"""
        print(f"🔍 システム状態監視開始 ({duration}秒間)")
        self.monitoring = True
        start_time = time.time()
        
        while self.monitoring and (time.time() - start_time) < duration:
            state = self.capture_system_state()
            self.log_data.append(state)
            
            # 重要な変化を検出
            self.detect_critical_changes(state)
            
            time.sleep(2)  # 2秒間隔で監視
        
        print("✅ 監視完了")
        return self.log_data
    
    def detect_critical_changes(self, state):
        """重要な変化を検出してアラート"""
        # ポート競合の検出
        if 'EADDRINUSE' in state['port_3001'] or 'Address already in use' in state['port_3001']:
            print(f"🚨 [{state['timestamp']}] ポート競合検出!")
            print(f"   詳細: {state['port_3001']}")
        
        # 複数nodeプロセスの検出
        if len(state['node_processes']) > 1:
            print(f"⚠️  [{state['timestamp']}] 複数nodeプロセス検出: {len(state['node_processes'])}個")
        
        # tmuxセッション数の変化
        if len(state['tmux_sessions']) > 2:
            print(f"📊 [{state['timestamp']}] tmuxセッション数: {len(state['tmux_sessions'])}")
    
    def save_analysis_report(self, filename="stack_analysis_report.json"):
        """分析結果をファイルに保存"""
        with open(filename, 'w') as f:
            json.dump(self.log_data, f, indent=2)
        print(f"📄 分析レポート保存: {filename}")
    
    def stop_monitoring(self):
        """監視を停止"""
        self.monitoring = False

def main():
    analyzer = StackAnalyzer()
    
    print("🎯 OpenHandsスタック問題 根本原因分析")
    print("=" * 50)
    
    # 初期状態を確認
    initial_state = analyzer.capture_system_state()
    print("📋 初期システム状態:")
    print(f"   tmuxセッション数: {len(initial_state['tmux_sessions'])}")
    print(f"   nodeプロセス数: {len(initial_state['node_processes'])}")
    print(f"   ポート3001状態: {'使用中' if initial_state['port_3001'] else '空き'}")
    print()
    
    # 監視開始
    try:
        log_data = analyzer.monitor_continuously(300)  # 5分間監視
        analyzer.save_analysis_report()
        
        print("\n📊 分析サマリー:")
        print(f"   収集データポイント数: {len(log_data)}")
        
        # ポート競合発生回数をカウント
        port_conflicts = sum(1 for state in log_data if 'EADDRINUSE' in state['port_3001'])
        print(f"   ポート競合発生回数: {port_conflicts}")
        
    except KeyboardInterrupt:
        print("\n⏹️  監視を手動停止")
        analyzer.stop_monitoring()
        analyzer.save_analysis_report()

if __name__ == "__main__":
    main()