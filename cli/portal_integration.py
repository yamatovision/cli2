#!/usr/bin/env python3
"""
Portal統合モジュール
OpenHandsの依存関係に依存しない独立したPortal連携機能

使用方法:
    from portal_integration import PortalIntegration
    
    portal = PortalIntegration()
    await portal.login("email", "password")
    content = await portal.fetch_prompt("feature_extension.j2")
"""
import asyncio
import aiohttp
import json
import os
from pathlib import Path
from typing import Optional, Dict, List
import logging
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from openhands.security.obscure_storage import get_obscure_storage
except ImportError:
    # スタンドアロンで使用する場合のフォールバック
    get_obscure_storage = None

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('portal_integration')


class PortalIntegration:
    """Portal統合クラス - 完全に独立したPortal連携機能"""
    
    # プロンプトマッピング
    PROMPT_MAPPING = {
        'feature_extension.j2': '67d795ccc7e55b63256e5dd6',
        'orchestrator.j2': '6862397f1428c1efc592f6cc',
        'debug_detective.j2': '67d52839c9efa29641812d95',
        'requirements_creator.j2': '67d52839c9efa29641812db9',
        'typescript_manager.j2': '67d8f13e8ff74c4c95660d87',
        'mockup_analyzer.j2': '67d52839c9efa29641812db6',
        'integration_tester.j2': '682c15b8b673896d53d68b28',
        'refactoring_manager.j2': '67fd96760ff4b574ba8e4f11',
        'github_manager.j2': '67d52839c9efa29641812dbc',
        'backend_agent.j2': '67d52839c9efa29641812dbf',
        'prototype_agent.j2': '67fd971a0ff4b574ba8e4f3a',
        'api_integration.j2': '68314fd296d6b2534f169217',
        'deploy_specialist.j2': '67fd96fb0ff4b574ba8e4f31',
        'environment_assistant.j2': '67d52839c9efa29641812db3',
        'data_architect.j2': '67e34f27e4b15d4bee45e9fa',
        'auth_architect.j2': '67fd96d00ff4b574ba8e4f26',
        'implementation_planner.j2': '67fd969d0ff4b574ba8e4f1a',
    }
    
    def __init__(self, portal_url: str = "http://localhost:8081"):
        """
        Portal統合クラスを初期化
        
        Args:
            portal_url: PortalのベースURL
        """
        self.portal_url = portal_url
        self._obscure_storage = get_obscure_storage() if get_obscure_storage else None
        self._token = None
    
    def load_token(self) -> Optional[str]:
        """保存されたトークンを読み込み"""
        if self._obscure_storage:
            try:
                token = self._obscure_storage.load_api_key()
                if token:
                    self._token = token
                    return token
            except Exception as e:
                logger.error(f"トークン読み込みエラー: {e}")
        return None
    
    def save_token(self, token: str) -> bool:
        """トークンを保存"""
        if self._obscure_storage:
            if self._obscure_storage.save_api_key(token):
                self._token = token
                return True
            else:
                logger.error(f"トークン保存エラー")
                return False
        return False
    
    async def login(self, email: str, password: str) -> bool:
        """
        Portal にログインしてCLIトークンを取得
        
        Args:
            email: ユーザーのメールアドレス
            password: パスワード
            
        Returns:
            bool: ログイン成功の場合True
        """
        try:
            async with aiohttp.ClientSession() as session:
                login_data = {
                    "email": email,
                    "password": password
                }
                
                async with session.post(f"{self.portal_url}/api/cli/login", json=login_data) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('success'):
                            token = data.get('data', {}).get('token')
                            if token:
                                self.save_token(token)
                                logger.info("ログイン成功")
                                return True
                    
                    error_data = await response.json()
                    logger.error(f"ログインエラー: {error_data}")
                    return False
        except Exception as e:
            logger.error(f"ログイン例外: {e}")
            return False
    
    async def verify_token(self, token: Optional[str] = None) -> bool:
        """
        トークンを検証
        
        Args:
            token: 検証するトークン（Noneの場合は保存済みトークンを使用）
            
        Returns:
            bool: トークンが有効な場合True
        """
        if not token:
            token = self._token or self.load_token()
        
        if not token:
            return False
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {'X-CLI-Token': token}
                
                async with session.get(f"{self.portal_url}/api/cli/prompts", headers=headers) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"トークン検証エラー: {e}")
            return False
    
    async def get_available_prompts(self) -> Optional[List[Dict]]:
        """
        利用可能なプロンプト一覧を取得
        
        Returns:
            List[Dict]: プロンプト一覧、エラーの場合None
        """
        token = self._token or self.load_token()
        if not token:
            logger.error("トークンが見つかりません")
            return None
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {'X-CLI-Token': token}
                
                async with session.get(f"{self.portal_url}/api/cli/prompts", headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('success'):
                            return data.get('data', {}).get('prompts', [])
                    return None
        except Exception as e:
            logger.error(f"プロンプト一覧取得エラー: {e}")
            return None
    
    async def fetch_prompt_by_id(self, prompt_id: str) -> Optional[str]:
        """
        プロンプトIDでプロンプトを取得
        
        Args:
            prompt_id: プロンプトID
            
        Returns:
            str: プロンプト内容、エラーの場合None
        """
        token = self._token or self.load_token()
        if not token:
            logger.error("トークンが見つかりません")
            return None
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {'X-CLI-Token': token}
                url = f"{self.portal_url}/api/cli/prompts/{prompt_id}"
                
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('success'):
                            return data.get('data', {}).get('prompt', {}).get('content')
                    return None
        except Exception as e:
            logger.error(f"プロンプト取得エラー: {e}")
            return None
    
    async def fetch_prompt_by_filename(self, filename: str) -> Optional[str]:
        """
        ファイル名でプロンプトを取得
        
        Args:
            filename: プロンプトファイル名（例: 'feature_extension.j2'）
            
        Returns:
            str: プロンプト内容、エラーの場合None
        """
        prompt_id = self.PROMPT_MAPPING.get(filename)
        if not prompt_id:
            logger.error(f"ファイル名 '{filename}' に対応するプロンプトIDが見つかりません")
            return None
        
        return await self.fetch_prompt_by_id(prompt_id)
    
    def is_portal_prompt(self, filename: str) -> bool:
        """
        ファイル名がPortal連携対象かチェック
        
        Args:
            filename: プロンプトファイル名
            
        Returns:
            bool: Portal連携対象の場合True
        """
        return filename in self.PROMPT_MAPPING
    
    def get_prompt_id(self, filename: str) -> Optional[str]:
        """
        ファイル名からプロンプトIDを取得
        
        Args:
            filename: プロンプトファイル名
            
        Returns:
            str: プロンプトID、見つからない場合None
        """
        return self.PROMPT_MAPPING.get(filename)
    
    async def test_connection(self) -> bool:
        """
        Portal接続をテスト
        
        Returns:
            bool: 接続成功の場合True
        """
        return await self.verify_token()
    
    async def save_prompt_to_file(self, filename: str, output_path: Optional[Path] = None) -> bool:
        """
        プロンプトをファイルに保存
        
        Args:
            filename: プロンプトファイル名
            output_path: 出力パス（Noneの場合は現在のディレクトリ）
            
        Returns:
            bool: 保存成功の場合True
        """
        content = await self.fetch_prompt_by_filename(filename)
        if not content:
            return False
        
        if not output_path:
            output_path = Path(filename)
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"プロンプトを保存しました: {output_path}")
            return True
        except Exception as e:
            logger.error(f"ファイル保存エラー: {e}")
            return False


# 便利関数
async def quick_login(email: str, password: str) -> PortalIntegration:
    """
    クイックログイン
    
    Args:
        email: メールアドレス
        password: パスワード
        
    Returns:
        PortalIntegration: ログイン済みのPortalIntegrationインスタンス
        
    Raises:
        Exception: ログインに失敗した場合
    """
    portal = PortalIntegration()
    if await portal.login(email, password):
        return portal
    else:
        raise Exception("ログインに失敗しました")


async def fetch_prompt(filename: str) -> Optional[str]:
    """
    プロンプトを取得（保存済みトークンを使用）
    
    Args:
        filename: プロンプトファイル名
        
    Returns:
        str: プロンプト内容、エラーの場合None
    """
    portal = PortalIntegration()
    return await portal.fetch_prompt_by_filename(filename)


async def test_portal_connection() -> bool:
    """
    Portal接続をテスト（保存済みトークンを使用）
    
    Returns:
        bool: 接続成功の場合True
    """
    portal = PortalIntegration()
    return await portal.test_connection()


# CLIスクリプトとして実行された場合
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Portal統合ツール")
    subparsers = parser.add_subparsers(dest='command', help='利用可能なコマンド')
    
    # ログインコマンド
    login_parser = subparsers.add_parser('login', help='Portalにログイン')
    login_parser.add_argument('email', help='メールアドレス')
    login_parser.add_argument('password', help='パスワード')
    
    # プロンプト取得コマンド
    fetch_parser = subparsers.add_parser('fetch', help='プロンプトを取得')
    fetch_parser.add_argument('filename', help='プロンプトファイル名')
    fetch_parser.add_argument('-o', '--output', help='出力ファイルパス')
    
    # 一覧表示コマンド
    list_parser = subparsers.add_parser('list', help='利用可能なプロンプト一覧を表示')
    
    # 接続テストコマンド
    test_parser = subparsers.add_parser('test', help='Portal接続をテスト')
    
    args = parser.parse_args()
    
    async def main():
        portal = PortalIntegration()
        
        if args.command == 'login':
            if await portal.login(args.email, args.password):
                print("✅ ログイン成功")
            else:
                print("❌ ログイン失敗")
                return 1
        
        elif args.command == 'fetch':
            content = await portal.fetch_prompt_by_filename(args.filename)
            if content:
                if args.output:
                    output_path = Path(args.output)
                    if await portal.save_prompt_to_file(args.filename, output_path):
                        print(f"✅ プロンプトを保存しました: {output_path}")
                    else:
                        print("❌ ファイル保存に失敗しました")
                        return 1
                else:
                    print(content)
            else:
                print(f"❌ プロンプト '{args.filename}' の取得に失敗しました")
                return 1
        
        elif args.command == 'list':
            prompts = await portal.get_available_prompts()
            if prompts:
                print(f"利用可能なプロンプト: {len(prompts)}件")
                for prompt in prompts:
                    title = prompt.get('title', 'No Title')
                    prompt_id = prompt.get('id', 'No ID')
                    print(f"  - {title} ({prompt_id})")
            else:
                print("❌ プロンプト一覧の取得に失敗しました")
                return 1
        
        elif args.command == 'test':
            if await portal.test_connection():
                print("✅ Portal接続成功")
            else:
                print("❌ Portal接続失敗")
                return 1
        
        else:
            parser.print_help()
            return 1
        
        return 0
    
    try:
        exit_code = asyncio.run(main())
        exit(exit_code)
    except KeyboardInterrupt:
        print("\n⚠️  操作が中断されました")
        exit(1)
    except Exception as e:
        print(f"❌ エラー: {e}")
        exit(1)