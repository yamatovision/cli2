#!/usr/bin/env python3
"""
BlueLampエージェントコントローラーのデリゲート修正テストスクリプト

このスクリプトは、修正されたデリゲート機能をテストするために使用します。
"""

import os
import sys
import time
import subprocess
from pathlib import Path

def test_bluelamp_delegate():
    """BlueLampのデリゲート機能をテストする"""
    
    print("=== BlueLampデリゲート修正テスト ===")
    print(f"テスト開始時刻: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # ログファイルのパスを設定
    log_dir = Path("/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli/logs")
    today_log = log_dir / f"bluelamp_{time.strftime('%Y-%m-%d')}.log"
    
    print(f"ログファイル: {today_log}")
    
    # 現在のログファイルサイズを記録
    initial_size = today_log.stat().st_size if today_log.exists() else 0
    print(f"初期ログサイズ: {initial_size} bytes")
    
    # テスト用のコマンドを実行（簡単なタスク）
    print("\n=== テスト実行 ===")
    print("BlueLampでシンプルなタスクを実行します...")
    
    # ここでBlueLampコマンドを実行
    # 実際のテストでは適切なコマンドに置き換えてください
    test_command = [
        "python3", 
        "/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli/bluelamp",
        "--help"  # 安全なテストコマンド
    ]
    
    try:
        result = subprocess.run(test_command, capture_output=True, text=True, timeout=30)
        print(f"コマンド実行結果: {result.returncode}")
        if result.stdout:
            print(f"標準出力: {result.stdout[:200]}...")
        if result.stderr:
            print(f"標準エラー: {result.stderr[:200]}...")
    except subprocess.TimeoutExpired:
        print("コマンドがタイムアウトしました")
    except Exception as e:
        print(f"コマンド実行エラー: {e}")
    
    # ログファイルの変化を確認
    time.sleep(2)  # ログ書き込みを待つ
    
    if today_log.exists():
        final_size = today_log.stat().st_size
        print(f"\n=== ログ分析 ===")
        print(f"最終ログサイズ: {final_size} bytes")
        print(f"追加されたログ: {final_size - initial_size} bytes")
        
        # 新しいログメッセージタイプを検索
        new_log_types = [
            "DELEGATE_BLOCKING_STEP",
            "DELEGATE_EVENT_PROCESSING", 
            "FORWARDING_TO_DELEGATE",
            "DELEGATE_EVENT_COMPLETED",
            "DELEGATE_TIMEOUT",
            "DELEGATE_INACTIVITY",
            "DELEGATE_STARTED",
            "END_DELEGATE_START",
            "END_DELEGATE_COMPLETE"
        ]
        
        print("\n=== 新しいログメッセージの確認 ===")
        with open(today_log, 'r', encoding='utf-8') as f:
            log_content = f.read()
            
        for log_type in new_log_types:
            count = log_content.count(log_type)
            if count > 0:
                print(f"✅ {log_type}: {count}件")
            else:
                print(f"❌ {log_type}: 0件")
    
    print(f"\nテスト完了時刻: {time.strftime('%Y-%m-%d %H:%M:%S')}")

def check_modifications():
    """修正内容を確認する"""
    
    print("\n=== 修正内容の確認 ===")
    
    agent_controller_path = Path("/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli/openhands/controller/agent_controller.py")
    
    if not agent_controller_path.exists():
        print("❌ agent_controller.pyが見つかりません")
        return
    
    with open(agent_controller_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修正内容の確認
    modifications = [
        "_delegate_start_time",
        "_delegate_last_activity", 
        "DELEGATE_BLOCKING_STEP",
        "DELEGATE_TIMEOUT",
        "elapsed_time > 300",
        "inactivity_time > 120"
    ]
    
    print("修正内容の確認:")
    for mod in modifications:
        if mod in content:
            print(f"✅ {mod}: 実装済み")
        else:
            print(f"❌ {mod}: 未実装")

if __name__ == "__main__":
    print("BlueLampエージェントコントローラー デリゲート修正テスト")
    print("=" * 60)
    
    # 修正内容の確認
    check_modifications()
    
    # 実際のテスト実行
    test_bluelamp_delegate()
    
    print("\n" + "=" * 60)
    print("テスト完了")
    print("\n次のステップ:")
    print("1. ログファイルで詳細なデバッグ情報を確認")
    print("2. デリゲートエージェントを使用する実際のタスクでテスト")
    print("3. タイムアウト機能の動作確認")