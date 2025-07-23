#!/usr/bin/env python3
"""
BlueLamp バイナリ用エントリーポイント
バイナリ化時の特殊な初期化処理を含む
"""

import sys
import os

# PyInstallerでバイナリ化されている場合の処理
if getattr(sys, 'frozen', False):
    # バイナリの実行ディレクトリを取得
    application_path = sys._MEIPASS
    # Pythonパスに追加
    sys.path.insert(0, application_path)
    # 環境変数の設定
    os.environ['BLUELAMP_BINARY_MODE'] = '1'

# メインモジュールのインポートと実行
from extensions.cli.main import main

if __name__ == '__main__':
    main()