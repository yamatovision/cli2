"""Prototype Implementation Agent"""

from openhands.agenthub.prototype_implementation.prototype_implementation import PrototypeImplementation
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('PrototypeImplementation', PrototypeImplementation)

__all__ = ['PrototypeImplementation']