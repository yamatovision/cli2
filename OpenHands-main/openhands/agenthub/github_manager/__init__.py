"""GitHub Manager Agent"""

from openhands.agenthub.github_manager.github_manager import GitHubManager
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('GitHubManager', GitHubManager)

__all__ = ['GitHubManager']