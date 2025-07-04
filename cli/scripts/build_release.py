#!/usr/bin/env python3
"""
Release Build Script
GitHub Releases向けのビルドプロセスを自動化するスクリプト
"""

import os
import sys
import subprocess
import shutil
import tempfile
import argparse
import logging
from pathlib import Path
from typing import Optional

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('release_build')


class ReleaseBuildManager:
    """リリースビルド管理クラス"""
    
    def __init__(self, project_root: Path, version: Optional[str] = None):
        self.project_root = project_root
        self.version = version
        self.build_dir = project_root / "build_temp"
        self.dist_dir = project_root / "dist"
        
    def build_release(self, include_decoys: bool = True) -> bool:
        """リリースビルドを実行"""
        try:
            logger.info("Starting release build process...")
            
            # 1. 環境準備
            self._prepare_environment()
            
            # 2. バージョン確認・更新
            if self.version:
                self._update_version()
            
            # 3. 既存のdistディレクトリをクリーンアップ
            self._cleanup_dist()
            
            # 4. パッケージビルド
            self._build_package()
            
            # 5. ビルド結果の検証
            self._verify_build()
            
            # 6. クリーンアップ
            self._cleanup_temp_files()
            
            logger.info("Release build completed successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Release build failed: {e}")
            self._cleanup_temp_files()
            return False
    
    def _prepare_environment(self):
        """環境準備"""
        logger.info("Preparing build environment...")
        
        # リリースビルド環境変数を設定
        os.environ['RELEASE_BUILD'] = 'true'
        
        # 一時ビルドディレクトリを作成
        self.build_dir.mkdir(exist_ok=True)
        
        # Poetryがインストールされているか確認
        try:
            result = subprocess.run(['poetry', '--version'], 
                                  capture_output=True, text=True, check=True)
            logger.info(f"Poetry version: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise RuntimeError("Poetry is not installed or not accessible")
    
    def _update_version(self):
        """バージョン更新"""
        logger.info(f"Updating version to {self.version}...")
        
        try:
            subprocess.run(['poetry', 'version', self.version], 
                          cwd=self.project_root, check=True)
            
            # 更新されたバージョンを取得
            result = subprocess.run(['poetry', 'version', '-s'], 
                                  cwd=self.project_root, 
                                  capture_output=True, text=True, check=True)
            actual_version = result.stdout.strip()
            logger.info(f"Version updated to: {actual_version}")
            
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to update version: {e}")
    
    def _cleanup_dist(self):
        """distディレクトリのクリーンアップ"""
        logger.info("Cleaning up dist directory...")
        
        if self.dist_dir.exists():
            shutil.rmtree(self.dist_dir)
        self.dist_dir.mkdir()
    
    
    def _build_package(self):
        """パッケージビルド"""
        logger.info("Building package...")
        
        try:
            # Poetry build
            subprocess.run(['poetry', 'build'], 
                          cwd=self.project_root, check=True)
            
            logger.info("Package built successfully")
            
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to build package: {e}")
    
    def _verify_build(self):
        """ビルド結果の検証"""
        logger.info("Verifying build results...")
        
        # distディレクトリの内容を確認
        if not self.dist_dir.exists():
            raise RuntimeError("dist directory not found")
        
        dist_files = list(self.dist_dir.glob("*"))
        if not dist_files:
            raise RuntimeError("No files found in dist directory")
        
        # .whl と .tar.gz ファイルの存在確認
        whl_files = list(self.dist_dir.glob("*.whl"))
        tar_files = list(self.dist_dir.glob("*.tar.gz"))
        
        if not whl_files:
            raise RuntimeError("No .whl file found")
        if not tar_files:
            raise RuntimeError("No .tar.gz file found")
        
        logger.info("Build verification completed:")
        for file_path in dist_files:
            size_kb = file_path.stat().st_size / 1024
            logger.info(f"  {file_path.name}: {size_kb:.1f} KB")
    
    def _cleanup_temp_files(self):
        """一時ファイルのクリーンアップ"""
        logger.info("Cleaning up temporary files...")
        
        # ゴミファイルをクリーンアップ
        script_path = self.project_root / "scripts" / "generate_decoy_files.py"
        
        try:
            subprocess.run([
                sys.executable, str(script_path),
                '--cleanup',
                '--target-dir', str(self.project_root)
            ], check=True)
        except subprocess.CalledProcessError:
            logger.warning("Failed to cleanup decoy files")
        
        # 一時ビルドディレクトリを削除
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)
        
        # 環境変数をクリア
        os.environ.pop('RELEASE_BUILD', None)


def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(description='Build release package for GitHub Releases')
    parser.add_argument(
        '--version',
        type=str,
        help='Version to set (e.g., 1.0.0, patch, minor, major)'
    )
    parser.add_argument(
        '--project-root',
        type=str,
        default='.',
        help='Project root directory (default: current directory)'
    )
    
    args = parser.parse_args()
    
    project_root = Path(args.project_root).resolve()
    
    # プロジェクトルートの検証
    if not (project_root / "pyproject.toml").exists():
        logger.error(f"pyproject.toml not found in {project_root}")
        return 1
    
    # ビルド実行
    builder = ReleaseBuildManager(project_root, args.version)
    success = builder.build_release(include_decoys=False)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())