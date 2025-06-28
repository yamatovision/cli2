"""Deploy Specialist Agent"""

from openhands.agenthub.deploy_specialist.deploy_specialist import DeploySpecialist
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('DeploySpecialist', DeploySpecialist)

__all__ = ['DeploySpecialist']