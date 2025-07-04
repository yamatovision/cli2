#!/usr/bin/env python3
"""
BlueLamp Single File Builder
単一実行ファイルを生成するスクリプト
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path
import tempfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('build_single_file')


class SingleFileBuilder:
    """単一ファイルビルダー"""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.build_dir = project_root / "build_temp"
        
    def build_with_pyinstaller(self) -> Path:
        """PyInstallerで単一ファイルを作成"""
        logger.info("Building with PyInstaller...")
        
        # specファイルの作成
        spec_content = '''
# -*- mode: python ; coding: utf-8 -*-
import sys
from pathlib import Path

block_cipher = None

# APIキー隠蔽とメモリ暗号化を含める
hidden_imports = [
    'openhands.security.obscure_storage',
    'openhands.security.memory_encryption',
]

a = Analysis(
    ['cli.py'],
    pathex=[],
    binaries=[],
    datas=[
        # 必要なデータファイルを含める
        ('openhands/', 'openhands/'),
    ],
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'test',
        'tests',
        'pytest',
        'matplotlib',
        'scipy',
        'pandas',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='bluelamp',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
'''
        
        spec_file = self.build_dir / "bluelamp.spec"
        spec_file.parent.mkdir(exist_ok=True)
        spec_file.write_text(spec_content)
        
        # PyInstallerの実行
        cmd = [
            sys.executable, "-m", "PyInstaller",
            "--clean",
            "--distpath", str(self.build_dir / "dist"),
            "--workpath", str(self.build_dir / "build"),
            str(spec_file)
        ]
        
        try:
            subprocess.run(cmd, check=True, cwd=self.project_root)
            output_file = self.build_dir / "dist" / "bluelamp"
            if sys.platform == "win32":
                output_file = output_file.with_suffix(".exe")
            
            logger.info(f"Build successful: {output_file}")
            return output_file
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Build failed: {e}")
            raise
            
    def build_with_nuitka(self) -> Path:
        """Nuitkaで単一ファイルを作成（オプション）"""
        logger.info("Building with Nuitka...")
        
        cmd = [
            sys.executable, "-m", "nuitka",
            "--standalone",
            "--onefile",
            "--output-dir=" + str(self.build_dir),
            "--output-filename=bluelamp",
            "--assume-yes-for-downloads",
            "--follow-imports",
            "--include-package=openhands",
            "cli.py"
        ]
        
        try:
            subprocess.run(cmd, check=True, cwd=self.project_root)
            output_file = self.build_dir / "bluelamp.bin"
            logger.info(f"Build successful: {output_file}")
            return output_file
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Build failed: {e}")
            raise
            
        
    def create_release_bundle(self) -> Path:
        """リリース用バンドルの作成"""
        logger.info("Creating release bundle...")
        
        # PyInstallerでビルド
        exe_file = self.build_with_pyinstaller()
        
        # 実行ファイルサイズの確認
        size_mb = exe_file.stat().st_size / 1024 / 1024
        logger.info(f"Executable size: {size_mb:.1f} MB")
        
        # リリースディレクトリに移動
        release_dir = self.project_root / "releases"
        release_dir.mkdir(exist_ok=True)
        
        final_path = release_dir / exe_file.name
        shutil.copy2(exe_file, final_path)
        
        # ビルドディレクトリのクリーンアップ
        shutil.rmtree(self.build_dir)
        
        logger.info(f"Release bundle created: {final_path}")
        return final_path


def main():
    """メイン実行関数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Build BlueLamp as single file")
    parser.add_argument(
        "--method",
        choices=["pyinstaller", "nuitka"],
        default="pyinstaller",
        help="Build method to use"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output directory"
    )
    
    args = parser.parse_args()
    
    # プロジェクトルートの取得
    project_root = Path(__file__).parent.parent
    
    builder = SingleFileBuilder(project_root)
    
    try:
        if args.method == "pyinstaller":
            output = builder.create_release_bundle()
        else:
            output = builder.build_with_nuitka()
            
        print(f"\n✅ Build successful!")
        print(f"📦 Output: {output}")
        print(f"📏 Size: {output.stat().st_size / 1024 / 1024:.1f} MB")
        
    except Exception as e:
        print(f"\n❌ Build failed: {e}")
        return 1
        
    return 0


if __name__ == "__main__":
    sys.exit(main())