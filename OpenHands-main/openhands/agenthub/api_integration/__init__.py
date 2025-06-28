"""API Integration Agent"""

from openhands.agenthub.api_integration.api_integration import APIIntegration
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('APIIntegration', APIIntegration)

__all__ = ['APIIntegration']