"""
Single File Compatibility Helper
単一ファイル実行時の互換性を保つヘルパー
"""

import os
import sys
from pathlib import Path


def get_resource_path(relative_path: str) -> Path:
    """
    リソースファイルの正しいパスを取得
    PyInstallerでパッケージ化されていても動作する
    """
    # PyInstallerの場合
    if hasattr(sys, '_MEIPASS'):
        # 一時解凍ディレクトリ内のパス
        return Path(sys._MEIPASS) / relative_path
    
    # Nuitkaの場合
    if "__compiled__" in globals():
        # 実行ファイルと同じディレクトリ
        return Path(sys.argv[0]).parent / relative_path
    
    # 通常のPython実行
    return Path(__file__).parent.parent / relative_path


def is_frozen() -> bool:
    """単一ファイル化されているかチェック"""
    return hasattr(sys, '_MEIPASS') or "__compiled__" in globals()


def get_app_data_dir() -> Path:
    """アプリケーションデータディレクトリを取得"""
    if is_frozen():
        # 単一ファイルの場合は固定の場所を使用
        if sys.platform == "win32":
            base = Path(os.environ.get('APPDATA', ''))
        elif sys.platform == "darwin":
            base = Path.home() / "Library" / "Application Support"
        else:
            base = Path.home() / ".local" / "share"
        
        return base / "bluelamp"
    else:
        # 開発環境では現在のディレクトリ
        return Path.cwd() / ".bluelamp"


def get_temp_dir() -> Path:
    """一時ディレクトリを取得"""
    if is_frozen():
        # PyInstallerの一時ディレクトリ
        if hasattr(sys, '_MEIPASS'):
            return Path(sys._MEIPASS) / "temp"
        
    # 通常の一時ディレクトリ
    import tempfile
    return Path(tempfile.gettempdir()) / "bluelamp"


# 既存コードの修正例
class CompatibleObscureStorage:
    """単一ファイル対応の隠蔽ストレージ"""
    
    def __init__(self):
        # 固定パスではなく動的に決定
        self.base_path = get_app_data_dir() / "sessions"
        self.base_path.mkdir(parents=True, exist_ok=True)
        
    def get_api_key_path(self) -> Path:
        """APIキーファイルのパスを取得"""
        # 単一ファイルでも同じ場所を参照
        return self.base_path / "2874fd16-7e86-4c34-98ac-d2cfb3f62478-d5e2b751df612560" / "events" / "1.json"