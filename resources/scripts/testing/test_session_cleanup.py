#!/usr/bin/env python3
"""
セッション削除機能の簡易テスト
"""

import os
import time
from pathlib import Path


def get_session_age_days(session_path: Path) -> float:
    """セッションの経過日数を取得"""
    try:
        creation_time = session_path.stat().st_ctime
        age_seconds = time.time() - creation_time
        return age_seconds / (24 * 60 * 60)
    except Exception as e:
        print(f"エラー {session_path}: {e}")
        return 0


def get_session_size_mb(session_path: Path) -> float:
    """セッションのサイズ（MB）を取得"""
    try:
        total_size = 0
        for file_path in session_path.rglob("*"):
            if file_path.is_file():
                total_size += file_path.stat().st_size
        return total_size / (1024 * 1024)
    except Exception as e:
        print(f"サイズ取得エラー {session_path}: {e}")
        return 0


def analyze_sessions():
    """セッション分析"""
    sessions_dir = Path("~/.openhands/sessions").expanduser()
    
    if not sessions_dir.exists():
        print("セッションディレクトリが存在しません")
        return
    
    print("=== セッション分析 ===")
    
    sessions = []
    total_size_mb = 0
    
    for session_path in sessions_dir.iterdir():
        if not session_path.is_dir():
            continue
            
        age_days = get_session_age_days(session_path)
        size_mb = get_session_size_mb(session_path)
        
        sessions.append((session_path.name, age_days, size_mb))
        total_size_mb += size_mb
    
    # 古い順にソート
    sessions.sort(key=lambda x: x[1], reverse=True)
    
    print(f"総セッション数: {len(sessions)}")
    print(f"総サイズ: {total_size_mb:.1f}MB ({total_size_mb/1024:.2f}GB)")
    print()
    
    # 古いセッション上位10個
    print("=== 古いセッション（上位10個） ===")
    for name, age_days, size_mb in sessions[:10]:
        print(f"{name}: {age_days:.1f}日前, {size_mb:.1f}MB")
    
    print()
    
    # 7日以上古いセッション
    old_sessions = [(name, age_days, size_mb) for name, age_days, size_mb in sessions if age_days > 7]
    old_size_mb = sum(size_mb for _, _, size_mb in old_sessions)
    
    print(f"=== 7日以上古いセッション ===")
    print(f"対象セッション数: {len(old_sessions)}")
    print(f"削除可能サイズ: {old_size_mb:.1f}MB ({old_size_mb/1024:.2f}GB)")
    
    if old_sessions:
        print("\n削除対象（上位20個）:")
        for name, age_days, size_mb in old_sessions[:20]:
            print(f"  {name}: {age_days:.1f}日前, {size_mb:.1f}MB")


if __name__ == "__main__":
    analyze_sessions()