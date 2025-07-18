from dotenv import load_dotenv

load_dotenv()

from core.agents.agent_controller import AgentController
from core.agents import (  # noqa: E402
    orchestrator_agent,  # オーケストレーター（旧BlueLampOrchestrator）
    extension_manager_agent,  # 拡張マネージャー（旧codeact_agent2）
    bluelamp_agents,  # 16専門エージェント
)
from core.agents.agent import Agent  # noqa: E402

__all__ = [
    'Agent',
    'AgentController',
    'orchestrator_agent',  # オーケストレーター
    'extension_manager_agent',  # 拡張マネージャー
    'bluelamp_agents',  # 16専門エージェント
]
