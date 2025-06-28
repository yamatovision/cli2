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
    TypeScriptManager,
    FeatureExtension,
    RefactoringExpert,
)
from openhands.controller.agent import Agent

# 16エージェントを一括登録
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
    ('TypeScriptManager', TypeScriptManager),
    ('FeatureExtension', FeatureExtension),
    ('RefactoringExpert', RefactoringExpert),
]

for name, cls in BLUELAMP_AGENTS:
    Agent.register(name, cls)

__all__ = [name for name, _ in BLUELAMP_AGENTS]