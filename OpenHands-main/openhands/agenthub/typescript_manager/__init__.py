"""TypeScript Manager Agent"""

from openhands.agenthub.typescript_manager.typescript_manager import TypeScriptManager
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('TypeScriptManager', TypeScriptManager)

__all__ = ['TypeScriptManager']