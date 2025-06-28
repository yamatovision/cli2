"""System Architect Agent"""

from openhands.agenthub.system_architect.system_architect import SystemArchitect
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('SystemArchitect', SystemArchitect)

__all__ = ['SystemArchitect']