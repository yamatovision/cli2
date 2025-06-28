"""Requirements Engineer Agent"""

from openhands.agenthub.requirements_engineer.requirements_engineer import RequirementsEngineer
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('RequirementsEngineer', RequirementsEngineer)

__all__ = ['RequirementsEngineer']