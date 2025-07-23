#!/usr/bin/env python3
"""
BlueLamp CLI バイナリビルドスクリプト
既存の実装に影響を与えずにスタンドアロンバイナリを作成
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

def clean_build_dirs():
    """ビルド関連のディレクトリをクリーンアップ"""
    dirs_to_clean = ['build', 'dist', '__pycache__']
    for dir_name in dirs_to_clean:
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
            print(f"✓ {dir_name} ディレクトリを削除しました")

def install_pyinstaller():
    """PyInstallerがインストールされていなければインストール"""
    try:
        import PyInstaller
        print("✓ PyInstallerはインストール済みです")
    except ImportError:
        print("PyInstallerをインストールしています...")
        # Poetry環境でインストール
        subprocess.check_call(["poetry", "add", "--dev", "pyinstaller"])
        print("✓ PyInstallerのインストールが完了しました")

def build_binary():
    """バイナリのビルド実行"""
    print("\n🔨 BlueLamp CLIバイナリのビルドを開始します...")
    
    # PyInstallerコマンドの構築（Poetry環境で実行）
    cmd = [
        "poetry", "run", "pyinstaller",
        "--name", "bluelamp",
        "--onefile",
        "--clean",
        "--noconfirm",
        "--spec", "bluelamp.spec"
    ]
    
    # ビルド実行
    try:
        subprocess.check_call(cmd)
        print("\n✅ ビルドが正常に完了しました！")
        print(f"バイナリの場所: {os.path.join('dist', 'bluelamp')}")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ ビルドエラー: {e}")
        sys.exit(1)

def main():
    """メイン処理"""
    print("🚀 BlueLamp CLI バイナリビルダー")
    print("=" * 50)
    
    # 1. クリーンアップ
    print("\n1. ビルドディレクトリのクリーンアップ")
    clean_build_dirs()
    
    # 2. PyInstallerの確認/インストール
    print("\n2. PyInstallerの確認")
    install_pyinstaller()
    
    # 3. ビルド実行
    print("\n3. バイナリのビルド")
    build_binary()
    
    print("\n" + "=" * 50)
    print("✨ すべての処理が完了しました！")

if __name__ == "__main__":
    main()