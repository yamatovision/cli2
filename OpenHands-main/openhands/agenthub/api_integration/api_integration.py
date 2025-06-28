"""API Integration Agent Implementation"""

import os
from typing import List, Dict, Any, Optional
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.controller.state.state import State
from openhands.events.action import AgentFinishAction, MessageAction
from openhands.utils.prompt import PromptManager
from openhands.core.logger import openhands_logger as logger


class APIIntegration(CodeActAgent):
    """API統合: バックエンドAPI実装完了後に、フロントエンドのモックコードを実APIに置き換える"""
    
    VERSION = '1.0'
    
    def __init__(
        self,
        llm: Any,
        config: Any = None,
    ):
        super().__init__(llm=llm, config=config)
        self._prompt_manager = None
        
    @property
    def prompt_manager(self) -> PromptManager:
        """独自のプロンプトマネージャーを使用"""
        if self._prompt_manager is None:
            self._prompt_manager = PromptManager(
                prompt_dir=os.path.join(os.path.dirname(__file__), 'prompts'),
                agent_skills_docs=self.agent_skills_docs,
            )
        return self._prompt_manager