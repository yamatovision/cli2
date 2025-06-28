"""Environment Setup Agent"""

from openhands.agenthub.environment_setup.environment_setup import EnvironmentSetup
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('EnvironmentSetup', EnvironmentSetup)

__all__ = ['EnvironmentSetup']