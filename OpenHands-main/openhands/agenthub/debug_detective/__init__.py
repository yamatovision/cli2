"""Debug Detective Agent"""

from openhands.agenthub.debug_detective.debug_detective import DebugDetective
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('DebugDetective', DebugDetective)

__all__ = ['DebugDetective']