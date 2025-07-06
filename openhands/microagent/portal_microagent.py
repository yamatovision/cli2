"""
Portal連携マイクロエージェント
Portal APIから専門プロンプトを取得してマイクロエージェントとして注入
"""
import asyncio
import logging
from typing import List, Optional
from dataclasses import dataclass

from .base import BaseMicroagent, MicroagentKnowledge
from ..portal.prompt_client import PortalPromptClient

logger = logging.getLogger('bluelamp.microagent.portal')


@dataclass
class PortalMicroagentConfig:
    """Portal マイクロエージェント設定"""
    name: str
    prompt_id: str
    triggers: List[str]
    description: str = ""


class PortalMicroagent(BaseMicroagent):
    """Portal APIから専門プロンプトを取得するマイクロエージェント"""
    
    def __init__(self, config: PortalMicroagentConfig, portal_client: Optional[PortalPromptClient] = None):
        """
        Args:
            config: Portal マイクロエージェント設定
            portal_client: Portal APIクライアント
        """
        super().__init__(name=config.name, triggers=config.triggers)
        self.config = config
        self.portal_client = portal_client or PortalPromptClient()
        self._cached_content: Optional[str] = None
        
    async def get_content(self) -> str:
        """Portal APIから専門プロンプトを取得"""
        if self._cached_content is None:
            try:
                content = await self.portal_client.fetch_prompt(self.config.prompt_id)
                if content:
                    self._cached_content = content
                    logger.info(f"Portal プロンプト取得成功: {self.config.name} ({self.config.prompt_id})")
                else:
                    logger.warning(f"Portal プロンプト取得失敗: {self.config.name} ({self.config.prompt_id})")
                    self._cached_content = f"# {self.config.name}\n\n{self.config.description}"
            except Exception as e:
                logger.error(f"Portal API エラー: {e}")
                self._cached_content = f"# {self.config.name}\n\n{self.config.description}"
        
        return self._cached_content
    
    def get_knowledge(self, query: str) -> List[MicroagentKnowledge]:
        """同期的にナレッジを取得（非同期処理をラップ）"""
        try:
            # 非同期処理を同期的に実行
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # 既にイベントループが動いている場合は新しいタスクとして実行
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, self._async_get_knowledge(query))
                    return future.result()
            else:
                # イベントループが動いていない場合は直接実行
                return asyncio.run(self._async_get_knowledge(query))
        except Exception as e:
            logger.error(f"Portal マイクロエージェント取得エラー: {e}")
            return []
    
    async def _async_get_knowledge(self, query: str) -> List[MicroagentKnowledge]:
        """非同期でナレッジを取得"""
        if self.is_triggered(query):
            content = await self.get_content()
            return [
                MicroagentKnowledge(
                    name=self.name,
                    content=content,
                    trigger=self._get_matched_trigger(query)
                )
            ]
        return []
    
    def _get_matched_trigger(self, query: str) -> str:
        """マッチしたトリガーを取得"""
        query_lower = query.lower()
        for trigger in self.triggers:
            if trigger.lower() in query_lower:
                return trigger
        return self.triggers[0] if self.triggers else ""


class PortalMicroagentLoader:
    """Portal マイクロエージェントローダー"""
    
    def __init__(self, portal_client: Optional[PortalPromptClient] = None):
        self.portal_client = portal_client or PortalPromptClient()
        self._microagents: List[PortalMicroagent] = []
        self._load_portal_microagents()
    
    def _load_portal_microagents(self):
        """Portal マイクロエージェントを定義・読み込み"""
        configs = [
            PortalMicroagentConfig(
                name="debug-detective",
                prompt_id="af9d922c29beffe1224ac6236d083946",  # デバッグ探偵
                triggers=["debug", "error", "bug", "fix", "troubleshoot", "エラー", "デバッグ", "バグ"],
                description="デバッグ専門家として、プロジェクトのエラーを徹底的に調査しエラーを解消します。"
            ),
            PortalMicroagentConfig(
                name="feature-extension-planner", 
                prompt_id="6862397f1428c1efc592f6ea",  # 機能拡張プランナー
                triggers=["feature", "extension", "planning", "機能拡張", "機能追加", "プランニング", "新機能"],
                description="既存のプロジェクトに対する追加要件や変更要求を分析し、具体的な実装計画を作成して実装するスペシャリストです。"
            ),
            PortalMicroagentConfig(
                name="refactoring-manager",
                prompt_id="6862397f1428c1efc592f6ec",  # リファクタリングエキスパート
                triggers=["refactor", "refactoring", "cleanup", "リファクタリング", "コード整理", "最適化", "改善"],
                description="既存のコード構造を分析し、無駄を徹底的に排除し、シンプルかつ保守性の高いコードへと導く専門家です。"
            )
        ]
        
        for config in configs:
            microagent = PortalMicroagent(config, self.portal_client)
            self._microagents.append(microagent)
            logger.info(f"Portal マイクロエージェント登録: {config.name}")
    
    def get_microagents(self) -> List[PortalMicroagent]:
        """登録されたPortal マイクロエージェントを取得"""
        return self._microagents
    
    def get_triggered_knowledge(self, query: str) -> List[MicroagentKnowledge]:
        """クエリにマッチするマイクロエージェントのナレッジを取得"""
        knowledge = []
        for microagent in self._microagents:
            knowledge.extend(microagent.get_knowledge(query))
        return knowledge