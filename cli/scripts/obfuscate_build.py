#!/usr/bin/env python3
"""
BlueLamp 難読化ビルドスクリプト
PyPI公開用の難読化されたパッケージを作成
"""

import os
import sys
import shutil
import subprocess
import tempfile
from pathlib import Path
import logging
import ast
import base64
import zlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('obfuscate_build')


class CodeObfuscator:
    """Pythonコードの難読化"""
    
    def __init__(self):
        self.obfuscated_names = {}
        self.name_counter = 0
        
    def obfuscate_file(self, filepath: Path) -> str:
        """ファイルを難読化"""
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
            
        # 基本的な難読化
        # 1. 空白行とコメントの削除
        lines = source.split('\n')
        obfuscated_lines = []
        
        for line in lines:
            # docstringは保持（PyPIで必要）
            if '"""' in line or "'''" in line:
                obfuscated_lines.append(line)
                continue
                
            # インラインコメントを削除
            if '#' in line:
                code_part = line.split('#')[0].rstrip()
                if code_part:
                    obfuscated_lines.append(code_part)
            else:
                if line.strip():
                    obfuscated_lines.append(line)
                    
        return '\n'.join(obfuscated_lines)
    
    def compress_code(self, source: str) -> str:
        """コードを圧縮してbase64エンコード"""
        compressed = zlib.compress(source.encode('utf-8'))
        encoded = base64.b64encode(compressed).decode('ascii')
        
        # 実行時に展開するラッパー
        wrapper = f'''import base64,zlib
exec(zlib.decompress(base64.b64decode("{encoded}")).decode("utf-8"))'''
        
        return wrapper


class ObfuscatedPackageBuilder:
    """難読化パッケージビルダー"""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.build_dir = project_root / "build_obfuscated"
        self.dist_dir = project_root / "dist"
        self.obfuscator = CodeObfuscator()
        
    def build(self):
        """難読化ビルドを実行"""
        logger.info("Starting obfuscated build...")
        
        try:
            # 1. 一時ディレクトリにプロジェクトをコピー
            self._prepare_build_directory()
            
            # 2. Pythonファイルを難読化
            self._obfuscate_python_files()
            
            # 3. パッケージをビルド
            self._build_package()
            
            # 4. クリーンアップ
            self._cleanup()
            
            logger.info("Obfuscated build completed successfully!")
            
        except Exception as e:
            logger.error(f"Build failed: {e}")
            self._cleanup()
            raise
    
    def _prepare_build_directory(self):
        """ビルドディレクトリを準備"""
        logger.info("Preparing build directory...")
        
        # 既存のビルドディレクトリを削除
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)
            
        # プロジェクトをコピー
        shutil.copytree(
            self.project_root,
            self.build_dir,
            ignore=shutil.ignore_patterns(
                '__pycache__', '*.pyc', '.git', 'build*', 'dist',
                '.venv', 'venv', '*.egg-info', '.pytest_cache'
            )
        )
        
    def _obfuscate_python_files(self):
        """Pythonファイルを難読化"""
        logger.info("Obfuscating Python files...")
        
        # 難読化対象のファイルを取得
        python_files = list((self.build_dir / "openhands").rglob("*.py"))
        
        # 除外するファイル
        exclude_patterns = [
            "__init__.py",  # インポートに必要
            "setup.py",     # セットアップに必要
        ]
        
        for py_file in python_files:
            # 除外パターンに該当するかチェック
            if any(pattern in py_file.name for pattern in exclude_patterns):
                continue
                
            logger.info(f"Obfuscating: {py_file.name}")
            source = self.obfuscator.obfuscate_file(py_file)
            
            # すべてのファイルを圧縮（より強力な難読化）
            # ただし、メインエントリーポイントは除外
            if py_file.name not in ["main.py", "__main__.py"]:
                source = self.obfuscator.compress_code(source)
                
            # ファイルを上書き
            with open(py_file, 'w', encoding='utf-8') as f:
                f.write(source)
                
    def _build_package(self):
        """パッケージをビルド"""
        logger.info("Building package...")
        
        # distディレクトリをクリーン
        if self.dist_dir.exists():
            shutil.rmtree(self.dist_dir)
            
        # Poetry buildを実行
        subprocess.run(
            ["poetry", "build"],
            cwd=self.build_dir,
            check=True
        )
        
        # ビルド結果を元のdistディレクトリにコピー
        build_dist = self.build_dir / "dist"
        shutil.copytree(build_dist, self.dist_dir)
        
    def _cleanup(self):
        """一時ファイルをクリーンアップ"""
        logger.info("Cleaning up...")
        
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)


def main():
    """メイン関数"""
    project_root = Path(__file__).parent.parent
    
    # pyproject.tomlの存在確認
    if not (project_root / "pyproject.toml").exists():
        logger.error("pyproject.toml not found!")
        return 1
        
    # 難読化ビルドを実行
    builder = ObfuscatedPackageBuilder(project_root)
    builder.build()
    
    return 0


if __name__ == "__main__":
    sys.exit(main())