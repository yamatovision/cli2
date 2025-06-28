"""Backend Implementation Agent"""

from openhands.agenthub.backend_implementation.backend_implementation import BackendImplementation
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('BackendImplementation', BackendImplementation)

__all__ = ['BackendImplementation']