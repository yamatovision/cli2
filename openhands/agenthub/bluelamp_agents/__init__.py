"""BlueLamp専門エージェント群"""

from .agents import (
    RequirementsEngineer,
    UIUXDesigner,
    DataModelingEngineer,
    SystemArchitect,
    ImplementationConsultant,
    EnvironmentSetup,
    PrototypeImplementation,
    BackendImplementation,
    TestQualityVerification,
    APIIntegration,
    DebugDetective,
    DeploySpecialist,
    GitHubManager,
)
from openhands.controller.agent import Agent

# 13エージェントを一括登録（14エージェント構造に対応）
BLUELAMP_AGENTS = [
    ('RequirementsEngineer', RequirementsEngineer),
    ('UIUXDesigner', UIUXDesigner),
    ('DataModelingEngineer', DataModelingEngineer),
    ('SystemArchitect', SystemArchitect),
    ('ImplementationConsultant', ImplementationConsultant),
    ('EnvironmentSetup', EnvironmentSetup),
    ('PrototypeImplementation', PrototypeImplementation),
    ('BackendImplementation', BackendImplementation),
    ('TestQualityVerification', TestQualityVerification),
    ('APIIntegration', APIIntegration),
    ('DebugDetective', DebugDetective),
    ('DeploySpecialist', DeploySpecialist),
    ('GitHubManager', GitHubManager),
]

for name, cls in BLUELAMP_AGENTS:
    Agent.register(name, cls)

__all__ = [name for name, _ in BLUELAMP_AGENTS]
