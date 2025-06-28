"""Implementation Consultant Agent"""

from openhands.agenthub.implementation_consultant.implementation_consultant import ImplementationConsultant
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('ImplementationConsultant', ImplementationConsultant)

__all__ = ['ImplementationConsultant']