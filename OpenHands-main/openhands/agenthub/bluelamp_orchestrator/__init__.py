"""BlueLamp Orchestrator Agent"""

from openhands.agenthub.bluelamp_orchestrator.bluelamp_orchestrator import BlueLampOrchestrator
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('BlueLampOrchestrator', BlueLampOrchestrator)

__all__ = ['BlueLampOrchestrator']