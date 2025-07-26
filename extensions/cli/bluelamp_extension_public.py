#!/usr/bin/env python3
"""
BlueLamp Public CLI - Extension Manager Agent
一般公開用ブルーランプ拡張 - 拡張マネージャーエージェント
"""

import os
import sys
import threading

def main():
    """ブルーランプ拡張（拡張マネージャー）のメインエントリーポイント"""
    # セキュリティシステムの初期化
    try:
        from extensions.security.system_init import initialize_system_components
        initialize_system_components()
    except Exception as e:
        print(f"Warning: Security system initialization failed: {e}")
    
    # 実行コマンドを識別するための環境変数
    os.environ['BLUELAMP_COMMAND'] = 'ブルーランプ拡張'
    
    # 現在のディレクトリをワークスペースとして設定
    current_dir = os.getcwd()
    os.environ['SANDBOX_VOLUMES'] = f"{current_dir}:/workspace:rw"
    
    # セッション情報を表示
    print("🔧エージェント：拡張マネージャー")
    print("ブルーランプ拡張モードを起動しています...")
    print("")
    
    # バックグラウンドでバージョンチェックを実行
    from extensions.cli.version_check import run_version_check_in_background
    version_thread = threading.Thread(target=run_version_check_in_background, daemon=True)
    version_thread.start()
    
    # main_sessionモジュールをインポートして実行
    from extensions.cli.main_session.main import main as session_main
    session_main()

if __name__ == '__main__':
    main()