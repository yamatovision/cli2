"""
専門エージェントの基底クラス
★1～★12のプロンプトを使用する専門エージェントの共通機能を提供
"""

import os
import logging
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.controller.state.state import State
from openhands.core.config import AgentConfig
from openhands.core.logger import openhands_logger as logger
from openhands.events.action import AgentFinishAction, MessageAction
from openhands.events.event import Event
from openhands.llm.llm import LLM

from openhands.portal.portal_prompt_manager import PortalPromptManager


class SpecialistAgentBase(CodeActAgent, ABC):
    """
    専門エージェントの基底クラス
    ★番号ベースのプロンプトを使用する専門エージェントの共通機能
    """
    
    VERSION = '1.0'
    
    def __init__(
        self,
        llm: LLM,
        config: AgentConfig,
        star_number: int,
        agent_name: str,
    ):
        """
        Args:
            llm: 言語モデル
            config: エージェント設定
            star_number: ★番号（1-12）
            agent_name: エージェント名
        """
        super().__init__(llm, config)
        
        if not (1 <= star_number <= 12):
            raise ValueError(f"star_number must be between 1 and 12, got {star_number}")
        
        self.star_number = star_number
        self.agent_name = agent_name
        self._prompt_manager = None
        
        # 専門分野の設定
        self.specialization = self._get_specialization()
        
        logger.info(f"{agent_name} initialized with ★{star_number} prompts")
    
    @abstractmethod
    def _get_specialization(self) -> str:
        """専門分野の説明を返す（サブクラスで実装）"""
        pass
    
    @property
    def prompt_manager(self) -> PromptManager:
        """★番号に対応するPromptManagerを返す"""
        if self._prompt_manager is None:
            # フォールバック用のローカルプロンプトディレクトリ
            prompt_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 
                'prompts', 
                self.agent_name.lower()
            )
            
            # ★番号に対応するシステムプロンプトファイル名
            system_prompt_filename = f'system_prompt_star{self.star_number}.j2'
            
            # PortalPromptManagerを作成
            self._prompt_manager = PortalPromptManager(
                prompt_dir=prompt_dir,
                system_prompt_filename=system_prompt_filename,
                enable_portal=True
            )
            
            logger.info(f"PortalPromptManager initialized for ★{self.star_number} ({self.agent_name})")
        
        return self._prompt_manager
    
    def step(self, state: State) -> Event:
        """エージェントのステップ実行"""
        try:
            # 専門分野固有の前処理
            self._pre_step_processing(state)
            
            # 基底クラスのstep実行
            event = super().step(state)
            
            # 専門分野固有の後処理
            self._post_step_processing(state, event)
            
            return event
            
        except Exception as e:
            logger.error(f"{self.agent_name} step error: {e}")
            return AgentFinishAction(
                outputs={'error': f'{self.agent_name} error: {str(e)}'},
                thought=f'エラーが発生しました: {str(e)}'
            )
    
    def _pre_step_processing(self, state: State):
        """ステップ実行前の処理（サブクラスでオーバーライド可能）"""
        pass
    
    def _post_step_processing(self, state: State, event: Event):
        """ステップ実行後の処理（サブクラスでオーバーライド可能）"""
        pass
    
    def get_agent_info(self) -> Dict[str, Any]:
        """エージェント情報を取得"""
        return {
            'agent_name': self.agent_name,
            'star_number': self.star_number,
            'specialization': self.specialization,
            'version': self.VERSION,
            'prompt_source': self.prompt_manager.get_prompt_source_info(),
        }
    
    def switch_to_star_number(self, new_star_number: int):
        """★番号を切り替え（セッション切り替え用）"""
        if not (1 <= new_star_number <= 15):
            raise ValueError(f"star_number must be between 1 and 15, got {new_star_number}")
        
        old_star_number = self.star_number
        self.star_number = new_star_number
        
        # PromptManagerの★番号を更新
        if self._prompt_manager:
            self._prompt_manager.set_star_number(new_star_number)
        
        logger.info(f"{self.agent_name} switched from ★{old_star_number} to ★{new_star_number}")
    
    def refresh_prompts(self):
        """プロンプトを再読み込み"""
        if self._prompt_manager:
            self._prompt_manager.refresh_prompts()
            logger.info(f"{self.agent_name} prompts refreshed")
    
    def _get_tools(self) -> List[Any]:
        """専門エージェント用のツールを取得"""
        tools = super()._get_tools()
        
        # 委譲関連ツールを除外（専門エージェントは委譲しない）
        filtered_tools = []
        for tool in tools:
            # ChatCompletionToolParamオブジェクトの場合
            if hasattr(tool, 'function') and hasattr(tool.function, 'name'):
                if not tool.function.name.startswith('delegate_'):
                    filtered_tools.append(tool)
            # dict形式の場合
            elif isinstance(tool, dict) and 'function' in tool:
                if not tool.get('function', {}).get('name', '').startswith('delegate_'):
                    filtered_tools.append(tool)
            else:
                # その他のツールはそのまま含める
                filtered_tools.append(tool)
        
        # 専門分野固有のツールを追加
        specialist_tools = self._get_specialist_tools()
        filtered_tools.extend(specialist_tools)
        
        return filtered_tools
    
    def _get_specialist_tools(self) -> List[Any]:
        """専門分野固有のツールを取得（サブクラスでオーバーライド可能）"""
        return []
    
    def handle_delegation_request(self, task_description: str) -> str:
        """委譲リクエストを処理"""
        logger.info(f"{self.agent_name} received delegation: {task_description}")
        
        # 専門分野固有の委譲処理
        result = self._handle_specialist_task(task_description)
        
        logger.info(f"{self.agent_name} completed delegation task")
        return result
    
    @abstractmethod
    def _handle_specialist_task(self, task_description: str) -> str:
        """専門分野固有のタスク処理（サブクラスで実装）"""
        pass