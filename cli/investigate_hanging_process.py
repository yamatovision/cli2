#!/usr/bin/env python3
"""
ハングしているプロセスの詳細調査
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def find_hanging_bash_processes():
    """ハングしているbashプロセスを探す"""
    print("=== ハングしているbashプロセスの調査 ===")
    
    try:
        # BlueLampプロセスの子プロセスを探す
        result = subprocess.run(['ps', '-ef'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        
        bluelamp_pids = []
        bash_processes = []
        
        # BlueLampのPIDを特定
        for line in lines:
            if 'openhands.cli.main' in line:
                parts = line.split()
                if len(parts) >= 2:
                    bluelamp_pids.append(parts[1])
                    print(f"BlueLamp PID: {parts[1]}")
        
        # 各BlueLampプロセスの子プロセスを探す
        for pid in bluelamp_pids:
            print(f"\n--- PID {pid} の子プロセス ---")
            child_result = subprocess.run(['ps', '--ppid', pid], capture_output=True, text=True)
            if child_result.stdout.strip():
                print(child_result.stdout)
            else:
                print("子プロセスなし")
                
        # 長時間実行されているbashプロセスを探す
        print("\n=== 長時間実行中のbashプロセス ===")
        for line in lines:
            if 'bash -c' in line:
                parts = line.split()
                if len(parts) >= 9:  # 時間情報が含まれる位置
                    print(f"Bash process: {line}")
                    
    except Exception as e:
        print(f"プロセス調査エラー: {e}")

def check_system_resources():
    """システムリソースの確認"""
    print("\n=== システムリソース確認 ===")
    
    try:
        # CPU使用率
        result = subprocess.run(['top', '-l', '1', '-n', '10'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        for line in lines[:15]:  # 最初の15行を表示
            if 'CPU usage' in line or 'python' in line.lower() or 'bash' in line.lower():
                print(line)
                
        # メモリ使用量
        print("\n--- メモリ使用量 ---")
        mem_result = subprocess.run(['vm_stat'], capture_output=True, text=True)
        print(mem_result.stdout[:500])  # 最初の500文字
        
    except Exception as e:
        print(f"システムリソース確認エラー: {e}")

def check_open_files():
    """オープンファイルの確認"""
    print("\n=== オープンファイル確認 ===")
    
    try:
        # BlueLampプロセスのオープンファイルを確認
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        
        for line in lines:
            if 'openhands.cli.main' in line:
                parts = line.split()
                if len(parts) >= 2:
                    pid = parts[1]
                    print(f"\n--- PID {pid} のオープンファイル ---")
                    lsof_result = subprocess.run(['lsof', '-p', pid], capture_output=True, text=True)
                    # パイプやソケットに関連するものを表示
                    for lsof_line in lsof_result.stdout.split('\n'):
                        if 'PIPE' in lsof_line or 'unix' in lsof_line or 'TCP' in lsof_line:
                            print(lsof_line)
                            
    except Exception as e:
        print(f"オープンファイル確認エラー: {e}")

def analyze_log_patterns():
    """ログのパターン分析"""
    print("\n=== ログパターン分析 ===")
    
    log_file = Path("/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli/reference/cli/logs/bluelamp_2025-06-25.log")
    
    if log_file.exists():
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # 特定のCmdRunActionの開始と終了を追跡
            action_starts = {}
            action_timeouts = {}
            
            for i, line in enumerate(lines):
                # アクション開始の検出（仮想的なパターン）
                if 'CmdRunAction' in line and 'id=' in line:
                    # IDを抽出
                    try:
                        id_start = line.find('id=') + 3
                        id_end = line.find(')', id_start)
                        if id_end == -1:
                            id_end = line.find(' ', id_start)
                        if id_end == -1:
                            id_end = len(line)
                        action_id = line[id_start:id_end].strip()
                        
                        if 'Pending action active' in line:
                            # タイムアウト情報を記録
                            time_start = line.find('for ') + 4
                            time_end = line.find('s:', time_start)
                            if time_end > time_start:
                                timeout_time = line[time_start:time_end]
                                action_timeouts[action_id] = timeout_time
                                
                    except Exception:
                        pass
            
            print("ハングしているアクション:")
            for action_id, timeout in action_timeouts.items():
                try:
                    timeout_float = float(timeout)
                    if timeout_float > 300:  # 5分以上
                        print(f"  Action ID {action_id}: {timeout}秒")
                except ValueError:
                    pass
                    
        except Exception as e:
            print(f"ログ分析エラー: {e}")

def main():
    print("ハングプロセス詳細調査開始")
    print("=" * 60)
    
    find_hanging_bash_processes()
    check_system_resources()
    check_open_files()
    analyze_log_patterns()
    
    print("\n" + "=" * 60)
    print("調査完了")

if __name__ == "__main__":
    main()