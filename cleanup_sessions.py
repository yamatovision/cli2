#!/usr/bin/env python3
"""
セッション削除実行スクリプト
"""

import shutil
import time
from pathlib import Path


def cleanup_old_sessions(max_age_days=7, dry_run=True):
    """古いセッションを削除"""
    sessions_dir = Path("~/.openhands/sessions").expanduser()
    
    if not sessions_dir.exists():
        print("セッションディレクトリが存在しません")
        return
    
    deleted_count = 0
    deleted_size_mb = 0
    
    print(f"=== セッション削除{'（DRY RUN）' if dry_run else '実行'} ===")
    print(f"対象: {max_age_days}日以上古いセッション")
    print()
    
    for session_path in sessions_dir.iterdir():
        if not session_path.is_dir():
            continue
            
        try:
            # セッションの年齢を計算
            creation_time = session_path.stat().st_ctime
            age_seconds = time.time() - creation_time
            age_days = age_seconds / (24 * 60 * 60)
            
            if age_days > max_age_days:
                # サイズを計算
                total_size = 0
                for file_path in session_path.rglob("*"):
                    if file_path.is_file():
                        total_size += file_path.stat().st_size
                size_mb = total_size / (1024 * 1024)
                
                print(f"{'[DRY RUN] ' if dry_run else ''}削除: {session_path.name} ({age_days:.1f}日前, {size_mb:.1f}MB)")
                
                if not dry_run:
                    shutil.rmtree(session_path)
                
                deleted_count += 1
                deleted_size_mb += size_mb
                
        except Exception as e:
            print(f"エラー {session_path.name}: {e}")
    
    print()
    print(f"削除{'予定' if dry_run else '完了'}: {deleted_count}個のセッション, {deleted_size_mb:.1f}MB")
    
    if dry_run:
        print("\n実際に削除するには: python3 cleanup_sessions.py --execute")


if __name__ == "__main__":
    import sys
    
    # コマンドライン引数の確認
    execute = "--execute" in sys.argv
    
    if execute:
        confirm = input("本当に古いセッションを削除しますか？ (yes/no): ")
        if confirm.lower() == "yes":
            cleanup_old_sessions(max_age_days=7, dry_run=False)
        else:
            print("キャンセルされました")
    else:
        cleanup_old_sessions(max_age_days=7, dry_run=True)