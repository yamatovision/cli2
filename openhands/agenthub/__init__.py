from dotenv import load_dotenv

load_dotenv()


from openhands.agenthub import (  # noqa: E402
    blueprint_agent,  # 設計エージェント（旧BlueLampOrchestrator）
    implementation_agent,  # 実装エージェント（旧codeact_agent2）
    expansion_agent,  # 拡張エージェント（旧codeact_agent3）
    bluelamp_agents,  # 16専門エージェント
)
from openhands.controller.agent import Agent  # noqa: E402

__all__ = [
    'Agent',
    'blueprint_agent',  # 設計エージェント
    'implementation_agent',  # 実装エージェント
    'expansion_agent',  # 拡張エージェント
    'bluelamp_agents',  # 16専門エージェント
]
