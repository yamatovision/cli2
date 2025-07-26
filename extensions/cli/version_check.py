"""
バージョンチェック機能
PyPIから最新バージョンを確認してアップグレード通知を表示
"""
import asyncio
import aiohttp
import importlib.metadata
from typing import Optional, Tuple
from packaging import version
from prompt_toolkit.formatted_text import HTML
from prompt_toolkit import print_formatted_text
from datetime import datetime, timedelta
import json
import os
from pathlib import Path


class VersionChecker:
    """バージョンチェックを管理するクラス"""
    
    CACHE_FILE = Path.home() / '.bluelamp' / 'version_cache.json'
    CACHE_DURATION = timedelta(hours=24)  # 24時間キャッシュ
    PYPI_URL = "https://pypi.org/pypi/bluelamp-ai/json"
    
    def __init__(self):
        self.current_version = self._get_current_version()
        
    def _get_current_version(self) -> str:
        """現在インストールされているバージョンを取得"""
        try:
            return importlib.metadata.version('bluelamp-ai')
        except Exception:
            return "0.0.0"
            
    def _load_cache(self) -> Optional[dict]:
        """キャッシュからバージョン情報を読み込み"""
        if not self.CACHE_FILE.exists():
            return None
            
        try:
            with open(self.CACHE_FILE, 'r') as f:
                cache = json.load(f)
                
            # キャッシュの有効期限をチェック
            cached_time = datetime.fromisoformat(cache.get('timestamp', ''))
            if datetime.now() - cached_time < self.CACHE_DURATION:
                return cache
        except Exception:
            pass
            
        return None
        
    def _save_cache(self, latest_version: str) -> None:
        """バージョン情報をキャッシュに保存"""
        try:
            self.CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
            cache = {
                'latest_version': latest_version,
                'timestamp': datetime.now().isoformat()
            }
            with open(self.CACHE_FILE, 'w') as f:
                json.dump(cache, f)
        except Exception:
            pass
            
    async def _fetch_latest_version(self) -> Optional[str]:
        """PyPIから最新バージョンを取得"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.PYPI_URL, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('info', {}).get('version')
        except Exception:
            pass
        return None
        
    async def check_for_updates(self) -> Tuple[bool, Optional[str]]:
        """アップデートが利用可能かチェック"""
        # キャッシュをチェック
        cache = self._load_cache()
        if cache:
            latest_version = cache.get('latest_version')
        else:
            # PyPIから最新バージョンを取得
            latest_version = await self._fetch_latest_version()
            if latest_version:
                self._save_cache(latest_version)
                
        if not latest_version:
            return False, None
            
        # バージョンを比較
        try:
            current = version.parse(self.current_version)
            latest = version.parse(latest_version)
            return latest > current, latest_version
        except Exception:
            return False, None
            
    def display_update_notification(self, latest_version: str) -> None:
        """アップデート通知を表示"""
        print_formatted_text('')
        print_formatted_text(
            HTML('<yellow>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</yellow>')
        )
        print_formatted_text(
            HTML('<yellow>🎉 新しいバージョンが利用可能です！</yellow>')
        )
        print_formatted_text(
            HTML(f'<grey>現在のバージョン: </grey><cyan>{self.current_version}</cyan>')
        )
        print_formatted_text(
            HTML(f'<grey>最新バージョン: </grey><green>{latest_version}</green>')
        )
        print_formatted_text('')
        print_formatted_text(
            HTML('<grey>アップデート方法:</grey>')
        )
        print_formatted_text(
            HTML('<cyan>  pipx upgrade bluelamp-ai</cyan>')
        )
        print_formatted_text(
            HTML('<yellow>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</yellow>')
        )
        print_formatted_text('')


async def check_and_notify_updates() -> None:
    """非同期でバージョンチェックを実行して通知を表示"""
    try:
        checker = VersionChecker()
        has_update, latest_version = await checker.check_for_updates()
        
        if has_update and latest_version:
            checker.display_update_notification(latest_version)
    except Exception:
        # エラーが発生してもCLIの動作に影響を与えない
        pass


def run_version_check_in_background() -> None:
    """バックグラウンドでバージョンチェックを実行"""
    try:
        # 新しいイベントループを作成して実行
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(check_and_notify_updates())
        loop.close()
    except Exception:
        pass