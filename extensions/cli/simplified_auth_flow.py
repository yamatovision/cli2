"""
簡略化された認証フロー
Portal認証 → Claude APIキー自動取得/設定
"""
import os
import asyncio
from typing import Optional
from pydantic import SecretStr

from extensions.cli.auth import PortalAuthenticator
from core.config import OpenHandsConfig
from core.storage.settings.file_settings_store import FileSettingsStore
from core.storage.data_models.settings import Settings
from core.config.utils import OH_DEFAULT_AGENT
from core.storage.condenser.impl.llm_summarizing_condenser import LLMSummarizingCondenserConfig


class SimplifiedAuthFlow:
    """簡略化された認証フロー管理"""
    
    def __init__(self):
        self.portal_auth = PortalAuthenticator()
        
    async def run_simplified_setup(
        self, 
        config: OpenHandsConfig, 
        settings_store: FileSettingsStore
    ) -> bool:
        """
        簡略化されたセットアップフローを実行
        
        Returns:
            bool: セットアップ成功時True
        """
        print("\n🔵 BlueLamp CLI セットアップ")
        print("=" * 50)
        
        # 1. Portal認証
        print("ステップ 1/2: Portal認証")
        if not await self._authenticate_with_portal():
            return False
            
        # 2. Claude APIキー設定
        print("\nステップ 2/2: Claude APIキー設定")
        claude_api_key = await self._get_or_set_claude_api_key()
        if not claude_api_key:
            return False
            
        # 3. 設定保存
        await self._save_simplified_settings(
            config, settings_store, claude_api_key
        )
        
        print("\n✅ セットアップ完了！")
        print("=" * 50)
        return True
        
    async def _authenticate_with_portal(self) -> bool:
        """Portal認証を実行"""
        try:
            # 既存の認証をチェック
            existing_key = self.portal_auth.load_api_key()
            if existing_key:
                print("既存の認証情報を確認中...")
                if await self.portal_auth.verify_api_key_async(existing_key):
                    user_info = self.portal_auth.get_user_info()
                    print(f"✅ 認証済み: {user_info.get('name', 'User')}")
                    return True
                else:
                    print("⚠️ 認証情報が無効です。再ログインが必要です。")
                    
            # 新規ログイン
            return await self.portal_auth.prompt_for_login()
            
        except Exception as e:
            print(f"❌ Portal認証エラー: {e}")
            return False
            
    async def _get_or_set_claude_api_key(self) -> Optional[str]:
        """Claude APIキーを取得または設定"""
        try:
            # Portal APIでユーザーのClaude APIキーを取得
            claude_api_key = await self._fetch_claude_api_key_from_portal()
            
            if claude_api_key:
                print("✅ Claude APIキーが見つかりました（Portal）")
                return claude_api_key
            else:
                print("⚠️ Claude APIキーが未登録です")
                return await self._prompt_and_save_claude_api_key()
                
        except Exception as e:
            print(f"❌ Claude APIキー取得エラー: {e}")
            return None
            
    async def _fetch_claude_api_key_from_portal(self) -> Optional[str]:
        """PortalからClaude APIキーを取得"""
        import aiohttp
        
        if not self.portal_auth.api_key:
            return None
            
        url = f"{self.portal_auth.base_url}/api/cli/claude-api-key"
        headers = {"X-CLI-Token": self.portal_auth.api_key}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("success"):
                            return data.get("data", {}).get("claudeApiKey")
                    return None
        except Exception:
            return None
            
    async def _prompt_and_save_claude_api_key(self) -> Optional[str]:
        """Claude APIキーの入力と保存"""
        print("\nClaude APIキーを入力してください:")
        print("(Anthropic Console: https://console.anthropic.com/)")
        
        try:
            api_key = input("Claude API Key: ").strip()
            if not api_key:
                print("❌ APIキーが入力されませんでした")
                return None
                
            # Portal APIでAPIキーを保存
            if await self._save_claude_api_key_to_portal(api_key):
                print("✅ Claude APIキーを保存しました")
                return api_key
            else:
                print("⚠️ APIキーの保存に失敗しましたが、セッションでは使用されます")
                return api_key
                
        except (EOFError, KeyboardInterrupt):
            print("\n❌ キャンセルされました")
            return None
            
    async def _save_claude_api_key_to_portal(self, api_key: str) -> bool:
        """Portal APIでClaude APIキーを保存"""
        import aiohttp
        
        if not self.portal_auth.api_key:
            return False
            
        url = f"{self.portal_auth.base_url}/api/cli/claude-api-key"
        headers = {"X-CLI-Token": self.portal_auth.api_key}
        payload = {"claudeApiKey": api_key}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("success", False)
                    return False
        except Exception:
            return False
            
    async def _save_simplified_settings(
        self, 
        config: OpenHandsConfig, 
        settings_store: FileSettingsStore,
        claude_api_key: str
    ) -> None:
        """簡略化された設定を保存"""
        # LLM設定（Anthropic固定、最新モデル）
        llm_config = config.get_llm_config()
        llm_config.model = 'claude-sonnet-4-20250514'  # 最新モデル固定
        llm_config.api_key = SecretStr(claude_api_key)
        llm_config.base_url = None
        config.set_llm_config(llm_config)
        
        # エージェント設定
        config.default_agent = OH_DEFAULT_AGENT
        config.enable_default_condenser = True
        
        agent_config = config.get_agent_config(config.default_agent)
        agent_config.condenser = LLMSummarizingCondenserConfig(
            llm_config=llm_config,
            type='llm',
        )
        config.set_agent_config(agent_config, config.default_agent)
        
        # 設定ストアに保存
        settings = await settings_store.load()
        if not settings:
            settings = Settings()
            
        settings.llm_model = 'claude-sonnet-4-20250514'
        settings.llm_api_key = SecretStr(claude_api_key)
        settings.llm_base_url = None
        settings.agent = OH_DEFAULT_AGENT
        settings.enable_default_condenser = True
        
        await settings_store.store(settings)
        
        # 環境変数にも設定（セッション用）
        os.environ['ANTHROPIC_API_KEY'] = claude_api_key
        print("🔧 環境変数 ANTHROPIC_API_KEY を設定しました")


# 使用例
async def run_simplified_auth_flow(
    config: OpenHandsConfig, 
    settings_store: FileSettingsStore
) -> bool:
    """簡略化認証フローのエントリーポイント"""
    flow = SimplifiedAuthFlow()
    return await flow.run_simplified_setup(config, settings_store)