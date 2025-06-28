"""Refactoring Expert Agent"""

from openhands.agenthub.refactoring_expert.refactoring_expert import RefactoringExpert
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('RefactoringExpert', RefactoringExpert)

__all__ = ['RefactoringExpert']