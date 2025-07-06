"""
Portal連携PromptManager
Portal APIからプロンプトを取得する機能を持つPromptManager
"""
import os
import asyncio
import logging
from typing import Optional, TYPE_CHECKING
from jinja2 import Template

from .prompt_client import PortalPromptClient
from .prompt_mapping import is_portal_prompt, get_prompt_id

if TYPE_CHECKING:
    from openhands.controller.state.state import State
    from openhands.core.message import Message

logger = logging.getLogger('bluelamp.portal.prompt_manager')


class PortalPromptManager:
    """Portal APIからプロンプトを取得するPromptManager"""
    
    def __init__(
        self,
        prompt_dir: str,
        system_prompt_filename: str = 'system_prompt.j2',
        portal_base_url: Optional[str] = None,
        enable_portal: bool = True
    ):
        """
        Args:
            prompt_dir: ローカルプロンプトディレクトリ
            system_prompt_filename: システムプロンプトファイル名
            portal_base_url: PortalのベースURL
            enable_portal: Portal連携を有効にするか
        """
        # 基本設定
        self.prompt_dir = prompt_dir
        self.system_prompt_filename = system_prompt_filename
        
        # Portal固有の設定
        self.portal_client = PortalPromptClient(base_url=portal_base_url) if enable_portal else None
        self.enable_portal = enable_portal
        self._portal_content_cache: Optional[str] = None
        self._local_manager = None  # 型アノテーション削除（循環参照を避ける）
        
        # テンプレートファイルを読み込み
        template_dir = os.path.dirname(__file__)
        
        # additional_info.j2テンプレートを読み込み
        self._additional_info_template = None
        additional_info_path = os.path.join(template_dir, 'additional_info.j2')
        if os.path.exists(additional_info_path):
            with open(additional_info_path, 'r') as f:
                self._additional_info_template = Template(f.read())
        
        # user_prompt.j2テンプレートを読み込み
        self._user_template = None
        user_prompt_path = os.path.join(template_dir, 'user_prompt.j2')
        if os.path.exists(user_prompt_path):
            with open(user_prompt_path, 'r') as f:
                self._user_template = Template(f.read())
        
        # microagent_info.j2テンプレートは使用しないので読み込まない
        # （build_microagent_infoは空文字を返す）
        
        logger.info(f"PortalPromptManager初期化: portal={enable_portal}, file={system_prompt_filename}")
    
    def _get_local_manager(self):
        """ローカルPromptManagerを遅延初期化"""
        if self._local_manager is None:
            from openhands.utils.prompt import PromptManager
            self._local_manager = PromptManager(
                prompt_dir=self.prompt_dir,
                system_prompt_filename=self.system_prompt_filename
            )
        return self._local_manager
    
    async def _fetch_portal_content(self, retry_on_auth_error: bool = True) -> Optional[str]:
        """Portal APIからプロンプト内容を取得"""
        if not self.enable_portal or not self.portal_client:
            return None
            
        try:
            # Portal連携対象かチェック
            if not is_portal_prompt(self.system_prompt_filename):
                logger.debug(f"Portal連携対象外: {self.system_prompt_filename}")
                return None
            
            # Portal APIから取得
            content = await self.portal_client.fetch_prompt_by_filename(self.system_prompt_filename)
            if content:
                logger.info(f"Portal プロンプト取得成功: {self.system_prompt_filename}")
                return content
            else:
                logger.warning(f"Portal プロンプト取得失敗: {self.system_prompt_filename}")
                
                # 認証エラーの可能性がある場合は自動再認証を試行
                if retry_on_auth_error:
                    logger.info("認証エラーの可能性があります。自動再認証を試行します...")
                    try:
                        from openhands.cli.auth import PortalAuthenticator
                        auth = PortalAuthenticator()
                        
                        # APIキーを読み込む
                        auth.load_api_key()
                        
                        # 現在のトークンを検証し、必要に応じて再認証
                        try:
                            await auth.verify_api_key(auto_reauth=True)
                            # 再認証後に再試行
                            logger.info("再認証後にプロンプト取得を再試行します...")
                            return await self._fetch_portal_content(retry_on_auth_error=False)
                        except Exception as auth_error:
                            logger.error(f"自動再認証に失敗: {auth_error}")
                            return None
                            
                    except Exception as reauth_error:
                        logger.error(f"再認証処理エラー: {reauth_error}")
                        return None
                
                return None
                
        except Exception as e:
            logger.error(f"Portal プロンプト取得エラー: {e}")
            
            # 認証関連エラーの場合は自動再認証を試行
            if retry_on_auth_error and ("401" in str(e) or "unauthorized" in str(e).lower() or "authentication" in str(e).lower()):
                logger.info("認証エラーを検出しました。自動再認証を試行します...")
                try:
                    from openhands.cli.auth import PortalAuthenticator
                    auth = PortalAuthenticator()
                    
                    # APIキーを読み込む
                    auth.load_api_key()
                    
                    # 自動再認証を実行
                    try:
                        await auth.verify_api_key(auto_reauth=True)
                        # 再認証後に再試行
                        logger.info("再認証後にプロンプト取得を再試行します...")
                        return await self._fetch_portal_content(retry_on_auth_error=False)
                    except Exception as auth_error:
                        logger.error(f"自動再認証に失敗: {auth_error}")
                        return None
                        
                except Exception as reauth_error:
                    logger.error(f"再認証処理エラー: {reauth_error}")
                    return None
            
            return None
    
    def get_system_message(self) -> str:
        """
        システムメッセージを取得
        Portal優先、ローカルフォールバック
        """
        try:
            # キャッシュがある場合はそれを使用
            if self._portal_content_cache is not None:
                logger.debug("キャッシュからプロンプトを返却")
                # キャッシュされたプロンプトをそのまま返す（コンテキストは別途追加される）
                return self._clean_portal_prompt(self._portal_content_cache)
            
            # Portal連携が有効で対象ファイルの場合
            if self.enable_portal and is_portal_prompt(self.system_prompt_filename):
                try:
                    # 非同期処理を同期的に実行
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        # 既にイベントループが動いている場合は新しいタスクとして実行
                        import concurrent.futures
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(asyncio.run, self._fetch_portal_content())
                            portal_content = future.result(timeout=10)
                    else:
                        # イベントループが動いていない場合は直接実行
                        portal_content = asyncio.run(self._fetch_portal_content())
                    
                    if portal_content:
                        self._portal_content_cache = portal_content
                        logger.info(f"Portal プロンプト使用: {self.system_prompt_filename}")
                        # Portal APIから取得したプロンプトをクリーンアップして返す
                        return self._clean_portal_prompt(portal_content)
                        
                except Exception as e:
                    logger.warning(f"Portal プロンプト取得失敗、ローカルにフォールバック: {e}")
            
            # ローカルファイルにフォールバック
            logger.info(f"ローカル プロンプト使用: {self.system_prompt_filename}")
            local_manager = self._get_local_manager()
            return local_manager.get_system_message()
            
        except Exception as e:
            logger.error(f"プロンプト取得エラー: {e}")
            # 最後の手段として空のプロンプトを返す
            return "# System Prompt\nYou are a helpful AI assistant."
    
    async def get_system_message_async(self) -> str:
        """
        非同期でシステムメッセージを取得
        """
        try:
            # キャッシュがある場合はそれを使用
            if self._portal_content_cache is not None:
                logger.debug("キャッシュからプロンプトを返却")
                return self._clean_portal_prompt(self._portal_content_cache)
            
            # Portal連携が有効で対象ファイルの場合
            if self.enable_portal and is_portal_prompt(self.system_prompt_filename):
                portal_content = await self._fetch_portal_content()
                if portal_content:
                    self._portal_content_cache = portal_content
                    logger.info(f"Portal プロンプト使用: {self.system_prompt_filename}")
                    return self._clean_portal_prompt(portal_content)
            
            # ローカルファイルにフォールバック
            logger.info(f"ローカル プロンプト使用: {self.system_prompt_filename}")
            local_manager = self._get_local_manager()
            return local_manager.get_system_message()
            
        except Exception as e:
            logger.error(f"プロンプト取得エラー: {e}")
            # 最後の手段として空のプロンプトを返す
            return "# System Prompt\nYou are a helpful AI assistant."
    
    def _clean_portal_prompt(self, content: str) -> str:
        """
        Portalから取得したプロンプトをクリーンアップ
        - メタデータ（Source、Fetchedなど）を削除
        - {{ instructions }}などのテンプレート変数を処理
        """
        try:
            # "---"で始まるメタデータセクションを削除
            if "\n---\n" in content:
                content = content.split("\n---\n")[0]
            
            # {{ instructions }}を空文字に置換（必要に応じて後で実装）
            content = content.replace("{{ instructions }}", "")
            
            return content.strip()
        except Exception as e:
            logger.error(f"プロンプトクリーンアップエラー: {e}")
            return content
    
    def clear_cache(self):
        """プロンプトキャッシュをクリア"""
        self._portal_content_cache = None
        logger.debug("プロンプトキャッシュをクリアしました")
    
    async def test_portal_connection(self) -> bool:
        """Portal接続テスト"""
        if not self.enable_portal or not self.portal_client:
            return False
        return await self.portal_client.test_connection()
    
    def get_example_user_message(self) -> str:
        """ユーザーメッセージ例を取得"""
        if self._user_template:
            try:
                return self._user_template.render().strip()
            except Exception as e:
                logger.error(f"user_prompt テンプレートレンダリングエラー: {e}")
                return ""
        else:
            # テンプレートがない場合はローカルマネージャーにフォールバック
            local_manager = self._get_local_manager()
            return local_manager.get_example_user_message()
    
    def get_user_message(self, task: str, **kwargs) -> str:
        """ユーザーメッセージを取得（ローカルから）"""
        local_manager = self._get_local_manager()
        return local_manager.get_user_message(task, **kwargs)
    
    def build_workspace_context(
        self,
        repository_info=None,
        runtime_info=None,
        conversation_instructions=None,
        repo_instructions: str = '',
    ) -> str:
        """ワークスペースコンテキストを構築"""
        # additional_info.j2テンプレートを使ってコンテキスト情報を生成
        if self._additional_info_template:
            try:
                context = self._additional_info_template.render(
                    repository_info=repository_info,
                    repository_instructions=repo_instructions,
                    runtime_info=runtime_info,
                    conversation_instructions=conversation_instructions,
                )
                return context.strip()
            except Exception as e:
                logger.error(f"additional_info テンプレートレンダリングエラー: {e}")
                return ""
        else:
            # テンプレートがない場合はローカルマネージャーにフォールバック
            local_manager = self._get_local_manager()
            return local_manager.build_workspace_context(
                repository_info=repository_info,
                runtime_info=runtime_info,
                conversation_instructions=conversation_instructions,
                repo_instructions=repo_instructions,
            )
    
    def build_microagent_info(self, triggered_agents=None) -> str:
        """マイクロエージェント情報を構築"""
        # Portal APIから取得したプロンプトには含まれているため、空文字を返す
        return ""
    
    def add_turns_left_reminder(self, messages: list['Message'], state: 'State') -> None:
        """残りターン数のリマインダーをメッセージに追加"""
        # ローカルマネージャーに委譲（State, Message, TextContentのインポートを避けるため）
        local_manager = self._get_local_manager()
        local_manager.add_turns_left_reminder(messages, state)


# 便利関数
def create_portal_prompt_manager(
    prompt_dir: str,
    system_prompt_filename: str = 'system_prompt.j2',
    portal_base_url: Optional[str] = None,
    enable_portal: bool = True
) -> PortalPromptManager:
    """PortalPromptManagerを作成する便利関数"""
    return PortalPromptManager(
        prompt_dir=prompt_dir,
        system_prompt_filename=system_prompt_filename,
        portal_base_url=portal_base_url,
        enable_portal=enable_portal
    )


# テスト用関数
async def test_portal_prompt_manager():
    """PortalPromptManagerのテスト"""
    import tempfile
    import os
    
    # テスト用の一時ディレクトリとファイルを作成
    with tempfile.TemporaryDirectory() as temp_dir:
        # テスト用ローカルプロンプトファイルを作成
        test_prompt_path = os.path.join(temp_dir, 'feature_extension.j2')
        with open(test_prompt_path, 'w') as f:
            f.write("# Local Test Prompt\nThis is a local test prompt.")
        
        # PortalPromptManagerを作成
        manager = PortalPromptManager(
            prompt_dir=temp_dir,
            system_prompt_filename='feature_extension.j2',
            enable_portal=True
        )
        
        print("Portal接続テスト...")
        if await manager.test_portal_connection():
            print("✅ Portal接続成功")
        else:
            print("❌ Portal接続失敗")
        
        print("\nプロンプト取得テスト...")
        content = await manager.get_system_message_async()
        print(f"取得したプロンプト: {len(content)}文字")
        print(f"内容プレビュー: {content[:100]}...")


if __name__ == "__main__":
    asyncio.run(test_portal_prompt_manager())